"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
} from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        router.push(next);
        router.refresh();
      } else {
        const { error, data } = await signUpWithPassword(email, password);
        if (error) throw error;
        if (data.session) {
          // Email confirmation disabled in this Supabase project -- session
          // is active immediately.
          router.push(next);
          router.refresh();
        } else {
          setConfirmationSent(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Browser will redirect to Google, then to /auth/callback.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  if (confirmationSent) {
    return (
      <div className="glass w-full max-w-sm rounded-xl3 p-8 text-center">
        <p className="font-display text-lg text-ink">Check your email</p>
        <p className="mt-2 text-sm text-muted">
          We sent a confirmation link to <span className="text-ink">{email}</span>.
          Click it to finish creating your account.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-violet-200 hover:text-violet-100">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-sm rounded-xl3 p-8">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-amber-400 text-void">
          <InfinityIcon className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-display text-xl text-ink">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {mode === "login"
              ? "Sign in to pick up right where your memory left off."
              : "Start building your second brain."}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="glass"
        className="mb-4 w-full"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs text-muted">Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">Password</label>
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && <p className="text-xs text-red-300">{error}</p>}

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            Don&rsquo;t have an account?{" "}
            <Link href="/signup" className="text-violet-200 hover:text-violet-100">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-violet-200 hover:text-violet-100">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.15.8 3.88 1.5l2.65-2.55C16.75 3.13 14.6 2.2 12 2.2 6.98 2.2 2.9 6.28 2.9 11.3s4.08 9.1 9.1 9.1c5.25 0 8.75-3.7 8.75-8.9 0-.6-.07-1.05-.15-1.5H12z"
      />
    </svg>
  );
}
