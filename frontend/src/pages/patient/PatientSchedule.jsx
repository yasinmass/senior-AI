import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getClinicalPlans, recordTaskCompletion } from '../../utils/api';

const BRAIN_EXERCISES = [
    { id: 'meditation', name: 'Mindfulness Meditation', cat: 'Mental', dur: '10 min', desc: 'Deep breathing and focused awareness to reduce neuro-inflammation.' },
    { id: 'dual_n_back', name: 'Dual N-Back', cat: 'Cognitive', dur: '15 min', desc: 'Working memory training that improves fluid intelligence.' },
    { id: 'speed_match', name: 'Processing Speed Match', cat: 'Speed', dur: '10 min', desc: 'Identify pairs quickly to maintain synaptic firing speed.' },
    { id: 'semantic_link', name: 'Semantic Linking', cat: 'Language', dur: '20 min', desc: 'Link unrelated concepts to strengthen associative memory.' },
    { id: 'spatial_rotation', name: 'Mental Rotation', cat: 'Visual', dur: '15 min', desc: 'Rotate 3D objects mentally to exercise parietal lobe.' },
    { id: 'stretching', name: 'Neurological Stretching', cat: 'Motor', dur: '15 min', desc: 'Gentle movements to maintain motor cortex plasticity.' },
];

