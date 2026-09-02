from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('user/', UserView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('update_progress/', UpdateProgressView.as_view()),
    path('get_progress/', UserProgressView.as_view()),
    path('answers/', AnswerGet.as_view(), name='answer-list'),
    path('answers/<int:pk>/', AnswerGet.as_view(), name='answer-detail'),
    path('answers/post/', AnswerPost.as_view(), name='answer-post'),
    path('phrases/', PhraseGet.as_view(), name='phrase-list'),
    path('phrases/<int:pk>/', PhraseGet.as_view(), name='phrase-detail'),
]