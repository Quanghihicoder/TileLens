from kafka import KafkaConsumer, KafkaProducer
import whisper
import base64
import json
import io
import os
import tempfile
import subprocess
import soundfile as sf

# Load Whisper model
model = whisper.load_model("small")  # or "base", "small", "medium", "large" based on your needs

# Kafka configuration
bootstrap_servers = "kafka:9092"
audio_send_topic = "audio.send"
# transcription_data_topic = "transcription.data"
transcription_results_topic = "transcription.results"

consumer = KafkaConsumer(
    audio_send_topic,
    bootstrap_servers=bootstrap_servers,
    auto_offset_reset='latest',
    group_id='transcription-group'
)

producer = KafkaProducer(bootstrap_servers=bootstrap_servers)

def process_audio(audio_data):

    try:
        audio_bytes = base64.b64decode(audio_data)

        with tempfile.NamedTemporaryFile(suffix=".webm") as tmp_webm, tempfile.NamedTemporaryFile(suffix=".wav") as tmp_wav:
            # Write webm bytes and flush
            tmp_webm.write(audio_bytes)
            tmp_webm.flush()

            if os.path.getsize(tmp_webm.name) == 0:
                raise ValueError("Empty WEBM file generated")

            # Convert webm to wav using ffmpeg
            subprocess.run([
                "ffmpeg",
                "-y",  # overwrite output file if exists
                "-i", tmp_webm.name,
                "-ar", "16000",  # 16 kHz sample rate (recommended for Whisper)
                "-ac", "1",      # mono channel
                tmp_wav.name
            ], check=True)

            # Verify WAV file was created and has content
            if os.path.getsize(tmp_wav.name) == 0:
                raise ValueError("Empty WAV file generated")
            
            # Transcribe wav file
            result = model.transcribe(tmp_wav.name, language="en")
            return result["text"]
    except Exception as e:
        print(f"Error processing audio: {e}")
        return ""


for message in consumer:
    try:
        data = json.loads(message.value.decode('utf-8'))
        session_id = data['sessionId']
        audio_data = data['audio']
        
        # Process audio with Whisper
        transcription = process_audio(audio_data)
        
        # Send result back to Kafka
        producer.send(
            transcription_results_topic,
            value=json.dumps({
                'sessionId': session_id,
                'text': transcription,
                'isFinal': True
            }).encode('utf-8')
        )
        
        # producer.send(
        #     transcription_data_topic,
        #     value=json.dumps({
        #         'sessionId': session_id,
        #         'text': transcription,
        #         'isFinal': False
        #     }).encode('utf-8')
        # )
    except Exception as e:
        print(f"Error processing message: {e}")