const BRAIN_FOODS = [
    { id: 'blueberries', name: 'Blueberries / Berries', cat: 'Antioxidants', desc: 'Rich in flavonoids that delay mental aging.' },
    { id: 'walnuts', name: 'Walnuts', cat: 'Omega-3', desc: 'High in DHA, shown to improve cognitive performance.' },
    { id: 'turmeric', name: 'Turmeric with Black Pepper', cat: 'Anti-inflammatory', desc: 'Curcumin helps clear amyloid plaques in the brain.' },
    { id: 'broccoli', name: 'Steamed Broccoli', cat: 'Vitamin K', desc: 'Essential for forming sphingolipids, a type of fat in brain cells.' },
    { id: 'fatty_fish', name: 'Salmon / Mackerel', cat: 'Omega-3', desc: 'Provides building blocks for brain and nerve cells.' },
    { id: 'dark_choco', name: 'Dark Chocolate (85%+)', cat: 'Flavonoids', desc: 'Powerful antioxidants to protect brain cells from oxidation.' },
    { id: 'leafy_greens', name: 'Spinach / Kale', cat: 'Vitamins', desc: 'Lutein and Vitamin K for slowing cognitive decline.' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

export default function PatientSchedule() {
    const [plans, setPlans] = useState(null);
    const [activeType, setActiveType] = useState('exercise');
    const [completed, setCompleted] = useState({}); // Stores { task_id: true }
    const [activeDay, setActiveDay] = useState(TODAY);
    const [loading, setLoading] = useState(true);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await getClinicalPlans();
            if (data.success) {
                setPlans(data.plans);
                // Extract completions from all plans and set them in state
                const allCompletions = {};
                Object.values(data.plans).forEach(p => {
                    (p.completed_today || []).forEach(tid => {
                        allCompletions[tid] = true;
                    });
                });
                setCompleted(allCompletions);
            }
        } catch (err) {
            console.error("Load plans failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    async function handleComplete(planId, taskId) {
        if (completed[taskId]) return; // Already done

        try {
            const res = await recordTaskCompletion(planId, taskId, `Completed on ${activeDay}`);
            if (res.success) {
                setCompleted(prev => ({ ...prev, [taskId]: true }));
            }
        } catch (err) {
            alert("Connection error. Could not log completion.");
        }
    }

    const currentPlan = plans?.[activeType] || {};
    const currentSchedule = currentPlan.content || {};
    const instructions = currentPlan.special_instructions || "Follow the daily scheduled interventions as prescribed.";
    const doctorName = currentPlan.assigned_by || "Clinical Team";

    const totalTasks = Object.values(currentSchedule).flat().length;
    const doneTasks = Object.keys(completed).length; // This counts across all types but UI filters by currentPlan.id normally
    const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    if (loading) return (
        <DashboardLayout role="patient" title="Synchronizing Schedule…">
            <div className="flex items-center justify-center py-40">
                <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </DashboardLayout>
    );

    const activeDayTasks = currentSchedule[activeDay] || [];
    const activeLibrary = activeType === 'diet' ? BRAIN_FOODS : BRAIN_EXERCISES;

    return (
        <DashboardLayout role="patient" title="Therapeutic Schedule">
            <div className="page-header mb-12 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Clinical Interventions</h2>
                    <p className="text-gray-500 font-medium italic">Personalized neuro-protective schedule from Dr. {doctorName}</p>
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                    {[
                        { id: 'exercise', label: 'Exercises', icon: '🧠' },
                        { id: 'diet', label: 'Diet Chart', icon: '🥗' },
                        { id: 'task', label: 'Tasks', icon: '📋' }
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveType(t.id)}
                            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all ${activeType === t.id ? 'bg-white text-teal-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr-400px] gap-12">
                <div className="space-y-12">
                    {/* Week overview */}
                    <div className="card shadow-2xl border-0 bg-white overflow-hidden">
                        <div className="px-10 py-6 bg-gray-900 flex items-center justify-between">
                            <h3 className="text-white font-black uppercase tracking-widest text-xs">Diagnostic Timeline</h3>
                            <div className="flex gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <span>{activeType} track active</span>
                            </div>
                        </div>
                        <div className="p-10 text-center">
                            <div className="flex justify-between gap-2 overflow-x-auto pb-4">
                                {DAYS.map(day => {
                                    const dayTasks = currentSchedule[day] || [];
                                    const isToday = day === TODAY;
                                    const isActive = day === activeDay;

                                    return (
                                        <div key={day}
                                            onClick={() => setActiveDay(day)}
                                            className={`flex-1 min-w-[60px] cursor-pointer transition-all ${isActive ? 'scale-105' : ''}`}>
                                            <div className={`text-center py-4 rounded-2xl border-2 transition-all ${isActive ? 'bg-teal-600 border-teal-600 shadow-xl shadow-teal-100 text-white' : isToday ? 'bg-white border-teal-600 text-teal-600' : 'bg-gray-50 border-transparent text-gray-400 hover:border-gray-200'}`}>
                                                <div className="text-[10px] font-black uppercase tracking-widest mb-1">{day.slice(0, 3)}</div>
                                                <div className="text-xs font-black">{dayTasks.length}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Task Detail */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
                                {activeDay} {activeType === 'diet' ? 'Nutrients' : 'Interventions'} {activeDay === TODAY && <span className="text-teal-600 ml-2">— Today</span>}
                            </h3>
                            <span className="bg-gray-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{activeDayTasks.length} Targets</span>
                        </div>

                        {activeDayTasks.length === 0 ? (
                            <div className="card border-2 border-dashed border-gray-100 p-20 text-center rounded-[40px] bg-gray-50/30">
                                <div className="text-5xl mb-6 grayscale opacity-30">{activeType === 'diet' ? '🍽️' : '🧘'}</div>
                                <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">No {activeType} scheduled</h4>
                                <p className="text-gray-400 font-medium italic mt-2">Consult with clinical portal for customization.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {activeDayTasks.map((itemId, i) => {
                                    const item = activeLibrary.find(e => e.id === itemId) || { name: itemId, desc: 'Clinical instruction.' };
                                    const taskId = `${activeType}_${activeDay}_${itemId}`;
                                    const done = completed[taskId];

                                    return (
                                        <div key={i} className={`card shadow-xl border-0 rounded-[32px] overflow-hidden transition-all hover:shadow-2xl ${done ? 'bg-emerald-50 opacity-70' : 'bg-white'}`}>
                                            <div className="p-8 flex items-start gap-8">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${done ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white shadow-xl shadow-gray-200'}`}>
                                                    {activeType === 'diet' ? '🥗' : (done ? '✓' : i + 1)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className={`text-xl font-black uppercase tracking-tight ${done ? 'text-emerald-900 line-through' : 'text-gray-900'}`}>{item.name}</h4>
                                                            <div className="flex gap-2 mt-2">
                                                                {item.dur && <span className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">⏱ {item.dur}</span>}
                                                                <span className="bg-white border border-gray-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400"># {item.cat || 'Nutritional'}</span>
                                                            </div>
                                                        </div>
                                                        {done && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-4 py-1 rounded-full shadow-inner shadow-emerald-200">Logged Completed</span>}
                                                    </div>
                                                    <p className={`text-sm font-medium leading-relaxed italic ${done ? 'text-emerald-700' : 'text-gray-500'}`}>{item.desc}</p>
                                                    <div className="mt-8 flex gap-3">
                                                        {!done && activeDay === TODAY ? (
                                                            <button
                                                                className="bg-white border-2 border-emerald-600 text-emerald-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all underline decoration-4"
                                                                onClick={() => handleComplete(currentPlan.id, taskId)}
                                                            >
                                                                Commit Completion
                                                            </button>
                                                        ) : done ? (
                                                            <span className="text-emerald-600 font-black text-[10px] uppercase italic">Verified Clinical Record</span>
                                                        ) : (
                                                            <span className="text-gray-300 font-black text-[10px] uppercase italic">Await Active Day</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-8">
                    <div className="card shadow-2xl border-0 bg-white p-10 rounded-[40px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Clinical Progress</h4>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-black text-gray-900 tracking-tighter">{pct}%</span>
                            <span className="text-teal-600 text-xl font-black">↑</span>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-8">{doneTasks} Daily Targets Finalized</p>
                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-teal-600 shadow-lg shadow-teal-200 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                        </div>
                    </div>

                    <div className="card shadow-2xl border-0 bg-gray-900 p-10 rounded-[40px] text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6">Physician Directives</h4>
                        <p className="italic font-medium text-sm leading-relaxed text-teal-100/80 mb-8 font-serif">
                            "{instructions}"
                        </p>
                        <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-black italic">!</div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Directing Neurologist</div>
                                <div className="text-xs font-black text-white">Dr. {doctorName}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
