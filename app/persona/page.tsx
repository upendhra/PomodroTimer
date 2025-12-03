"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PersonaPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, redirect to dashboard since persona selection isn't implemented
    // You can implement persona selection logic here later
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Welcome!</h1>
        <p className="text-gray-600">Setting up your productivity persona...</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
      </div>
    </div>
  );
}
