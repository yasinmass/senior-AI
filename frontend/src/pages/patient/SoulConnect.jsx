import DashboardLayout from '../../components/DashboardLayout';

export default function SoulConnect() {
    return (
        <DashboardLayout role="patient" title="Soul Connect">
            <div className="page-header">
                <h2>Soul Connect</h2>
                <p>Connect with your loved ones and share meaningful moments.</p>
            </div>
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤝</div>
                <h3>Connect deeper</h3>
                <p style={{ color: 'var(--gray-400)', marginTop: '10px' }}>
                    This feature is coming soon. Experience a whole new way to connect with the people you care about.
                </p>
            </div>
        </DashboardLayout>
    );
}
