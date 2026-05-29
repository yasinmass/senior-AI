from django.urls import path
from . import views

urlpatterns = [
    # Auth & Profile
    path('signup/', views.signup_view, name='patient_signup'),
    path('login/', views.login_view, name='patient_login'),
    path('logout/', views.logout_view, name='logout'),
    path('doctors/', views.doctors_list_view, name='doctors_list'),
    path('patient/set-doctor/', views.associate_doctor_view, name='associate_doctor'),
    path('me/', views.me_view, name='me'),
    path('profile/language/', views.language_update_view, name='language_update'),
    path('translate/', views.translate_ui_view, name='translate_ui'),
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
    path('audio/transcribe-local/', views.audio_transcribe_local_view, name='audio_transcribe_local'),

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
    path('diary/delete/<int:entry_id>/', views.delete_diary_entry_view, name='delete_diary'),
    path('diary/star/<int:entry_id>/',   views.star_diary_entry_view,   name='star_diary'),
    path('diary/doctor/reports/', views.doctor_diary_reports_view),
    path('diary/caretaker/reports/', views.caretaker_diary_reports_view),
    path('diary/caretaker/alerts/', views.caretaker_diary_alerts_view),


    # AI Companion TTS
    path('tts/', views.tts_view, name='tts'),

    # AI Companion Context (legacy)
    path('companion/context/', views.companion_context_view, name='companion_context'),

    # AI Companion Chat (new)
    path('companion/greet/',   views.companion_greet_view,   name='companion_greet'),
    path('companion/chat/',    views.companion_chat_view,    name='companion_chat'),
    path('companion/history/', views.companion_history_view, name='companion_history'),
    path('companion/crisis/',  views.companion_crisis_view,  name='companion_crisis'),

    # Soul Connect
    path('soul-connect/', views.soul_connect_view, name='soul_connect'),
    path('checkin/submit/', views.checkin_submit_view, name='checkin_submit'),
    path('checkin/today/', views.checkin_today_view, name='checkin_today'),
    path('checkin/history/', views.checkin_history_view, name='checkin_history'),
]
