import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAuth } from '../utils/api';

export default function ProtectedRoute({ children, role: requiredRole }) {
    const [auth, setAuth] = useState(null); // null = unknown, false = failed, object = success
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
        <div className="flex items-center justify-center p-40">
            <div className="spin text-teal-600 text-4xl">⟳</div>
        </div>
    );

    // No auth at all
    if (!auth) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Auth but wrong role
    if (requiredRole && auth.role !== requiredRole) {
        return <Navigate to={auth.role === 'patient' ? '/patient' : '/doctor'} replace />;
    }

    return children;
}
