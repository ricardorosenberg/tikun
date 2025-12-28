import BrandHeader from "../components/BrandHeader";
import Card from "../components/Card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-12">
        <BrandHeader />
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tikun-500">Tikun</p>
            <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
              Alerts that you can see and feel.
            </h1>
            <p className="text-lg text-slate-600">
              Tikun is a calm, empowering sound recognition assistant for people with hearing
              impairments. Train the sounds that matter to you and receive clear visual, tactile,
              and optional audio alerts.
            </p>
            <div className="flex flex-wrap gap-4">
              <a className="tikun-button" href="/dashboard">
                Get started
              </a>
              <a className="tikun-button-secondary" href="/login">
                Sign in
              </a>
            </div>
            <p className="text-sm text-slate-500">
              To recognize sounds, Tikun needs microphone access. Your audio is processed for
              recognition, and we store only sound fingerprints (embeddings) unless you opt in to
              upload recordings.
            </p>
          </div>
          <Card className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">How Tikun supports you</h2>
              <p className="mt-2 text-sm text-slate-600">
                A simple workflow that adapts to your environment and helps you stay aware.
              </p>
            </div>
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="rounded-2xl border border-slate-200 p-4">
                <strong className="block text-slate-900">Define your sounds</strong>
                Choose sounds like door knocks, fire alarms, or someone calling your name.
              </li>
              <li className="rounded-2xl border border-slate-200 p-4">
                <strong className="block text-slate-900">Train in minutes</strong>
                Record a few examples and confirm what Tikun should learn.
              </li>
              <li className="rounded-2xl border border-slate-200 p-4">
                <strong className="block text-slate-900">Feel confident</strong>
                Receive clear flashes, vibrations, and optional beeps when Tikun recognizes a sound.
              </li>
            </ul>
          </Card>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {["Door knock", "Fire alarm", "Phone ringing"].map((sound) => (
            <Card key={sound} className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Example sound</p>
              <h3 className="text-lg font-semibold text-slate-900">{sound}</h3>
              <p className="text-sm text-slate-600">Make Tikun recognize {sound.toLowerCase()}.</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
