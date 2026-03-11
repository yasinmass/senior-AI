import json
import os
import tempfile
import re
from pypdf import PdfReader
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
from .models import Patient, Assessment, Doctor, ClinicalPlan, MOCAAssessment, TaskCompletion, DiaryEntry, SoulConnect, ChatHistory, DailyCheckin
from .ml_predictor import predict_dementia, combined_risk_level
import subprocess
from pysentimiento import create_analyzer

# Load analyzer models once at startup (per user request)
try:
    print("[SENTIMIENTO] Loading models... this may take a moment.")
    sentiment_analyzer = create_analyzer(task="sentiment", lang="en")
    emotion_analyzer   = create_analyzer(task="emotion", lang="en")
    print("[SENTIMIENTO] Models loaded successfully.")
except Exception as e:
    print(f"[SENTIMIENTO] ERROR loading models: {e}")
    sentiment_analyzer = None
    emotion_analyzer = None

def analyze_mood(english_text):
    if not sentiment_analyzer or not emotion_analyzer:
        return {
            "mood_score": 5, "sentiment": "NEU", "emotion": "others", "probas": {}, "crisis": False
        }

    sentiment = sentiment_analyzer.predict(english_text)
    emotion   = emotion_analyzer.predict(english_text)

    # Mood score mapping 1-10
    score_map  = {"POS": 8, "NEU": 5, "NEG": 3}
    emo_adjust = {
        "joy":     +2,
        "surprise": +1,
        "others":   0,
        "sadness": -2,
        "fear":    -1,
        "disgust": -2,
        "anger":   -2
    }
    mood_score = score_map.get(sentiment.output, 5)
    mood_score += emo_adjust.get(emotion.output, 0)
    mood_score  = max(1, min(10, mood_score))

    # Crisis detection
    crisis_keywords = [
        "want to die", "end my life", "no point",
        "give up", "nobody cares", "can't go on",
        "hurt myself", "disappear"
    ]
    crisis = any(
        kw in english_text.lower() 
        for kw in crisis_keywords
    )
    if mood_score <= 2 and emotion.output in ["sadness", "fear"]:
        crisis = True

    return {
        "mood_score": mood_score,
        "sentiment":  sentiment.output,
        "emotion":    emotion.output,
        "probas":     dict(emotion.probas),
        "crisis":     crisis
    }


# ─── Faster-Whisper Model (lazy-loaded) ──────────────────────────────────────
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            _whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
            print("[WHISPER] Model loaded successfully.")
        except Exception as e:
            print(f"[WHISPER] ERROR loading model: {e}")
    return _whisper_model


def convert_webm_to_wav(input_path, output_path):
    """Convert any audio format to 16kHz mono WAV using ffmpeg."""
    subprocess.run(
        ["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", "-y", output_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def process_diary_audio(audio_path, explicit_lang=None):
    """
    Transcribe + translate audio using faster-whisper.
    If explicit_lang is provided, forces that language right away instead of auto-detecting.
    Returns dict with original_text, english_text, and language.
    """
    wav_path = audio_path.rsplit('.', 1)[0] + '.wav'
    convert_webm_to_wav(audio_path, wav_path)

    model = get_whisper_model()
    if model is None:
        raise RuntimeError("Whisper model could not be loaded.")

    language = explicit_lang

    if not language:
        # ── Pass 1: auto-detect language ──────────────────────────────────
        segments, info = model.transcribe(
            wav_path,
            task="transcribe",
            beam_size=5,
            vad_filter=True,          # removes silence — improves short recordings
            vad_parameters=dict(min_silence_duration_ms=300),
        )
        language = info.language   # e.g. 'ta', 'en', 'hi'
        raw_text = " ".join([s.text for s in segments]).strip()
    else:
        raw_text = ""

    # ── Pass 2: re-transcribe with forced language for accuracy ──────
    # This ensures Tamil speech isn't romanised or transcribed as English.
    if language and language != 'en':
        segments2, _ = model.transcribe(
            wav_path,
            task="transcribe",
            language=language,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300),
        )
        original_text = " ".join([s.text for s in segments2]).strip() or raw_text
    else:
        # If it was explicit 'en' or auto-detected 'en'
        if explicit_lang == 'en':
            segments_en, _ = model.transcribe(
                wav_path,
                task="transcribe",
                language="en",
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
            )
            original_text = " ".join([s.text for s in segments_en]).strip()
        else:
            original_text = raw_text

    # ── Translate to English ─────────────────────────────────────────
    if language != 'en':
        segments_tr, _ = model.transcribe(
            wav_path,
            task="translate",
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300),
        )
        english_text = " ".join([s.text for s in segments_tr]).strip()
    else:
        english_text = original_text

    # ── Cleanup temp files ───────────────────────────────────────────
    for p in [audio_path, wav_path]:
        try:
            if os.path.exists(p):
                os.remove(p)
        except Exception:
            pass

    return {
        "original_text": original_text or english_text,
        "english_text":  english_text  or original_text,
        "language":      language,
    }




def json_body(request):
    """Parse JSON body safely."""
    try:
        return json.loads(request.body)
    except Exception:
        return {}


def error(msg, status=400):
    return JsonResponse({'success': False, 'error': msg}, status=status)


def success(data=None, status=200):
    payload = {'success': True}
    if data:
        payload.update(data)
    return JsonResponse(payload, status=status)


@csrf_exempt
@require_http_methods(["POST", "GET"])
def soul_connect_view(request):
    """
    Handles saving or fetching SoulConnect history.
    """
    if request.method == "GET":
        patient_id = request.session.get('patient_id')
        if not patient_id:
            return error("Not authenticated", 401)
        
        patient = Patient.objects.get(id=patient_id)
        entries = SoulConnect.objects.filter(patient=patient).order_by('-created_at')[:20]
        return success({
            'entries': [
                {
                    'id': e.id,
                    'q1_answer': e.q1_answer,
                    'q2_answer': e.q2_answer,
                    'q3_answer': e.q3_answer,
                    'q4_answer': e.q4_answer,
                    'language': e.language,
                    'created_at': e.created_at.strftime('%Y-%m-%d %H:%M'),
                } for e in entries
            ]
        })
    elif request.method == "POST":
        patient_id = request.session.get('patient_id')
        if not patient_id:
            return error("Not authenticated", 401)

        data = json.loads(request.body)
        patient = Patient.objects.get(id=patient_id)
        sc = SoulConnect.objects.create(
            patient=patient,
            q1_answer=data.get('q1_answer', ''),
            q2_answer=data.get('q2_answer', ''),
            q3_answer=data.get('q3_answer', ''),
            q4_answer=data.get('q4_answer', ''),
            language=data.get('language', 'en')
        )
        return success({'id': sc.id, 'message': 'Saved successfully'})


