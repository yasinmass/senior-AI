import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { icon: '🎙️', title: 'Voice Biomarkers', desc: 'AI analyzes 26 MFCC speech features to detect early cognitive decline signs.' },
        { icon: '🧩', title: 'Cognitive Testing', desc: 'Validated memory, orientation, and executive function assessments.' },
        { icon: '📉', title: 'Risk Stratification', desc: 'Machine learning models classify potential risk into Low, Moderate, or High.' },
        { icon: '👨‍⚕️', title: 'Clinical Workspace', desc: 'Dedicated portal for medical professionals to monitor patient longitudinal data.' },
        { icon: '📅', title: 'Health Tracking', desc: 'Personalized wellness schedules and cognitive exercise monitoring for patients.' },
        { icon: '🔒', title: 'Global Security', desc: 'HIPAA-grade encryption ensuring patient-doctor confidentiality.' },
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">NeuroScan AI</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#features" className="text-gray-600 hover:text-teal-600 font-semibold transition-colors">Features</a>
                        <div className="flex items-center gap-4 border-l border-gray-200 pl-8 ml-2">
                            <Link to="/login/patient" className="text-gray-500 font-bold hover:text-primary transition-colors text-sm uppercase tracking-widest">Patient Login</Link>
                            <Link to="/login/doctor" className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black rounded-lg uppercase tracking-widest transition-all">Doctor Access</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 overflow-hidden bg-gray-50">
                <div className="absolute top-0 right-0 -z-10 w-[60%] h-[120%] bg-teal-600/5 rounded-bl-[400px]" />
                <div className="max-w-7xl mx-auto px-6 grid items-center gap-16" style={{ gridTemplateColumns: window.innerWidth > 992 ? '1.2fr 0.8fr' : '1fr' }}>
                    <div className="fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-100/50 rounded-full border border-teal-200 mb-8">
                            <span className="flex h-2 w-2 rounded-full bg-teal-600" />
                            <span className="text-[10px] font-black text-teal-800 uppercase tracking-[0.2em]">Next-Generation Clinical Intelligence</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.95] mb-10 tracking-tighter">
                            Advanced <br /><span className="text-teal-600">Cognitive</span> <br />Screening.
                        </h1>
                        <p className="text-xl text-gray-500 leading-relaxed mb-12 max-w-lg font-medium">
                            An AI-powered diagnostic suite for early detection of neurological indicators using speech biomarkers and clinical assessments.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                            <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 hover:translate-y-[-10px] transition-all">
                                <div className="text-3xl mb-4">👤</div>
                                <h3 className="text-xl font-black text-gray-900 mb-3 uppercase tracking-tight">For Patients</h3>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">Securely track your brain health, take AI tests, and view clinical history.</p>
                                <button onClick={() => navigate('/signup/patient')} className="w-full py-4 bg-primary hover:bg-blue-700 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all uppercase tracking-widest text-xs">
                                    Start Free Screening
                                </button>
                            </div>
                            <div className="bg-gray-900 p-8 rounded-[32px] shadow-xl border border-gray-800 hover:translate-y-[-10px] transition-all text-white">
                                <div className="text-3xl mb-4">🩺</div>
                                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">For Doctors</h3>
                                <p className="text-white/40 text-sm mb-6 leading-relaxed">Clinical directory, longitudinal data analysis, and patient risk reporting.</p>
                                <button onClick={() => navigate('/login/doctor')} className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-gray-900 font-black rounded-xl shadow-lg shadow-teal-900/40 transition-all uppercase tracking-widest text-xs">
                                    Provider Portal
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative fade-in animate-float hidden lg:block" style={{ animationDelay: '0.2s' }}>
                        <div className="w-full aspect-[4/5] bg-gray-200 rounded-[60px] shadow-2xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173599211d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80')] bg-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                            <div className="absolute bottom-10 left-10 text-white">
                                <p className="text-teal-400 font-black text-xs uppercase tracking-[0.3em] mb-2">Validated Tech</p>
                                <h4 className="text-3xl font-black tracking-tighter">94.2% AI Accuracy</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features section */}
            <section id="features" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-24">
                        <h2 className="text-5xl font-black text-gray-900 mb-8 uppercase tracking-tighter">Clinical Methodologies</h2>
                        <p className="text-lg text-gray-500 font-medium">NeuroScan AI integrates state-of-the-at voice processing and cognitive theory into a unified clinical platform.</p>
                    </div>

                    <div className="grid gap-12" style={{ gridTemplateColumns: window.innerWidth > 768 ? 'repeat(3, 1fr)' : '1fr' }}>
                        {features.map((f, i) => (
                            <div key={i} className="bg-gray-50 p-12 rounded-[40px] border border-gray-100 hover:bg-white hover:shadow-2xl transition-all group">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-10 shadow-sm group-hover:bg-teal-600 transition-all">{f.icon}</div>
                                <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">{f.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 border-t border-gray-100 bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 grid gap-16" style={{ gridTemplateColumns: window.innerWidth > 992 ? '2fr 1fr 1fr' : '1fr' }}>
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                                <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-black text-gray-900 tracking-tighter">NeuroScan AI</span>
                        </div>
                        <p className="text-gray-400 font-medium max-w-sm leading-relaxed mb-10">Early detection and monitoring for neurodegenerative conditions using advanced machine learning for voice biomarkers.</p>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">HIPAA Compliant</div>
                            <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400">GDPR Ready</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-10">Patient Tools</h4>
                        <ul className="space-y-6">
                            <li><Link to="/signup/patient" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">Screening Portal</Link></li>
                            <li><Link to="/login/patient" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">Secure Sign In</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 uppercase tracking-[0.2em] text-[10px] mb-10">Join Network</h4>
                        <ul className="space-y-6">
                            <li><Link to="/login/doctor" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">Clinician Access</Link></li>
                            <li><Link to="/signup/doctor" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">Enroll as Provider</Link></li>
                            <li><a href="#" className="text-gray-400 hover:text-teal-600 font-bold transition-colors">API Documentation</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">© 2026 NeuroScan AI Laboratory. Global Health Systems.</p>
                    <div className="flex gap-8">
                        <span className="text-xs font-black text-gray-300">SYSTEM_STATUS: ONLINE</span>
                        <span className="text-xs font-black text-gray-300">V2.4.0-STABLE</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
