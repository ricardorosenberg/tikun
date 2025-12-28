"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/config";
import BrandHeader from "../../components/BrandHeader";
import Card from "../../components/Card";

export default function VerifyPage() {
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("Missing verification token.");
      return;
    }
    fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: "POST",
      body: new URLSearchParams({ token }),
    })
      .then(() => setStatus("Email verified! You can now sign in."))
      .catch(() => setStatus("Verification failed. Please request a new link."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-xl space-y-10">
        <BrandHeader />
        <Card>
          <h1 className="text-2xl font-semibold text-slate-900">Verify your email</h1>
          <p className="mt-3 text-sm text-slate-600">{status}</p>
          <a className="mt-6 inline-block text-sm text-tikun-500" href="/login">
            Back to sign in
          </a>
        </Card>
      </div>
    </main>
  );
}
