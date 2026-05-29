from django.db import models
from django.contrib.auth.hashers import make_password


class Doctor(models.Model):
    """Stores registered doctor information."""
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)  # hashed
    specialization = models.CharField(max_length=200, default='Neurology')
    license_number = models.CharField(max_length=100, blank=True)
    hospital = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def __str__(self):
        return f"Dr. {self.name} ({self.email})"

    class Meta:
        db_table = 'doctors'
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'


LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('ta', 'Tamil'),
    ('hi', 'Hindi'),
]

class Patient(models.Model):
    """Stores registered user/patient information."""
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)  # hashed
    age = models.IntegerField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    preferred_lang = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    
    # NEW: Clinical connection to a doctor
    assigned_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    
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


class MOCAAssessment(models.Model):
    """Stores Montreal Cognitive Assessment (MOCA) results — 30 marks total."""

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='moca_assessments')

    # 10 sections × 3 marks each = 30
    visuospatial_score   = models.IntegerField(default=0)   # Q1
    naming_score         = models.IntegerField(default=0)   # Q2
    memory_score         = models.IntegerField(default=0)   # Q3
    attention1_score     = models.IntegerField(default=0)   # Q4 left/right sequence
    attention2_score     = models.IntegerField(default=0)   # Q5 tap on A
    attention3_score     = models.IntegerField(default=0)   # Q6 serial subtraction
    language_score       = models.IntegerField(default=0)   # Q7 fluency
    abstraction_score    = models.IntegerField(default=0)   # Q8 similarity
    orientation_score    = models.IntegerField(default=0)   # Q9 date/place
    delayed_recall_score = models.IntegerField(default=0)   # Q10 delayed memory

    total_moca_score     = models.IntegerField(default=0)   # out of 30

    # Store raw answers as JSON for auditing
    answers_json = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"MOCA for {self.patient.name} — {self.total_moca_score}/30 ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        db_table   = 'moca_assessments'
        verbose_name = 'MOCA Assessment'
        verbose_name_plural = 'MOCA Assessments'
        ordering   = ['-created_at']


class ClinicalPlan(models.Model):
    """Stores clinical plans (exercises, diet, tasks) assigned by doctors to patients."""
    PLAN_TYPES = [
        ('exercise', 'Exercise Schedule'),
        ('diet', 'Diet Chart'),
        ('task', 'Clinical Task'),
    ]

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='plans')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='plans')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='exercise')

    content = models.JSONField(default=dict) 

    special_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'clinical_plans'
        verbose_name = 'Clinical Plan'
        verbose_name_plural = 'Clinical Plans'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_plan_type_display()} for {self.patient.name}"


class TaskCompletion(models.Model):
    """Tracks when a patient completes an assigned clinical task/exercise."""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='completions')
    plan = models.ForeignKey(ClinicalPlan, on_delete=models.CASCADE, related_name='completions')
    
    task_id = models.CharField(max_length=100) # e.g. "ex_1" or "diet_mon"
    completed_at = models.DateTimeField(auto_now_add=True)
    
    # Metadata about the completion
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'task_completions'
        verbose_name = 'Task Completion'
        verbose_name_plural = 'Task Completions'
        ordering = ['-completed_at']

    def __str__(self):
        return f"Completion: {self.task_id} by {self.patient.name}"


class DiaryEntry(models.Model):
    """Stores voice diary entries recorded by seniors."""
    senior_id      = models.IntegerField()
    original_text  = models.TextField()
    english_text   = models.TextField()
    language       = models.CharField(max_length=10)
    mood_score     = models.IntegerField(null=True, blank=True)
    emotion        = models.CharField(max_length=50, null=True, blank=True)
    sentiment      = models.CharField(max_length=10, null=True, blank=True)
    crisis_flag    = models.BooleanField(default=False)
    is_starred     = models.BooleanField(default=False)   # ← TASK 3: favourite
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Diary #{self.id} by senior {self.senior_id} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        db_table = 'diary_entries'
        verbose_name = 'Diary Entry'
        verbose_name_plural = 'Diary Entries'
        ordering = ['-is_starred', '-created_at']   # starred first, then newest



class SoulConnect(models.Model):
    """Stores the senior's daily check-in answers."""
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='soul_connections')
    
    q1_answer = models.TextField(blank=True, null=True)
    q2_answer = models.TextField(blank=True, null=True)
    q3_answer = models.TextField(blank=True, null=True)
    q4_answer = models.TextField(blank=True, null=True)
    
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'soul_connect_entries'
        verbose_name = 'Soul Connect Entry'
        verbose_name_plural = 'Soul Connect Entries'
        ordering = ['-created_at']

    def __str__(self):
        return f"Soul Connect by {self.patient.name} on {self.created_at.strftime('%Y-%m-%d')}"


class ChatHistory(models.Model):
    """Stores AI Companion conversation messages per patient."""
    patient     = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='chat_history')
    role        = models.CharField(max_length=20)   # 'user' or 'assistant'
    message     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.role}] {self.patient.name}: {self.message[:60]}"

    class Meta:
        db_table = 'chat_history'
        verbose_name = 'Chat History'
        verbose_name_plural = 'Chat Histories'
        ordering = ['created_at']

class DailyCheckin(models.Model):
    """Stores the senior's daily check-in (Soul Connect) structured answers."""
    patient      = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='daily_checkins')
    date         = models.DateField(auto_now_add=True)
    sleep_rating = models.IntegerField()  # 1=badly 4=very well
    food_rating  = models.IntegerField()
    day_rating   = models.IntegerField()
    exercise     = models.IntegerField()  # 1=no 2=little 3=yes
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'daily_checkins'
        unique_together = ['patient', 'date']
        verbose_name = 'Daily Checkin'
        verbose_name_plural = 'Daily Checkins'

    def __str__(self):
        return f"DailyCheckin by {self.patient.name} on {self.date}"

