"use strict";
import User from "../../models/userModel.js";
import Otp from "../../models/otpModel.js";
import { sendOtpEmail } from "../../utils/mailer.js";



const generateAccessAndRefressToken = async function (userId){

    try{
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateAccessToken();

        user.refreshToken=refreshToken;

        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};

    }
    catch(error){
        
        console.error('[AUTH] POST /register error:', error);

        return res.render("./errorPages/error.ejs", {
            flashError: 'Something went wrong. Please try again.',
            csrfToken : req.csrfToken ? req.csrfToken() : undefined,
        });
    }
}

/* ── Rate-limit helper (simple in-memory, use express-rate-limit in prod) ── */
const RATE_STORE = new Map();   // email → { count, resetAt }
const RATE_LIMIT = 3;           // max OTP sends per window
const RATE_WINDOW_MS = 15 * 60 * 1000;  // 15 min window

function isRateLimited(email) {
    const key  = email.toLowerCase().trim();
    const now  = Date.now();
    const rec  = RATE_STORE.get(key);

    if (!rec || now > rec.resetAt) {
        RATE_STORE.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return false;
    }
    if (rec.count >= RATE_LIMIT) return true;
    rec.count++;
    return false;
}


/* ── Input sanitiser ── */
function sanitise(val) {
    return typeof val === 'string' ? val.trim() : '';
}

/* ── Validation helpers ── */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
function isStrongPassword(pw) {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw);
}

/* ================================================================
   HELPER — mask email for display  e.g.  a***n@example.com
================================================================ */
function maskEmail(email) {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.length <= 2
        ? local[0] + '*'
        : local[0] + '***' + local.slice(-1);
    return `${visible}@${domain}`;
}


/* ================================================================
   1. GET /register
================================================================ */

const getRegisterUser = function(req,res){

    return res.render("./userView/userRegister.ejs",{
        flashError  : req.flash ? req.flash('error')[0]   || null : null,
        flashSuccess: req.flash ? req.flash('success')[0] || null : null,
        formData    : req.session.formData,
        csrfToken   : req.csrfToken ? req.csrfToken() : undefined,
    });

}

/* ================================================================
   2. POST /register
   Validate → store pending data in session → send OTP → redirect
================================================================ */

const postRegisterUser = async function (req,res){

    const firstName       = sanitise(req.body.firstName);
    const lastName        = sanitise(req.body.lastName);
    const email           = sanitise(req.body.email).toLowerCase();
    const phone           = sanitise(req.body.phone).replace(/\D/g, '').slice(0, 10);
    const city            = sanitise(req.body.city);
    const password        = req.body.password        || '';
    const confirmPassword = req.body.confirmPassword || '';

    /* ── Server-side validation ── */
    const errors = [];

    if (!firstName || firstName.length < 2)
        errors.push('First name must be at least 2 characters.');
    if (!lastName)
        errors.push('Last name is required.');
    if (!email || !isValidEmail(email))
        errors.push('A valid email address is required.');
    if (phone && phone.length !== 10)
        errors.push('Phone number must be exactly 10 digits.');
    if (!city)
        errors.push('Please select your city.');
    if (!isStrongPassword(password))
        errors.push('Password must be 8+ chars with uppercase, a number, and a symbol.');
    if (password !== confirmPassword)
        errors.push('Passwords do not match.');
    if (!req.body.terms)
        errors.push('You must accept the Terms of Use and Privacy Policy.');


    if (errors.length > 0) {
        /* Preserve form values across the redirect (without password) */
        req.session.formData = { firstName, lastName, email, phone, city };

        return res.render("./userView/userRegister.ejs", {
            flashError : errors[0],
            formData   : req.session.formData,
            csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
        });
    }



    try{

        const existingUser = await User.findOne({ email }).select('_id isVerified');

        if (existingUser) {

            if (!existingUser.isVerified) {
                /*
                    Account exists but was never verified.
                    Delete the stale unverified account and let the user re-register.
                    (Or you can just re-send the OTP — choose your UX.)
                */
                await User.deleteOne({ _id: existing._id });
            } else {

                req.session.formData = { firstName, lastName, email, phone, city };

                return res.render("./userView/userRegister.ejs", {
                    flashError: 'An account with this email already exists. Please log in.',
                    formData  : req.session.formData,
                    csrfToken : req.csrfToken ? req.csrfToken() : undefined,
                });
            }
        }


         /* ── Rate-limit OTP sends per email ── */
        if (isRateLimited(email)) {
            return res.render("./userView/userRegister.ejs", {
                flashError: 'Too many OTP requests. Please wait 15 minutes before trying again.',
                formData  : { firstName, lastName, email, phone, city },
                csrfToken : req.csrfToken ? req.csrfToken() : undefined,
            });
        }

        /* ── Generate & send OTP ── */
        const generatedOTP = await Otp.createForEmail(email, 'register');

        await sendOtpEmail({
            to       : email,
            firstName,
            otp      : generatedOTP,
            purpose  : 'register',
        });


        /* ── Store pending user data in session (NOT in DB yet) ── */
        req.session.pendingUser = {
            firstName,
            lastName,
            email,
            phone,
            city,
            passwordHash: password,   // stored plain here; hashed by User pre-save hook
        };
        
        

        return res.redirect('/api/v1/users/verify-otp');


    }catch(error){


        console.error('[AUTH] POST /register error:', error);

        return res.render("./userView/userRegister.ejs", {
            flashError: 'Something went wrong. Please try again.',
            formData  : { firstName, lastName, email, phone, city },
            csrfToken : req.csrfToken ? req.csrfToken() : undefined,
        });

    }


}


