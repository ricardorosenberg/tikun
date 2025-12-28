"use client";

import { useEffect, useState } from "react";
import BrandHeader from "../../components/BrandHeader";
import Card from "../../components/Card";
import Toggle from "../../components/Toggle";
import { apiFetch } from "../../lib/api";

interface Sound {
  id: string;
  name: string;
  description?: string;
  icon?: string | null;
  sensitivity: number;
  active: boolean;
}

const exampleSounds = ["Door knock", "Fire alarm", "Phone ringing", "Someone calling my name"];

export default function DashboardPage() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [soundGoal, setSoundGoal] = useState(4);
  const [status, setStatus] = useState<string | null>(null);

  const loadSounds = async () => {
    try {
      const data = await apiFetch("/api/sounds");
      setSounds(data.sounds || []);
    } catch (error) {
      setStatus("Connect your account to load sounds.");
    }
  };

  useEffect(() => {
    loadSounds();
  }, []);

  const createSound = async () => {
    if (!name) {
      setStatus("Name your sound to continue.");
      return;
    }
    const sound = await apiFetch("/api/sounds", {
      method: "POST",
      body: JSON.stringify({ name, description, sensitivity: 0.6, active: true }),
    });
    setSounds((prev) => [sound, ...prev]);
    setName("");
    setDescription("");
    setStatus("Sound saved.");
  };

  const updateSound = async (soundId: string, payload: Partial<Sound>) => {
    const updated = await apiFetch(`/api/sounds/${soundId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setSounds((prev) => prev.map((sound) => (sound.id === soundId ? updated : sound)));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <BrandHeader />
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">My Sounds</h1>
              <p className="text-sm text-slate-600">
                Choose the sounds you want Tikun to recognize and adjust their sensitivity.
              </p>
            </div>
            <div className="space-y-3">
              <label className="space-y-2 text-sm text-slate-700">
                How many sounds do you want Tikun to recognize?
                <input
                  className="tikun-input"
                  type="number"
                  min={1}
                  max={20}
                  value={soundGoal}
                  onChange={(event) => setSoundGoal(Number(event.target.value))}
                  aria-label="Number of sounds to recognize"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Sound name
                <input
                  className="tikun-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Door knock"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Description (optional)
                <input
                  className="tikun-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short, clear notes for your training"
                />
              </label>
              <button className="tikun-button" onClick={createSound}>
                Add Sound
              </button>
            </div>
            {status && <p className="text-sm text-slate-600">{status}</p>}
          </Card>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Need inspiration?</h2>
            <p className="text-sm text-slate-600">Common assistive sounds you can add:</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {exampleSounds.map((sound) => (
                <li key={sound} className="rounded-2xl border border-slate-200 px-4 py-2">
                  {sound}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {sounds.length === 0 ? (
            <Card>
              <div className="space-y-4 text-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 120 120"
                  className="mx-auto h-24 w-24 text-slate-200"
                >
                  <circle cx="60" cy="60" r="40" fill="currentColor" />
                  <path d="M40 60h40" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
                  <path d="M60 40v40" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-slate-600">
                  No sounds yet. Add your first sound to start training.
                </p>
              </div>
            </Card>
          ) : (
            sounds.map((sound) => (
              <Card key={sound.id} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{sound.name}</h3>
                  <p className="text-sm text-slate-600">{sound.description || "No description yet."}</p>
                </div>
                <label className="space-y-2 text-sm text-slate-700">
                  Sensitivity
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={sound.sensitivity}
                    onChange={(event) =>
                      updateSound(sound.id, { sensitivity: Number(event.target.value) })
                    }
                    aria-label={`Sensitivity for ${sound.name}`}
                    className="w-full"
                  />
                </label>
                <Toggle
                  id={`active-${sound.id}`}
                  checked={sound.active}
                  onChange={(next) => updateSound(sound.id, { active: next })}
                  label={sound.active ? "Active" : "Inactive"}
                />
                <div className="flex gap-3">
                  <a className="tikun-button-secondary" href={`/training/${sound.id}`}>
                    Train
                  </a>
                  <a className="tikun-button" href="/listening">
                    Start Listening
                  </a>
                </div>
              </Card>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
