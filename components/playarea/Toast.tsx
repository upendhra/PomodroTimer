'use client';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white shadow-[0_15px_40px_rgba(5,10,20,0.4)] backdrop-blur-2xl">
        {message}
      </div>
    </div>
  );
}
