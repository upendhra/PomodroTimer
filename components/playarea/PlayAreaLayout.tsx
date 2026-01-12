'use client';

import { ReactNode, CSSProperties } from 'react';

interface PlayAreaLayoutProps {
  top: ReactNode;
  bottom?: ReactNode;
  wrapTop?: boolean;
  showBackgroundLayers?: boolean;
  styleOverrides?: CSSProperties;
}

export default function PlayAreaLayout({ top, bottom, wrapTop = true, showBackgroundLayers = true, styleOverrides }: PlayAreaLayoutProps) {
  return (
    <div className="play-area-layout relative min-h-screen w-full overflow-x-hidden text-white" style={styleOverrides}>
      {showBackgroundLayers && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.2),_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#030711_0%,#050812_35%,#01030a_100%)] opacity-70"></div>
          <div className="noise-layer absolute inset-0"></div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
          {wrapTop ? (
            <section
              className="rounded-[32px] border"
              style={{
                background: 'linear-gradient(145deg, rgba(13,17,31,0.96), rgba(5,8,18,0.94))',
                borderColor: 'var(--accent-border)',
                boxShadow: '0 30px 80px rgba(2,4,12,0.65)',
              }}
            >
              <div className="p-6 sm:p-8 lg:p-10">{top}</div>
            </section>
          ) : (
            <div>{top}</div>
          )}
          {bottom && (
            <section
              className="rounded-[32px] border"
              style={{
                background: 'linear-gradient(145deg, rgba(9,12,24,0.95), rgba(3,6,14,0.95))',
                borderColor: 'var(--accent-border)',
                boxShadow: '0 25px 60px rgba(1,3,8,0.6)',
              }}
            >
              <div className="p-6 sm:p-8 lg:p-10">{bottom}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
