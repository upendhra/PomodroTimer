"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!formData.password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        throw loginError;
      }

      if (data.user) {
        // Redirect to dashboard after successful login
        router.push('/dashboard/home');
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 text-gray-900 overflow-hidden relative">
      {/* Top nav pill */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-md">
        <span className="text-sm text-gray-600">New here?</span>
        <Link href="/auth/signup" className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-80 transition-opacity">
          Create account
        </Link>
      </div>

      {/* Aurora background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 w-[26rem] h-[26rem] bg-gradient-to-br from-purple-200/60 to-pink-200/40 rounded-full blur-[180px] animate-aurora-blob-1" />
        <div className="absolute top-1/4 right-0 w-[32rem] h-[32rem] bg-gradient-to-tr from-indigo-200/60 to-cyan-200/40 rounded-full blur-[200px] animate-aurora-blob-2" />
        <div className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] bg-gradient-to-bl from-cyan-200/60 to-blue-200/40 rounded-full blur-[220px] animate-aurora-blob-3" />
        {[
          { top: 90.39, left: 62.96, delay: 1.12, duration: 8.39 },
          { top: 70.62, left: 51.83, delay: 3.42, duration: 7.60 },
          { top: 9.85, left: 99.10, delay: 3.64, duration: 11.66 },
          { top: 43.10, left: 14.58, delay: 3.76, duration: 10.50 },
          { top: 31.78, left: 4.64, delay: 3.32, duration: 10.16 },
          { top: 34.37, left: 80.99, delay: 1.47, duration: 8.11 },
          { top: 45.87, left: 55.26, delay: 2.74, duration: 8.67 },
          { top: 45.82, left: 10.99, delay: 3.47, duration: 7.22 },
          { top: 67.43, left: 86.47, delay: 0.12, duration: 11.84 },
          { top: 44.43, left: 7.98, delay: 1.45, duration: 9.57 },
          { top: 55.11, left: 2.24, delay: 1.08, duration: 8.04 },
          { top: 91.61, left: 42.42, delay: 3.05, duration: 10.80 },
          { top: 57.57, left: 84.42, delay: 1.01, duration: 11.35 },
          { top: 42.52, left: 87.87, delay: 0.83, duration: 8.20 },
          { top: 77.85, left: 71.30, delay: 1.97, duration: 6.57 },
          { top: 64.00, left: 59.87, delay: 3.80, duration: 8.76 },
          { top: 94.75, left: 76.02, delay: 1.32, duration: 6.80 },
          { top: 6.85, left: 15.91, delay: 4.57, duration: 10.42 }
        ].map((pos, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/50 rounded-full animate-float"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animationDelay: `${pos.delay}s`,
              animationDuration: `${pos.duration}s`
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-16">
        <div className="w-full max-w-md">
          <div className="relative bg-white/20 backdrop-blur-2xl rounded-[32px] border border-white/30 shadow-[0_20px_60px_rgba(15,23,42,0.15)] p-10 animate-scale-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-300 via-cyan-300 to-pink-200 shadow-lg shadow-purple-200/50" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Aurora</p>
                <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
              </div>
            </div>
            <p className="text-gray-600 mb-8">
              Log in to continue your focused sessions.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/40 bg-white/30 text-gray-900 placeholder:text-gray-400 px-5 py-4 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-300/80 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/40 bg-white/30 text-gray-900 placeholder:text-gray-400 px-5 py-4 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-300/80 transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600">
                  <input type="checkbox" className="rounded-full border-gray-300 text-purple-500 focus:ring-purple-300" />
                  Remember me
                </label>
                <button type="button" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium py-4 shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>

              {error && (
                <p className="text-red-500 text-sm text-center mt-2">{error}</p>
              )}
            </form>

            <div className="flex items-center gap-4 my-8">
              <span className="h-px flex-1 bg-white/40"></span>
              <span className="text-xs uppercase tracking-[0.3em] text-gray-500">Or continue with</span>
              <span className="h-px flex-1 bg-white/40"></span>
            </div>

            <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white text-gray-700 font-medium py-3 shadow-md hover:shadow-lg transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.35 11.1h-9.18v2.96h5.4c-.24 1.5-1.62 4.4-5.4 4.4-3.25 0-5.9-2.69-5.9-6s2.65-6 5.9-6c1.85 0 3.1.79 3.8 1.47l2.6-2.6C17.42 3.14 15.15 2 12.15 2 6.87 2 2.5 6.36 2.5 11.64S6.87 21.28 12.15 21.28c5.85 0 9.73-4.11 9.73-9.91 0-.66-.07-1.16-.53-2.27" />
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-gray-600 mt-6">
            Don’t have an account? <Link href="/auth/signup" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 font-semibold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
