import json
import os
import tempfile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
from .models import Patient, Assessment
from .ml_predictor import predict_dementia, combined_risk_level


# ─── Helpers ────────────────────────────────────────────────────────────────

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


# ─── Auth Views ──────────────────────────────────────────────────────────────

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
    )

    request.session['patient_id'] = patient.id
    request.session['patient_name'] = patient.name
    request.session['patient_email'] = patient.email

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

    request.session['patient_id'] = patient.id
    request.session['patient_name'] = patient.name
    request.session['patient_email'] = patient.email

    return success({
        'patient': {'id': patient.id, 'name': patient.name, 'email': patient.email}
    })


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """Clear the patient session."""
    request.session.flush()
    return success({'message': 'Logged out successfully.'})


@require_http_methods(["GET"])
def me_view(request):
    """Return current logged-in patient info."""
    patient_id = request.session.get('patient_id')
    if not patient_id:
        return error('Not authenticated.', 401)

    try:
        patient = Patient.objects.get(id=patient_id)
        return success({
            'patient': {'id': patient.id, 'name': patient.name, 'email': patient.email}
        })
    except Patient.DoesNotExist:
        request.session.flush()
        return error('Patient not found.', 401)


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
            'total_score': a.total_score,
            'ml_prediction': a.ml_prediction,
            'risk_level': a.risk_level,
            'created_at': a.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        for a in assessments
    ]
    return success({'assessments': data})
