let pendingUserId = null;
let pendingEmail = null;
let pendingTempToken = null;
let lockTimeout = null;

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
        document.getElementById('forgotEmail').value = '';
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

    // LOGIN FORM
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
                pendingTempToken = result.tempToken;
                if (twoFAModal) twoFAModal.classList.remove('hidden');
                showSuccess('2FA code sent to your email!');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else if (result.user) {
                localStorage.setItem('user', JSON.stringify(result.user));
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => window.location.href = 'welcome.html', 1000);
            }
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('locked')) {
                showError(`🔒 ${errorMessage}`);
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<i class="fas fa-clock"></i> Account Locked';
                lockTimeout = setTimeout(() => {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                    showSuccess('✅ Account unlocked. You can try logging in again.');
                }, 300000);
            } else if (errorMessage.includes('attempt(s) remaining')) {
                showError(`⚠️ ${errorMessage}`);
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else if (errorMessage.includes('verify your email')) {
                showError(`📧 ${errorMessage}`);
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else {
                showError('❌ Invalid username or password');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
        }
    });

    // ==================== RESET PASSWORD FUNCTIONS ====================

    // Get DOM elements
    const resetCodeInput = document.getElementById('resetCode');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');

    // Function to validate reset password
    function validateResetPassword(password) {
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[@$!%*?&]/.test(password);

        // Update UI for each requirement
        updateResetRequirement('reset-req-length', hasLength);
        updateResetRequirement('reset-req-upper', hasUpper);
        updateResetRequirement('reset-req-lower', hasLower);
        updateResetRequirement('reset-req-number', hasNumber);
        updateResetRequirement('reset-req-special', hasSpecial);

        return hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
    }

    function updateResetRequirement(elementId, isValid) {
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

    // Function to check password match
    function checkResetPasswordMatch() {
        const password = newPasswordInput?.value || '';
        const confirm = confirmNewPasswordInput?.value || '';
        const matchMsg = document.getElementById('resetPasswordMatchMsg');

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

        // Enable/disable reset button
        const isPasswordValid = validateResetPassword(password);
        const isMatch = password === confirm && password.length > 0;

        if (resetPasswordBtn) {
            resetPasswordBtn.disabled = !(isPasswordValid && isMatch);
            console.log('Reset button enabled:', !resetPasswordBtn.disabled);
        }
    }

    // Add event listeners for reset password fields
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            validateResetPassword(this.value);
            checkResetPasswordMatch();
        });
    }

    if (confirmNewPasswordInput) {
        confirmNewPasswordInput.addEventListener('input', function() {
            checkResetPasswordMatch();
        });
    }

    // Toggle reset password visibility
    const toggleResetPassword = document.querySelector('.toggle-reset-password');
    if (toggleResetPassword) {
        toggleResetPassword.addEventListener('click', function() {
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    const toggleConfirmResetPassword = document.querySelector('.toggle-confirm-reset-password');
    if (toggleConfirmResetPassword) {
        toggleConfirmResetPassword.addEventListener('click', function() {
            const type = confirmNewPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmNewPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // FORGOT PASSWORD - Send reset code
    document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;

        if (!email) {
            showError('Please enter your email');
            return;
        }

        pendingEmail = email;

        try {
            const result = await AuthAPI.forgotPassword(email);
            showSuccess('Reset code sent to your email!');
            forgotModal.classList.add('hidden');
            resetPasswordModal.classList.remove('hidden');
            // Clear previous values
            if (resetCodeInput) resetCodeInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
            if (resetPasswordBtn) resetPasswordBtn.disabled = true;
        } catch (error) {
            showError(error.message || 'Failed to send reset code');
        }
    });

    // RESET PASSWORD - Complete reset
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            const resetCode = resetCodeInput?.value;
            const newPassword = newPasswordInput?.value;
            const confirmPassword = confirmNewPasswordInput?.value;

            console.log('Reset password attempt');

            if (!resetCode || resetCode.length !== 6) {
                showError('Please enter the 6-digit reset code');
                return;
            }

            if (newPassword !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (!validateResetPassword(newPassword)) {
                showError('Please meet all password requirements');
                return;
            }

            resetPasswordBtn.disabled = true;
            resetPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

            try {
                const result = await AuthAPI.resetPassword(pendingEmail, resetCode, newPassword);
                showSuccess('Password reset successful! You can now login.');
                resetPasswordModal.classList.add('hidden');
                resetResetPasswordForm();
                pendingEmail = null;
            } catch (error) {
                showError(error.message || 'Failed to reset password');
                resetPasswordBtn.disabled = false;
                resetPasswordBtn.innerHTML = 'Reset Password';
            }
        });
    }

    function resetResetPasswordForm() {
        if (resetCodeInput) resetCodeInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
        if (resetPasswordBtn) resetPasswordBtn.disabled = true;

        // Reset requirements UI
        const requirements = ['reset-req-length', 'reset-req-upper', 'reset-req-lower', 'reset-req-number', 'reset-req-special'];
        requirements.forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                element.style.color = '#999';
                const text = element.innerText || element.textContent;
                element.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 6px;"></i> ${text.replace(/[✓✗]/g, '').trim()}`;
            }
        });

        const matchMsg = document.getElementById('resetPasswordMatchMsg');
        if (matchMsg) matchMsg.innerHTML = '';
    }

    // ==================== REGISTRATION PASSWORD VALIDATION ====================
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

    // Toggle password visibility for login
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

    // Toggle registration password visibility
    const toggleRegPassword = document.querySelector('.toggle-reg-password');
    if (toggleRegPassword) {
        toggleRegPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('regPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    const toggleConfirmRegPassword = document.querySelector('.toggle-confirm-password');
    if (toggleConfirmRegPassword) {
        toggleConfirmRegPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('confirmPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

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
