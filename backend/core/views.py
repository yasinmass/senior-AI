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
from .models import Patient, Assessment, Doctor, ClinicalPlan, MOCAAssessment, TaskCompletion
from .ml_predictor import predict_dementia, combined_risk_level



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
                'assigned_doctor': {
                    'id': doctor.id, 'name': doctor.name, 'hospital': doctor.hospital
                } if doctor else None
            }
        })
    except Patient.DoesNotExist:
        request.session.flush()
        return error('Patient not found.', 401)


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

    return success({
        'stats': {
            'total_patients': total_patients,
            'high_risk': high_risk,
            'moderate_risk': moderate_risk,
            'low_risk': low_risk,
            'total_assessments': total_assessments,
            'pending_reports': max(0, total_patients - len(latest_per_patient)),
        }
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
        }
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
                        created_at__date=today
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
        answers_json         = data.get('answers_json', {}),
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
