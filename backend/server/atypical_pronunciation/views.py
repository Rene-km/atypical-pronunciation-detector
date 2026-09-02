from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status
from .serializers import *
from .models import *
import jwt, datetime
import torch
import torchaudio
from difflib import SequenceMatcher


# Create your views here.
class RegisterView(APIView):
    """
    API view to handle user registration.
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(APIView):
    """
    API view to handle user login and return a JWT token.
    """
    def post(self, request):
        email = request.data['email']
        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed('User not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect password!')

        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256').encode().decode('utf-8')

        response = Response()

        response.set_cookie(key='jwt', value=token, httponly=True)
        response.data = {
            'jwt': token
        }
        return response


class UserView(APIView):
    """
    API view to retrieve authenticated user details.
    """
    def get(self, request):
        token = request.COOKIES.get('jwt')

        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated!')

        user = User.objects.filter(id=payload['id']).first()
        serializer = UserSerializer(user)
        return Response(serializer.data)

class LogoutView(APIView):
    """
    API view to log out user by deleting JWT cookie.
    """
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': 'success'
        }
        return response
    
class UpdateProgressView(APIView):
    """
    API view to update user progress when they complete a phrase.
    """
    def post(self, request):
        token = request.COOKIES.get('jwt')
        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('User not found!')

        phrase_id = request.data.get('phrase_id')
        try:
            phrase = Phrase.objects.get(id=phrase_id)
        except Phrase.DoesNotExist:
            return Response({'error': 'Phrase not found'}, status=status.HTTP_404_NOT_FOUND)

        progress, created = Progress.objects.get_or_create(user=user)
        progress.completed_phrases.add(phrase)
        progress.update_scores()  
        return Response({
            'status': 'phrase added',
            'easy_score': progress.score_easy,
            'medium_score': progress.score_medium,
            'hard_score': progress.score_hard
        })


class UserProgressView(APIView):
    """
    API view to retrieve the user's progress, including completed phrases and scores.
    """
    def get(self, request):
        token = request.COOKIES.get('jwt')
        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get all phrases
        phrases = Phrase.objects.all()
        phrase_serializer = PhraseSerializer(phrases, many=True)
        
        # Get user's progress
        progress = Progress.objects.filter(user=user.email).first()
        completed_phrases = set()
        if progress:
            completed_phrases = set(progress.completed_phrases.values_list('id', flat=True))

        # Add completion status to each phrase
        response_data = {
            'phrases': [
                {
                    **phrase_data,
                    'completed': phrase_data['id'] in completed_phrases
                }
                for phrase_data in phrase_serializer.data
            ],
            'score_easy': progress.score_easy if progress else 0,
            'score_medium': progress.score_medium if progress else 0,
            'score_hard': progress.score_hard if progress else 0
        }

        return Response(response_data)

class AnswerPost(APIView):
    """
    API view to handle posting of user answers (audio responses).
    """
    def post(self, request):
        serializer = AnswerSerializer(data=request.data)
        if serializer.is_valid():
            answer = serializer.save()  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GreedyCTCDecoder(torch.nn.Module):
    def __init__(self, labels, blank=0):
        super().__init__()
        self.labels = labels
        self.blank = blank

    def forward(self, emission: torch.Tensor) -> str:
        """Given a sequence emission over labels, get the best path string.
        Args:
          emission (Tensor): Logit tensors. Shape `[num_seq, num_label]`.

        Returns:
          str: The resulting transcript.
        """
        indices = torch.argmax(emission, dim=-1)  
        indices = torch.unique_consecutive(indices, dim=-1)
        indices = [i for i in indices if i != self.blank]
        return "".join([self.labels[i] for i in indices])


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
model = bundle.get_model().to(device)
labels = bundle.get_labels()
decoder = GreedyCTCDecoder(labels=labels)

class AnswerGet(APIView):
    """
    API view to retrieve answers and process audio transcription.
    """
    def get(self, request, pk=None):
        if pk:
            try:
                answer = Answer.objects.get(pk=pk)
                serializer = AnswerSerializer(answer)

                
                if answer.audio:
                    learner_transcript = self.transcribe_audio(answer.audio.path)
                    
                    native_transcript = answer.question.phrase
                    
                    comparison_results = self.compare_transcripts(native_transcript, learner_transcript)
                    response_data = {
                        'answer_details': serializer.data,
                        'learner_transcript': learner_transcript,
                        'comparison_results': comparison_results
                    }
                else:
                    response_data = {
                        'answer_details': serializer.data,
                        'error': 'No audio available for transcription'
                    }

                return Response(response_data)
            except Answer.DoesNotExist:
                return Response({'error': 'Answer not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            answers = Answer.objects.all()
            serializer = AnswerSerializer(answers, many=True)
            return Response(serializer.data)

    def transcribe_audio(self, audio_path):
        """
        Converts an audio file to a textual transcript using pre-trained model.
        """
        waveform, sample_rate = torchaudio.load(audio_path)
        waveform = waveform.to(device)
        if sample_rate != bundle.sample_rate:
            waveform = torchaudio.functional.resample(waveform, sample_rate, bundle.sample_rate)

        with torch.inference_mode():
            emission, _ = model(waveform)

        transcript = decoder(emission[0])
        return transcript.lower().replace("|", " ").strip()

   

    def compare_transcripts(self, native_transcript, learner_transcript):
        """
        Compares the native transcript with the learner's transcript using similarity scores.
        """
        native_words = native_transcript.lower().split()
        learner_words = learner_transcript.lower().split()

        max_length = max(len(native_words), len(learner_words))
        native_words.extend([""] * (max_length - len(native_words)))
        learner_words.extend([""] * (max_length - len(learner_words)))

        word_scores = []
        for native_word, learner_word in zip(native_words, learner_words):
            if native_word == learner_word:
                similarity = 1.0  
            else:
                similarity = SequenceMatcher(None, native_word, learner_word).ratio()

            word_scores.append({
                "native_word": native_word,
                "learner_word": learner_word,
                "similarity": round(similarity * 100, 2)
            })

        return word_scores


class PhraseGet(APIView):
    """
    API view to retrieve all phrases or a specific phrase by ID.
    """
    def get(self, request, pk=None):
        token = request.COOKIES.get('jwt')
        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if pk:
            try:
                phrase = Phrase.objects.get(pk=pk)
                serializer = PhraseSerializer(phrase)
                return Response(serializer.data)
            except Phrase.DoesNotExist:
                return Response({'error': 'Phrase not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            phrases = Phrase.objects.all()
            serializer = PhraseSerializer(phrases, many=True)
            return Response(serializer.data)
        