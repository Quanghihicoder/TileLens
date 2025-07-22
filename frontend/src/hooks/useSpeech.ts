import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useNotification } from "../providers/Notification";

const socketUrl = import.meta.env.VITE_SOCKET_URL;

interface SpeechActions {
  zoomIn: () => void;
  zoomOut: () => void;
  drag: (direction: 'top' | 'left' | 'bottom' | 'right', amount: number) => void;
}

export const useSpeech = ({ zoomIn, zoomOut, drag }: SpeechActions) => {
  const showNotification = useNotification();

  // Speech to Text
  const [recordingStatus, setRecordingStatus] = useState<number>(0); // 0 - can start, 1 - recording
  const [recordingLength, setRecordingLength] = useState<number>(0); // in seconds

  const [transcript, setTranscript] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[] | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingSpeech, setIsLoadingSpeech] = useState<boolean>(false);

  // Fallback function if AudioWorklet isn't supported
  const setupMediaRecorderOnly = (stream: MediaStream) => {
    if (socket == null) return;

    const audioChunks: BlobPart[] = [];
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorderRef.current.start(10);
    setRecordingStatus(1);

    // Save audioChunks so handleStop can use it
    audioChunksRef.current = audioChunks;
  };

  const handleStart = async () => {
    if (socket == null) return;

    try {
      setTranscript("");
      setIsSpeaking(true)
      const audioChunks: BlobPart[] = []; // Store chunks locally during recording

      // Get audio stream
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Load the audio processor worklet
      try {
        await audioContextRef.current.audioWorklet.addModule(
          "/audio-processor.js"
        );
      } catch (error) {
        console.error("Failed to load audio processor:", error);
        // Fallback to MediaRecorder only if worklet fails
        return setupMediaRecorderOnly(stream);
      }

      const source: MediaStreamAudioSourceNode =
        audioContextRef.current.createMediaStreamSource(stream);
      const processor: AudioWorkletNode = new AudioWorkletNode(
        audioContextRef.current,
        "audio-processor"
      );

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // Store the audio chunks array in the ref so it's accessible in handleStop
      audioChunksRef.current = audioChunks;

      mediaRecorderRef.current.start(10);
      setRecordingStatus(1);
    } catch (error) {
      setRecordingStatus(0);
      console.error("Error accessing microphone:", error);
    }
  };

  const handleStop = () => {
    if (socket == null) return;

    if (mediaRecorderRef.current) {
      // Request the final data
      mediaRecorderRef.current.requestData();

      // Wait for the last ondataavailable event to fire
      setTimeout(() => {
        if (audioChunksRef.current && audioChunksRef.current.length > 0) {
          setIsLoadingSpeech(true);

          // Combine all chunks into a single Blob
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Send the complete audio to backend via Socket
          socket.emit("audio:send", audioBlob);

          // Clear the chunks
          audioChunksRef.current = [];
        }

        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
      }, 100); // Small delay to ensure last chunk is captured
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setRecordingStatus(0);
    setRecordingLength(0);
  };

  useEffect(() => {
    const intervalSeconds = setInterval(() => {
      if (recordingStatus !== 1) return;
      setRecordingLength((prevLength) => prevLength + 1);
    }, 1000);

    return () => clearInterval(intervalSeconds);
  }, [recordingStatus]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Listen for transcription results
    newSocket.on("transcription:received", (data) => {
      setTranscript((prev) => prev + " " + data.text);
      // setIsLoadingSpeech(false);
    });

    return () => {
      newSocket.disconnect();

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Limit because of Kafka
    if (recordingLength >= 35) {
      handleStop();
    } else if (recordingLength >= 25) {
      showNotification(
        `Recording limit: 35 seconds. Auto-stopping in ${
          35 - recordingLength
        } seconds.`,
        "info",
        true
      );
    } else if (recordingLength > 0 && recordingStatus == 1) {
      showNotification("Recording...", "info", true);
    }
  }, [recordingLength]);

  useEffect(() => {
    if (isLoadingSpeech) {
      showNotification("Processing...", "info", true);
    }
  }, [isLoadingSpeech]);

  const processCommands = (input: string) => {
    // Extract all valid commands in order
    const commands =
      input.match(/(zoom in|zoom out|drag (?:top|left|bottom|right) \d+)/gi) ||
      [];

    if (commands.length == 0) {
      showNotification("No valid command: " + input, "error");
    }  else {
      showNotification("Performing commands: " + commands.join(" "), "success", true);
    }

    // Process each command in sequence with 500ms delay
    commands.forEach((command, index) => {
      setTimeout(() => {
        const lowerCommand = command.toLowerCase();

        if (lowerCommand === "zoom in") {
          zoomIn();
        } else if (lowerCommand === "zoom out") {
          zoomOut();
        } else if (lowerCommand.startsWith("drag ")) {
          const parts = command.split(" ");
          const direction = parts[1].toLowerCase();
          const amount = parseInt(parts[2]);

          switch (direction) {
            case "top":
              drag("top", amount);
              break;
            case "left":
              drag("left", amount);
              break;
            case "bottom":
              drag("bottom",amount);
              break;
            case "right":
              drag("right", amount);
              break;
          }
        }
      }, index * 500);
    });

    if (commands.length > 0) {
      setTimeout(() => {
        showNotification("Done processing!", "info");
      }, commands.length * 500);
    }
  };

  useEffect(() => {
    if (transcript.length > 0) {
      try {
        processCommands(transcript);
      } catch (err) {
        showNotification("Error process command", "error");
      } finally {
        setIsLoadingSpeech(false);
        setIsSpeaking(false)
      }
    } 
  }, [transcript]);

  return { recordingStatus, isSpeaking, isLoadingSpeech, handleStart, handleStop };
};
