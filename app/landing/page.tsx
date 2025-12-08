"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import GradientText from "@/components/ui/GradientText";
import SectionHeader from "@/components/ui/SectionHeader";
import AuroraBackground from "@/components/ui/AuroraBackground";
import AuroraWave from "@/components/ui/AuroraWave";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 text-gray-900 overflow-hidden font-['Inter',sans-serif]">
      <AuroraBackground />
      <AuroraWave />

      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 z-20 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_rgba(15,23,42,0.08)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 via-cyan-400 to-pink-300 shadow-lg shadow-purple-200/60" />
            <div>
              <p className="text-sm font-semibold text-gray-500" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Aurora</p>
              <p className="text-lg font-semibold text-gray-900">Pomodro</p>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-gray-600 font-medium">
            <a href="#features" className="hover:text-purple-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-purple-500 transition-colors">Pricing</a>
            <a href="/auth/signup" className="hover:text-purple-500 transition-colors">Sign up</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-8 pt-40 pb-24 text-center max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-8 tracking-wide">
          <GradientText>Focus. Plan. Achieve.</GradientText>
        </h1>
        <p className="text-2xl text-gray-700 max-w-3xl mx-auto mb-12 leading-relaxed">
          Immerse yourself in a bright Aurora productivity hub with glass cards, glowing gradients,
          and distraction-free planning for creators, students, and professionals.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/auth/signup" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-10 py-4 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-white/90 px-10 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-32 px-8 max-w-7xl mx-auto">
        <SectionHeader
          title="Features"
          subtitle="A bright and powerful productivity environment"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-16">
          {[
            {
              title: "Aurora Workspace",
              desc: "Soothing bright gradients and glass surfaces that elevate your focus.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full"></div>
            },
            {
              title: "Project Planning",
              desc: "Timeline planning, structured tasks, and progress visibility.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-cyan-500 rounded-full"></div>
            },
            {
              title: "Deep Focus Mode",
              desc: "Immersive workspace with timer, music, and bright visuals.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full"></div>
            },
            {
              title: "Streak Tracking",
              desc: "Daily and weekly progress insights to build habits.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full"></div>
            },
            {
              title: "Custom Themes",
              desc: "Upload your own ambient themes or pick bright curated ones.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full"></div>
            },
            {
              title: "Persona-Based Setup",
              desc: "Tailored UI for students, writers, employees, and more.",
              icon: <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full"></div>
            },
          ].map((f, i) => (
            <Card key={i} icon={f.icon} className="group">
              <h3 className="text-2xl font-semibold mb-4 text-gray-900 group-hover:text-purple-600 transition-colors">{f.title}</h3>
              <p className="text-gray-600 text-lg group-hover:text-gray-800 transition-colors">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 py-32 px-8 bg-gradient-to-r from-purple-50/50 via-cyan-50/50 to-indigo-50/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <SectionHeader title="How It Works" subtitle="Start in just three steps" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mt-20">
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
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 mb-6 opacity-80">
                    {i + 1}
                  </div>
                  <h3 className="text-3xl font-semibold mb-4 text-gray-900">{title}</h3>
                  <p className="text-gray-600 text-lg">{desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <SectionHeader title="Pricing" subtitle="Free during beta" />

          <div className="relative mt-16">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-cyan-400/30 to-indigo-400/30 rounded-3xl blur-3xl"></div>

            <Card className="relative p-16 max-w-2xl mx-auto" icon={<span className="text-3xl">⭐</span>}>
              <h3 className="text-5xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">Free Access</h3>
              <p className="text-gray-600 text-xl mb-10 leading-relaxed">
                Full access to all features during beta. No credit card required.
              </p>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white px-12 py-5 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 text-xl">
                Start Now
              </Button>
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
