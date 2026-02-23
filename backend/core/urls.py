from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me_view, name='me'),

    # ML Audio Analysis
    path('audio/analyze/', views.analyze_audio_view, name='analyze_audio'),

    # Assessment
    path('assessment/save/', views.save_assessment_view, name='save_assessment'),
    path('assessment/latest/', views.latest_assessment_view, name='latest_assessment'),
    path('assessment/history/', views.all_assessments_view, name='all_assessments'),
]
