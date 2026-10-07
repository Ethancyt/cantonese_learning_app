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

export async function recordingToWav(recording: Blob) {
  let decoded: AudioBuffer;
  const context = new AudioContext();
  try {
    decoded = await context.decodeAudioData(await recording.arrayBuffer());
  } finally {
    await context.close();
  }
  if (!decoded.duration || decoded.duration > 60)
    throw new Error("Keep speaking recordings under 60 seconds.");
  const renderer = new OfflineAudioContext(
    1,
    Math.ceil(decoded.duration * 16000),
    16000,
  );
  const source = renderer.createBufferSource();
  source.buffer = decoded;
  source.connect(renderer.destination);
  source.start();
  const rendered = await renderer.startRendering();
  return new Blob([encodePcmWav(rendered.getChannelData(0))], {
    type: "audio/wav",
  });
}
