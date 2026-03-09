import DashboardLayout from '../../components/DashboardLayout';
import MemoryGame from '../../components/MemoryGame_updated_ui';
import { useTranslate } from '../../hooks/useTranslate';

async function saveScore(scoreData) {
    try {
        await fetch('/api/games/save-score/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scoreData),
            credentials: 'include',
        });
    } catch (e) {
        console.warn('[Games] score save failed:', e);
    }
}

export default function Games() {
    const t = useTranslate({
        title: 'Memory Game',
        subtitle: 'Exercise your memory with this fun card matching game!',
    });
    return (
        <DashboardLayout role="patient" title={t.title}>
            <div className="page-header">
                <h2>🎮 {t.title}</h2>
                <p>{t.subtitle}</p>
            </div>
            <MemoryGame onScoreSave={saveScore} />
        </DashboardLayout>
    );
}
