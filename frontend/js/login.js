let pendingUserId = null;
let pendingEmail = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');

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

    // Toggle password visibility for registration
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

    // Toggle confirm password visibility for registration
    const toggleConfirmPassword = document.querySelector('.toggle-confirm-password');
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('confirmPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Toggle reset password visibility
    const toggleResetPassword = document.querySelector('.toggle-reset-password');
    if (toggleResetPassword) {
        toggleResetPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('newPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Toggle confirm reset password visibility
    const toggleConfirmResetPassword = document.querySelector('.toggle-confirm-reset-password');
    if (toggleConfirmResetPassword) {
        toggleConfirmResetPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('confirmNewPassword');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Get modal elements
    const registerModal = document.getElementById('registerModal');
    const verifyModal = document.getElementById('verifyModal');
    const forgotModal = document.getElementById('forgotModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');

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
            resetRegistrationForm();
            resetResetPasswordForm();
        });
    });

    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            registerModal.classList.add('hidden');
            resetRegistrationForm();
        }
        if (e.target === verifyModal) verifyModal.classList.add('hidden');
        if (e.target === forgotModal) forgotModal.classList.add('hidden');
        if (e.target === resetPasswordModal) {
            resetPasswordModal.classList.add('hidden');
            resetResetPasswordForm();
        }
    });

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

    // ==================== RESET PASSWORD VALIDATION ====================
    function validateResetPassword(password) {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[@$!%*?&]/.test(password)
        };

        updateResetRequirement('reset-req-length', requirements.length);
        updateResetRequirement('reset-req-upper', requirements.upper);
        updateResetRequirement('reset-req-lower', requirements.lower);
        updateResetRequirement('reset-req-number', requirements.number);
        updateResetRequirement('reset-req-special', requirements.special);

        return requirements.length && requirements.upper && requirements.lower && requirements.number && requirements.special;
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

    function checkResetPasswordMatch() {
        const password = document.getElementById('newPassword')?.value || '';
        const confirm = document.getElementById('confirmNewPassword')?.value || '';
        const matchMsg = document.getElementById('resetPasswordMatchMsg');
        const resetBtn = document.getElementById('resetPasswordBtn');

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

        const isPasswordValid = validateResetPassword(password);
        const isMatch = password === confirm && password.length > 0;

        if (resetBtn) {
            resetBtn.disabled = !(isPasswordValid && isMatch);
        }
    }

    // Real-time registration password validation
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

    // Real-time reset password validation
    const newPassword = document.getElementById('newPassword');
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            validateResetPassword(this.value);
            checkResetPasswordMatch();
        });
    }

    const confirmNewPassword = document.getElementById('confirmNewPassword');
    if (confirmNewPassword) {
        confirmNewPassword.addEventListener('input', checkResetPasswordMatch);
    }

    function resetRegistrationForm() {
        const form = document.getElementById('registerForm');
        if (form) form.reset();
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) registerBtn.disabled = true;

        const requirements = ['req-length', 'req-upper', 'req-lower', 'req-number', 'req-special'];
        requirements.forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                element.style.color = '#999';
                const text = element.innerText || element.textContent;
                if (!text.includes('circle')) {
                    element.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 6px;"></i> ${text.replace(/[✓✗]/g, '').trim()}`;
                }
            }
        });

        const matchMsg = document.getElementById('passwordMatchMsg');
        if (matchMsg) matchMsg.innerHTML = '';
    }

    function resetResetPasswordForm() {
        const resetCode = document.getElementById('resetCode');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

        if (resetCode) resetCode.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';

        const resetBtn = document.getElementById('resetPasswordBtn');
        if (resetBtn) resetBtn.disabled = true;

        const requirements = ['reset-req-length', 'reset-req-upper', 'reset-req-lower', 'reset-req-number', 'reset-req-special'];
        requirements.forEach(req => {
            const element = document.getElementById(req);
            if (element) {
                element.style.color = '#999';
                const text = element.innerText || element.textContent;
                if (!text.includes('circle')) {
                    element.innerHTML = `<i class="fas fa-circle" style="font-size: 8px; margin-right: 6px;"></i> ${text.replace(/[✓✗]/g, '').trim()}`;
                }
            }
        });

        const matchMsg = document.getElementById('resetPasswordMatchMsg');
        if (matchMsg) matchMsg.innerHTML = '';
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

    // LOGIN FORM - FIXED REDIRECT
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const deviceInfo = navigator.userAgent;

        if (!username || !password) {
            showError('Please enter username and password');
            return;
        }

        // Disable login button to prevent multiple submits
        const loginBtn = document.querySelector('#loginForm button');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        try {
            const result = await AuthAPI.login({ username, password, deviceInfo });

            if (result.user) {
                // Store user data
                localStorage.setItem('user', JSON.stringify(result.user));
                console.log('Login successful, redirecting to welcome.html');
                showSuccess('Login successful! Redirecting...');

                // Short delay to show success message
                setTimeout(() => {
                    window.location.href = 'welcome.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);

            if (error.message.includes('locked')) {
                showError('🔒 ' + error.message);
                setTimeout(() => {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                }, 300000);
            } else if (error.message.includes('attempt(s) remaining')) {
                showError('⚠️ ' + error.message);
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else if (error.message.includes('verify your email')) {
                showError('📧 Please verify your email first. Check your inbox.');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else {
                showError('Invalid username or password');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
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

        if (!validateResetPassword(newPassword)) {
            showError('Please meet all password requirements');
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
