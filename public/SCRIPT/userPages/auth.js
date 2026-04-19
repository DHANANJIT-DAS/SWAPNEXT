

/* ----------------------------------------------------------------
   SHARED UTILITIES
---------------------------------------------------------------- */

/** Show a field error message and mark the input as invalid */
function setError(fieldGroupId, inputEl, message) {
    const group = document.getElementById(fieldGroupId);
    const errEl = group && group.querySelector('.field-error');
    if (inputEl) {
        inputEl.classList.add('is-invalid');
        inputEl.classList.remove('is-valid');
        inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errEl) errEl.textContent = message;
}

/** Clear a field's error state and mark it valid */
function setValid(fieldGroupId, inputEl) {
    const group = document.getElementById(fieldGroupId);
    const errEl = group && group.querySelector('.field-error');
    if (inputEl) {
        inputEl.classList.remove('is-invalid');
        inputEl.classList.add('is-valid');
        inputEl.setAttribute('aria-invalid', 'false');
    }
    if (errEl) errEl.textContent = '';
}

/** Clear all state from a field */
function clearState(fieldGroupId, inputEl) {
    const group = document.getElementById(fieldGroupId);
    const errEl = group && group.querySelector('.field-error');
    if (inputEl) {
        inputEl.classList.remove('is-invalid', 'is-valid');
        inputEl.removeAttribute('aria-invalid');
    }
    if (errEl) errEl.textContent = '';
}

/** Basic email format check */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Toggle password visibility on a given input + button pair */
function setupEyeToggle(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (!input || !btn) return;

    const showIcon = btn.querySelector('.eye-show');
    const hideIcon = btn.querySelector('.eye-hide');

    btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
        if (showIcon) showIcon.hidden = isPassword;
        if (hideIcon) hideIcon.hidden = !isPassword;
        input.focus();
    });
}

/** Show loading state on submit button */
function setSubmitLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.submit-text');
    const spinner = btn.querySelector('.submit-spinner');
    btn.disabled = loading;
    if (text) text.hidden = loading;
    if (spinner) spinner.hidden = !loading;
}

/* ================================================================
   LOGIN PAGE
   ================================================================ */
function initLogin() {

    const form = document.getElementById('loginForm');
    const emailEl = document.getElementById('email');
    const passEl = document.getElementById('password');

    if (!form) return;

    /* ── Eye toggle ── */
    setupEyeToggle('password', 'togglePassword');

    /* ── Real-time email validation (on blur) ── */
    emailEl && emailEl.addEventListener('blur', () => {
        if (!emailEl.value.trim()) {
            setError('fg-email', emailEl, 'Email address is required');
        } else if (!isValidEmail(emailEl.value)) {
            setError('fg-email', emailEl, 'Please enter a valid email address');
        } else {
            setValid('fg-email', emailEl);
        }
    });

    emailEl && emailEl.addEventListener('input', () => {
        if (emailEl.classList.contains('is-invalid') && isValidEmail(emailEl.value)) {
            setValid('fg-email', emailEl);
        }
    });

    /* ── Real-time password hint (on blur) ── */
    passEl && passEl.addEventListener('blur', () => {
        if (!passEl.value) {
            setError('fg-password', passEl, 'Password is required');
        } else {
            clearState('fg-password', passEl);
        }
    });

    /* ── Form submit validation ── */
    form.addEventListener('submit', (e) => {
        let valid = true;

        if (!emailEl.value.trim()) {
            setError('fg-email', emailEl, 'Email address is required');
            valid = false;
        } else if (!isValidEmail(emailEl.value)) {
            setError('fg-email', emailEl, 'Please enter a valid email address');
            valid = false;
        }

        if (!passEl.value) {
            setError('fg-password', passEl, 'Password is required');
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
            /* Focus first error */
            const firstErr = form.querySelector('.is-invalid');
            if (firstErr) firstErr.focus();
            return;
        }

        /* Show loading state while form submits */
        setSubmitLoading('loginSubmit', true);
    });
}

/* ================================================================
   REGISTER PAGE
   ================================================================ */
