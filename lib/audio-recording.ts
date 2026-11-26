// Both Azure and compatible transcription providers accept this portable PCM WAV.
export function encodePcmWav(samples: Float32Array, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((value, index) => {
    const clamped = Math.max(-1, Math.min(1, value));
    view.setInt16(
      44 + index * 2,
      Math.round(clamped * (clamped < 0 ? 32768 : 32767)),
      true,
    );
  });
  return buffer;
}

const recordingSeconds = 25;
const targetSampleRate = 16000;

async function capturedWav(
  chunks: Float32Array[],
  length: number,
  sampleRate: number,
) {
  if (length < sampleRate * 0.15)
    throw new Error(
      "The recording was too short. Try recording the whole phrase again.",
    );
  const renderer = new OfflineAudioContext(
    1,
    Math.ceil((length * targetSampleRate) / sampleRate),
    targetSampleRate,
  );
  const recorded = renderer.createBuffer(1, length, sampleRate);
  const channel = recorded.getChannelData(0);
  let offset = 0;
  for (const chunk of chunks) {
    channel.set(chunk, offset);
    offset += chunk.length;
  }
  const source = renderer.createBufferSource();
  source.buffer = recorded;
  source.connect(renderer.destination);
  source.start();
  const rendered = await renderer.startRendering();
  return new Blob([encodePcmWav(rendered.getChannelData(0))], {
    type: "audio/wav",
  });
}

export async function startSpeechRecording(signal: AbortSignal) {
  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof AudioContext === "undefined"
  )
    throw new Error(
      "This browser cannot record here. You can still practise aloud.",
    );

  const context = new AudioContext();
  // Start from the original button gesture for browsers with media activation rules.
  const resumed = context.resume().then(
    () => true,
    () => false,
  );
  let stream: MediaStream | undefined;
  const release = () => {
    stream?.getTracks().forEach((track) => track.stop());
    if (context.state !== "closed") void context.close().catch(() => {});
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    signal.throwIfAborted();
    if (!(await resumed))
      throw new Error("Could not start audio recording. Try again.");
    let worklet: AudioWorkletNode | undefined;
    if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      try {
        await context.audioWorklet.addModule("/workshop-recorder.js");
        worklet = new AudioWorkletNode(context, "workshop-pcm-recorder", {
          channelCount: 1,
          channelCountMode: "explicit",
        });
      } catch {
        // Use main-thread capture if the browser cannot load an audio worklet.
      }
    }
    signal.throwIfAborted();
    const source = context.createMediaStreamSource(stream);
    const muted = context.createGain();
    muted.gain.value = 0;
    const recorder = worklet ?? context.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    const sampleLimit = context.sampleRate * recordingSeconds;
    let length = 0,
      finished = false;
    let limitTimer: ReturnType<typeof setTimeout>;
    let flushTimer: ReturnType<typeof setTimeout>;
    let resolveClip!: (clip: Blob | null) => void;
    let rejectClip!: (error: Error) => void;
    const clip = new Promise<Blob | null>((resolve, reject) => {
      resolveClip = resolve;
      rejectClip = reject;
    });
    function abort() {
      finish();
    }
    function finish(error?: Error) {
      if (finished) return;
      finished = true;
      clearTimeout(limitTimer);
      clearTimeout(flushTimer);
      signal.removeEventListener("abort", abort);
      source.disconnect();
      recorder.disconnect();
      muted.disconnect();
      if (worklet) worklet.port.close();
      release();
      if (signal.aborted) resolveClip(null);
      else if (error) rejectClip(error);
      else
        capturedWav(chunks, length, context.sampleRate).then(
          resolveClip,
          rejectClip,
        );
    }
    function collect(samples: Float32Array) {
      if (finished) return;
      const chunk = samples.slice(0, sampleLimit - length);
      chunks.push(chunk);
      length += chunk.length;
      if (length >= sampleLimit) finish();
    }
    function stop() {
      if (finished) return;
      if (worklet) {
        worklet.port.postMessage("stop");
        flushTimer = setTimeout(finish, 1000);
      } else {
        finish();
      }
    }
    if (worklet) {
      worklet.port.onmessage = ({
        data,
      }: MessageEvent<Float32Array | null>) => {
        if (data) collect(data);
        else finish();
      };
      worklet.onprocessorerror = () =>
        finish(new Error("Recording stopped unexpectedly. Try again."));
    } else {
      (recorder as ScriptProcessorNode).onaudioprocess = (event) =>
        collect(event.inputBuffer.getChannelData(0));
    }
    source.connect(recorder).connect(muted).connect(context.destination);
    limitTimer = setTimeout(stop, recordingSeconds * 1000);
    signal.addEventListener("abort", abort, { once: true });
    return { clip, stop };
  } catch (error) {
    release();
    if (error instanceof DOMException && error.name === "NotAllowedError")
      throw new Error(
        "Microphone access was denied. Allow it in your browser and try again.",
      );
    throw error;
  }
}
