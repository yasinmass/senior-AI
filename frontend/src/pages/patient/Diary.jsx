import DashboardLayout from '../../components/DashboardLayout';

export default function Diary() {
    return (
        <DashboardLayout role="patient" title="Diary">
            <div className="page-header">
                <h2>My Diary</h2>
                <p>Record your thoughts, memories, and daily experiences.</p>
            </div>
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📓</div>
                <h3>Your Personal space</h3>
                <p style={{ color: 'var(--gray-400)', marginTop: '10px' }}>
                    This feature is coming soon. Stay tuned to start jotting down your memories.
                </p>
            </div>
        </DashboardLayout>
    );
}
