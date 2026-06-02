import DashboardLayout from '../../components/DashboardLayout';
import MemoryGame from '../../components/MemoryGame_updated_ui';
import { useTranslate } from '../../hooks/useTranslate';
import { saveGameScore } from '../../utils/api';

async function handleScoreSave(scoreData) {
    try {
        await saveGameScore(scoreData);
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
            <MemoryGame onScoreSave={handleScoreSave} />
        </DashboardLayout>
    );
}