/* ================================================================
   3. GET /verify-otp
================================================================ */

const getVerifyOTP = async function (req, res) {
    if(!req.session.pendingUser){
        res.status(401).render("./errorPages/error.ejs", {
            currUser  : req.user || req.session?.user || null,
            message : 'Please login or sign up first .',
        });
        
    }

    const { email, firstName } = req.session.pendingUser;
    return res.render("./includes/verifyOTP.ejs", {
        email,
        firstName,
        maskedEmail: maskEmail(email),
        flashError : req.flash ? req.flash('error')[0] || null : null,
        csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
    });
}


/* ================================================================
   4. POST /verify-otp
   Check OTP → create User → set session → redirect /
================================================================ */

const postVerifyOTP = async function (req,res){

    const submittedOTP = sanitise(req.body.otp).replace(/\s/g, '');

    if (!submittedOTP || !/^\d{6}$/.test(submittedOTP)) {
        return res.render("./includes/verifyOTP.ejs", {
            email      : req.session.pendingUser.email,
            firstName  : req.session.pendingUser.firstName,
            maskedEmail: maskEmail(req.session.pendingUser.email),
            flashError : 'Please enter the 6-digit code from your email.',
            csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
        });
    }

    const { email, firstName, lastName, phone, city, passwordHash } = req.session.pendingUser;

    try{

        /* ── Verify OTP using Otp model static ── */
        const result = await Otp.verifyCode(email, submittedOTP, 'register');

        if (!result.ok) {
            return res.render("./includes/verifyOTP.ejs", {
                email,
                firstName,
                maskedEmail: maskEmail(email),
                flashError : result.reason,
                csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
            });
        }

        /* ── Create User in DB ── */
        const newUser = new User({
              firstName,
              lastName,
              email,
              phone,
              city,
              passwordHash,   // plain text — User pre-save hook hashes it
              isVerified: true,
        });

        await newUser.save();

        /* ── Clean up session pending data ── */
        delete req.session.pendingUser;

        const {accessToken,refreshToken} = await generateAccessAndRefressToken(newUser._id);

        const options={
            httpOnly:true,
            secure:true,
        }

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).redirect("/api/v1/listings");


    }catch (error){

        console.error('[AUTH] POST /verify-otp error:', error);

        /* Duplicate email race condition */
        if (error.code === 11000) {
            delete req.session.pendingUser;
            return res.redirect('/api/v1/users/login?msg=account-exists');
        }

        return res.render("./includes/verifyOTP.ejs", {
            email,
            firstName,
            maskedEmail: maskEmail(email),
            flashError : 'Something went wrong. Please try again.',
            csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
        });

    }

}


/* ================================================================
   5. POST /resend-otp
   Generate a fresh OTP and re-send it.
================================================================ */

