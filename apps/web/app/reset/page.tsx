"use client";

import { useState } from "react";
import BrandHeader from "../../components/BrandHeader";
import Card from "../../components/Card";
import { updatePassword } from "../../lib/auth";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || "";
    try {
      await updatePassword(token, password);
      setStatus("Password updated. You can now sign in.");
    } catch (error) {
      setStatus("Password update failed. Try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-xl space-y-10">
        <BrandHeader />
        <Card className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
            <p className="text-sm text-slate-600">Choose a new password for Tikun.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2 text-sm text-slate-700">
              New password
              <input
                className="tikun-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="tikun-button w-full" type="submit">
              Update password
            </button>
          </form>
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </Card>
      </div>
    </main>
  );
}
