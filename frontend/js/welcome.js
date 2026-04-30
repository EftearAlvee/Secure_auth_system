document.addEventListener('DOMContentLoaded', async () => {
    console.log('Welcome page loaded');

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('User from localStorage:', user);

    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    console.log('Welcome user:', user.username);

    // Display user info
    document.getElementById('welcomeUsername').textContent = `Welcome, ${user.username}!`;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('totalLogins').textContent = user.totalLogins || 1;
    document.getElementById('memberSince').textContent = new Date().toLocaleDateString();

    // Try to load profile - but don't redirect on failure
    try {
        console.log('Fetching user profile...');
        const profile = await AuthAPI.getProfile();
        console.log('Profile response:', profile);
        if (profile && profile.user) {
            document.getElementById('totalLogins').textContent = profile.user.totalLogins || 1;
            // Update local storage with latest user data
            localStorage.setItem('user', JSON.stringify(profile.user));
        }
    } catch (error) {
        console.log('Profile fetch failed, but continuing with cached user data');
        // Don't redirect - user may still be logged in
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutConfirmModal = document.getElementById('logoutConfirmModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout button clicked');
            if (logoutConfirmModal) {
                logoutConfirmModal.classList.remove('hidden');
            }
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            console.log('Confirming logout');
            try {
                confirmLogoutBtn.disabled = true;
                confirmLogoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';

                await AuthAPI.logout();

                localStorage.removeItem('user');
                localStorage.removeItem('csrfToken');

                document.cookie.split(";").forEach(function(c) {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                console.log('Logout successful');
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Logout error:', error);
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            if (logoutConfirmModal) {
                logoutConfirmModal.classList.add('hidden');
            }
        });
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === logoutConfirmModal) {
            logoutConfirmModal.classList.add('hidden');
        }
    });

    // Activity chart
    const ctx = document.getElementById('activityChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Login Activity',
                data: [12, 19, 15, 17],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#333' }
                }
            }
        }
    });
});
