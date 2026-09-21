"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
          />
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