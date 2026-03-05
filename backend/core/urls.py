from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),
    path('doctors/', views.doctors_list_view, name='doctors_list'),
    path('patient/set-doctor/', views.associate_doctor_view, name='associate_doctor'),
    path('doctor/signup/', views.doctor_signup_view, name='doctor_signup'),
    path('doctor/login/', views.doctor_login_view, name='doctor_login'),
    path('doctor/me/', views.doctor_me_view, name='doctor_me'),

    # Doctor Dashboard APIs                                                 a

    path('doctor/stats/', views.doctor_stats_view, name='doctor_stats'),
    path('doctor/patients/', views.doctor_patients_view),
    path('doctor/patient/<int:patient_id>/', views.doctor_patient_detail_view),
    path('doctor/add-patient/', views.doctor_associate_patient_view),
    path('doctor/extract-patient/', views.doctor_extract_patient_view),
    path('doctor/completions/', views.doctor_completions_view),

    # ML Audio Analysis
    path('audio/analyze/', views.analyze_audio_view, name='analyze_audio'),

    # Patient Assessment
    path('assessment/save/', views.save_assessment_view, name='save_assessment'),
    path('assessment/latest/', views.latest_assessment_view, name='latest_assessment'),
    path('assessment/history/', views.all_assessments_view, name='all_assessments'),

    # Clinical Planning & Tasks
    path('clinical/plans/', views.clinical_plans_view, name='clinical_plans'),
    path('clinical/complete-task/', views.mark_task_complete_view, name='complete_task'),

    # MOCA Assessment
    path('moca/save/',    views.save_moca_view,    name='save_moca'),
    path('moca/latest/',  views.latest_moca_view,  name='latest_moca'),
    path('moca/history/', views.moca_history_view, name='moca_history'),

    # Voice Diary
    path('diary/record/',  views.record_diary_view,      name='record_diary'),
    path('diary/entries/', views.get_diary_entries_view,  name='diary_entries'),
]
