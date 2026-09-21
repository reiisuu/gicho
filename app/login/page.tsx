"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "Unable to log in");
        return;
      }

      router.push("/pos");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-md"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Gicho</h1>
          <p className="text-gray-600">Enter your PIN or password to continue</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-medium text-gray-900">
            PIN or Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              autoFocus
              className="min-h-14 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-14 text-xl font-medium text-slate-900 outline-none placeholder:text-slate-500 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide PIN or password" : "Show PIN or password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-inset"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-6 w-6" />
              ) : (
                <Eye aria-hidden="true" className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}