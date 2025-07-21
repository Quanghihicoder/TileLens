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

# Copy your Python file
COPY app.py .

# Install pip packages
RUN pip install --no-cache-dir \
    openai-whisper \
    kafka-python \
    soundfile

# Run the script
CMD ["python", "-u", "app.py"]