function initRegister() {

    const form = document.getElementById('registerForm');
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const cityEl = document.getElementById('city');
    const passEl = document.getElementById('password');
    const confirmEl = document.getElementById('confirmPassword');
    const termsEl = document.getElementById('terms');
    const strengthFill = document.getElementById('strengthFill');
    const strengthLbl = document.getElementById('strengthLabel');
    const strengthDesc = document.getElementById('password-strength-desc');

    if (!form) return;

    /* ── Eye toggles ── */
    setupEyeToggle('password', 'togglePassword');
    setupEyeToggle('confirmPassword', 'toggleConfirm');

    /* ----------------------------------------------------------------
       PASSWORD STRENGTH ENGINE
       Rules: length ≥8 · uppercase · number · special char
       Score 0–4 drives strength bar width + colour + label
    ---------------------------------------------------------------- */
    const RULES = {
        len: (v) => v.length >= 8,
        upper: (v) => /[A-Z]/.test(v),
        num: (v) => /\d/.test(v),
        sym: (v) => /[^a-zA-Z0-9]/.test(v),
    };
    const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const COLORS = ['', 'var(--red)', 'var(--amber)', '#4CAF50', 'var(--green)'];

    function evaluatePassword(pw) {
        let score = 0;
        for (const [rule, test] of Object.entries(RULES)) {
            const pass = test(pw);
            const el = document.getElementById(`chk-${rule}`);
            if (el) el.classList.toggle('pass', pass);
            if (pass) score++;
        }
        return score;
    }

    function updateStrengthUI(score) {
        if (!strengthFill) return;
        if (score === 0) {
            strengthFill.style.width = '0';
            strengthFill.removeAttribute('data-score');
            if (strengthLbl) { strengthLbl.textContent = ''; strengthLbl.removeAttribute('data-score'); }
            if (strengthDesc) strengthDesc.textContent = '';
            return;
        }
        strengthFill.setAttribute('data-score', score);
        if (strengthLbl) {
            strengthLbl.textContent = LABELS[score];
            strengthLbl.setAttribute('data-score', score);
        }
        if (strengthDesc) strengthDesc.textContent = `Password strength: ${LABELS[score]}`;
    }

    passEl && passEl.addEventListener('input', () => {
        const pw = passEl.value;
        const score = evaluatePassword(pw);
        updateStrengthUI(pw ? score : 0);
        /* Live confirm match check */
        if (confirmEl && confirmEl.value) {
            if (confirmEl.value !== pw) {
                setError('fg-confirm', confirmEl, 'Passwords do not match');
            } else {
                setValid('fg-confirm', confirmEl);
            }
        }
        /* Clear invalid state as user types */
        if (passEl.classList.contains('is-invalid') && pw.length >= 8) {
            clearState('fg-password', passEl);
        }
    });

    /* ── Confirm password live match ── */
    confirmEl && confirmEl.addEventListener('input', () => {
        if (!confirmEl.value) { clearState('fg-confirm', confirmEl); return; }
        if (confirmEl.value !== passEl.value) {
            setError('fg-confirm', confirmEl, 'Passwords do not match');
        } else {
            setValid('fg-confirm', confirmEl);
        }
    });

    /* ── Phone: numbers only, max 10 digits ── */
    phoneEl && phoneEl.addEventListener('input', () => {
        phoneEl.value = phoneEl.value.replace(/\D/g, '').slice(0, 10);
        if (phoneEl.value && phoneEl.value.length !== 10) {
            setError('fg-phone', phoneEl, 'Enter a valid 10-digit number');
        } else {
            clearState('fg-phone', phoneEl);
        }
    });

    /* ── Blur validators ── */
    function blurValidate(el, groupId, fn) {
        el && el.addEventListener('blur', () => fn(el, groupId));
    }

    blurValidate(firstNameEl, 'fg-firstName', (el, g) => {
        if (!el.value.trim()) setError(g, el, 'First name is required');
        else if (el.value.trim().length < 2) setError(g, el, 'Must be at least 2 characters');
        else setValid(g, el);
    });

    blurValidate(lastNameEl, 'fg-lastName', (el, g) => {
        if (!el.value.trim()) setError(g, el, 'Last name is required');
        else setValid(g, el);
    });

    blurValidate(emailEl, 'fg-email', (el, g) => {
        if (!el.value.trim()) setError(g, el, 'Email address is required');
        else if (!isValidEmail(el.value)) setError(g, el, 'Enter a valid email address');
        else setValid(g, el);
    });

    blurValidate(cityEl, 'fg-city', (el, g) => {
        if (!el.value) setError(g, el, 'Please select your city');
        else setValid(g, el);
    });

    blurValidate(passEl, 'fg-password', (el, g) => {
        const pw = el.value;
        const score = evaluatePassword(pw);
        if (!pw) {
            setError(g, el, 'Password is required');
        } else if (score < 2) {
            setError(g, el, 'Password is too weak — add uppercase, numbers or symbols');
        } else {
            setValid(g, el);
        }
    });

    blurValidate(confirmEl, 'fg-confirm', (el, g) => {
        if (!el.value) setError(g, el, 'Please confirm your password');
        else if (el.value !== passEl.value) setError(g, el, 'Passwords do not match');
        else setValid(g, el);
    });

    /* ── Input: clear error once user starts correcting ── */
    const liveClears = [
        [firstNameEl, 'fg-firstName'],
        [lastNameEl, 'fg-lastName'],
        [emailEl, 'fg-email'],
    ];
    liveClears.forEach(([el, g]) => {
        el && el.addEventListener('input', () => {
            if (el.classList.contains('is-invalid') && el.value.trim()) {
                clearState(g, el);
            }
        });
    });

    /* ── Full form validation on submit ── */
    form.addEventListener('submit', (e) => {
        let valid = true;

        /* First name */
        if (!firstNameEl.value.trim()) {
            setError('fg-firstName', firstNameEl, 'First name is required');
            valid = false;
        } else if (firstNameEl.value.trim().length < 2) {
            setError('fg-firstName', firstNameEl, 'Must be at least 2 characters');
            valid = false;
        } else {
            setValid('fg-firstName', firstNameEl);
        }

        /* Last name */
        if (!lastNameEl.value.trim()) {
            setError('fg-lastName', lastNameEl, 'Last name is required');
            valid = false;
        } else {
            setValid('fg-lastName', lastNameEl);
        }

        /* Email */
        if (!emailEl.value.trim()) {
            setError('fg-email', emailEl, 'Email address is required');
            valid = false;
        } else if (!isValidEmail(emailEl.value)) {
            setError('fg-email', emailEl, 'Enter a valid email address');
            valid = false;
        } else {
            setValid('fg-email', emailEl);
        }

        /* Phone (optional but validate if filled) */
        if (phoneEl && phoneEl.value && phoneEl.value.length !== 10) {
            setError('fg-phone', phoneEl, 'Enter a valid 10-digit number');
            valid = false;
        }

        /* City */
        if (!cityEl.value) {
            setError('fg-city', cityEl, 'Please select your city');
            valid = false;
        } else {
            setValid('fg-city', cityEl);
        }

        /* Password */
        const pw = passEl.value;
        const score = evaluatePassword(pw);
        if (!pw) {
            setError('fg-password', passEl, 'Password is required');
            valid = false;
        } else if (score < 2) {
            setError('fg-password', passEl, 'Password is too weak');
            valid = false;
        } else {
            setValid('fg-password', passEl);
        }

        /* Confirm */
        if (!confirmEl.value) {
            setError('fg-confirm', confirmEl, 'Please confirm your password');
            valid = false;
        } else if (confirmEl.value !== pw) {
            setError('fg-confirm', confirmEl, 'Passwords do not match');
            valid = false;
        } else {
            setValid('fg-confirm', confirmEl);
        }

        /* Terms */
        if (termsEl && !termsEl.checked) {
            setError('fg-terms', null, 'You must accept the terms to continue');
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
            /* Scroll first invalid field into view */
            const firstErr = form.querySelector('.is-invalid');
            if (firstErr) {
                firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErr.focus();
            }
            return;
        }

        /* Show loading spinner */
        setSubmitLoading('registerSubmit', true);
    });

    /* ── Terms error clears when checkbox is ticked ── */
    termsEl && termsEl.addEventListener('change', () => {
        if (termsEl.checked) {
            const errEl = form.querySelector('#terms-error');
            if (errEl) errEl.textContent = '';
        }
    });
}
