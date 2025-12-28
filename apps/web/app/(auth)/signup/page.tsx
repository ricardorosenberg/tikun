"use client";

import { useState } from "react";
import BrandHeader from "../../../components/BrandHeader";
import Card from "../../../components/Card";
import { signUp } from "../../../lib/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await signUp(email, password);
      setStatus("Check your email to verify your account.");
    } catch (error) {
      setStatus("Sign up failed. Try a different email.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-xl space-y-10">
        <BrandHeader />
        <Card className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create your Tikun account</h1>
            <p className="text-sm text-slate-600">
              Start training the sounds that matter to you.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2 text-sm text-slate-700">
              Email
              <input
                className="tikun-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Password
              <input
                className="tikun-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="tikun-button w-full" type="submit">
              Create account
            </button>
          </form>
          {status && <p className="text-sm text-slate-600">{status}</p>}
          <p className="text-sm text-slate-600">
            Already have an account? <a className="text-tikun-500" href="/login">Sign in</a>.
          </p>
        </Card>
      </div>
    </main>
  );
}
