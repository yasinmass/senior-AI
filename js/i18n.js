// js/i18n.js — Multilingual support: English, Hindi, Tamil

const TRANSLATIONS = {

    en: {
        // ── Language switcher ──
        lang_en: 'EN', lang_hi: 'हिं', lang_ta: 'தமி',

        // ── Common ──
        app_name: 'Healthcare AI Screening',
        logout: 'Logout',
        go_back: 'Go Back',
        return_dashboard: 'Return to Dashboard',

        // ── index.html ──
        home_title: 'DEMENTIA SCREENING',
        home_subtitle: 'AI-driven early cognitive health assessment.',
        home_cta: 'Start AI Assessment',
        feat1_title: 'Voice Biomarkers',
        feat1_desc: 'Analyzing speech rate and pause duration for cognitive drift.',
        feat2_title: 'Cognitive Tasks',
        feat2_desc: 'Integrated orientation and memory recall metrics.',
        feat3_title: 'AI Predictions',
        feat3_desc: 'Real-time risk assessment using pre-trained ML models.',

        // ── login.html ──
        login_heading: 'Welcome Back',
        login_subtitle: 'Sign in to continue your assessment',
        login_email: 'Email address',
        login_password: 'Password',
        login_btn: 'Login',
        login_loading: 'Signing in...',
        login_no_account: 'Need an account?',
        login_signup_link: 'Sign Up',

        // ── signup.html ──
        signup_heading: 'Create Account',
        signup_name: 'Full Name',
        signup_age: 'Age',
        signup_dob: 'Date of Birth',
        signup_email: 'Email',
        signup_phone: 'Phone',
        signup_password: 'Password',
        signup_btn: 'Register',
        signup_loading: 'Creating Account...',
        signup_have_account: 'Already have an account?',
        signup_login_link: 'Sign In',

        // ── audio.html ──
        audio_notice_title: '⚠ Please Note',
        audio_notice_line1: 'This tool relies on voice analysis and may not be suitable for individuals with speech difficulties or impairments.',
        audio_notice_line2: 'If you find it hard to speak clearly, we kindly encourage you to consult a doctor or specialist for a proper cognitive evaluation.',
        audio_notice_line3: 'Your health matters — a qualified healthcare professional can guide you to the right assessment for your needs.',
        audio_notice_proceed: 'I Understand — Continue',
        audio_notice_back: 'Go Back',
        audio_title: 'Voice Biomarker Test',
        audio_subtitle: 'Speak about your day for at least 10 seconds (up to 60s).',
        audio_ready: 'Ready to record',
        audio_start_btn: 'Start Recording',
        audio_stop_btn: 'Stop Recording',
        audio_next_btn: 'Next: Memory Quiz',

        // ── quiz.html ──
        quiz_memory_task: 'Memory Task',
        quiz_memory_instruction: 'Please remember these five words. Your reaction time will be recorded.',
        quiz_ready_btn: 'I am Ready',
        quiz_saving: 'Saving Results...',
        quiz_saving_sub: 'Storing your cognitive profile securely in the database.',
        quiz_done_title: 'Assessment Completed ✓',
        quiz_done_sub: 'Your cognitive profile has been saved to the database.',
        quiz_view_report: 'View Full AI Report',
        quiz_domain_orientation: 'Orientation Assessment',
        quiz_domain_memory: 'Memory Assessment',
        quiz_domain_executive: 'Executive Assessment',

        // ── Quiz Questions ──
        q1: { q: 'What is today\'s day?', opts: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], a: null, domain: 'orientation' },
        q2: { q: 'What month is it currently?', opts: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], a: null, domain: 'orientation' },
        q3: { q: 'What year is it?', opts: ['2022', '2023', '2024', '2025', '2026'], a: '2026', domain: 'orientation' },
        q4: { q: 'What season is it? (India — February)', opts: ['Summer', 'Monsoon', 'Winter', 'Spring'], a: 'Winter', domain: 'orientation' },
        q5: { q: 'Memory Recall: Was "Apple" one of the words shown?', opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
        q6: { q: 'Memory Recall: Was "Car" one of the words shown?', opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
        q7: { q: 'Memory Recall: Was "Tree" one of the words shown?', opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
        q8: { q: 'Memory Recall: Was "Pen" one of the words shown?', opts: ['Yes', 'No'], a: 'Yes', domain: 'memory' },
        q9: { q: 'Memory Recall: Was "Chair" one of the words shown?', opts: ['Yes', 'No'], a: 'No', domain: 'memory' },
        q10: { q: 'Serial 7s: 100 minus 7 is?', opts: ['93', '97', '83', '91'], a: '93', domain: 'executive' },
        q11: { q: 'Logical Step: If January is the 1st month, March is the...?', opts: ['2nd', '3rd', '4th', '5th'], a: '3rd', domain: 'executive' },
        q12: { q: 'Arithmetic: What is 12 multiplied by 3?', opts: ['32', '34', '36', '38'], a: '36', domain: 'executive' },
        q13: { q: 'Logic: All Roses are flowers. Some flowers fade. Do all Roses definitely fade?', opts: ['Yes', 'No', 'Maybe'], a: 'Maybe', domain: 'executive' },
        q14: { q: 'Pattern: 2, 4, 8, 16... What comes next?', opts: ['24', '30', '32', '64'], a: '32', domain: 'executive' },

        // ── result.html ──
        result_heading: 'AI Cognitive Report',
        result_subtitle: 'Combined voice biomarker + cognitive quiz analysis',
        result_ml_label: 'Voice Biomarker AI Model',
        result_ml_analyzing: 'Analyzing...',
        result_ml_loading: 'Loading voice analysis from AI model',
        result_ml_dementia: 'Dementia Markers Detected',
        result_ml_dementia_sub: 'The AI voice model identified cognitive speech patterns associated with dementia.',
        result_ml_normal: 'Normal — No Concerns',
        result_ml_normal_sub: 'Voice biomarker patterns are within normal cognitive range.',
        result_ml_skipped: 'Voice Test Skipped',
        result_ml_skipped_sub: 'No voice recording was analyzed. Complete the voice test for full results.',
        result_quiz_label: 'Cognitive Quiz Performance',
        result_orientation: 'Orientation',
        result_memory: 'Memory',
        result_executive: 'Executive',
        result_total: 'Total Score',
        result_rt: 'Avg Reaction Time',
        result_voice_label: 'Voice Biomarkers',
        result_wpm: 'Words per Minute',
        result_pause: 'Pause Duration (s)',
        result_words: 'Words Spoken',
        result_final_label: 'Final Combined Assessment',
        result_analyzing: 'Analyzing...',
        result_normal_verdict: 'Cognitively Normal',
        result_normal_desc: 'Both voice biomarker analysis and cognitive quiz results indicate no significant signs of dementia.',
        result_moderate_verdict: 'Moderate Risk',
        result_moderate_desc: 'Some indicators suggest potential early-stage cognitive drift. We recommend monitoring and follow-up with a healthcare professional.',
        result_high_verdict: 'High Risk — Dementia Indicated',
        result_high_desc: 'Both the AI voice model and cognitive test results indicate significant markers consistent with dementia. An immediate clinical evaluation is strongly recommended.',
        out_of_10: 'out of 10',
        out_of_30: 'out of 30',
        sec_per_q: 'seconds per question',
    },

    // ─────────────────────────────────────────────────────────────────────────
    hi: {
        lang_en: 'EN', lang_hi: 'हिं', lang_ta: 'தமி',

        app_name: 'हेल्थकेयर AI स्क्रीनिंग',
        logout: 'लॉगआउट',
        go_back: 'वापस जाएं',
        return_dashboard: 'डैशबोर्ड पर वापस जाएं',

        home_title: 'डिमेंशिया स्क्रीनिंग',
        home_subtitle: 'AI-आधारित प्रारंभिक संज्ञानात्मक स्वास्थ्य मूल्यांकन।',
        home_cta: 'AI मूल्यांकन शुरू करें',
        feat1_title: 'आवाज़ बायोमार्कर',
        feat1_desc: 'संज्ञानात्मक परिवर्तन के लिए भाषण दर और विराम अवधि का विश्लेषण।',
        feat2_title: 'संज्ञानात्मक कार्य',
        feat2_desc: 'अभिविन्यास और स्मृति मेट्रिक्स का एकीकृत मूल्यांकन।',
        feat3_title: 'AI भविष्यवाणी',
        feat3_desc: 'पूर्व-प्रशिक्षित ML मॉडल से वास्तविक समय जोखिम मूल्यांकन।',

        login_heading: 'वापस आपका स्वागत है',
        login_subtitle: 'जारी रखने के लिए साइन इन करें',
        login_email: 'ईमेल पता',
        login_password: 'पासवर्ड',
        login_btn: 'लॉगिन',
        login_loading: 'साइन इन हो रहा है...',
        login_no_account: 'खाता नहीं है?',
        login_signup_link: 'साइन अप',

        signup_heading: 'खाता बनाएं',
        signup_name: 'पूरा नाम',
        signup_age: 'उम्र',
        signup_dob: 'जन्म तिथि',
        signup_email: 'ईमेल',
        signup_phone: 'फ़ोन',
        signup_password: 'पासवर्ड',
        signup_btn: 'पंजीकरण करें',
        signup_loading: 'खाता बनाया जा रहा है...',
        signup_have_account: 'पहले से खाता है?',
        signup_login_link: 'साइन इन',

        audio_notice_title: '⚠ कृपया ध्यान दें',
        audio_notice_line1: 'यह उपकरण आवाज़ विश्लेषण पर निर्भर करता है और भाषण कठिनाइयों वाले व्यक्तियों के लिए उपयुक्त नहीं हो सकता।',
        audio_notice_line2: 'यदि आपको स्पष्ट रूप से बोलने में कठिनाई होती है, तो हम आपसे अनुरोध करते हैं कि उचित संज्ञानात्मक मूल्यांकन के लिए किसी डॉक्टर से परामर्श करें।',
        audio_notice_line3: 'आपका स्वास्थ्य महत्वपूर्ण है — एक योग्य स्वास्थ्य देखभाल पेशेवर आपको सही मूल्यांकन की ओर मार्गदर्शन कर सकते हैं।',
        audio_notice_proceed: 'मैं समझता/समझती हूं — जारी रखें',
        audio_notice_back: 'वापस जाएं',
        audio_title: 'आवाज़ बायोमार्कर परीक्षण',
        audio_subtitle: 'कम से कम 10 सेकंड (अधिकतम 60 सेकंड) तक अपने दिन के बारे में बोलें।',
        audio_ready: 'रिकॉर्ड करने के लिए तैयार',
        audio_start_btn: 'रिकॉर्डिंग शुरू करें',
        audio_stop_btn: 'रिकॉर्डिंग बंद करें',
        audio_next_btn: 'अगला: स्मृति प्रश्नोत्तरी',

        quiz_memory_task: 'स्मृति कार्य',
        quiz_memory_instruction: 'कृपया इन पाँच शब्दों को याद करें। आपकी प्रतिक्रिया समय रिकॉर्ड की जाएगी।',
        quiz_ready_btn: 'मैं तैयार हूं',
        quiz_saving: 'परिणाम सहेजा जा रहा है...',
        quiz_saving_sub: 'आपका संज्ञानात्मक प्रोफ़ाइल सुरक्षित रूप से डेटाबेस में संग्रहीत किया जा रहा है।',
        quiz_done_title: 'मूल्यांकन पूर्ण ✓',
        quiz_done_sub: 'आपका संज्ञानात्मक प्रोफ़ाइल डेटाबेस में सहेजा गया है।',
        quiz_view_report: 'पूरी AI रिपोर्ट देखें',
        quiz_domain_orientation: 'अभिविन्यास मूल्यांकन',
        quiz_domain_memory: 'स्मृति मूल्यांकन',
        quiz_domain_executive: 'कार्यकारी मूल्यांकन',

        q1: { q: 'आज कौन सा दिन है?', opts: ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'], a: null, domain: 'orientation' },
        q2: { q: 'अभी कौन सा महीना है?', opts: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'], a: null, domain: 'orientation' },
        q3: { q: 'अभी कौन सा साल है?', opts: ['2022', '2023', '2024', '2025', '2026'], a: '2026', domain: 'orientation' },
        q4: { q: 'अभी कौन सा मौसम है? (फरवरी)', opts: ['गर्मी', 'मानसून', 'सर्दी', 'बसंत'], a: 'सर्दी', domain: 'orientation' },
        q5: { q: 'स्मृति: क्या "Apple" दिखाए गए शब्दों में से एक था?', opts: ['हाँ', 'नहीं'], a: 'हाँ', domain: 'memory' },
        q6: { q: 'स्मृति: क्या "Car" दिखाए गए शब्दों में से एक था?', opts: ['हाँ', 'नहीं'], a: 'हाँ', domain: 'memory' },
        q7: { q: 'स्मृति: क्या "Tree" दिखाए गए शब्दों में से एक था?', opts: ['हाँ', 'नहीं'], a: 'हाँ', domain: 'memory' },
        q8: { q: 'स्मृति: क्या "Pen" दिखाए गए शब्दों में से एक था?', opts: ['हाँ', 'नहीं'], a: 'हाँ', domain: 'memory' },
        q9: { q: 'स्मृति: क्या "Chair" दिखाए गए शब्दों में से एक था?', opts: ['हाँ', 'नहीं'], a: 'नहीं', domain: 'memory' },
        q10: { q: 'अंकगणित: 100 में से 7 घटाने पर क्या आता है?', opts: ['93', '97', '83', '91'], a: '93', domain: 'executive' },
        q11: { q: 'तार्किक: यदि जनवरी पहला महीना है, तो मार्च...?', opts: ['दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ'], a: 'तीसरा', domain: 'executive' },
        q12: { q: 'गणित: 12 गुणा 3 क्या होता है?', opts: ['32', '34', '36', '38'], a: '36', domain: 'executive' },
        q13: { q: 'तर्क: सभी गुलाब फूल हैं। कुछ फूल मुरझा जाते हैं। क्या सभी गुलाब मुरझा जाते हैं?', opts: ['हाँ', 'नहीं', 'शायद'], a: 'शायद', domain: 'executive' },
        q14: { q: 'क्रम: 2, 4, 8, 16... आगे क्या आएगा?', opts: ['24', '30', '32', '64'], a: '32', domain: 'executive' },

        result_heading: 'AI संज्ञानात्मक रिपोर्ट',
        result_subtitle: 'आवाज़ बायोमार्कर + संज्ञानात्मक प्रश्नोत्तरी का संयुक्त विश्लेषण',
        result_ml_label: 'आवाज़ बायोमार्कर AI मॉडल',
        result_ml_analyzing: 'विश्लेषण हो रहा है...',
        result_ml_loading: 'AI मॉडल से आवाज़ विश्लेषण लोड हो रहा है',
        result_ml_dementia: 'डिमेंशिया के संकेत मिले',
        result_ml_dementia_sub: 'AI आवाज़ मॉडल ने डिमेंशिया से जुड़े संज्ञानात्मक भाषण पैटर्न की पहचान की।',
        result_ml_normal: 'सामान्य — कोई चिंता नहीं',
        result_ml_normal_sub: 'आवाज़ बायोमार्कर पैटर्न सामान्य संज्ञानात्मक सीमा के भीतर हैं।',
        result_ml_skipped: 'आवाज़ परीक्षण छोड़ा गया',
        result_ml_skipped_sub: 'कोई आवाज़ रिकॉर्डिंग विश्लेषण नहीं हुई। पूर्ण परिणाम के लिए आवाज़ परीक्षण पूरा करें।',
        result_quiz_label: 'संज्ञानात्मक प्रश्नोत्तरी प्रदर्शन',
        result_orientation: 'अभिविन्यास',
        result_memory: 'स्मृति',
        result_executive: 'कार्यकारी',
        result_total: 'कुल अंक',
        result_rt: 'औसत प्रतिक्रिया समय',
        result_voice_label: 'आवाज़ बायोमार्कर',
        result_wpm: 'शब्द प्रति मिनट',
        result_pause: 'विराम अवधि (से.)',
        result_words: 'बोले गए शब्द',
        result_final_label: 'अंतिम संयुक्त मूल्यांकन',
        result_analyzing: 'विश्लेषण हो रहा है...',
        result_normal_verdict: 'संज्ञानात्मक रूप से सामान्य',
        result_normal_desc: 'आवाज़ बायोमार्कर विश्लेषण और प्रश्नोत्तरी दोनों डिमेंशिया के कोई महत्वपूर्ण संकेत नहीं दिखाते।',
        result_moderate_verdict: 'मध्यम जोखिम',
        result_moderate_desc: 'कुछ संकेत प्रारंभिक संज्ञानात्मक परिवर्तन की संभावना दर्शाते हैं। एक स्वास्थ्य पेशेवर से परामर्श की सिफारिश की जाती है।',
        result_high_verdict: 'उच्च जोखिम — डिमेंशिया के संकेत',
        result_high_desc: 'AI मॉडल और प्रश्नोत्तरी दोनों डिमेंशिया के महत्वपूर्ण संकेत दिखाते हैं। तत्काल नैदानिक मूल्यांकन की अत्यधिक सिफारिश की जाती है।',
        out_of_10: 'में से',
        out_of_30: 'में से',
        sec_per_q: 'सेकंड प्रति प्रश्न',
    },

    // ─────────────────────────────────────────────────────────────────────────
    ta: {
        lang_en: 'EN', lang_hi: 'हिं', lang_ta: 'தமி',

        app_name: 'ஹெல்த்கேர் AI திரையிடல்',
        logout: 'வெளியேறு',
        go_back: 'திரும்பு',
        return_dashboard: 'டாஷ்போர்டுக்கு திரும்பு',

        home_title: 'டிமென்ஷியா திரையிடல்',
        home_subtitle: 'AI அடிப்படையிலான ஆரம்பகால அறிவாற்றல் மதிப்பீடு.',
        home_cta: 'AI மதிப்பீட்டை தொடங்கு',
        feat1_title: 'குரல் பயோமார்க்கர்கள்',
        feat1_desc: 'அறிவாற்றல் மாற்றத்திற்கான பேச்சு வேகம் மற்றும் இடைவேளை பகுப்பாய்வு.',
        feat2_title: 'அறிவாற்றல் பணிகள்',
        feat2_desc: 'நோக்குநிலை மற்றும் நினைவக அளவீடுகளின் ஒருங்கிணைந்த மதிப்பீடு.',
        feat3_title: 'AI கணிப்புகள்',
        feat3_desc: 'முன் பயிற்சி பெற்ற ML மாதிரிகள் மூலம் நிகழ்நேர ஆபத்து மதிப்பீடு.',

        login_heading: 'மீண்டும் வரவேற்கிறோம்',
        login_subtitle: 'தொடர உள்நுழையவும்',
        login_email: 'மின்னஞ்சல் முகவரி',
        login_password: 'கடவுச்சொல்',
        login_btn: 'உள்நுழைவு',
        login_loading: 'உள்நுழைகிறது...',
        login_no_account: 'கணக்கு இல்லையா?',
        login_signup_link: 'பதிவு செய்க',

        signup_heading: 'கணக்கு உருவாக்கு',
        signup_name: 'முழு பெயர்',
        signup_age: 'வயது',
        signup_dob: 'பிறந்த தேதி',
        signup_email: 'மின்னஞ்சல்',
        signup_phone: 'தொலைபேசி',
        signup_password: 'கடவுச்சொல்',
        signup_btn: 'பதிவு செய்க',
        signup_loading: 'கணக்கு உருவாக்கப்படுகிறது...',
        signup_have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
        signup_login_link: 'உள்நுழைவு',

        audio_notice_title: '⚠ தயவுசெய்து கவனிக்கவும்',
        audio_notice_line1: 'இந்த கருவி குரல் பகுப்பாய்வை நம்பியுள்ளது, பேச்சு சிரமங்கள் உள்ளவர்களுக்கு இது பொருத்தமாக இருக்காது.',
        audio_notice_line2: 'தெளிவாக பேசுவதில் சிரமம் இருந்தால், சரியான அறிவாற்றல் மதிப்பீட்டிற்கு ஒரு மருத்துவரை அணுகுமாறு கேட்டுக்கொள்கிறோம்.',
        audio_notice_line3: 'உங்கள் ஆரோக்கியம் முக்கியம் — தகுதிவாய்ந்த சுகாதார நிபுணர் உங்களுக்கு சரியான மதிப்பீட்டை வழிகாட்டுவார்.',
        audio_notice_proceed: 'புரிகிறது — தொடர்க',
        audio_notice_back: 'திரும்பு',
        audio_title: 'குரல் பயோமார்க்கர் சோதனை',
        audio_subtitle: 'குறைந்தது 10 வினாடிகள் (அதிகபட்சம் 60 வினாடிகள்) உங்கள் நாளைப் பற்றி பேசுங்கள்.',
        audio_ready: 'பதிவு செய்ய தயார்',
        audio_start_btn: 'பதிவை தொடங்கு',
        audio_stop_btn: 'பதிவை நிறுத்து',
        audio_next_btn: 'அடுத்து: நினைவக வினாடி வினா',

        quiz_memory_task: 'நினைவக பணி',
        quiz_memory_instruction: 'இந்த ஐந்து வார்த்தைகளை நினைவில் வைத்துக்கொள்ளுங்கள். உங்கள் எதிர்வினை நேரம் பதிவு செய்யப்படும்.',
        quiz_ready_btn: 'நான் தயார்',
        quiz_saving: 'முடிவுகள் சேமிக்கப்படுகின்றன...',
        quiz_saving_sub: 'உங்கள் அறிவாற்றல் சுயவிவரம் பாதுகாப்பாக தரவுத்தளத்தில் சேமிக்கப்படுகிறது.',
        quiz_done_title: 'மதிப்பீடு முடிந்தது ✓',
        quiz_done_sub: 'உங்கள் அறிவாற்றல் சுயவிவரம் தரவுத்தளத்தில் சேமிக்கப்பட்டது.',
        quiz_view_report: 'முழு AI அறிக்கையை காண்க',
        quiz_domain_orientation: 'நோக்குநிலை மதிப்பீடு',
        quiz_domain_memory: 'நினைவக மதிப்பீடு',
        quiz_domain_executive: 'நிர்வாக மதிப்பீடு',

        q1: { q: 'இன்று என்ன நாள்?', opts: ['திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி', 'ஞாயிறு'], a: null, domain: 'orientation' },
        q2: { q: 'இப்போது என்ன மாதம்?', opts: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'], a: null, domain: 'orientation' },
        q3: { q: 'இப்போது என்ன ஆண்டு?', opts: ['2022', '2023', '2024', '2025', '2026'], a: '2026', domain: 'orientation' },
        q4: { q: 'இப்போது என்ன பருவம்? (பிப்ரவரி)', opts: ['கோடை', 'மழை', 'குளிர்', 'வசந்தம்'], a: 'குளிர்', domain: 'orientation' },
        q5: { q: 'நினைவக சோதனை: "Apple" காட்டப்பட்ட வார்த்தைகளில் ஒன்றா?', opts: ['ஆம்', 'இல்லை'], a: 'ஆம்', domain: 'memory' },
        q6: { q: 'நினைவக சோதனை: "Car" காட்டப்பட்ட வார்த்தைகளில் ஒன்றா?', opts: ['ஆம்', 'இல்லை'], a: 'ஆம்', domain: 'memory' },
        q7: { q: 'நினைவக சோதனை: "Tree" காட்டப்பட்ட வார்த்தைகளில் ஒன்றா?', opts: ['ஆம்', 'இல்லை'], a: 'ஆம்', domain: 'memory' },
        q8: { q: 'நினைவக சோதனை: "Pen" காட்டப்பட்ட வார்த்தைகளில் ஒன்றா?', opts: ['ஆம்', 'இல்லை'], a: 'ஆம்', domain: 'memory' },
        q9: { q: 'நினைவக சோதனை: "Chair" காட்டப்பட்ட வார்த்தைகளில் ஒன்றா?', opts: ['ஆம்', 'இல்லை'], a: 'இல்லை', domain: 'memory' },
        q10: { q: 'கணக்கு: 100 இல் இருந்து 7 கழித்தால்?', opts: ['93', '97', '83', '91'], a: '93', domain: 'executive' },
        q11: { q: 'தர்க்கம்: ஜனவரி முதல் மாதம் என்றால், மார்ச்...?', opts: ['இரண்டாவது', 'மூன்றாவது', 'நான்காவது', 'ஐந்தாவது'], a: 'மூன்றாவது', domain: 'executive' },
        q12: { q: 'கணக்கு: 12 பெருக்கல் 3 என்ன?', opts: ['32', '34', '36', '38'], a: '36', domain: 'executive' },
        q13: { q: 'தர்க்கம்: அனைத்து ரோஜாக்களும் பூக்கள். சில பூக்கள் வாடுகின்றன. அனைத்து ரோஜாக்களும் வாடுமா?', opts: ['ஆம்', 'இல்லை', 'ஒருவேளை'], a: 'ஒருவேளை', domain: 'executive' },
        q14: { q: 'வடிவம்: 2, 4, 8, 16... அடுத்தது என்ன?', opts: ['24', '30', '32', '64'], a: '32', domain: 'executive' },

        result_heading: 'AI அறிவாற்றல் அறிக்கை',
        result_subtitle: 'குரல் பயோமார்க்கர் + அறிவாற்றல் வினாடி வினா ஒருங்கிணைந்த பகுப்பாய்வு',
        result_ml_label: 'குரல் பயோமார்க்கர் AI மாதிரி',
        result_ml_analyzing: 'பகுப்பாய்வு செய்கிறது...',
        result_ml_loading: 'AI மாதிரியிலிருந்து குரல் பகுப்பாய்வு ஏற்றப்படுகிறது',
        result_ml_dementia: 'டிமென்ஷியா அறிகுறிகள் கண்டறியப்பட்டன',
        result_ml_dementia_sub: 'AI குரல் மாதிரி டிமென்ஷியாவுடன் தொடர்புடைய அறிவாற்றல் பேச்சு முறைகளை கண்டறிந்தது.',
        result_ml_normal: 'இயல்பு — கவலையில்லை',
        result_ml_normal_sub: 'குரல் பயோமார்க்கர் முறைகள் இயல்பான அறிவாற்றல் வரம்பிற்குள் உள்ளன.',
        result_ml_skipped: 'குரல் சோதனை தவிர்க்கப்பட்டது',
        result_ml_skipped_sub: 'குரல் பதிவு பகுப்பாய்வு செய்யப்படவில்லை. முழு முடிவுகளுக்கு குரல் சோதனையை முடிக்கவும்.',
        result_quiz_label: 'அறிவாற்றல் வினாடி வினா செயல்திறன்',
        result_orientation: 'நோக்குநிலை',
        result_memory: 'நினைவகம்',
        result_executive: 'நிர்வாகம்',
        result_total: 'மொத்த மதிப்பெண்',
        result_rt: 'சராசரி எதிர்வினை நேரம்',
        result_voice_label: 'குரல் பயோமார்க்கர்கள்',
        result_wpm: 'நிமிடத்திற்கு வார்த்தைகள்',
        result_pause: 'இடைவேளை கால அளவு (வி)',
        result_words: 'பேசிய வார்த்தைகள்',
        result_final_label: 'இறுதி ஒருங்கிணைந்த மதிப்பீடு',
        result_analyzing: 'பகுப்பாய்வு செய்கிறது...',
        result_normal_verdict: 'அறிவாற்றல் ரீதியாக இயல்பு',
        result_normal_desc: 'குரல் பயோமார்க்கர் பகுப்பாய்வு மற்றும் வினாடி வினா முடிவுகள் இரண்டும் டிமென்ஷியாவின் குறிப்பிடத்தக்க அறிகுறிகளை காட்டவில்லை.',
        result_moderate_verdict: 'மிதமான ஆபத்து',
        result_moderate_desc: 'சில அறிகுறிகள் ஆரம்பகால அறிவாற்றல் மாற்றத்தின் சாத்தியத்தை காட்டுகின்றன. ஒரு சுகாதார நிபுணரிடம் ஆலோசனை பெற பரிந்துரைக்கப்படுகிறது.',
        result_high_verdict: 'அதிக ஆபத்து — டிமென்ஷியா அறிகுறிகள்',
        result_high_desc: 'AI மாதிரி மற்றும் வினாடி வினா இரண்டும் டிமென்ஷியாவுடன் ஒத்த முக்கியமான அறிகுறிகளை காட்டுகின்றன. உடனடி மருத்துவ மதிப்பீடு கடுமையாக பரிந்துரைக்கப்படுகிறது.',
        out_of_10: 'இல் இருந்து',
        out_of_30: 'இல் இருந்து',
        sec_per_q: 'வினாடிகள் (ஒரு கேள்விக்கு)',
    }
};

// ─── Engine ──────────────────────────────────────────────────────────────────

function getCurrentLang() {
    return localStorage.getItem('app_lang') || 'en';
}

function setLang(lang) {
    localStorage.setItem('app_lang', lang);
    applyTranslations(lang);
    updateSwitcher(lang);
}

function t(key) {
    const lang = getCurrentLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ||
        (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) ||
        key;
}

function applyTranslations(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key] !== undefined) el.textContent = dict[key];
    });

    // Placeholder text
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key] !== undefined) el.placeholder = dict[key];
    });

    // Button value
    document.querySelectorAll('[data-i18n-val]').forEach(el => {
        const key = el.getAttribute('data-i18n-val');
        if (dict[key] !== undefined) el.value = dict[key];
    });

    // html content
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
}

