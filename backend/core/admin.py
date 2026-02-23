from django.contrib import admin
from .models import Patient, Assessment


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'age', 'phone', 'created_at')
    search_fields = ('name', 'email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'total_score', 'risk_level',
        'reaction_time', 'speech_rate', 'created_at'
    )
    list_filter = ('risk_level',)
    search_fields = ('patient__name', 'patient__email')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
