from django.db import models
from django.contrib.auth.hashers import make_password


class Patient(models.Model):
    """Stores registered user/patient information."""
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)  # hashed
    age = models.IntegerField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        db_table = 'patients'
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'


class Assessment(models.Model):
    """Stores each dementia screening assessment result."""

    RISK_CHOICES = [
        ('Low', 'Low Risk'),
        ('Moderate', 'Moderate Risk'),
        ('High', 'High Risk'),
    ]

    ML_CHOICES = [
        ('dementia', 'Dementia Detected'),
        ('normal', 'Normal'),
        ('pending', 'Pending'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='assessments')

    # Cognitive quiz scores
    orientation_score = models.IntegerField(default=0)   # out of 10
    memory_score = models.IntegerField(default=0)        # out of 10
    executive_score = models.IntegerField(default=0)     # out of 10
    total_score = models.IntegerField(default=0)         # out of 30

    # Reaction time (average seconds per question)
    reaction_time = models.FloatField(default=0.0)

    # Voice biomarkers from audio recording
    speech_rate = models.FloatField(default=0.0)         # words per minute
    pause_duration = models.FloatField(default=0.0)      # total silence in seconds
    word_count = models.IntegerField(default=0)
    recording_duration = models.FloatField(default=0.0)  # seconds

    # ML Model (MFCC-based) audio analysis results
    ml_prediction = models.CharField(max_length=10, choices=ML_CHOICES, default='pending')
    ml_dementia_probability = models.FloatField(default=0.0)   # 0-100%
    ml_normal_probability = models.FloatField(default=0.0)     # 0-100%

    # Final combined risk classification (quiz + ML model)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='Low')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment for {self.patient.name} — {self.risk_level} Risk | ML: {self.ml_prediction} ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        db_table = 'assessments'
        verbose_name = 'Assessment'
        verbose_name_plural = 'Assessments'
        ordering = ['-created_at']
