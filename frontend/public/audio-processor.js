class AudioProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    // Only process if we have input data
    if (input && input.length > 0) {
      this.port.postMessage({ audioData: input[0] });
    }
    return true; // Keep processor alive
  }
}

registerProcessor("audio-processor", AudioProcessor);
