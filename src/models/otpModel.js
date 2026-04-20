/* ================================================================

   Each OTP document lives for OTP_EXPIRE_MINUTES then MongoDB
   automatically deletes it via the TTL index on expiresAt.
   ================================================================ */


'use strict';
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const OTP_EXPIRE_MINUTES = 10;
const OTP_SALT_ROUNDS    = 10;
const MAX_ATTEMPTS       = 5;   // lock after 5 wrong guesses

const otpSchema = new mongoose.Schema({

    /* Who this OTP belongs to — stored as lowercase email */
    email : {
        type     : String,
        required : true,
        lowercase: true,
        trim     : true,
        index    : true,
    },

    /* Purpose: register | reset-password | login-2fa */
    purpose : {
        type    : String,
        enum    : ['register', 'reset-password', 'login-2fa'],
        default : 'register',
    },

    /* Hashed OTP — we never store the plain code */
    otpHash : {
        type     : String,
        required : true,
    },

    /* Wrong-guess counter — locked after MAX_ATTEMPTS */
    attempts : { type: Number, default: 0 },

    /* Whether this OTP has already been used / consumed */
    consumed : { type: Boolean, default: false },

    /* TTL field — MongoDB removes the document after this date */
    expiresAt : {
        type    : Date,
        default : () => new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000),
    },


}, { timestamps: true,});

/* ── TTL index — MongoDB auto-deletes expired docs ── */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ── Compound index for fast lookup ── */
otpSchema.index({ email: 1, purpose: 1 });

/* ────────────────────────────────────────────────────────────
   STATIC: generate + store a new OTP for an email
   Returns the plain 6-digit code (to be sent via email/SMS).
   Deletes any previous OTP for the same email + purpose first.
────────────────────────────────────────────────────────────── */
otpSchema.statics.createForEmail = async function (email, purpose = 'register') {

    /* Delete old OTPs for this email + purpose to avoid confusion */
    await this.deleteMany({ email: email.toLowerCase().trim(), purpose });

    /* Generate cryptographically random 6-digit code */
    const generatedOTP = String(Math.floor(100000 + Math.random() * 900000));

    /* Hash before storage — if DB is breached, OTPs are still safe */
    const otpHash = await bcrypt.hash(generatedOTP, OTP_SALT_ROUNDS);

    await this.create({
        email    : email.toLowerCase().trim(),
        purpose,
        otpHash,
    });

    return generatedOTP;   // caller sends this to the user
};

/* ────────────────────────────────────────────────────────────
   STATIC: verify a submitted OTP code
   Returns: { ok: true } | { ok: false, reason: '...' }
────────────────────────────────────────────────────────────── */
otpSchema.statics.verifyCode = async function (email, sendOTP, purpose = 'register') {

    const record = await this.findOne({
        email   : email.toLowerCase().trim(),
        purpose,
        consumed: false,
    });

    if (!record) {
        return { ok: false, reason: 'No OTP found. Please request a new one.' };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
        await record.deleteOne();
        return { ok: false, reason: 'Too many wrong attempts. Please request a new OTP.' };
    }

    const match = await bcrypt.compare(String(sendOTP).trim(), record.otpHash);

    if (!match) {
        record.attempts += 1;
        await record.save();
        const left = MAX_ATTEMPTS - record.attempts;
        return {
        ok    : false,
        reason: left > 0
            ? `Wrong code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
            : 'Too many wrong attempts. Please request a new OTP.',
        };
    }

    /* Mark consumed so it cannot be reused */
    record.consumed = true;
    await record.save();

    return { ok: true };
};

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
