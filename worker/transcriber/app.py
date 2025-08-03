from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
import whisper
import base64
import json
import os
import tempfile
import subprocess
from typing import Dict, Any
from dotenv import load_dotenv
load_dotenv()

audio_send_topic = "audio.send"
transcription_results_topic = "transcription.results"

def load_whisper_model(model_size: str = "base"):
    try:
        print(f"Loading Whisper model: {model_size}")
        model = whisper.load_model(model_size)
        return model
    except Exception as e:
        print(f"Failed to load Whisper model '{model_size}': {e}")
        raise RuntimeError(f"Could not load Whisper model '{model_size}'") from e

model = load_whisper_model("base")

def get_kafka_config() -> Dict[str, Any]:
    try: 
        brokers = os.getenv("MSK_BROKERS", "")
        broker_list = [b for b in brokers.split(",") if b.strip()] or ["kafka:9092"]
        
        return {
            'bootstrap_servers': broker_list,  
            'security_protocol': 'PLAINTEXT',
        }
    except Exception as e:
        print(f"Error while parsing Kafka configuration: {e}")
        raise RuntimeError("Failed to get Kafka configuration") from e
    
def create_kafka_consumer(config: Dict[str, Any]) -> KafkaConsumer:
    topic_name = audio_send_topic
    consumer_config = {
        "bootstrap_servers": config["bootstrap_servers"],
        "auto_offset_reset": "latest",
        "group_id": "transcription-group",
        "security_protocol": "PLAINTEXT"
    }

    try:
        return KafkaConsumer(topic_name, **consumer_config)
    except KafkaError as e:
        print(f"Failed to create Kafka consumer: {e}")
        raise RuntimeError(f"Kafka consumer initialization failed for topic '{topic_name}'") from e

def create_kafka_producer(config: Dict[str, Any]) -> KafkaProducer:
    producer_config = {
        "bootstrap_servers": config["bootstrap_servers"],
        "security_protocol": "PLAINTEXT"
    }

    try:
        return KafkaProducer(**producer_config)
    except KafkaError as e:
        print(f"Failed to create Kafka producer: {e}")
        raise RuntimeError("Kafka producer initialization failed") from e


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
    

def main(event=None, context=None):
    try:
        # Get Kafka configuration 
        kafka_config = get_kafka_config()

        # Create Kafka consumer and producer
        consumer = create_kafka_consumer(kafka_config)
        producer = create_kafka_producer(kafka_config)

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
            except Exception as e:
                print(f"Error processing message: {e}")
    except Exception as e:
        print(f"Error initializing Kafka client: {e}")
        raise

if __name__ == "__main__":
    main()

