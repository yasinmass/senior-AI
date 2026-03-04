import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getDoctorPatients, assignClinicalPlan } from '../../utils/api';

const BRAIN_EXERCISES = [
    { id: 'meditation', name: 'Mindfulness Meditation', cat: 'Mental', dur: '10 min', desc: 'Focus on breathing and relaxation.' },
    { id: 'dual_n_back', name: 'Dual N-Back', cat: 'Cognitive', dur: '15 min', desc: 'Working memory and concentration task.' },
    { id: 'speed_match', name: 'Processing Speed Match', cat: 'Speed', dur: '10 min', desc: 'Identify matching symbols quickly.' },
    { id: 'semantic_link', name: 'Semantic Linking', cat: 'Language', dur: '20 min', desc: 'Connect related concepts words.' },
    { id: 'spatial_rotation', name: 'Spatial Rotation', cat: 'Visual', dur: '15 min', desc: 'Mentally rotate 3D objects.' },
    { id: 'stretching', name: 'Daily Stretching', cat: 'Motor', dur: '15 min', desc: 'Physical movement for brain health.' },
];

const BRAIN_FOODS = [
    { id: 'blueberries', name: 'Blueberries', cat: 'Antioxidants', desc: 'Rich in flavonoids.' },
    { id: 'walnuts', name: 'Walnuts', cat: 'Omega-3', desc: 'Healthy fats for brain cells.' },
    { id: 'turmeric', name: 'Turmeric', cat: 'Anti-inflammatory', desc: 'Curcumin for neuro-health.' },
    { id: 'fatty_fish', name: 'Fatty Fish', cat: 'Omega-3', desc: 'Salmon or trout sources.' },
    { id: 'dark_choco', name: 'Dark Chocolate', cat: 'Flavonoids', desc: 'At least 70% cocoa.' },
    { id: 'leafy_greens', name: 'Leafy Greens', cat: 'Vitamins', desc: 'Spinach, kale, or collards.' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorSchedule() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [planType, setPlanType] = useState('exercise'); // 'exercise' or 'diet'
    const [dayExercises, setDayExercises] = useState({});
    const [instructions, setInstructions] = useState('');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Note: Only for demonstration. In production, use backend proxy.
    const GEMINI_KEY = "AIzaSyChnbBmZ6Rfty4A6BZveGknhI1LkJlfGQU";

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getDoctorPatients();
                if (data.success) setPatients(data.patients);
            } catch (err) {
                console.error("Failed to load patients for schedule:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const activeLibrary = planType === 'diet' ? BRAIN_FOODS : BRAIN_EXERCISES;

    async function generateAIDiet() {
        if (!selectedPatient) return;
        const p = patients.find(item => item.id == selectedPatient);
        if (!p) return;

        setGenerating(true);
        const risk = p.latest_assessment?.risk_level || "Unknown";
        const score = p.latest_assessment?.total_score || "N/A";

        // Call Gemini API to get a structured diet suggestion based on patient risk
        const prompt = `As a neurologist/nutritionist, create a 7-day healthy brain diet plan for a patient with dementia risk level ${risk} (MoCA score ${score}/30). 
    Please suggest from these food IDs: ${BRAIN_FOODS.map(f => f.id).join(', ')}. 
    Return a valid JSON object where keys are the 7 days (Monday, Tuesday, etc.) and values are arrays of food IDs. Choose 2-3 items per day.`;

        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            const result = await resp.json();
            const text = result.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const aiPlan = JSON.parse(jsonMatch[0]);

            // Sanitize and set
            const sanitized = {};
            const validIds = BRAIN_FOODS.map(f => f.id);
            DAYS.forEach(day => {
                sanitized[day] = (aiPlan[day] || []).filter(id => validIds.includes(id));
            });

            setDayExercises(sanitized);
            setInstructions(`AI-Generated Diet based on Clinical Risk Level: ${risk}. Please follow strictly for cognitive maintenance.`);
        } catch (err) {
            console.error("Failed to generate AI diet:", err);
        } finally {
            setGenerating(false);
        }
    }

    function addExercise(day, exId) {
        setDayExercises(prev => {
            const current = prev[day] || [];
            if (current.includes(exId)) return prev;
            return { ...prev, [day]: [...current, exId] };
        });
    }

    function removeExercise(day, exId) {
        setDayExercises(prev => ({
            ...prev,
            [day]: (prev[day] || []).filter(e => e !== exId)
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedPatient) return;
        try {
            const res = await assignClinicalPlan({
                patient_id: selectedPatient,
                plan_type: planType,
                content: dayExercises,
                special_instructions: instructions
            });
            if (res.success) setSaved(true);
        } catch (err) {
            console.error("Assignment failed:", err);
        }
    }

    if (saved) return (
        <DashboardLayout role="doctor" title="Success">
            <div className="p-20 text-center">
                <div className="text-5xl mb-4 text-green-500">✓</div>
                <h2 className="text-2xl font-bold mb-2">Clinical Plan Assigned</h2>
                <p className="text-gray-500 mb-6">Patient can now see their new {planType} schedule in their portal.</p>
                <button onClick={() => { setSaved(false); setDayExercises({}); setSelectedPatient(''); }} className="bg-primary text-white px-6 py-2 rounded">New Assignment</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout role="doctor" title="Therapeutic Schedular">
            <div className="mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Set Patient Schedule</h2>
                <p className="text-gray-500 text-sm">Assign personalized exercises and diet plans to support neurological health.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Settings */}
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Select Patient</label>
                        <select
                            className="w-full border border-gray-200 p-2 text-sm rounded"
                            value={selectedPatient}
                            onChange={e => setSelectedPatient(e.target.value)}
                            required
                        >
                            <option value="">-- Select Patient --</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Plan Type</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded border ${planType === 'exercise' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}
                                onClick={() => { setPlanType('exercise'); setDayExercises({}); }}
                            >
                                Exercises
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-2 text-xs font-bold rounded border ${planType === 'diet' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-400 border-gray-200'}`}
                                onClick={() => { setPlanType('diet'); setDayExercises({}); }}
                            >
                                Diet Plan
                            </button>
                        </div>
                    </div>

                    {planType === 'diet' && (
                        <button
                            type="button"
                            onClick={generateAIDiet}
                            disabled={generating || !selectedPatient}
                            className="w-full bg-teal-600 text-white py-2 rounded text-xs font-bold hover:bg-teal-700 disabled:opacity-50"
                        >
                            {generating ? 'AI Generating...' : 'Generate AI Diet Suggestion'}
                        </button>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Clinical Instructions</label>
                        <textarea
                            className="w-full border border-gray-200 p-3 text-xs rounded min-h-[100px]"
                            placeholder="Enter special instructions or notes for the patient..."
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-md font-bold text-sm shadow-sm hover:bg-black transition-colors">
                        Assign Plan to Patient
                    </button>
                </div>

                {/* Center/Right Column: Schedule Builder */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex overflow-x-auto gap-2 pb-2">
                        {DAYS.map(day => (
                            <div key={day} className="min-w-[150px] flex-1">
                                <div className="bg-gray-100 p-2 text-center text-[10px] font-bold text-gray-500 uppercase rounded-t-lg">
                                    {day}
                                </div>
                                <div className="bg-white border-l border-r border-b border-gray-200 p-3 min-h-[150px] space-y-2 rounded-b-lg">
                                    {(dayExercises[day] || []).length === 0 && <p className="text-[10px] text-gray-300 italic text-center mt-4">No {planType}s</p>}
                                    {(dayExercises[day] || []).map(exId => {
                                        const libItem = activeLibrary.find(e => e.id === exId);
                                        return libItem ? (
                                            <div key={exId} className="bg-gray-50 border border-gray-100 p-2 rounded text-[10px] flex justify-between items-center group">
                                                <span className="font-bold text-gray-700">{libItem.name}</span>
                                                <button type="button" onClick={() => removeExercise(day, exId)} className="text-gray-300 hover:text-red-500 group-hover:opacity-100 transition-opacity">×</button>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Library to add from */}
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                        <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Click to Add {planType === 'diet' ? 'Foods' : 'Exercises'}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {activeLibrary.map(item => (
                                <div
                                    key={item.id}
                                    className="border border-gray-100 p-3 rounded-lg hover:border-primary cursor-pointer transition-colors"
                                    onClick={() => {
                                        // Just add to first day or provide a way to choose. 
                                        // For simplicity, let's just make it possible to click to add to active week view or some selection.
                                        // Let's assume we add to all days or we need to select day.
                                        // Simpler: provide a small dropdown or just add to Monday by default for demo.
                                        // Actually, let's keep it simple: the user must drag (just kidding, we'll use a selection)
                                    }}
                                >
                                    <p className="text-xs font-bold text-gray-800">{item.name}</p>
                                    <p className="text-[9px] text-gray-400 mb-2 truncate">{item.desc}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {DAYS.map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                className="text-[8px] bg-gray-50 hover:bg-primary hover:text-white px-1 py-0.5 rounded border border-gray-100"
                                                onClick={(e) => { e.stopPropagation(); addExercise(d, item.id); }}
                                            >
                                                {d.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
}
