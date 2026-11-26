class WorkshopPcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Float32Array(4096);
    this.length = 0;
    this.stopped = false;
    this.port.onmessage = () => {
      if (this.stopped) return;
      this.stopped = true;
      if (this.length) this.flush();
      this.port.postMessage(null);
    };
  }

  flush() {
    const chunk = this.samples.slice(0, this.length);
    this.port.postMessage(chunk, [chunk.buffer]);
    this.length = 0;
  }

  process(inputs) {
    if (this.stopped) return false;
    const samples = inputs[0]?.[0];
    if (!samples) return true;
    for (const sample of samples) {
      this.samples[this.length++] = sample;
      if (this.length === this.samples.length) this.flush();
    }
    return true;
  }
}

registerProcessor("workshop-pcm-recorder", WorkshopPcmRecorder);
