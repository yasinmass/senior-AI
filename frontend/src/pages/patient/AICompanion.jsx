import DashboardLayout from '../../components/DashboardLayout';

export default function AICompanion() {
    return (
        <DashboardLayout role="patient" title="AI Companion">
            <div className="page-header">
                <h2>AI Companion</h2>
                <p>Your friendly AI assistant for daily support and companionship.</p>
            </div>
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
                <h3>Welcome to your AI Companion</h3>
                <p style={{ color: 'var(--gray-400)', marginTop: '10px' }}>
                    This feature is coming soon. You'll be able to chat, play games, and get assistance right here.
                </p>
            </div>
        </DashboardLayout>
    );
}
