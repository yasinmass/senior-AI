// Uses Vite proxy — /api/* → http://127.0.0.1:8000/api/*
export const API_BASE = '/api';

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
    });
    return res;
}

// Auth Check
export async function checkAuth() {
    try {
        const res = await apiFetch('/me/');
        if (res.ok) return { role: 'patient', data: await res.json() };

        const resDoc = await apiFetch('/doctor/me/');
        if (resDoc.ok) return { role: 'doctor', data: await resDoc.json() };

        return null;
    } catch {
        return null;
    }
}

// Patient Auth
export async function login(email, password) {
    const res = await apiFetch('/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function signup(userData) {
    const res = await apiFetch('/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return res.json();
}

// Doctor Auth
export async function doctorLogin(email, password) {
    const res = await apiFetch('/doctor/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
}

export async function doctorSignup(userData) {
    const res = await apiFetch('/doctor/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    return res.json();
}

export async function logout() {
    await apiFetch('/logout/', { method: 'POST' });
    sessionStorage.clear();
    localStorage.clear();
}

// Doctor Dashboard Data
export async function getDoctorStats() {
    const res = await apiFetch('/doctor/stats/');
    return res.json();
}

export async function getDoctorPatients() {
    const res = await apiFetch('/doctor/patients/');
    return res.json();
}

export async function getDoctorPatientDetail(id) {
    const res = await apiFetch(`/doctor/patient/${id}/`);
    return res.json();
}

// Patient Dashboard Data
export async function getLatestAssessment() {
    const res = await apiFetch('/assessment/latest/');
    return res.json();
}

export async function getAssessmentHistory() {
    const res = await apiFetch('/assessment/history/');
    return res.json();
}

export async function saveAssessment(data) {
    const res = await apiFetch('/assessment/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function analyzeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    const res = await apiFetch('/audio/analyze/', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

// Clinical Planning & Tasks
export async function getClinicalPlans() {
    const res = await apiFetch('/clinical/plans/');
    return res.json();
}

export async function assignClinicalPlan(data) {
    const res = await apiFetch('/clinical/plans/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

// MOCA Assessment
export async function saveMOCA(data) {
    const res = await apiFetch('/moca/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function getLatestMOCA() {
    const res = await apiFetch('/moca/latest/');
    return res.json();
}

export async function getMOCAHistory() {
    const res = await apiFetch('/moca/history/');
    return res.json();
}

export async function getDoctors() {
    const res = await apiFetch('/doctors/');
    return res.json();
}

export async function setDoctor(doctorId) {
    const res = await apiFetch('/patient/set-doctor/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId }),
    });
    return res.json();
}

export async function recordTaskCompletion(planId, taskId, notes = '') {
    const res = await apiFetch('/clinical/complete-task/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, task_id: taskId, notes }),
    });
    return res.json();
}

export async function addPatientByEmail(email) {
    const res = await apiFetch('/doctor/add-patient/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    return res.json();
}

export async function getDoctorCompletions() {
    const res = await apiFetch('/doctor/completions/');
    return res.json();
}
export async function ingestPatientPDF(file) {
    const formData = new FormData();
    formData.append('report', file);
    const res = await apiFetch('/doctor/extract-patient/', {
        method: 'POST',
        body: formData,
    });
    return res.json();
}
