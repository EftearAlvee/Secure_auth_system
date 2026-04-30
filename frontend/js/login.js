let pendingUserId = null;
let pendingEmail = null;
let pendingTempToken = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');

    // Get modal elements
    const registerModal = document.getElementById('registerModal');
    const verifyModal = document.getElementById('verifyModal');
    const forgotModal = document.getElementById('forgotModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const twoFAModal = document.getElementById('twoFAModal');

    // Create Account button
    document.getElementById('createAccountBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('hidden');
        resetRegistrationForm();
    });

    // Forgot Password button
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.classList.remove('hidden');
    });

    // Close modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            registerModal?.classList.add('hidden');
            verifyModal?.classList.add('hidden');
            forgotModal?.classList.add('hidden');
            resetPasswordModal?.classList.add('hidden');
            twoFAModal?.classList.add('hidden');
            resetRegistrationForm();
            resetResetPasswordForm();
        });
    });

    // LOGIN FORM with 2FA support
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const deviceInfo = navigator.userAgent;

        if (!username || !password) {
            showError('Please enter username and password');
            return;
        }

        const loginBtn = document.querySelector('#loginForm button');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const result = await AuthAPI.login({ username, password, deviceInfo });

            if (result.requires2FA) {
                // Save temp token for 2FA verification
                pendingTempToken = result.tempToken;
                // Show 2FA modal
                if (twoFAModal) {
                    twoFAModal.classList.remove('hidden');
                }
                showSuccess('2FA code sent to your email!');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'welcome.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);

            if (error.message.includes('locked')) {
                showError('🔒 ' + error.message);
            } else if (error.message.includes('attempt(s) remaining')) {
                showError('⚠️ ' + error.message);
            } else if (error.message.includes('verify your email')) {
                showError('📧 Please verify your email first. Check your inbox.');
            } else {
                showError('Invalid username or password');
            }
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    });

    // Verify 2FA Code
    document.getElementById('verify2FABtn')?.addEventListener('click', async () => {
        const twoFACode = document.getElementById('twoFACode').value;
        const trustDevice = document.getElementById('trustDevice')?.checked || false;
        const deviceInfo = navigator.userAgent;

        if (!twoFACode || twoFACode.length !== 6) {
            showError('Please enter the 6-digit verification code');
            return;
        }

        const verifyBtn = document.getElementById('verify2FABtn');
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        try {
            const result = await AuthAPI.verify2FA(pendingTempToken, twoFACode, deviceInfo, trustDevice);

            if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'welcome.html';
                }, 1000);
            }
        } catch (error) {
            showError('Invalid verification code. Please try again.');
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verify';
        }
    });

    // Resend 2FA Code
    document.getElementById('resend2FABtn')?.addEventListener('click', async () => {
        if (!pendingTempToken) {
            showError('Session expired. Please login again.');
            return;
        }

        try {
            await AuthAPI.resend2FA(pendingTempToken);
            showSuccess('New verification code sent to your email!');
        } catch (error) {
            showError('Failed to resend code. Please try again.');
        }
    });

    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Password validation functions (keep your existing ones)
    function validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        updateRequirement('req-length', requirements.length);
        updateRequirement('req-upper', requirements.upper);
        updateRequirement('req-lower', requirements.lower);
        updateRequirement('req-number', requirements.number);
        updateRequirement('req-special', requirements.special);

        return requirements.length && requirements.upper && requirements.lower && requirements.number && requirements.special;
    }

    function updateRequirement(elementId, isValid) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isValid) {
                element.style.color = '#4caf50';
                element.innerHTML = element.innerHTML.replace('fa-circle', 'fa-check-circle');
            } else {
                element.style.color = '#999';
                element.innerHTML = element.innerHTML.replace('fa-check-circle', 'fa-circle');
            }
        }
    }

    function checkPasswordMatch() {
        const password = document.getElementById('regPassword')?.value || '';
        const confirm = document.getElementById('confirmPassword')?.value || '';
        const matchMsg = document.getElementById('passwordMatchMsg');
        const registerBtn = document.getElementById('registerBtn');

        if (confirm.length > 0) {
            if (password === confirm) {
                matchMsg.innerHTML = '<i class="fas fa-check-circle" style="color: #4caf50;"></i> Passwords match';
                matchMsg.style.color = '#4caf50';
            } else {
                matchMsg.innerHTML = '<i class="fas fa-times-circle" style="color: #f44336;"></i> Passwords do not match';
                matchMsg.style.color = '#f44336';
            }
        } else {
            matchMsg.innerHTML = '';
        }

        const isPasswordValid = validatePassword(password);
        const isMatch = password === confirm && password.length > 0;

        if (registerBtn) {
            registerBtn.disabled = !(isPasswordValid && isMatch);
        }
    }

    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            validatePassword(this.value);
            checkPasswordMatch();
        });
    }

    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }

    function resetRegistrationForm() {
        const form = document.getElementById('registerForm');
        if (form) form.reset();
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) registerBtn.disabled = true;
    }

    function resetResetPasswordForm() {
        // Reset password form fields
    }

    // REGISTER FORM
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            showError('Passwords do not match');
            return;
        }

        if (!validatePassword(password)) {
            showError('Please meet all password requirements');
            return;
        }

        try {
            const result = await AuthAPI.register({ username, email, password });

            if (result.userId) {
                pendingUserId = result.userId;
                registerModal.classList.add('hidden');
                verifyModal.classList.remove('hidden');
                showSuccess('Verification code sent to your email!');
                resetRegistrationForm();
            }
        } catch (error) {
            showError(error.message);
        }
    });

    // VERIFY EMAIL
    document.getElementById('verifyBtn')?.addEventListener('click', async () => {
        const code = document.getElementById('verifyCode').value;

        if (!code || code.length !== 6) {
            showError('Please enter the 6-digit verification code');
            return;
        }

        try {
            const result = await AuthAPI.verifyEmail(pendingUserId, code);
            if (result.verified) {
                showSuccess('Email verified! You can now login.');
                verifyModal.classList.add('hidden');
                document.getElementById('verifyCode').value = '';
                pendingUserId = null;
            }
        } catch (error) {
            showError(error.message);
        }
    });

    // RESEND CODE
    document.getElementById('resendCodeBtn')?.addEventListener('click', async () => {
        if (!pendingUserId) {
            showError('Please register first');
            return;
        }

        try {
            const email = document.getElementById('regEmail').value;
            await AuthAPI.resendVerification(email);
            showSuccess('New verification code sent to your email!');
        } catch (error) {
            showError('Failed to resend code. Please try again.');
        }
    });

    // FORGOT PASSWORD
    document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('forgotEmail').value;
        pendingEmail = email;

        try {
            const result = await AuthAPI.forgotPassword(email);
            showSuccess('Reset code sent to your email!');
            forgotModal.classList.add('hidden');
            resetPasswordModal.classList.remove('hidden');
            resetResetPasswordForm();
        } catch (error) {
            showError(error.message);
        }
    });

    // RESET PASSWORD
    document.getElementById('resetPasswordBtn')?.addEventListener('click', async () => {
        const resetCode = document.getElementById('resetCode').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!resetCode || resetCode.length !== 6) {
            showError('Please enter the 6-digit reset code');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }

        try {
            const result = await AuthAPI.resetPassword(pendingEmail, resetCode, newPassword);
            showSuccess('Password reset successful! You can now login.');
            resetPasswordModal.classList.add('hidden');
            resetResetPasswordForm();
            pendingEmail = null;
        } catch (error) {
            showError(error.message);
        }
    });

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.innerHTML = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 8000);
    }

    function showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.innerHTML = message;
        successDiv.classList.remove('hidden');
        setTimeout(() => successDiv.classList.add('hidden'), 5000);
    }
});
