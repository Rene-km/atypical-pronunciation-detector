from django.test import TestCase
from django.core.files.base import ContentFile
from atypical_pronunciation.models import *
import base64

class UserModelTest(TestCase):
    def setUp(self):
        """Create a test user before each test"""
        self.user = User.objects.create_user(email="test@example.com", password="securepass", name="Test User")

    def test_user_creation(self):
        """Ensure the user is created correctly"""
        self.assertEqual(self.user.email, "test@example.com")
        self.assertTrue(self.user.check_password("securepass"))

    def test_user_str(self):
        """Test string representation of the user"""
        self.assertEqual(str(self.user), "test@example.com")  # Default __str__ from AbstractUser


class ModuleModelTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(diff="Medium")

    def test_module_creation(self):
        """Ensure module is created correctly"""
        self.assertEqual(self.module.diff, "Medium")

    def test_module_str(self):
        """Test string representation of Module"""
        self.assertEqual(str(self.module), "Medium")


class PhraseModelTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(diff="Easy")
        self.phrase = Phrase.objects.create(phrase="Hello World", module=self.module)

    def test_phrase_creation(self):
        """Ensure phrase is created correctly"""
        self.assertEqual(self.phrase.phrase, "Hello World")
        self.assertEqual(self.phrase.module.diff, "Easy")

    def test_phrase_str(self):
        """Test string representation of Phrase"""
        self.assertEqual(str(self.phrase), "Hello World")


class ProgressModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="securepass", name="Test User")
        self.module_easy = Module.objects.create(diff="Easy")
        self.module_medium = Module.objects.create(diff="Medium")
        self.module_hard = Module.objects.create(diff="Hard")

        self.phrase_easy = Phrase.objects.create(phrase="Simple", module=self.module_easy)
        self.phrase_medium = Phrase.objects.create(phrase="Challenging", module=self.module_medium)
        self.phrase_hard = Phrase.objects.create(phrase="Difficult", module=self.module_hard)

        self.progress = Progress.objects.create(user=self.user)
        self.progress.completed_phrases.add(self.phrase_easy, self.phrase_medium, self.phrase_hard)
        self.progress.update_scores()

    def test_progress_update_scores(self):
        """Ensure scores update correctly"""
        self.assertEqual(self.progress.score_easy, 1)
        self.assertEqual(self.progress.score_medium, 1)
        self.assertEqual(self.progress.score_hard, 1)

    def test_progress_str(self):
        """Test string representation of Progress"""
        self.assertEqual(str(self.progress), "test@example.com's Progress")


class AnswerModelTest(TestCase):
    def setUp(self):
        self.module = Module.objects.create(diff="Easy")
        self.phrase = Phrase.objects.create(phrase="Hello World", module=self.module)
        self.audio_data = base64.b64encode(b'test_audio_data').decode('utf-8')
        self.answer = Answer.objects.create(question=self.phrase, audio_base64=self.audio_data)

    def test_answer_str(self):
        """Ensure Answer model's string representation works"""
        self.assertEqual(str(self.answer), f"Answer for: {self.phrase.phrase}")

    def test_audio_decoding(self):
        """Ensure the Answer model can decode Base64 and save the file"""
        self.answer.decode_and_save_audio()
        self.assertIsNotNone(self.answer.audio)  # Ensure file is saved
        self.assertTrue(self.answer.audio.name.endswith('.wav'))  # Ensure it's a WAV file

import base64
import io
from django.core.files.uploadedfile import SimpleUploadedFile
from pydub import AudioSegment


class AnswerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="testpassword")
        self.phrase = Phrase.objects.create(phrase="Hello World")
        self.answer = self.create_answer()

    def create_answer(self):
        """Helper function to create an Answer instance with Base64 WAV"""
        # Generate a short WAV file dynamically
        audio = AudioSegment.silent(duration=1000)  # 1 second silent audio
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)

        # Convert to Base64
        base64_audio = base64.b64encode(wav_io.read()).decode("utf-8")

        return Answer.objects.create(
            question=self.phrase,
            audio_base64=base64_audio
        )

    def test_decode_and_save_audio(self):
        """Test that Base64 WAV data is correctly decoded and saved"""
        self.answer.decode_and_save_audio()
        self.assertIsNotNone(self.answer.audio)
        self.assertTrue(self.answer.audio.name.endswith(".wav"))

    def test_get_answer(self):
        """Test retrieving an answer with Base64 WAV format"""
        response = self.client.get(f"/api/answers/{self.answer.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("audio_base64", response.json()["answer_details"])
