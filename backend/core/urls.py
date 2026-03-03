from django.urls import path
from . import views

urlpatterns = [
    # Patient Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),

    # Doctor Auth
    path('doctor/signup/', views.doctor_signup_view, name='doctor_signup'),
    path('doctor/login/', views.doctor_login_view, name='doctor_login'),
    path('doctor/me/', views.doctor_me_view, name='doctor_me'),

    # Doctor Dashboard APIs
    path('doctor/stats/', views.doctor_stats_view, name='doctor_stats'),
    path('doctor/patients/', views.doctor_patients_view, name='doctor_patients'),
    path('doctor/patient/<int:patient_id>/', views.doctor_patient_detail_view, name='doctor_patient_detail'),

    # ML Audio Analysis
    path('audio/analyze/', views.analyze_audio_view, name='analyze_audio'),

    # Patient Assessment
    path('assessment/save/', views.save_assessment_view, name='save_assessment'),
    path('assessment/latest/', views.latest_assessment_view, name='latest_assessment'),
    path('assessment/history/', views.all_assessments_view, name='all_assessments'),

    # Clinical Planning & Tasks
    path('clinical/plans/', views.clinical_plans_view, name='clinical_plans'),
]
