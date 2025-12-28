import { createClient } from "@supabase/supabase-js";
import { API_BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseEnabled } from "./config";

const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export async function signUp(email: string, password: string) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/dashboard",
      },
    });
    if (error) throw error;
    return data;
  }
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Signup failed");
  const payload = await response.json();
  localStorage.setItem("tikun_token", payload.access_token);
  return payload;
}

export async function signIn(email: string, password: string) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  const payload = await response.json();
  localStorage.setItem("tikun_token", payload.access_token);
  return payload;
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem("tikun_token");
}

export async function getAccessToken(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }
  return localStorage.getItem("tikun_token");
}

export async function resetPassword(email: string) {
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset",
    });
    if (error) throw error;
    return;
  }
  await fetch(`${API_BASE_URL}/api/auth/forgot`, {
    method: "POST",
    body: new URLSearchParams({ email }),
  });
}

export async function updatePassword(token: string, password: string) {
  if (supabase) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return;
  }
  await fetch(`${API_BASE_URL}/api/auth/reset`, {
    method: "POST",
    body: new URLSearchParams({ token, password }),
  });
}
