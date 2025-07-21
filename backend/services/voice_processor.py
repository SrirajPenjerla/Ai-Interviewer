import openai
import os
import base64
from typing import Optional

openai.api_key = os.getenv('OPENAI_API_KEY')

def transcribe_audio(audio_data: bytes) -> str:
    """Transcribe audio using OpenAI Whisper"""
    try:
        # Save audio to temp file
        with open("temp_audio.wav", "wb") as f:
            f.write(audio_data)
        
        with open("temp_audio.wav", "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)
        
        os.remove("temp_audio.wav")
        return transcript["text"]
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def text_to_speech(text: str) -> Optional[bytes]:
    """Convert text to speech using OpenAI TTS"""
    try:
        response = openai.Audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        return response.content
    except Exception as e:
        print(f"TTS error: {e}")
        return None

def process_voice_input(audio_data: bytes) -> dict:
    """Process voice input: transcribe and return text"""
    text = transcribe_audio(audio_data)
    return {
        "transcribed_text": text,
        "success": bool(text)
    }

def generate_ai_voice_response(text: str) -> Optional[bytes]:
    """Generate AI voice response"""
    return text_to_speech(text) 