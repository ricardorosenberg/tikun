"use client";

import { useEffect, useRef, useState } from "react";
import BrandHeader from "../../components/BrandHeader";
import Card from "../../components/Card";
import Toggle from "../../components/Toggle";
import FlashOverlay from "../../components/FlashOverlay";
import { apiFetch } from "../../lib/api";
import { encodeWav, getMicrophoneStream, playBeep } from "../../lib/audio";

const WINDOW_SECONDS = 0.96;

type Prediction = {
  sound_id?: string | null;
  sound_name?: string | null;
  label: string;
  confidence: number;
};

type DetectionEvent = {
  id: string;
  sound_id?: string | null;
  confidence: number;
  created_at: string;
};

export default function ListeningPage() {
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Microphone permission required.");
  const [lastPrediction, setLastPrediction] = useState<Prediction | null>(null);
  const [flashText, setFlashText] = useState<string | null>(null);
  const [ambientLevel, setAmbientLevel] = useState(0);
  const [history, setHistory] = useState<DetectionEvent[]>([]);
  const [enableVibration, setEnableVibration] = useState(true);
  const [enableBeep, setEnableBeep] = useState(true);
  const [flashIntensity, setFlashIntensity] = useState(0.9);
  const [cooldownSeconds, setCooldownSeconds] = useState(4);
  const audioRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recentHitsRef = useRef<{ label: string; time: number }[]>([]);
  const lastTriggerRef = useRef<number>(0);

  const loadHistory = async () => {
    try {
      const events = await apiFetch("/api/detections");
      setHistory(events);
    } catch (error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const triggerAlert = (label: string) => {
    setFlashText(label.toUpperCase());
    if (enableBeep) playBeep();
    if (enableVibration && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    setTimeout(() => setFlashText(null), 1400);
  };

  const startListening = async () => {
    setListening(true);
    setStatus("Tikun is listening… You're covered.");
    const stream = await getMicrophoneStream();
    streamRef.current = stream;
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const chunks: Float32Array[] = [];
    processor.onaudioprocess = async (event) => {
      const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
      chunks.push(chunk);
      const rms = Math.sqrt(chunk.reduce((sum, value) => sum + value * value, 0) / chunk.length);
      setAmbientLevel(rms);
      const totalLength = chunks.reduce((sum, current) => sum + current.length, 0);
      if (totalLength >= WINDOW_SECONDS * audioContext.sampleRate) {
        const buffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunkItem of chunks) {
          buffer.set(chunkItem, offset);
          offset += chunkItem.length;
        }
        const slice = buffer.slice(0, Math.floor(WINDOW_SECONDS * audioContext.sampleRate));
        chunks.length = 0;
        const wav = encodeWav(slice, audioContext.sampleRate);
        const formData = new FormData();
        formData.append("file", wav, "chunk.wav");
        try {
          const prediction: Prediction = await apiFetch("/api/infer", {
            method: "POST",
            body: formData,
          });
          setLastPrediction(prediction);
          const now = Date.now();
          recentHitsRef.current = recentHitsRef.current.filter((hit) => now - hit.time < 3000);
          if (prediction.label !== "unknown") {
            recentHitsRef.current.push({ label: prediction.label, time: now });
            const hits = recentHitsRef.current.filter((hit) => hit.label === prediction.label).length;
            if (hits >= 2 && now - lastTriggerRef.current > cooldownSeconds * 1000) {
              lastTriggerRef.current = now;
              triggerAlert(prediction.sound_name || prediction.label);
              loadHistory();
            }
          }
        } catch (error) {
          setStatus("Check your connection to the Tikun API.");
        }
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stopListening = () => {
    setListening(false);
    setStatus("Listening paused.");
    processorRef.current?.disconnect();
    audioRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      {flashText && (
        <div style={{ opacity: flashIntensity }}>
          <FlashOverlay text={flashText} />
        </div>
      )}
      <div className="mx-auto max-w-6xl space-y-10">
        <BrandHeader />
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Tikun Listening</h1>
              <p className="text-sm text-slate-600">{status}</p>
            </div>
            <div className="space-y-4">
              <button className="tikun-button" onClick={listening ? stopListening : startListening}>
                {listening ? "Stop Listening" : "Start Listening"}
              </button>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Ambient level</p>
                <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-tikun-500 transition"
                    style={{ width: `${Math.min(100, ambientLevel * 300)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last detected</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {lastPrediction?.sound_name || lastPrediction?.label || "—"}
                </p>
                <p className="text-sm text-slate-600">
                  Confidence: {lastPrediction ? `${Math.round(lastPrediction.confidence * 100)}%` : "—"}
                </p>
              </div>
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Listening settings</h2>
            <Toggle
              id="toggle-vibration"
              checked={enableVibration}
              onChange={setEnableVibration}
              label="Enable vibration"
            />
            <Toggle id="toggle-beep" checked={enableBeep} onChange={setEnableBeep} label="Enable beep" />
            <label className="space-y-2 text-sm text-slate-700">
              Flash intensity
              <input
                className="w-full"
                type="range"
                min={0.2}
                max={1}
                step={0.1}
                value={flashIntensity}
                onChange={(event) => setFlashIntensity(Number(event.target.value))}
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Cooldown (seconds)
              <input
                className="w-full"
                type="range"
                min={2}
                max={10}
                step={1}
                value={cooldownSeconds}
                onChange={(event) => setCooldownSeconds(Number(event.target.value))}
              />
            </label>
            <p className="text-sm text-slate-600">
              Tikun is listening with care. Use HTTPS for microphone and vibration access on mobile.
            </p>
          </Card>
        </section>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Detection history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-600">No detections yet. Start listening to build history.</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {history.map((event) => (
                <li key={event.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2">
                  <span>{event.sound_id || "Unknown"}</span>
                  <span className="text-slate-500">{new Date(event.created_at).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
