"use client";

import { useState } from "react";
import BrandHeader from "../../../components/BrandHeader";
import Card from "../../../components/Card";
import { signIn, resetPassword } from "../../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await signIn(email, password);
      window.location.href = "/dashboard";
    } catch (error) {
      setStatus("Login failed. Check your details and try again.");
    }
  };

  const handleReset = async () => {
    if (!email) {
      setStatus("Enter your email to receive a reset link.");
      return;
    }
    await resetPassword(email);
    setStatus("Password reset link sent. Check your email (or console in dev).");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-xl space-y-10">
        <BrandHeader />
        <Card className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-600">Sign in to manage your sounds.</p>
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
              Sign in
            </button>
          </form>
          <button className="text-sm text-tikun-500" onClick={handleReset} type="button">
            Forgot password?
          </button>
          {status && <p className="text-sm text-slate-600">{status}</p>}
          <p className="text-sm text-slate-600">
            New to Tikun? <a className="text-tikun-500" href="/signup">Create an account</a>.
          </p>
        </Card>
      </div>
    </main>
  );
}
