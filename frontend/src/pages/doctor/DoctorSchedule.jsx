import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients, assignClinicalPlan } from '../../utils/api';

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

const EXERCISES = [...BRAIN_EXERCISES]; // Use our new refined library

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorSchedule() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [planType, setPlanType] = useState('exercise');
    const [dayExercises, setDayExercises] = useState({});
    const [instructions, setInstructions] = useState('');
    const [saved, setSaved] = useState(false);
    const [dragEx, setDragEx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // API Key provided by user
    const GEMINI_KEY = "AIzaSyChnbBmZ6Rfty4A6BZveGknhI1LkJlfGQU";

    useEffect(() => {
        async function loadPatients() {
            try {
                const data = await getDoctorPatients();
                if (data.success) setPatients(data.patients);
            } catch (err) {
                console.error("Load patients failed:", err);
            } finally {
                setLoading(false);
            }
        }
        loadPatients();
    }, []);

    const activeLibrary = planType === 'diet' ? BRAIN_FOODS : BRAIN_EXERCISES;

    async function generateAIDiet() {
        if (!selectedPatient) return alert("Select a patient first.");
        const p = patients.find(item => item.id == selectedPatient);
        if (!p) return;

        setGenerating(true);
        const risk = p.latest_assessment?.risk_level || "Unknown";
        const score = p.latest_assessment?.total_score || "N/A";

        const prompt = `Act as a clinical neurologist and nutritionist. Create a 7-day brain-healthy diet plan for a patient with a Dementia risk level of ${risk} (Cognitive Score: ${score}/30). 
        The plan should focus on neuro-protective foods like berries, walnuts, and fatty fish.
        Format the output precisely as JSON with days as keys ('Monday', 'Tuesday', etc.) and an array of food item IDs (from this list: ${BRAIN_FOODS.map(f => f.id).join(', ')}) as values.
        Only return the JSON object, nothing else.`;

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const result = await res.json();

            if (result.error) {
                throw new Error(result.error.message || "API Error");
            }

            if (!result.candidates || !result.candidates[0]?.content?.parts[0]?.text) {
                throw new Error("Invalid response structure from AI");
            }

            const text = result.candidates[0].content.parts[0].text;

            // More robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI did not return a valid schedule object");

            const aiPlan = JSON.parse(jsonMatch[0]);

            // Sanitize: ensure only valid IDs from BRAIN_FOODS are included
            const sanitizedPlan = {};
            const validIds = BRAIN_FOODS.map(f => f.id);

            DAYS.forEach(day => {
                if (aiPlan[day] && Array.isArray(aiPlan[day])) {
                    sanitizedPlan[day] = aiPlan[day].filter(id => validIds.includes(id));
                } else {
                    sanitizedPlan[day] = [];
                }
            });

            setDayExercises(sanitizedPlan);
            setInstructions(`AI-Generated neuro-protective diet plan based on ${risk} risk profile. Please verify before finalizing.`);
        } catch (err) {
            console.error("AI Generation failed:", err);
            const isQuota = err.message.toLowerCase().includes("quota");

            if (isQuota) {
                const useTemplate = window.confirm("AI Quota Exceeded. Would you like to use the Standard Neuro-Protective Clinical Template instead?");
                if (useTemplate) {
                    const templatePlan = {};
                    const items = BRAIN_FOODS.map(f => f.id);
                    DAYS.forEach((day, i) => {
                        // Distribute foods across the week
                        templatePlan[day] = [items[i % items.length], items[(i + 3) % items.length]];
                    });
                    setDayExercises(templatePlan);
                    setInstructions("Standardized neuro-protective clinical template applied due to AI engine unavailability. Please customize as needed.");
                    return;
                }
            }
            alert(`AI Engine Status: ${err.message}. Please check if the API key is active or try manual assignment.`);
        } finally {
            setGenerating(false);
        }
    }

    function addExercise(day, exId) {
        setDayExercises(prev => {
            const existing = prev[day] || [];
            if (existing.includes(exId)) return prev;
            return { ...prev, [day]: [...existing, exId] };
        });
    }

    function removeExercise(day, exId) {
        setDayExercises(prev => ({ ...prev, [day]: (prev[day] || []).filter(e => e !== exId) }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedPatient) return alert('Please select a patient.');

        const payload = {
            patient_id: selectedPatient,
            plan_type: planType,
            content: dayExercises,
            special_instructions: instructions
        };

        try {
            const data = await assignClinicalPlan(payload);
            if (data.success) setSaved(true);
        } catch (err) {
            alert("Failed to assign plan: " + err.message);
        }
    }

    if (saved) return (
        <DashboardLayout role="doctor" title="Schedule Assignment">
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="card shadow-2xl p-12 text-center max-w-lg border-0 bg-white">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✓</div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Therapeutic Plan Pushed</h3>
                    <p className="text-gray-500 font-medium italic mb-10 leading-relaxed">
                        The specialized clinical schedule has been successfully deployed to the patient's portal. Direct clinical monitoring is now active.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button className="px-8 py-3 bg-gray-900 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-black transition-all"
                            onClick={() => { setSaved(false); setDayExercises({}); setSelectedPatient(''); setInstructions(''); }}>
                            Assign New Target
                        </button>
                        <button className="px-8 py-3 border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:border-teal-600 hover:text-teal-600 transition-all"
                            onClick={() => window.location.href = '/doctor'}>
                            Return to Command
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );

    const [activeDay, setActiveDay] = useState('Monday');
    const totalAssigned = Object.values(dayExercises).flat().length;

    return (
        <DashboardLayout role="doctor" title="Clinical Target Assignment">
            <div className="page-header mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Clinical Assignment</h2>
                    <p className="text-gray-500 font-medium italic">Prescribe personalized interventions for enrolled patients.</p>
                </div>
                <div className="bg-teal-50 px-6 py-3 rounded-2xl border border-teal-100 flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Active Prescriptions</span>
                    <span className="text-2xl font-black text-teal-700">{totalAssigned}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-[380px_1fr] gap-8">
                    {/* Control Panel */}
                    <div className="space-y-6">
                        <div className="card shadow-xl border-0 overflow-hidden bg-white">
                            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-[10px]">Configuration</h3>
                                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Enrolled Patient</label>
                                    <select className="form-control py-4 px-6 rounded-2xl bg-gray-50 border-gray-50 font-medium shadow-inner"
                                        value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
                                        <option value="">Search clinical registry…</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.latest_assessment?.risk_level || 'No Screening'})</option>)}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment Category</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'exercise', label: 'Exercises', icon: '🧠' },
                                            { id: 'diet', label: 'Diet Chart', icon: '🥗' },
                                            { id: 'task', label: 'Clinical Task', icon: '📋' }
                                        ].map(t => (
                                            <button key={t.id} type="button"
                                                className={`py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all border-2 ${planType === t.id ? 'bg-teal-600 text-white border-teal-600 shadow-xl shadow-teal-100' : 'bg-white text-gray-400 border-gray-50 hover:border-teal-600'}`}
                                                onClick={() => { setPlanType(t.id); setDayExercises({}); }}>
                                                <span className="text-lg">{t.icon}</span> {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {planType === 'diet' && (
                                    <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-100 animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-lg">✨</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-purple-600">AI Diagnostic Engine</h5>
                                        </div>
                                        <button type="button" onClick={generateAIDiet} disabled={generating}
                                            className="w-full py-3 bg-purple-600 text-white font-black uppercase tracking-widest text-[8px] rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all">
                                            {generating ? 'Engine Syncing…' : 'Generate AI Diet Suggestion'}
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Directives</label>
                                    <textarea className="form-control py-4 px-6 rounded-2xl bg-gray-50 border-gray-50 font-medium shadow-inner" rows={4}
                                        placeholder="Enter specialized instructions or constraints for this patient…"
                                        value={instructions} onChange={e => setInstructions(e.target.value)} />
                                </div>

                                <button type="submit" className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 group" disabled={loading}>
                                    {loading ? 'Processing…' : 'Finalize Assignment →'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                        {/* Day Selector */}
                        <div className="flex bg-white p-2 rounded-[28px] shadow-xl border border-gray-50 gap-2">
                            {DAYS.map(day => (
                                <button key={day} type="button" onClick={() => setActiveDay(day)}
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeDay === day ? 'bg-teal-600 text-white shadow-xl shadow-teal-100' : 'text-gray-400 hover:bg-gray-50'}`}>
                                    {day.slice(0, 3)}
                                    <div className={`text-[8px] mt-1 ${activeDay === day ? 'text-white/50' : 'text-gray-300'}`}>{(dayExercises[day] || []).length} items</div>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-[1fr_380px] gap-8 items-start">
                            {/* Focused Day View */}
                            <div className="card shadow-2xl border-0 bg-white overflow-hidden min-h-[600px] flex flex-col">
                                <div className="p-8 bg-gray-900 flex items-center justify-between">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{activeDay} Focus</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-400/10 px-4 py-1 rounded-full">Active Editor</span>
                                </div>

                                <div className="p-10 flex-1 bg-gray-50/30"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={() => { if (dragEx) { addExercise(activeDay, dragEx); setDragEx(null); } }}>

                                    {(dayExercises[activeDay] || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-40 opacity-20 border-4 border-dashed border-gray-200 rounded-[40px] m-4">
                                            <div className="text-6xl mb-6">➕</div>
                                            <h4 className="text-xl font-black uppercase tracking-widest text-gray-400">Add {planType} targets</h4>
                                            <p className="text-xs font-medium italic mt-2">Drag from library or click suggest</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {(dayExercises[activeDay] || []).map((exId, i) => {
                                                const ex = activeLibrary.find(e => e.id === exId);
                                                return ex ? (
                                                    <div key={`${exId}_${i}`} className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center justify-between group animate-in slide-in-from-right-4">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black">{i + 1}</div>
                                                            <div>
                                                                <h5 className="font-black text-gray-900 uppercase tracking-tight">{ex.name}</h5>
                                                                <p className="text-[10px] text-gray-400 font-medium">{ex.cat} · {ex.dur || 'Daily'}</p>
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={() => removeExercise(activeDay, exId)}
                                                            className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sticky Library */}
                            <div className="card shadow-xl border-0 overflow-hidden bg-white sticky top-24">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500">Target Library</h3>
                                    <span className="text-[8px] font-black uppercase text-teal-600">Quick-Add</span>
                                </div>
                                <div className="p-6 max-h-[600px] overflow-y-auto space-y-3">
                                    {activeLibrary.map(ex => (
                                        <div key={ex.id}
                                            draggable
                                            onDragStart={() => setDragEx(ex.id)}
                                            onClick={() => { addExercise(activeDay, ex.id); }}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group bg-gray-50/50 border-transparent hover:border-teal-600 hover:bg-white`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-black text-xs uppercase tracking-tight text-gray-900">{ex.name}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-white px-2 py-0.5 rounded-full text-gray-400 group-hover:text-teal-600 transition-all">{ex.cat}</span>
                                            </div>
                                            <p className="text-[9px] font-medium text-gray-400 italic mt-1 leading-tight">{ex.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