# ─── Patient Auth Views ──────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def signup_view(request):
    """Register a new patient."""
    data = json_body(request)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    age = data.get('age')
    dob = data.get('dob')
    phone = data.get('phone', '').strip()

    if not all([name, email, password]):
        return error('Name, email, and password are required.')

    if Patient.objects.filter(email=email).exists():
        return error('An account with this email already exists.')

    patient = Patient.objects.create(
        name=name,
        email=email,
        password=make_password(password),
        age=age,
        dob=dob if dob else None,
        phone=phone,
        preferred_lang=data.get('preferred_lang', 'en'),
    )

    request.session['patient_id'] = patient.id
    request.session['patient_name'] = patient.name
    request.session['patient_email'] = patient.email
    request.session['role'] = 'patient'

    return success({
        'patient': {'id': patient.id, 'name': patient.name, 'email': patient.email}
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """Authenticate a patient."""
    data = json_body(request)
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return error('Email and password are required.')

    try:
        patient = Patient.objects.get(email=email)
    except Patient.DoesNotExist:
        return error('Invalid email or password.', 401)

    if not check_password(password, patient.password):
        return error('Invalid email or password.', 401)

    # Flush old session to prevent cross-role contamination
    request.session.flush()
    request.session['patient_id'] = patient.id
    request.session['patient_name'] = patient.name
    request.session['patient_email'] = patient.email
    request.session['role'] = 'patient'

    return success({
        'patient': {'id': patient.id, 'name': patient.name, 'email': patient.email}
    })


@require_http_methods(["GET"])
def doctors_list_view(request):
    """List all available doctors for patient to link with."""
    doctors = Doctor.objects.all().order_by('name')
    return success({
        'doctors': [{
            'id': d.id,
            'name': d.name,
            'specialization': d.specialization,
            'hospital': d.hospital
        } for d in doctors]
    })


@csrf_exempt
@require_http_methods(["POST"])
def associate_doctor_view(request):
    """Allow patient to link with a specific doctor for monitoring."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Authentication required.', 401)
    
    data = json_body(request)
    doctor_id = data.get('doctor_id')
    
    try:
        patient = Patient.objects.get(id=patient_id)
        if doctor_id:
            doctor = Doctor.objects.get(id=doctor_id)
            patient.assigned_doctor = doctor
        else:
            patient.assigned_doctor = None
        patient.save()
        return success({'message': 'Clinical supervisor updated.'})
    except Exception as e:
        return error(str(e))


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """Clear the session."""
    request.session.flush()
    return success({'message': 'Logged out successfully.'})


@require_http_methods(["GET"])
def me_view(request):
    """Return current logged-in patient info with supervisor clinical data."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
        doctor = patient.assigned_doctor
        return success({
            'patient': {
                'id': patient.id, 'name': patient.name, 'email': patient.email,
                'age': patient.age, 'phone': patient.phone, 'role': 'patient',
                'preferred_lang': patient.preferred_lang,
                'assigned_doctor': {
                    'id': doctor.id, 'name': doctor.name, 'hospital': doctor.hospital
                } if doctor else None
            }
        })
    except Patient.DoesNotExist:
        request.session.flush()
        return error('Patient not found.', 401)


@csrf_exempt
@require_http_methods(["POST"])
def language_update_view(request):
    """Update patient preferred language."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
    
    data = json_body(request)
    lang = data.get('preferred_lang')
    if lang not in ['en', 'ta', 'hi']:
        return error('Invalid language selection.')
        
    try:
        patient = Patient.objects.get(id=patient_id)
        patient.preferred_lang = lang
        patient.save()
        return success({'language': lang})
    except Exception as e:
        return error(str(e))



# ─── Translation Proxy View ───────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def translate_ui_view(request):
    """
    POST /api/translate/
    Body: { "texts": {"key": "English text", ...}, "lang": "ta" }
    Returns: { "key": "Translated text", ... }
    Requires an active patient session for security.
    Falls back gracefully if LibreTranslate is unavailable.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    from .translator import translate_batch
    data  = json_body(request)
    texts = data.get('texts', {})
    lang  = data.get('lang', 'en')

    if lang not in ('en', 'ta', 'hi'):
        lang = 'en'

    translated = translate_batch(texts, lang)
    return JsonResponse(translated)


# ─── Doctor Auth Views ────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def doctor_signup_view(request):
    """Register a new doctor."""
    data = json_body(request)

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    specialization = data.get('specialization', 'Neurology').strip()
    license_number = data.get('license_number', '').strip()
    hospital = data.get('hospital', '').strip()
    phone = data.get('phone', '').strip()

    if not all([name, email, password]):
        return error('Name, email, and password are required.')

    if Doctor.objects.filter(email=email).exists():
        return error('An account with this email already exists.')

    doctor = Doctor.objects.create(
        name=name,
        email=email,
        password=make_password(password),
        specialization=specialization,
        license_number=license_number,
        hospital=hospital,
        phone=phone,
    )

    request.session['doctor_id'] = doctor.id
    request.session['doctor_name'] = doctor.name
    request.session['doctor_email'] = doctor.email
    request.session['role'] = 'doctor'

    return success({
        'doctor': {
            'id': doctor.id, 'name': doctor.name, 'email': doctor.email,
            'specialization': doctor.specialization, 'hospital': doctor.hospital
        }
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def doctor_login_view(request):
    """Authenticate a doctor."""
    data = json_body(request)
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return error('Email and password are required.')

    try:
        doctor = Doctor.objects.get(email=email)
    except Doctor.DoesNotExist:
        return error('Invalid email or password.', 401)

    if not check_password(password, doctor.password):
        return error('Invalid email or password.', 401)

    # Flush old session to prevent cross-role contamination
    request.session.flush()
    request.session['doctor_id'] = doctor.id
    request.session['doctor_name'] = doctor.name
    request.session['doctor_email'] = doctor.email
    request.session['role'] = 'doctor'

    return success({
        'doctor': {
            'id': doctor.id, 'name': doctor.name, 'email': doctor.email,
            'specialization': doctor.specialization, 'hospital': doctor.hospital
        }
    })


@require_http_methods(["GET"])
def doctor_me_view(request):
    """Return current logged-in doctor info."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)

    try:
        doctor = Doctor.objects.get(id=doctor_id)
        return success({
            'doctor': {
                'id': doctor.id, 'name': doctor.name, 'email': doctor.email,
                'specialization': doctor.specialization, 'hospital': doctor.hospital,
                'license_number': doctor.license_number, 'phone': doctor.phone,
                'role': 'doctor'
            }
        })
    except Doctor.DoesNotExist:
        request.session.flush()
        return error('Doctor not found.', 401)


# ─── Doctor Dashboard API Views ───────────────────────────────────────────────

@require_http_methods(["GET"])
def doctor_stats_view(request):
    """Get overview statistics for the doctor's assigned patients only."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)

    # Filter by patients who have specifically 'added' this doctor
    assigned_patients = Patient.objects.filter(assigned_doctor_id=doctor_id)
    total_patients = assigned_patients.count()
    
    all_assessments = Assessment.objects.filter(patient__in=assigned_patients).select_related('patient').order_by('-created_at')

    # Latest assessment per assigned patient
    seen = set()
    latest_per_patient = []
    for a in all_assessments:
        if a.patient_id not in seen:
            seen.add(a.patient_id)
            latest_per_patient.append(a)

    high_risk = sum(1 for a in latest_per_patient if a.risk_level == 'High')
    moderate_risk = sum(1 for a in latest_per_patient if a.risk_level == 'Moderate')
    low_risk = sum(1 for a in latest_per_patient if a.risk_level == 'Low')
    total_assessments = all_assessments.count()

    recent_sc = SoulConnect.objects.filter(patient__in=assigned_patients).select_related('patient').order_by('-created_at')[:5]

    return success({
        'stats': {
            'total_patients': total_patients,
            'high_risk': high_risk,
            'moderate_risk': moderate_risk,
            'low_risk': low_risk,
            'total_assessments': total_assessments,
            'pending_reports': max(0, total_patients - len(latest_per_patient)),
        },
        'recent_soul_connects': [
            {
                'id': sc.id,
                'patient_id': sc.patient_id,
                'patient_name': sc.patient.name,
                'q1_answer': sc.q1_answer,
                'q2_answer': sc.q2_answer,
                'q3_answer': sc.q3_answer,
                'q4_answer': sc.q4_answer,
                'language': sc.language,
                'created_at': sc.created_at.strftime('%Y-%m-%d %H:%M'),
            } for sc in recent_sc
        ]
    })


@require_http_methods(["GET"])
def doctor_patients_view(request):
    """Get only assigned patients with their latest assessment for the doctor."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)

    patients = Patient.objects.filter(assigned_doctor_id=doctor_id).order_by('-created_at')
    result = []
    for p in patients:
        latest = Assessment.objects.filter(patient=p).first()
        result.append({
            'id': p.id,
            'name': p.name,
            'email': p.email,
            'age': p.age,
            'phone': p.phone,
            'created_at': p.created_at.strftime('%Y-%m-%d'),
            'latest_assessment': {
                'id': latest.id,
                'risk_level': latest.risk_level,
                'total_score': latest.total_score,
                'ml_prediction': latest.ml_prediction,
                'created_at': latest.created_at.strftime('%Y-%m-%d %H:%M'),
            } if latest else None,
            'total_assessments': Assessment.objects.filter(patient=p).count(),
        })

    return success({'patients': result})


@require_http_methods(["GET"])
def doctor_patient_detail_view(request, patient_id):
    """Get full history for a specific patient."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    assessments = Assessment.objects.filter(patient=patient)
    assessment_data = [
        {
            'id': a.id,
            'orientation_score': a.orientation_score,
            'memory_score': a.memory_score,
            'executive_score': a.executive_score,
            'total_score': a.total_score,
            'reaction_time': a.reaction_time,
            'speech_rate': a.speech_rate,
            'pause_duration': a.pause_duration,
            'word_count': a.word_count,
            'recording_duration': a.recording_duration,
            'ml_prediction': a.ml_prediction,
            'ml_dementia_probability': a.ml_dementia_probability,
            'ml_normal_probability': a.ml_normal_probability,
            'risk_level': a.risk_level,
            'created_at': a.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        for a in assessments
    ]

    # Fetch clinical adherence record
    completions = TaskCompletion.objects.filter(patient=patient).select_related('plan').order_by('-completed_at')[:20]
    
    # Simple adherence calculation (e.g., last 7 days vs expected)
    # For now, just return counts and recent items
    exercise_plan = ClinicalPlan.objects.filter(patient=patient, plan_type='exercise').first()
    expected_per_week = 0
    if exercise_plan and isinstance(exercise_plan.content, dict):
        for tasks in exercise_plan.content.values():
            if isinstance(tasks, list): expected_per_week += len(tasks)
    
    recent_done = TaskCompletion.objects.filter(patient=patient, plan__plan_type='exercise').count()
    
    return success({
        'patient': {
            'id': patient.id,
            'name': patient.name,
            'email': patient.email,
            'age': patient.age,
            'phone': patient.phone,
            'dob': str(patient.dob) if patient.dob else None,
            'created_at': patient.created_at.strftime('%Y-%m-%d'),
        },
        'assessments': assessment_data,
        'total_assessments': len(assessment_data),
        'adherence': {
            'completed_count': recent_done,
            'expected_weekly': expected_per_week,
            'recent_activities': [
                {
                    'task': c.task_id,
                    'date': c.completed_at.strftime('%Y-%m-%d %H:%M'),
                    'type': c.plan.plan_type
                } for c in completions
            ]
        },
        'soul_connections': [
            {
                'id': sc.id,
                'q1_answer': sc.q1_answer,
                'q2_answer': sc.q2_answer,
                'q3_answer': sc.q3_answer,
                'q4_answer': sc.q4_answer,
                'language': sc.language,
                'created_at': sc.created_at.strftime('%Y-%m-%d %H:%M'),
            } for sc in SoulConnect.objects.filter(patient=patient).order_by('-created_at')[:30]
        ]
    })


# ─── Audio / ML Analysis View ─────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def analyze_audio_view(request):
    """
    Accepts an uploaded audio file (WAV/WebM), extracts 26 MFCC features,
    runs the dementia RandomForest model, and returns the ML prediction.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    audio_file = request.FILES.get('audio')
    if not audio_file:
        return error('No audio file provided.')

    # Save to a temp file on disk
    suffix = '.wav' if audio_file.name.endswith('.wav') else '.webm'
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        result = predict_dementia(tmp_path)

        return success({
            'ml_prediction': result['prediction'],
            'ml_dementia_probability': result['dementia_probability'],
            'ml_normal_probability': result['normal_probability'],
            'message': 'Audio analysis complete.'
        })

    except Exception as e:
        return error(f'Audio analysis failed: {str(e)}', 500)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@csrf_exempt
@require_http_methods(["POST"])
def audio_transcribe_local_view(request):
    """
    Accepts an audio file and returns the translated English text.
    Uses the local faster-whisper model, avoiding network calls.
    Forces the patient's preferred language on the first pass.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
        
    audio_file = request.FILES.get('audio')
    if not audio_file:
        return error('No audio file provided.')
        
    import tempfile
    try:
        suffix = '.webm'
        if audio_file.name and audio_file.name.endswith('.wav'): suffix = '.wav'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
            
        patient = Patient.objects.filter(id=patient_id).first()
        explicit_lang = patient.preferred_lang if patient else None
            
        result = process_diary_audio(tmp_path, explicit_lang=explicit_lang)
        # process_diary_audio deletes the file internally
        return JsonResponse({
            'original_text': result.get('original_text', ''),
            'english_text': result.get('english_text', ''),
            'language': result.get('language', '')
        })
    except Exception as e:
        print(f"STT Error: {e}")
        return error(str(e), 500)


# ─── Assessment Views ─────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def save_assessment_view(request):
    """
    Save a complete assessment result to the database.
    Combines ML audio prediction + quiz scores for the final risk level.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    data = json_body(request)

    total_score = data.get('total_score', 0)
    ml_pred     = data.get('ml_prediction', 'pending')
    ml_dem_prob = data.get('ml_dementia_probability', 0.0)

    # Calculate combined risk level using ML + quiz
    if ml_pred in ('dementia', 'normal'):
        final_risk = combined_risk_level(ml_pred, ml_dem_prob, total_score)
    else:
        # Fallback: quiz-only risk if ML analysis was skipped
        if total_score >= 25:
            final_risk = 'Low'
        elif total_score >= 15:
            final_risk = 'Moderate'
        else:
            final_risk = 'High'

    assessment = Assessment.objects.create(
        patient=patient,
        orientation_score=data.get('orientation_score', 0),
        memory_score=data.get('memory_score', 0),
        executive_score=data.get('executive_score', 0),
        total_score=total_score,
        reaction_time=data.get('average_reaction_time', 0.0),
        speech_rate=data.get('speech_rate', 0.0),
        pause_duration=data.get('pause_duration', 0.0),
        word_count=data.get('word_count', 0),
        recording_duration=data.get('recording_duration', 0.0),
        ml_prediction=ml_pred,
        ml_dementia_probability=ml_dem_prob,
        ml_normal_probability=data.get('ml_normal_probability', 0.0),
        risk_level=final_risk,
    )

    return success({
        'assessment_id': assessment.id,
        'final_risk_level': final_risk,
        'message': 'Assessment saved successfully.'
    }, status=201)


@require_http_methods(["GET"])
def latest_assessment_view(request):
    """Get the most recent assessment for the logged-in patient."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    assessment = Assessment.objects.filter(patient_id=patient_id).first()
    if not assessment:
        return error('No assessment found.', 404)

    return success({
        'assessment': {
            'id': assessment.id,
            'orientation_score': assessment.orientation_score,
            'memory_score': assessment.memory_score,
            'executive_score': assessment.executive_score,
            'total_score': assessment.total_score,
            'average_reaction_time': assessment.reaction_time,
            'speech_rate': assessment.speech_rate,
            'pause_duration': assessment.pause_duration,
            'word_count': assessment.word_count,
            'recording_duration': assessment.recording_duration,
            'ml_prediction': assessment.ml_prediction,
            'ml_dementia_probability': assessment.ml_dementia_probability,
            'ml_normal_probability': assessment.ml_normal_probability,
            'final_risk_level': assessment.risk_level,
            'created_at': assessment.created_at.strftime('%Y-%m-%d %H:%M'),
        }
    })


@require_http_methods(["GET"])
def all_assessments_view(request):
    """Get all assessments for the logged-in patient (history)."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    assessments = Assessment.objects.filter(patient_id=patient_id)
    data = [
        {
            'id': a.id,
            'orientation_score': a.orientation_score,
            'memory_score': a.memory_score,
            'executive_score': a.executive_score,
            'total_score': a.total_score,
            'ml_prediction': a.ml_prediction,
            'ml_dementia_probability': a.ml_dementia_probability,
            'risk_level': a.risk_level,
            'created_at': a.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        for a in assessments
    ]
    return success({'assessments': data})


# ─── Clinical Planning & Tasks ───────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["GET", "POST"])
def clinical_plans_view(request):
    """
    Handle clinical plan assignments and retrieval.
    """
    role = request.session.get('role')
    my_patient_id = request.session.get('patient_id')
    my_doctor_id = request.session.get('doctor_id')

    if not role:
        return error('Authentication required to access clinical assignments.', 401)

    if request.method == "GET":
        if role == 'doctor':
            # Doctor sees all plans they've assigned
            plans = ClinicalPlan.objects.filter(doctor_id=my_doctor_id)
            return success({
                'plans': [{
                    'id': p.id,
                    'patient_name': p.patient.name,
                    'type': p.plan_type,
                    'created_at': p.created_at.strftime('%Y-%m-%d')
                } for p in plans]
            })
        else:
            # Patient sees their own assigned plan
            types = ['exercise', 'diet', 'task']
            result = {}
            today = timezone.now().date()
            for t in types:
                p = ClinicalPlan.objects.filter(patient_id=my_patient_id, plan_type=t).first()
                if p:
                    # Get completions for this plan TODAY
                    completions = TaskCompletion.objects.filter(
                        plan=p, 
                        completed_at__date=today
                    ).values_list('task_id', flat=True)

                    result[t] = {
                        'id': p.id,
                        'content': p.content,
                        'special_instructions': p.special_instructions,
                        'assigned_by': p.doctor.name,
                        'date': p.created_at.strftime('%Y-%m-%d'),
                        'completed_today': list(completions)
                    }
            return success({'plans': result})

    elif request.method == "POST":
        if role != 'doctor':
            return error('Only medical professionals can assign clinical plans.', 403)
        
        data = json_body(request)
        patient_id = data.get('patient_id')
        plan_type = data.get('plan_type', 'exercise')
        content = data.get('content', {})
        special_instructions = data.get('special_instructions', '')

        if not patient_id:
            return error('Target patient ID is required for clinical assignment.')

        # Update if exists or create new
        plan, created = ClinicalPlan.objects.update_or_create(
            doctor_id=my_doctor_id,
            patient_id=patient_id,
            plan_type=plan_type,
            defaults={
                'content': content,
                'special_instructions': special_instructions
            }
        )

        return success({
            'message': 'Clinical plan assigned successfully.',
            'plan_id': plan.id,
            'created': created
        }, status=201)


# ─── MOCA Assessment Views ────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def save_moca_view(request):
    """
    Save a MOCA assessment result to the database.
    Pure condition-based scoring — no ML model used.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    data = json_body(request)

    visuospatial   = max(0, min(3, int(data.get('visuospatial_score',   0))))
    naming         = max(0, min(3, int(data.get('naming_score',         0))))
    memory         = max(0, min(3, int(data.get('memory_score',         0))))
    attention1     = max(0, min(3, int(data.get('attention1_score',     0))))
    attention2     = max(0, min(3, int(data.get('attention2_score',     0))))
    attention3     = max(0, min(3, int(data.get('attention3_score',     0))))
    language       = max(0, min(3, int(data.get('language_score',       0))))
    abstraction    = max(0, min(3, int(data.get('abstraction_score',    0))))
    orientation    = max(0, min(3, int(data.get('orientation_score',    0))))
    delayed_recall = max(0, min(3, int(data.get('delayed_recall_score', 0))))

    total = (visuospatial + naming + memory + attention1 + attention2 +
             attention3 + language + abstraction + orientation + delayed_recall)

    moca = MOCAAssessment.objects.create(
        patient          = patient,
        visuospatial_score   = visuospatial,
        naming_score         = naming,
        memory_score         = memory,
        attention1_score     = attention1,
        attention2_score     = attention2,
        attention3_score     = attention3,
        language_score       = language,
        abstraction_score    = abstraction,
        orientation_score    = orientation,
        delayed_recall_score = delayed_recall,
        total_moca_score     = total,
        answers_json          = data.get('answers_json', {}),
    )

    return success({
        'moca_id':          moca.id,
        'total_moca_score': moca.total_moca_score,
        'message':          'MOCA assessment saved successfully.'
    }, status=201)


@require_http_methods(["GET"])
def latest_moca_view(request):
    """Return the most recent MOCA assessment for the logged-in patient."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    moca = MOCAAssessment.objects.filter(patient_id=patient_id).first()
    if not moca:
        return error('No MOCA assessment found.', 404)

    return success({
        'moca': {
            'id':                    moca.id,
            'visuospatial_score':    moca.visuospatial_score,
            'naming_score':          moca.naming_score,
            'memory_score':          moca.memory_score,
            'attention1_score':      moca.attention1_score,
            'attention2_score':      moca.attention2_score,
            'attention3_score':      moca.attention3_score,
            'language_score':        moca.language_score,
            'abstraction_score':     moca.abstraction_score,
            'orientation_score':     moca.orientation_score,
            'delayed_recall_score':  moca.delayed_recall_score,
            'total_moca_score':      moca.total_moca_score,
            'created_at':            moca.created_at.strftime('%Y-%m-%d %H:%M'),
        }
    })


@require_http_methods(["GET"])
def moca_history_view(request):
    """Return all MOCA assessments for the logged-in patient."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    mocas = MOCAAssessment.objects.filter(patient_id=patient_id)
    data = [
        {
            'id':               m.id,
            'total_moca_score': m.total_moca_score,
            'created_at':       m.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        for m in mocas
    ]
    return success({'moca_assessments': data})


# ─── Clinical Monitoring & Adherence ──────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def doctor_associate_patient_view(request):
    """Allow doctor to add a patient to their clinical list via account email."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)
    
    data = json_body(request)
    email = data.get('email', '').strip().lower()
    
    if not email:
        return error('Patient email is required.')
    
    try:
        doctor = Doctor.objects.get(id=doctor_id)
        patient = Patient.objects.get(email=email)
        
        # Link the patient to this doctor
        patient.assigned_doctor = doctor
        patient.save()
        
        return success({'message': f'Patient {patient.name} successfully added to clinical registry.'})
    except Patient.DoesNotExist:
        return error('No patient account found with this email address.')
    except Exception as e:
        return error(str(e))


@csrf_exempt
@require_http_methods(["POST"])
def mark_task_complete_view(request):
    """Allow patient to mark a clinical task (exercise/diet) as completed."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
    
    data = json_body(request)
    plan_id = data.get('plan_id')
    task_id = data.get('task_id') # Mon, ex1 etc
    notes = data.get('notes', '')
    
    if not plan_id or not task_id:
        return error('Clinical plan and specific task identifier are required.')
    
    try:
        plan = ClinicalPlan.objects.get(id=plan_id, patient_id=patient_id)
        
        # Create completion record
        TaskCompletion.objects.create(
            patient_id=patient_id,
            plan=plan,
            task_id=task_id,
            notes=notes
        )
        return success({'message': 'Activity recorded in clinical history.'})
    except ClinicalPlan.DoesNotExist:
        return error('Assigned clinical plan not found.')


@require_http_methods(["GET"])
def doctor_completions_view(request):
    """Fetch real adherence data for the doctor's assigned patients."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)
    
    # Get patients for this doctor
    assigned_patients = Patient.objects.filter(assigned_doctor_id=doctor_id)
    
    # Get recent completions (last 50)
    completions = TaskCompletion.objects.filter(plan__doctor_id=doctor_id).select_related('patient', 'plan').order_by('-completed_at')[:50]
    
    # Calculate summary per patient
    patient_summary = []
    for p in assigned_patients:
        # Get latest assessment for risk level
        assessment = Assessment.objects.filter(patient=p).first()
        risk = assessment.risk_level if assessment else 'Unknown'
        
        # Count assigned tasks (approximate from JSON content)
        plan = ClinicalPlan.objects.filter(patient=p, plan_type='exercise').first()
        assigned_count = 0
        if plan and isinstance(plan.content, dict):
            # plan.content is { "Monday": ["ex1", "ex2"], "Tuesday": ... }
            for day_tasks in plan.content.values():
                if isinstance(day_tasks, list):
                    assigned_count += len(day_tasks)
        
        # Count completions this week (simplified)
        done_count = TaskCompletion.objects.filter(patient=p, plan__plan_type='exercise').count()
        
        pct = 0
        if assigned_count > 0:
            pct = min(100, int((done_count / assigned_count) * 100))
        
        patient_summary.append({
            'name': p.name,
            'risk': risk,
            'assigned': assigned_count,
            'done': done_count,
            'pct': pct
        })

    return success({
        'completions': [{
            'patient': c.patient.name,
            'risk': Assessment.objects.filter(patient=c.patient).first().risk_level if Assessment.objects.filter(patient=c.patient).exists() else 'Low',
            'exercise': c.task_id,
            'completedAt': c.completed_at.strftime('%Y-%m-%d %H:%M')
        } for c in completions],
        'patient_summary': patient_summary
    })
@csrf_exempt
@require_http_methods(["POST"])
def doctor_extract_patient_view(request):
    """
    Accepts a PDF clinical report, extracts the patient email from the 
    identification block, and associates the patient with the doctor.
    """
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Access denied. Doctor authentication required.', 403)
        
    pdf_file = request.FILES.get('report')
    if not pdf_file:
        return error('No clinical report PDF provided.')
        
    try:
        reader = PdfReader(pdf_file)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
            
        # Regex for the system registry email we added to the report
        match = re.search(r"System Registry Email\s+([A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,}))", full_text)
        
        if not match:
            # Broader search for any email if the specific label isn't caught perfectly
            match = re.search(r"([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})", full_text)
            
        if not match:
            return error("Could not find valid clinical registry credentials in this PDF.")
            
        email = match.group(0).strip().lower()
        
        doctor = Doctor.objects.get(id=doctor_id)
        patient = Patient.objects.get(email=email)
        
        # Link the patient to this doctor
        patient.assigned_doctor = doctor
        patient.save()
        
        return success({
            'message': 'Ingestion successful.',
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'email': patient.email
            }
        })
        
    except Patient.DoesNotExist:
        return error("The email found in the PDF does not match any registered patient.")
    except Exception as e:
        return error(f"Extraction failed: {str(e)}")


# ─── Voice Diary Views ────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def record_diary_view(request):
    """
    Record a voice diary entry:
    1. Receive audio from frontend
    2. Convert webm → wav via ffmpeg
    3. Transcribe (original language) + translate (English) via faster-whisper
    4. Save DiaryEntry to database
    5. Cleanup temp audio files
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    audio_file = request.FILES.get('audio')
    if not audio_file:
        return error('No audio file provided.')

    tmp_path = None
    try:
        # Save uploaded audio to a temp file
        suffix = '.webm'
        if audio_file.name:
            if audio_file.name.endswith('.wav'):
                suffix = '.wav'
            elif audio_file.name.endswith('.mp3'):
                suffix = '.mp3'

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in audio_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        # Process audio: transcribe + translate using patient's preferred language to avoid auto-detect failures
        patient = Patient.objects.filter(id=patient_id).first() # Corrected from user__id to id
        explicit_lang = patient.preferred_lang if patient else None
            
        result = process_diary_audio(tmp_path, explicit_lang=explicit_lang)
        # process_diary_audio deletes the file internally
        tmp_path = None  # already cleaned up inside process_diary_audio

        # Save to database
        analysis = analyze_mood(result['english_text'])
        
        entry = DiaryEntry.objects.create(
            senior_id=patient_id,
            original_text=result['original_text'],
            english_text=result['english_text'],
            language=result['language'],
            mood_score=analysis['mood_score'],
            emotion=analysis['emotion'],
            sentiment=analysis['sentiment'],
            crisis_flag=analysis['crisis']
        )

        return success({
            'original_text': entry.original_text,
            'english_text':  entry.english_text,
            'language':      entry.language,
            'mood_score':    entry.mood_score,
            'emotion':       entry.emotion,
            'sentiment':     entry.sentiment,
            'crisis_flag':   entry.crisis_flag,
            'is_starred':    entry.is_starred,
            'id':            entry.id,
            # TASK 2: isoformat() includes +00:00 so browser reads UTC correctly → converts to local IST
            'created_at':    entry.created_at.isoformat(),
        }, status=201)


    except Exception as e:
        return error(f'Diary recording failed: {str(e)}', 500)

    finally:
        # Safety cleanup if process_diary_audio didn't run
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@require_http_methods(["GET"])
def get_diary_entries_view(request):
    """Get all diary entries for the logged-in patient — starred first, then newest."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    # TASK 3: starred first, then by date
    entries = DiaryEntry.objects.filter(senior_id=patient_id).order_by('-is_starred', '-created_at')
    data = [
        {
            'id':            e.id,
            'original_text': e.original_text,
            'language':      e.language,
            'mood_score':    e.mood_score,
            'emotion':       e.emotion,
            'is_starred':    e.is_starred,
            # TASK 2: include UTC offset so JS new Date() converts to local time correctly
            'created_at':    e.created_at.isoformat(),
        }
        for e in entries
    ]
    return success({'entries': data})


# ── TASK 3: Delete diary entry ─────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_diary_entry_view(request, entry_id):
    """Delete a diary entry. Only the owner can delete."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
    try:
        entry = DiaryEntry.objects.get(id=entry_id, senior_id=patient_id)
        entry.delete()
        return success({'deleted': entry_id})
    except DiaryEntry.DoesNotExist:
        return error('Entry not found.', 404)


# ── TASK 3: Star / unstar diary entry ────────────────────────────────────────

@csrf_exempt
@require_http_methods(["PATCH"])
def star_diary_entry_view(request, entry_id):
    """Toggle is_starred on a diary entry."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
    try:
        entry = DiaryEntry.objects.get(id=entry_id, senior_id=patient_id)
        entry.is_starred = not entry.is_starred
        entry.save(update_fields=['is_starred'])
        return success({'id': entry.id, 'is_starred': entry.is_starred})
    except DiaryEntry.DoesNotExist:
        return error('Entry not found.', 404)




# ─── Text-to-Speech (gTTS) View ──────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["GET"])
def tts_view(request):
    """
    Convert text to speech using Google TTS (gTTS).
    GET /api/tts/?text=hello&lang=en
    Returns audio/mpeg stream.
    """
    text = request.GET.get('text', '').strip()
    lang = request.GET.get('lang', 'en').strip()

    if not text:
        return error('No text provided.')

    try:
        import io
        from gtts import gTTS

        tts = gTTS(text=text, lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        audio_data = buf.getvalue()

        from django.http import HttpResponse
        response = HttpResponse(audio_data, content_type='audio/mpeg')
        response['Content-Length'] = len(audio_data)
        response['Cache-Control'] = 'no-cache'
        return response

    except Exception as e:
        return error(f'TTS failed: {str(e)}', 500)


# ─── AI Companion Context View ───────────────────────────────────────────────

@require_http_methods(["GET"])
def companion_context_view(request):
    """
    Returns patient profile + recent diary entries as AI context.
    GET /api/companion/context/
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    # Build profile context
    profile = {
        'name': patient.name,
        'age': patient.age,
        'email': patient.email,
        'phone': patient.phone,
    }

    # Get recent diary entries (last 20)
    entries = DiaryEntry.objects.filter(senior_id=patient_id).order_by('-created_at')[:20]
    diary_data = []
    for e in entries:
        diary_data.append({
            'date': e.created_at.strftime('%B %d, %Y %I:%M %p'),
            'original_text': e.original_text,
            'english_text': e.english_text,
            'language': e.language,
            'mood_score': e.mood_score,
            'emotion': e.emotion,
        })

    # Get latest assessment risk level if available
    latest_assessment = None
    try:
        assessment = Assessment.objects.filter(patient=patient).order_by('-created_at').first()
        if assessment:
            latest_assessment = {
                'risk_level': assessment.risk_level,
                'total_score': assessment.total_score,
                'date': assessment.created_at.strftime('%B %d, %Y'),
            }
    except Exception:
        pass

    return success({
        'profile': profile,
        'diary_entries': diary_data,
        'latest_assessment': latest_assessment,
    })

# ─── Doctor & Caretaker Diary Reports APIs ────────────────────────────────────

@require_http_methods(["GET"])
def doctor_diary_reports_view(request):
    """Returns ALL assigned patients' diary entries with analysis for doctor dashboard."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as doctor.', 401)
        
    patients = Patient.objects.filter(assigned_doctor_id=doctor_id)
    return success({'patients': _build_patient_diary_reports(patients)})

@require_http_methods(["GET"])
def caretaker_diary_reports_view(request):
    """Returns diary analysis for the caretaker's assigned patients."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated as caretaker.', 401)
        
    patients = Patient.objects.filter(assigned_doctor_id=doctor_id)
    return success({'patients': _build_patient_diary_reports(patients)})

def _build_patient_diary_reports(patients):
    from datetime import timedelta
    from django.utils import timezone
    
    result = []
    one_week_ago = timezone.now() - timedelta(days=7)
    
    for p in patients:
        entries = list(DiaryEntry.objects.filter(senior_id=p.id).order_by('-created_at'))
        weekly_entries = [e for e in entries if e.created_at >= one_week_ago]
        
        # Calculate weekly stats
        avg_mood = 0
        most_common_emo = "None"
        crisis_count = sum(1 for e in weekly_entries if getattr(e, 'crisis_flag', False))
        
        if weekly_entries:
            valid_moods = [e.mood_score for e in weekly_entries if getattr(e, 'mood_score', None) is not None]
            if valid_moods:
                avg_mood = round(sum(valid_moods) / len(valid_moods), 1)
                
            emotions = [e.emotion for e in weekly_entries if getattr(e, 'emotion', None)]
            if emotions:
                most_common_emo = max(set(emotions), key=emotions.count)
                
        # Simple trend
        trend = "stable"
        if len(weekly_entries) >= 2:
            first_half = weekly_entries[len(weekly_entries)//2:]
            second_half = weekly_entries[:len(weekly_entries)//2]
            def avg(lst):
                vals = [e.mood_score for e in lst if getattr(e, 'mood_score', None) is not None]
                return sum(vals)/len(vals) if vals else 0
            fh_avg = avg(first_half)
            sh_avg = avg(second_half)
            if sh_avg > fh_avg + 1: trend = "improving"
            elif sh_avg < fh_avg - 1: trend = "declining"
            
        result.append({
            "patient_name": p.name,
            "patient_id": p.id,
            "entries": [
                {
                    "id": getattr(e, 'id', None),
                    "date": e.created_at.strftime('%Y-%m-%d %H:%M') if e.created_at else '',
                    "original_text": getattr(e, 'original_text', ''),
                    "english_text": getattr(e, 'english_text', ''),
                    "language": getattr(e, 'language', 'en'),
                    "mood_score": getattr(e, 'mood_score', None),
                    "emotion": getattr(e, 'emotion', 'unknown'),
                    "sentiment": getattr(e, 'sentiment', 'NEU'),
                    "crisis_flag": getattr(e, 'crisis_flag', False)
                } for e in entries
            ],
            "weekly_summary": {
                "average_mood": avg_mood,
                "dominant_emotion": most_common_emo,
                "total_entries": len(weekly_entries),
                "crisis_count": crisis_count,
                "trend": trend
            }
        })
    return result

@require_http_methods(["GET"])
def caretaker_diary_alerts_view(request):
    """Returns only CRISIS flagged diary entries for alerts badge."""
    doctor_id = request.session.get('doctor_id')
    if not doctor_id:
        return error('Not authenticated.', 401)
        
    patients = Patient.objects.filter(assigned_doctor_id=doctor_id)
    patient_ids = patients.values_list('id', flat=True)
    
    crisis_entries = DiaryEntry.objects.filter(
        senior_id__in=patient_ids, 
        crisis_flag=True
    ).order_by('-created_at')
    
    alerts = []
    for e in crisis_entries:
        try:
            p = Patient.objects.get(id=e.senior_id)
            p_name = p.name
        except:
            p_name = "Unknown Patient"
            
        alerts.append({
            "patient_name": p_name,
            "date": e.created_at.strftime('%Y-%m-%d %H:%M') if e.created_at else '',
            "message": f"Crisis explicitly detected in diary entry.",
            "entry_text": e.original_text,
            "mood_score": e.mood_score,
            "emotion": e.emotion
        })
        
    return success({
        "alerts": alerts,
        "total_alerts": len(alerts)
    })


# ─── AI Companion Views ────────────────────────────────────────────────────────

def _get_groq_client():
    """Lazily get a Groq client instance."""
    from groq import Groq
    from django.conf import settings
    return Groq(api_key=settings.GROQ_API_KEY)


def _build_diary_context(patient_id, days=7):
    """Return diary entries as a formatted string context for Groq."""
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(days=days)
    entries = DiaryEntry.objects.filter(senior_id=patient_id, created_at__gte=cutoff).order_by('-created_at')[:10]
    if not entries:
        return "No recent diary entries."
    lines = []
    for e in entries:
        date_str = e.created_at.strftime('%b %d')
        text = e.english_text or e.original_text or ''
        emotion = e.emotion or ''
        lines.append(f"[{date_str}] {text} (emotion: {emotion})")
    return "\n".join(lines)


@require_http_methods(["GET"])
def companion_greet_view(request):
    """
    GET /api/companion/greet/
    Returns a personalised greeting using Groq based on diary context.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    diary_context = _build_diary_context(patient_id, days=3)

    lang = patient.preferred_lang

    lang_instruction = {
        "en": "Always respond in English.",
        "ta": "Always respond in Tamil language (தமிழில் பதில் சொல்லவும்).",
        "hi": "Always respond in Hindi language (हिंदी में जवाब दें).",
    }.get(lang, "Always respond in English.")

    try:
        client = _get_groq_client()
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are Bhavi, a warm AI companion for senior citizens.\n"
                        f"Patient name: {patient.name}\n"
                        f"Their recent diary entries (last 3 days):\n{diary_context}\n\n"
                        f"{lang_instruction}\n"
                        "Generate a warm, short and personal greeting (2 sentences max). "
                        "If the diary mentions something specific, reference it naturally. "
                        "Be friendly, caring, and encouraging."
                    )
                },
                {"role": "user", "content": "greet"}
            ],
            max_tokens=120
        )
        greeting = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[COMPANION GREET] Groq error: {e}")
        greeting = f"Hello {patient.name}! I'm Bhavi, your AI companion. How are you feeling today?"

    return success({'message': greeting})


@csrf_exempt
@require_http_methods(["POST"])
def companion_chat_view(request):
    """
    POST /api/companion/chat/
    Accepts audio file (multipart) OR JSON {"text": "..."} and returns AI reply.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    user_text = ''
    tmp_path = None

    # ── Determine input mode ──
    audio_file = request.FILES.get('audio')
    if audio_file:
        # Voice mode: transcribe with Whisper
        try:
            suffix = '.webm'
            fname = audio_file.name or ''
            if fname.endswith('.wav'):    suffix = '.wav'
            elif fname.endswith('.mp3'): suffix = '.mp3'
            elif fname.endswith('.ogg'): suffix = '.ogg'

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in audio_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # Convert to WAV
            wav_path = tmp_path.rsplit('.', 1)[0] + '_conv.wav'
            convert_webm_to_wav(tmp_path, wav_path)

            model = get_whisper_model()
            if model is None:
                return error('Speech-to-text service unavailable.', 503)

            segments, _ = model.transcribe(wav_path, task="transcribe")
            user_text = " ".join([s.text for s in segments]).strip()

            # Cleanup
            for p in [tmp_path, wav_path]:
                if p and os.path.exists(p):
                    os.unlink(p)
            tmp_path = None
        except Exception as e:
            print(f"[COMPANION CHAT] Whisper error: {e}")
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
            return error(f'Audio processing failed: {str(e)}', 500)
    else:
        # Text mode
        body = json_body(request)
        user_text = (body.get('text') or body.get('message') or '').strip()

    if not user_text:
        return error('No message provided.')

    # ── Build full context ──
    diary_context = _build_diary_context(patient_id, days=7)

    # Fetch last 10 turns (20 messages) for conversation history
    history_qs = ChatHistory.objects.filter(patient=patient).order_by('-created_at')[:20]
    history_msgs = []
    for h in reversed(list(history_qs)):
        history_msgs.append({"role": h.role, "content": h.message})

    # ── Crisis detection ──
    crisis_keywords = [
        "want to die", "end my life", "no point living", "give up",
        "nobody cares", "can't go on", "hurt myself", "disappear forever",
        "hopeless", "no reason to live"
    ]
    crisis_flag = any(kw in user_text.lower() for kw in crisis_keywords)

    lang = patient.preferred_lang

    lang_instruction = {
        "en": "Always respond in English.",
        "ta": "Always respond in Tamil language (தமிழில் பதில் சொல்லவும்).",
        "hi": "Always respond in Hindi language (हिंदी में जवाब दें).",
    }.get(lang, "Always respond in English.")

    system_prompt = (
        f"You are Bhavi, a warm and caring AI companion for senior citizens.\n\n"
        f"Patient name: {patient.name}\n\n"
        f"{lang_instruction}\n\n"
        f"Their diary from the past 7 days:\n{diary_context}\n\n"
        "Rules:\n"
        "- Speak like a caring friend, not a doctor.\n"
        "- Keep responses SHORT — 2-3 sentences maximum.\n"
        "- Ask only ONE gentle question per response.\n"
        "- Be warm, patient and encouraging.\n"
        "- Never use medical jargon or scores.\n"
        "- If the user mentions feeling very sad or hopeless, respond with extra warmth and care.\n"
    )

    messages_for_groq = [{"role": "system", "content": system_prompt}]
    messages_for_groq.extend(history_msgs)
    messages_for_groq.append({"role": "user", "content": user_text})

    # ── Call Groq ──
    try:
        client = _get_groq_client()
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages_for_groq,
            max_tokens=200
        )
        ai_response = resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[COMPANION CHAT] Groq error: {e}")
        ai_response = "I'm here with you. Could you tell me more about how you're feeling?"

    # ── Save to ChatHistory ──
    ChatHistory.objects.create(patient=patient, role='user', message=user_text)
    ChatHistory.objects.create(patient=patient, role='assistant', message=ai_response)

    return success({
        'user_text': user_text,
        'ai_response': ai_response,
        'crisis_flag': crisis_flag,
    })


@require_http_methods(["GET"])
def companion_history_view(request):
    """
    GET /api/companion/history/
    Returns the last 20 chat messages for the logged-in patient.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

    history_qs = ChatHistory.objects.filter(patient=patient).order_by('-created_at')[:20]
    messages_data = []
    for h in reversed(list(history_qs)):
        messages_data.append({
            'role': h.role,
            'message': h.message,
            'time': h.created_at.strftime('%I:%M %p'),
        })

    return success({'messages': messages_data})


@csrf_exempt
@require_http_methods(["POST"])
def companion_crisis_view(request):
    """
    POST /api/companion/crisis/
    Called when crisis_flag is detected. Logs it for caretaker review.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)
    # In a full implementation, this would send a notification.
    return success({'notified': True})

@csrf_exempt
@require_http_methods(["POST"])
def checkin_submit_view(request):
    """
    POST /api/checkin/submit/
    Saves the daily check-in (Soul Connect) for the patient.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    data = json_body(request)
    try:
        patient = Patient.objects.get(id=patient_id)
        
        DailyCheckin.objects.create(
            patient=patient,
            sleep_rating=data.get('sleep_rating', 1),
            food_rating=data.get('food_rating', 1),
            day_rating=data.get('day_rating', 1),
            exercise=data.get('exercise', 1)
        )
        return success({'message': 'Check-in saved!'})
    except Exception as e:
        return error(str(e))

@require_http_methods(["GET"])
def checkin_today_view(request):
    """
    GET /api/checkin/today/
    Checks if the patient has submitted a check-in today.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
        today = timezone.now().date()
        checkin = DailyCheckin.objects.filter(patient=patient, date=today).first()
        
        if checkin:
            return success({
                'completed': True,
                'data': {
                    'sleep_rating': checkin.sleep_rating,
                    'food_rating': checkin.food_rating,
                    'day_rating': checkin.day_rating,
                    'exercise': checkin.exercise
                }
            })
        else:
            return success({'completed': False})
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

@require_http_methods(["GET"])
def checkin_history_view(request):
    """
    GET /api/checkin/history/
    Returns the last 7 days of check-ins for the patient.
    """
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
        from datetime import timedelta
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        checkins = DailyCheckin.objects.filter(patient=patient, date__gte=seven_days_ago).order_by('-date')
        
        history_list = []
        for c in checkins:
            history_list.append({
                'id': c.id,
                'date': c.date.strftime('%Y-%m-%d'),
                'sleep_rating': c.sleep_rating,
                'food_rating': c.food_rating,
                'day_rating': c.day_rating,
                'exercise': c.exercise
            })
        return success({'history': history_list})
    except Patient.DoesNotExist:
        return error('Patient not found.', 404)