const postResendOTP = async function (req,res){

    const { email, firstName } = req.session.pendingUser;

    if (isRateLimited(email)) {
        return res.render("./includes/verifyOTP.ejs", {
            email,
            firstName,
            maskedEmail: maskEmail(email),
            flashError : "You've requested too many OTPs. Please wait 15 minutes.",
            csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
        });
    }


    try{

        const generatedOTP = await Otp.createForEmail(email, 'register');
        
        await sendOtpEmail({ to: email, firstName, otp: generatedOTP, purpose: "register" });
        
        return res.render("./includes/verifyOTP.ejs", {
            email,
            firstName,
            maskedEmail  : maskEmail(email),
            flashSuccess : 'A new code has been sent to your email.',
            csrfToken    : req.csrfToken ? req.csrfToken() : undefined,
        });
        

    }catch(error){

        console.error('[AUTH] POST /resend-otp error:', error);

        return res.render("./includes/verifyOTP.ejs", {
            email,
            firstName,
            maskedEmail: maskEmail(email),
            flashError : 'Could not send OTP. Please try again.',
            csrfToken  : req.csrfToken ? req.csrfToken() : undefined,
        });

    }
}




/* ================================================================
   6. GET /login
================================================================ */
const getLoginUser = async function (req, res){
    const msg = req.query.msg;
    let flashSuccess = null;
    if (msg === 'account-exists') flashSuccess = 'Account already exists. Please log in.';
    if (msg === 'registered')     flashSuccess = 'Account created! Please log in.';

    return res.render("./userView/userLogin.ejs", {
        flashError  : req.flash ? req.flash('error')[0]   || null : null,
        flashSuccess: req.flash ? req.flash('success')[0] || null : flashSuccess,
        formData    : {},
        csrfToken   : req.csrfToken ? req.csrfToken() : undefined,
    });
}

/* ================================================================
   7. POST /login
   Find user → verify password → set session
================================================================ */

const postLoginUser = async function (req,res){

    const email    = sanitise(req.body.email).toLowerCase();
    const password = req.body.password || "";
    const remember = req.body.remember === 'on';

    /* Basic validation */
    if (!email || !isValidEmail(email) || !password) {
        return res.render("./userView/userLogin.ejs", {
            flashError: 'Please enter your email and password.',
            formData  : { email },
            csrfToken : req.csrfToken ? req.csrfToken() : undefined,
        });
    }

    try{

        const user = await User.findOne({ email }).select('+passwordHash');
        
        /* Generic error — don't reveal whether email exists */
        const INVALID = 'Incorrect email or password.';

        
        if (!user) {
            return res.render("./userView/userLogin.ejs", {
                flashError: INVALID,
                formData  : { email },
                csrfToken : req.csrfToken ? req.csrfToken() : undefined,
            });
        }

        if (!user.isActive || user.isBanned) {
            return res.render("./userView/userLogin.ejs", {
                flashError: 'Your account has been suspended. Please contact support.',
                formData  : { email },
                csrfToken : req.csrfToken ? req.csrfToken() : undefined,
            });
        }

        if (!user.isVerified) {
              /*
                Unverified account — restart OTP flow.
                Store pending data so /verify-otp renders correctly.
              */
            req.session.pendingUser = {
                firstName   : user.firstName,
                lastName    : user.lastName,
                email       : user.email,
                phone       : user.phone,
                city        : user.city,
                passwordHash: password,   // will be re-hashed if re-save is needed
            };
        
              /* Re-send verification OTP */
            if (!isRateLimited(email)) {
                const generatedOTP = await Otp.createForEmail(email, 'register');
                await sendOtpEmail({
                    to       : email,
                    firstName: user.firstName,
                    otp      : generatedOTP,
                    purpose  : 'register',
                });
            }
        
            return res.redirect('/verify-otp');
        }


        const passwordOk = await user.isPasswordCorrect(password);

        if (!passwordOk) {
            return res.render("./userView/userLogin.ejs", {
                flashError: INVALID,
                formData  : { email },
                csrfToken : req.csrfToken ? req.csrfToken() : undefined,
            });
        }

        const {accessToken,refreshToken} = await generateAccessAndRefressToken(user._id);

        const options={
            httpOnly:true,
            secure:true,
        }


        /* Extend session cookie if "remember me" checked */
        if (remember) {
            req.cookie.accessToken.maxAge = 30 * 24 * 60 * 60 * 1000;   // 30 days
        }

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).redirect('/api/v1/listings');


    }catch(error){

        console.error('[AUTH] POST /login error:', error);

        return res.render("./userView/userLogin.ejs", {
            flashError: 'Something went wrong. Please try again.',
            formData  : { email },
            csrfToken : req.csrfToken ? req.csrfToken() : undefined,
        });

    }
}









export {getRegisterUser, postRegisterUser, getVerifyOTP, postVerifyOTP, postResendOTP , getLoginUser,postLoginUser};