function updateSwitcher(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active-lang', btn.dataset.lang === lang);
    });
}

// ─── Language Switcher Widget ─────────────────────────────────────────────────

function injectLangSwitcher() {
    const switcher = document.createElement('div');
    switcher.id = 'lang-switcher';
    switcher.style.cssText = `
    position: fixed; top: 14px; right: 18px; z-index: 9999;
    display: flex; gap: 4px; background: rgba(255,255,255,0.92);
    border: 1px solid #e5e7eb; border-radius: 999px;
    padding: 4px 6px; box-shadow: 0 2px 12px rgba(0,0,0,0.10);
    backdrop-filter: blur(8px);
  `;

    ['en', 'hi', 'ta'].forEach(lang => {
        const btn = document.createElement('button');
        btn.className = 'lang-btn';
        btn.dataset.lang = lang;
        btn.textContent = { en: 'EN', hi: 'हिं', ta: 'தமி' }[lang];
        btn.style.cssText = `
      font-size: 11px; font-weight: 700; padding: 3px 9px;
      border-radius: 999px; border: none; cursor: pointer;
      transition: all 0.2s; font-family: inherit; letter-spacing: 0.02em;
    `;
        btn.onclick = () => setLang(lang);
        switcher.appendChild(btn);
    });

    document.body.appendChild(switcher);

    // Style active button
    const style = document.createElement('style');
    style.textContent = `
    .lang-btn { background: transparent; color: #6b7280; }
    .lang-btn:hover { background: #f3f4f6; color: #111827; }
    .lang-btn.active-lang { background: #14b8a6; color: #fff !important; }
  `;
    document.head.appendChild(style);
}

// ─── Init (runs on every page) ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    injectLangSwitcher();
    const lang = getCurrentLang();
    applyTranslations(lang);
    updateSwitcher(lang);
});

// Export for quiz.js
window.i18n = { t, getCurrentLang, TRANSLATIONS };
