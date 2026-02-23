// js/auth.js — Django API-backed authentication

const API_BASE = 'http://127.0.0.1:8000/api';

function getCurrentPage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    return page;
}

const AUTH_CONFIG = {
    loginPage: '/login.html',
    protectedPages: ['index.html', '', 'audio.html', 'quiz.html', 'result.html']
};

async function checkAuth() {
    const page = getCurrentPage();
    if (!AUTH_CONFIG.protectedPages.includes(page)) return;

    try {
        const res = await fetch(`${API_BASE}/me/`, {
            credentials: 'include'
        });
        if (!res.ok) {
            window.location.href = AUTH_CONFIG.loginPage;
        }
    } catch (e) {
        console.warn('Auth check failed — is Django running?', e);
        window.location.href = AUTH_CONFIG.loginPage;
    }
}

async function signup(userData) {
    const res = await fetch(`${API_BASE}/signup/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return true;
}

async function login(email, password) {
    const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data.success;
}

async function logout() {
    await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
    });
    window.location.href = AUTH_CONFIG.loginPage;
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    const page = getCurrentPage();
    if (page !== 'login.html' && page !== 'signup.html') {
        checkAuth();
    }
});
