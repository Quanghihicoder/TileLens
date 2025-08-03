# Use Python base image
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install pip packages
RUN pip install --no-cache-dir \
    openai-whisper \
    kafka-python \
    soundfile

# Copy your Python file
COPY app.py .

# Pre-download the Whisper model during build
RUN python -c "import whisper; whisper.load_model('small')"

# Run the script
CMD ["python", "-u", "app.py"]