let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Settings page loaded');

    // Get user from localStorage (no API call needed)
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    console.log('Current user from localStorage:', currentUser);

    // Display user info from localStorage
    document.getElementById('displayUsername').textContent = currentUser.username;
    document.getElementById('displayEmail').textContent = currentUser.email;
    document.getElementById('displayMemberSince').textContent = 'Recently';
    document.getElementById('totalLogins').textContent = currentUser.totalLogins || 0;
    document.getElementById('lastLogin').textContent = 'Last login recorded';

    // Set 2FA toggle state
    const twoFAToggle = document.getElementById('twoFAToggle');
    const twoFAStatus = document.getElementById('twoFAStatus');
    const twoFAInfo = document.getElementById('twoFAInfo');

    if (currentUser.twoFAEnabled) {
        twoFAToggle.checked = true;
        twoFAStatus.textContent = 'Enabled';
        twoFAStatus.className = 'status-badge status-enabled';
        twoFAInfo.classList.remove('hidden');
    } else {
        twoFAToggle.checked = false;
        twoFAStatus.textContent = 'Disabled';
        twoFAStatus.className = 'status-badge status-disabled';
        twoFAInfo.classList.add('hidden');
    }

    setupEventListeners();
});
async function loadUserProfile() {
    try {
        console.log('Fetching user profile with token...');
        const profile = await AuthAPI.getProfile();

        if (profile.user) {
            currentUser = profile.user;

            // Display user info
            document.getElementById('displayUsername').textContent = currentUser.username;
            document.getElementById('displayEmail').textContent = currentUser.email;
            document.getElementById('displayMemberSince').textContent = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Recently';
            document.getElementById('totalLogins').textContent = currentUser.totalLogins || 0;
            document.getElementById('lastLogin').textContent = currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Never';

            // Set 2FA toggle state
            const twoFAToggle = document.getElementById('twoFAToggle');
            const twoFAStatus = document.getElementById('twoFAStatus');
            const twoFAInfo = document.getElementById('twoFAInfo');

            if (currentUser.twoFAEnabled) {
                twoFAToggle.checked = true;
                twoFAStatus.textContent = 'Enabled';
                twoFAStatus.className = 'status-badge status-enabled';
                twoFAInfo.classList.remove('hidden');
            } else {
                twoFAToggle.checked = false;
                twoFAStatus.textContent = 'Disabled';
                twoFAStatus.className = 'status-badge status-disabled';
                twoFAInfo.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        console.log('Session may be invalid, redirecting to login');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

function setupEventListeners() {
    // Back to dashboard button
    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'welcome.html';
        });
    }

    // 2FA Toggle
    const twoFAToggle = document.getElementById('twoFAToggle');
    if (twoFAToggle) {
        twoFAToggle.addEventListener('change', async (e) => {
            const enable = e.target.checked;

            if (enable) {
                // Ask for confirmation before enabling
                const confirmEnable = confirm(
                    '⚠️ WARNING: Enabling 2FA will require you to enter a verification code from your email every time you log in.\n\n' +
                    'Make sure you have access to your email account.\n\n' +
                    'Do you want to enable 2FA?'
                );

                if (!confirmEnable) {
                    twoFAToggle.checked = false;
                    return;
                }
            } else {
                // Ask for confirmation before disabling
                const confirmDisable = confirm(
                    '⚠️ Disabling 2FA will make your account less secure.\n\n' +
                    'Are you sure you want to disable Two-Factor Authentication?'
                );

                if (!confirmDisable) {
                    twoFAToggle.checked = true;
                    return;
                }
            }

            // Show loading state
            showLoading();

            try {
                const result = await AuthAPI.toggle2FA(enable);

                if (result.twoFAEnabled === enable) {
                    if (enable) {
                        showSuccess('✅ 2FA enabled successfully! You will now receive verification codes via email when logging in.');
                    } else {
                        showSuccess('❌ 2FA disabled successfully.');
                    }

                    // Update local user data
                    currentUser.twoFAEnabled = enable;
                    localStorage.setItem('user', JSON.stringify(currentUser));

                    // Update UI
                    const twoFAStatus = document.getElementById('twoFAStatus');
                    const twoFAInfo = document.getElementById('twoFAInfo');

                    if (enable) {
                        twoFAStatus.textContent = 'Enabled';
                        twoFAStatus.className = 'status-badge status-enabled';
                        twoFAInfo.classList.remove('hidden');
                    } else {
                        twoFAStatus.textContent = 'Disabled';
                        twoFAStatus.className = 'status-badge status-disabled';
                        twoFAInfo.classList.add('hidden');
                    }
                }
            } catch (error) {
                console.error('Failed to toggle 2FA:', error);
                showError('Failed to update 2FA settings. Please try again.');
                twoFAToggle.checked = !enable; // Revert toggle
            } finally {
                hideLoading();
            }
        });
    }

    // Logout all devices button
    const logoutAllBtn = document.getElementById('logoutAllDevicesBtn');
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', async () => {
            const confirm = window.confirm(
                '⚠️ This will log you out from ALL devices, including this one.\n\n' +
                'You will need to log in again on all devices.\n\n' +
                'Are you sure?'
            );

            if (confirm) {
                await AuthAPI.logout();
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        });
    }
}

function showLoading() {
    const twoFAToggle = document.getElementById('twoFAToggle');
    if (twoFAToggle) {
        twoFAToggle.disabled = true;
    }
}

function hideLoading() {
    const twoFAToggle = document.getElementById('twoFAToggle');
    if (twoFAToggle) {
        twoFAToggle.disabled = false;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 5000);
}
