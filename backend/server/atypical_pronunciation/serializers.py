from rest_framework import serializers
from .models import *


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ['id', 'name', 'email', 'password']
    extra_kwargs = {
      'password': {'write_only': True}
    }

  def create(self, validated_data):
    password = validated_data.pop('password', None)
    instance = self.Meta.model(**validated_data)
    if password is not None:
      instance.set_password(password)
    instance.save()
    return instance

class ModuleSerializer(serializers.ModelSerializer):
  class Meta:
    model = Module
    fields = ['id', 'diff']

class PhraseSerializer(serializers.ModelSerializer):
  class Meta:
    model = Phrase
    fields = ['id', 'phrase', 'module', 'audio']


class ProgressSerializer(serializers.ModelSerializer):
  completed_phrases = PhraseSerializer(many=True, read_only=True)
    
  class Meta:
    model = Progress
    fields = ['user', 'completed_phrases', 'score_easy', 'score_medium', 'score_hard']


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'question', 'audio_base64', 'audio']

    def create(self, validated_data):
        return Answer.objects.create(**validated_data)
