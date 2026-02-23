from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.views.static import serve

FRONTEND_ROOT = settings.BASE_DIR.parent  # points to HEALTHCARE_HACK/

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),

    # Serve JS, CSS, and module files from their relative paths
    # (HTML references them as "js/audio.js", "css/home.css", etc.)
    path('js/<path:path>', serve, {'document_root': FRONTEND_ROOT / 'js'}),
    path('css/<path:path>', serve, {'document_root': FRONTEND_ROOT / 'css'}),
    path('modules/<path:path>', serve, {'document_root': FRONTEND_ROOT / 'modules'}),

    # Serve frontend HTML pages
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html')),
    path('login.html', TemplateView.as_view(template_name='login.html')),
    path('signup.html', TemplateView.as_view(template_name='signup.html')),
    path('audio.html', TemplateView.as_view(template_name='audio.html')),
    path('quiz.html', TemplateView.as_view(template_name='quiz.html')),
    path('result.html', TemplateView.as_view(template_name='result.html')),
]
