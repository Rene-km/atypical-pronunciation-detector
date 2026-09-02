from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.files.base import ContentFile
import base64
import io


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError('Users must have an email address')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
  """
  Custom User model that uses email as the unique identifier instead of username.
  """
  name = models.CharField(max_length=255)
  email = models.CharField(max_length=255, unique=True)
  password = models.CharField(max_length=255)
  username = None

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = []

  objects = UserManager()

class Module(models.Model):
  """
  Represents a learning module with a difficulty level (Easy, Medium, Hard).
  """
  id = models.AutoField(primary_key=True)
  diff = models.CharField(max_length=50, default="Easy")
  
  def __str__(self) -> str:
    return self.diff



class Phrase(models.Model):
  """
  Represents a phrase used for pronunciation practice.
  Each phrase belongs to a module and has an associated audio file.
  """
  id = models.AutoField(primary_key=True)
  phrase = models.CharField(max_length=255)
  module = models.ForeignKey(Module, null=True, on_delete=models.CASCADE)
  audio = models.FileField(upload_to='mp3/', default='settings.MEDIA_ROOT/mp3/1449423-1241067.mp3')
    
  def __str__(self):
    return self.phrase

class Progress(models.Model):
  """
  Tracks the user's progress by storing completed phrases and scores for each difficulty level.
  """
  user = models.ForeignKey(User, related_name='progress', on_delete=models.CASCADE, to_field='email')
  completed_phrases = models.ManyToManyField(Phrase)
  module_score = models.IntegerField(default=0)
  score_easy = models.IntegerField(default=0)
  score_medium = models.IntegerField(default=0)
  score_hard = models.IntegerField(default=0)

  def update_scores(self):
    """
    Updates the score for each difficulty level based on completed phrases.
    """
    self.score_easy = 0
    self.score_medium = 0
    self.score_hard = 0
    for phrase in self.completed_phrases.all():
      if phrase.module.diff == "Easy":
        self.score_easy += 1 
      elif phrase.module.diff == "Medium":
        self.score_medium += 1 
      elif phrase.module.diff == "Hard":
        self.score_hard += 1  
    self.save()
   

  def __str__(self):
    return f"{self.user.email}'s Progress"
  
class Answer(models.Model):
  """
  Represents a user's recorded answer to a pronunciation question.
  Stores the base64-encoded audio and decoded file.
  """
  question = models.ForeignKey(Phrase, related_name="answers", on_delete=models.CASCADE,)
  audio_base64 = models.TextField()
  audio = models.FileField(upload_to='decoded/', blank=True, null=True)

  def save(self, *args, **kwargs):
    """
    Saves the model and triggers audio decoding if necessary.
    """
    super().save(*args, **kwargs)  
    if self.audio_base64 and not self.audio:
        self.decode_and_save_audio()

  
  def decode_and_save_audio(self):
    """
    Decodes the base64-encoded audio and saves it as a WAV file.
    """
    print("DEBUG: decode_and_save_audio called!")
    if self.audio_base64:
        try:
            # Decode the Base64 string
            wav_data = base64.b64decode(self.audio_base64)
            
            # Save the WAV file directly
            filename = f'answer_{self.id}_audio.wav'
            self.audio.save(filename, ContentFile(wav_data), save=True)
            print(f"DEBUG: Audio saved as {filename}")
        
        except Exception as e:
            print(f"ERROR: Failed to decode and save audio - {e}")
       
      
  def __str__(self):
    if hasattr(self, 'question') and self.question:
        return f"Answer for: {self.question.phrase}"
    return f"Answer {self.id}"
  

