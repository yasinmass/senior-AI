import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAuth } from '../utils/api';

export default function ProtectedRoute({ children, role: requiredRole }) {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        async function verify() {
            setLoading(true);
            try {
                const res = await checkAuth();
                setAuth(res);
            } catch {
                setAuth(false);
            } finally {
                setLoading(false);
            }
        }
        verify();
    }, [location.pathname]);

    if (loading) return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '160px 24px', background: '#F4F6F9', minHeight: '100vh',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="loader-ring" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 15, color: '#94A3B5', fontWeight: 500 }}>Verifying your session…</p>
            </div>
        </div>
    );

    if (!auth) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredRole && auth.role !== requiredRole) {
        const dest = auth.role === 'patient' ? '/patient' : auth.role === 'caretaker' ? '/caretaker' : '/doctor';
        return <Navigate to={dest} replace />;
    }

    return children;
}
