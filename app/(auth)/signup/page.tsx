"use client";

import Link from "next/link";

const PARTICLES = [
  { top: 15.3, left: 22.7, delay: 0.5, duration: 8.2 },
  { top: 78.4, left: 88.1, delay: 2.1, duration: 9.5 },
  { top: 42.6, left: 55.9, delay: 1.8, duration: 7.3 },
  { top: 91.2, left: 12.4, delay: 3.4, duration: 10.1 },
  { top: 8.7, left: 67.3, delay: 0.9, duration: 6.8 },
  { top: 65.1, left: 34.8, delay: 4.2, duration: 11.2 },
  { top: 33.9, left: 91.5, delay: 1.3, duration: 7.9 },
  { top: 56.4, left: 8.2, delay: 2.7, duration: 9.1 },
  { top: 24.8, left: 76.6, delay: 3.9, duration: 8.5 },
  { top: 88.3, left: 43.1, delay: 0.6, duration: 10.7 },
  { top: 12.5, left: 58.9, delay: 2.4, duration: 7.6 },
  { top: 71.7, left: 19.3, delay: 1.7, duration: 9.8 },
  { top: 47.2, left: 82.4, delay: 3.1, duration: 6.4 },
  { top: 95.6, left: 28.7, delay: 0.3, duration: 11.5 },
  { top: 19.8, left: 71.2, delay: 4.5, duration: 8.9 },
  { top: 62.3, left: 5.6, delay: 1.2, duration: 7.1 },
  { top: 36.1, left: 94.8, delay: 2.9, duration: 10.3 },
  { top: 83.9, left: 49.5, delay: 0.8, duration: 9.4 },
  { top: 28.4, left: 63.7, delay: 3.6, duration: 6.9 },
  { top: 74.5, left: 15.9, delay: 1.5, duration: 8.7 }
];

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 text-gray-900 overflow-hidden relative">
      {/* Aurora background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-purple-200/60 to-cyan-200/40 rounded-full blur-[160px] animate-aurora-blob-1" />
        <div className="absolute top-32 right-10 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-200/60 to-pink-200/40 rounded-full blur-[180px] animate-aurora-blob-2" />
        <div className="absolute bottom-0 left-10 w-[30rem] h-[30rem] bg-gradient-to-bl from-cyan-200/50 to-blue-200/40 rounded-full blur-[200px] animate-aurora-blob-3" />
        {/* Subtle particles */}
        {PARTICLES.map((particle, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-white/50 rounded-full animate-float"
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Signup Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-16">
        <div className="w-full max-w-lg">
          <div className="relative bg-white/20 backdrop-blur-2xl rounded-[32px] border border-white/30 shadow-[0_20px_60px_rgba(15,23,42,0.15)] p-10 animate-scale-in">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-3xl blur-md opacity-80" />
            <div className="relative text-center space-y-3 mb-10">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Aurora</p>
              <h1 className="text-4xl font-semibold text-gray-900">Create your account</h1>
              <p className="text-gray-600">Start your productivity journey with Aurora focus.</p>
            </div>

            <form className="space-y-6">
              {[
                { label: "Name", type: "text", placeholder: "Enter your full name" },
                { label: "Email", type: "email", placeholder: "you@example.com" },
                { label: "Password", type: "password", placeholder: "Create a secure password" }
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-white/40 bg-white/30 text-gray-900 placeholder:text-gray-400 px-5 py-4 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-purple-300/80 transition-all"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium py-4 shadow-lg shadow-purple-300/50 hover:shadow-purple-400/60 transition-all duration-300 hover:-translate-y-0.5"
              >
                Sign up
              </button>
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
            Already have an account? <Link href="/auth/login" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 font-semibold cursor-pointer">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
