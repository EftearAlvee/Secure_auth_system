// Use the same domain as your frontend
const API_BASE_URL = 'https://secure-auth-system-wine.vercel.app/api';

class AuthAPI {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem('user');
                throw new Error('Session expired');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async verifyEmail(userId, verificationCode) {
        return this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ userId, verificationCode })
        });
    }

    static async resendVerification(email) {
        return this.request('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    static async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    static async resetPassword(email, resetCode, newPassword) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, resetCode, newPassword })
        });
    }

    static async getProfile() {
        return this.request('/auth/profile');
    }

    static async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }
}
