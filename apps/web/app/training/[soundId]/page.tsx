"use client";

import { useEffect, useState } from "react";
import BrandHeader from "../../../components/BrandHeader";
import Card from "../../../components/Card";
import { apiFetch } from "../../../lib/api";
import { encodeWav, getMicrophoneStream } from "../../../lib/audio";

const TARGET_DURATION = 0.96;

export default function TrainingPage({ params }: { params: { soundId: string } }) {
  const [status, setStatus] = useState("Ready to record.");
  const [recording, setRecording] = useState(false);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);

  const recordClip = async () => {
    setRecording(true);
    setStatus("Recording... keep the sound steady.");
    const stream = await getMicrophoneStream();
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];

    processor.onaudioprocess = (event) => {
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      if (totalLength >= TARGET_DURATION * audioContext.sampleRate) {
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        const buffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }
        const slice = buffer.slice(0, Math.floor(TARGET_DURATION * audioContext.sampleRate));
        const wav = encodeWav(slice, audioContext.sampleRate);
        setWavBlob(wav);
        setRecording(false);
        setStatus("Review this clip and confirm.");
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const submitClip = async (label: string) => {
    if (!wavBlob) return;
    const formData = new FormData();
    formData.append("file", wavBlob, "clip.wav");
    formData.append("label", label);
    formData.append("sound_id", params.soundId);
    await apiFetch("/api/train/sample", { method: "POST", body: formData });
    setWavBlob(null);
    setStatus("Clip saved. Record another example.");
  };

  useEffect(() => {
    apiFetch("/api/train/rebuild", { method: "POST" }).catch(() => null);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-10">
        <BrandHeader />
        <Card className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Training wizard</h1>
            <p className="text-sm text-slate-600">Step A: Record training examples.</p>
          </div>
          <button className="tikun-button" onClick={recordClip} disabled={recording}>
            {recording ? "Recording..." : "Record clip"}
          </button>
          <p className="text-sm text-slate-600">{status}</p>
        </Card>

        {wavBlob && (
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Is this the sound you want Tikun to recognize?
            </h2>
            <div className="flex flex-wrap gap-3">
              <button className="tikun-button" onClick={() => submitClip("positive")}>Yes</button>
              <button className="tikun-button-secondary" onClick={() => submitClip("negative")}>
                No
              </button>
              <button className="tikun-button-secondary" onClick={() => submitClip("similar")}>
                Similar, but not this
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Aim for 10–30 positives and 10–30 negatives/similar clips.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
