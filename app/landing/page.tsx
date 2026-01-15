"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import GradientText from "@/components/ui/GradientText";
import SectionHeader from "@/components/ui/SectionHeader";
import AuroraBackground from "@/components/ui/AuroraBackground";
import { Palette, Target, Zap, TrendingUp, Sparkles, Users } from "lucide-react";
import PomodoroShowcase from "@/components/landing/PomodoroShowcase";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 text-gray-900 overflow-hidden font-['Inter',sans-serif]">
      <AuroraBackground />

      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-8 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_rgba(15,23,42,0.08)] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 via-cyan-400 to-pink-300 shadow-lg shadow-purple-200/60" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Aurora</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">Pomodro</p>
            </div>
          </div>

          <nav className="flex items-center gap-3 sm:gap-6 text-sm sm:text-base text-gray-600 font-medium">
            <a href="#features" className="hover:text-purple-500 transition-colors hidden sm:inline">Features</a>
            <a href="#pricing" className="hover:text-purple-500 transition-colors hidden sm:inline">Pricing</a>
            <a href="/auth/signup" className="hover:text-purple-500 transition-colors">Sign up</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-4 sm:px-8 pt-32 sm:pt-40 pb-16 sm:pb-24 text-center max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
          <GradientText>Focus. Plan. Achieve.</GradientText>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed px-4">
          Immerse yourself in a bright Aurora productivity hub with glass cards, glowing gradients,
          and distraction-free planning for creators, students, and professionals.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link href="/demo/play" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-10 py-4 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300">
              Play Area
            </Button>
          </Link>
          <Link href="/auth/signup" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white/90 px-10 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Sign Up
            </Button>
          </Link>
        </div>

        {/* Pomodoro Showcase */}
        <PomodoroShowcase />
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-16 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <SectionHeader
          title="Features"
          subtitle="A bright and powerful productivity environment"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 mt-12 sm:mt-16">
          {[
            {
              title: "Aurora Workspace",
              desc: "Soothing bright gradients and glass surfaces that elevate your focus.",
              icon: Palette,
              gradient: "from-cyan-400 to-purple-500"
            },
            {
              title: "Project Planning",
              desc: "Timeline planning, structured tasks, and progress visibility.",
              icon: Target,
              gradient: "from-indigo-400 to-cyan-500"
            },
            {
              title: "Deep Focus Mode",
              desc: "Immersive workspace with timer, music, and bright visuals.",
              icon: Zap,
              gradient: "from-purple-400 to-blue-500"
            },
            {
              title: "Streak Tracking",
              desc: "Daily and weekly progress insights to build habits.",
              icon: TrendingUp,
              gradient: "from-blue-400 to-indigo-500"
            },
            {
              title: "Custom Themes",
              desc: "Upload your own ambient themes or pick bright curated ones.",
              icon: Sparkles,
              gradient: "from-cyan-500 to-violet-500"
            },
            {
              title: "Persona-Based Setup",
              desc: "Tailored UI for students, writers, employees, and more.",
              icon: Users,
              gradient: "from-violet-400 to-purple-500"
            },
          ].map((f, i) => {
            const IconComponent = f.icon;
            return (
              <Card key={i} className="group relative overflow-hidden">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.gradient} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">{f.title}</h3>
                <p className="text-gray-600 text-lg group-hover:text-gray-800 transition-colors">{f.desc}</p>
                
                {/* Hover glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-white/30 backdrop-blur-xl p-8 sm:p-12 md:p-16">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-cyan-400/20 to-indigo-400/20 blur-3xl"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 text-center">
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  10,000+
                </div>
                <p className="text-gray-700 text-lg font-medium">Active Users</p>
                <p className="text-gray-600 text-sm">Building focus habits daily</p>
              </div>
              
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                  500K+
                </div>
                <p className="text-gray-700 text-lg font-medium">Focus Sessions</p>
                <p className="text-gray-600 text-sm">Completed this month</p>
              </div>
              
              <div className="space-y-3">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  4.8★
                </div>
                <p className="text-gray-700 text-lg font-medium">User Rating</p>
                <p className="text-gray-600 text-sm">From 2,500+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 py-16 sm:py-32 px-4 sm:px-8 bg-gradient-to-r from-purple-50/50 via-cyan-50/50 to-indigo-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="How It Works" subtitle="Start in just three steps" />

          <div className="relative mt-12 sm:mt-20">
            {/* Connection line - hidden on mobile, visible on desktop */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 via-cyan-400 to-indigo-400 opacity-30"></div>
            
            {/* Arrow indicators */}
            <div className="hidden md:flex absolute top-24 left-0 right-0 justify-between px-[20%]">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"></div>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
              {[
                ["Create Project", "Set up your project workspace instantly."],
                ["Start Timer", "Enter clean, calm focus mode with Aurora glow."],
                ["Achieve Goals", "Track progress with streaks and insights."],
              ].map(([title, desc], i) => (
                <Card
                  key={i}
                  glowDirection="center"
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-cyan-400/20 to-indigo-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-3xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {i + 1}
                    </div>
                    <h3 className="text-3xl font-semibold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">{title}</h3>
                    <p className="text-gray-600 text-lg">{desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 py-16 sm:py-32 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader title="Pricing" subtitle="Free during beta" />

          <div className="relative mt-12 sm:mt-16">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-cyan-400/30 to-indigo-400/30 rounded-3xl blur-3xl"></div>

            <Card className="relative p-8 sm:p-12 md:p-16 max-w-2xl mx-auto" icon={<span className="text-2xl sm:text-3xl">⭐</span>}>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">Free Access</h3>
              <p className="text-gray-600 text-lg sm:text-xl mb-8 sm:mb-10 leading-relaxed">
                Full access to all features during beta. No credit card required.
              </p>
              <Link href="/auth/signup">
                <button className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 text-lg sm:text-xl font-semibold w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Now
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white/30 backdrop-blur-xl border-t border-white/40">
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 via-cyan-400 to-pink-300 shadow-lg shadow-purple-200/50" />
              <div>
                <p className="text-xs font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Aurora</p>
                <p className="text-xl font-semibold text-gray-900">Pomodro</p>
              </div>
            </div>
            <p className="text-gray-600 max-w-xs">
              Bright, calming spaces for focused work. Build projects, track progress, and stay in flow with our Aurora productivity hub.
            </p>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-600 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Product</h4>
            <ul className="space-y-3 text-gray-600">
              <li><a href="#features" className="hover:text-purple-500 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-purple-500 transition-colors">Pricing</a></li>
              <li><a href="/auth/signup" className="hover:text-purple-500 transition-colors">Sign up</a></li>
              <li><a href="/auth/login" className="hover:text-purple-500 transition-colors">Log in</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-600 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Support</h4>
            <ul className="space-y-3 text-gray-600">
              <li><a className="hover:text-purple-500 transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-purple-500 transition-colors" href="#">Contact</a></li>
              <li><a className="hover:text-purple-500 transition-colors" href="#">Status</a></li>
              <li><a className="hover:text-purple-500 transition-colors" href="#">Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-bold text-gray-600 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Stay in Touch</h4>
            <p className="text-gray-600 mb-4">Receive weekly focus rituals, updates, and launch info.</p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 rounded-2xl border border-white/60 bg-white/60 placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <Button size="sm">Subscribe</Button>
            </div>
            <div className="flex gap-4 mt-6 text-gray-500">
              {['Twitter', 'Instagram', 'Dribbble'].map((platform) => (
                <a key={platform} href="#" className="hover:text-purple-500 transition-colors text-sm font-medium">
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/40 py-6 text-center text-gray-500 text-sm">
          © 2025 Pomodro Timer. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
