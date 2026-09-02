from django.apps import AppConfig


class AtypicalPronunciationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'atypical_pronunciation'
'''
    def ready(self):
        import imageio_ffmpeg
        from pydub import AudioSegment
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        print("DEBUG: ffmpeg_path ->", ffmpeg_path)

        AudioSegment.converter = ffmpeg_path
        AudioSegment.ffmpeg = ffmpeg_path
        AudioSegment.ffprobe = ffmpeg_path

'''