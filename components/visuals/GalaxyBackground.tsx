"use client";

import { useCallback, useEffect, useRef } from "react";

type StarLayer = "far" | "mid" | "near";

type Star = {
  layer: StarLayer;
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleRange: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  driftX: number;
  driftY: number;
};

type Planet = {
  baseX: number;
  baseY: number;
  radiusFactor: number;
  color: string;
  opacity: number;
  ring?: boolean;
  ringColor?: string;
  angle: number;
  rotationSpeed: number;
  driftFactor: number;
  radius: number;
  x: number;
  y: number;
};

type NebulaCloud = {
  baseX: number;
  baseY: number;
  radius: number;
  colors: { stop: number; color: string }[];
  opacity: number;
  driftAngle: number;
  driftSpeed: number;
  driftDistance: number;
};

type SparkleParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type GoldenStar = {
  active: boolean;
  startTime: number;
  trail: { x: number; y: number }[];
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  target: { x: number; y: number };
  lastSparkle: number;
  nextSparkleDelay: number;
  life: number;
  maxLife: number;
};

type OrbitingPlanet = {
  radiusA: number;
  radiusB: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  glow: string;
};

interface GalaxyBackgroundProps {
  targetRef: React.RefObject<HTMLElement | null>;
  paused?: boolean;
  onMerge?: () => void;
}

const STAR_LAYER_CONFIG: Record<
  StarLayer,
  {
    baseCount: number;
    sizeRange: [number, number];
    twinkleRange: [number, number];
    twinkleSpeed: [number, number];
    driftSpeed: [number, number];
  }
> = {
  far: {
    baseCount: 80,
    sizeRange: [0.3, 0.7],
    twinkleRange: [0.05, 0.12],
    twinkleSpeed: [0.6, 1.2],
    driftSpeed: [0, 4],
  },
  mid: {
    baseCount: 60,
    sizeRange: [0.5, 1.2],
    twinkleRange: [0.1, 0.25],
    twinkleSpeed: [1, 2.5],
    driftSpeed: [6, 14],
  },
  near: {
    baseCount: 40,
    sizeRange: [0.9, 1.7],
    twinkleRange: [0.15, 0.4],
    twinkleSpeed: [2.5, 4.5],
    driftSpeed: [12, 24],
  },
};

const STAR_COLORS = ["#ffffff", "#e6f2ff", "#fff9e6"];

const PLANET_PRESETS: Omit<Planet, "radius" | "x" | "y">[] = [
  {
    baseX: 0.16,
    baseY: 0.28,
    radiusFactor: 0.22,
    color: "#4169E1",
    opacity: 0.22,
    ring: false,
    angle: 0,
    rotationSpeed: (Math.PI * 2) / 28,
    driftFactor: 0.03,
  },
  {
    baseX: 0.82,
    baseY: 0.24,
    radiusFactor: 0.27,
    color: "#D4A574",
    opacity: 0.2,
    ring: false,
    angle: 0,
    rotationSpeed: (Math.PI * 2) / 24,
    driftFactor: 0.025,
  },
  {
    baseX: 0.68,
    baseY: 0.78,
    radiusFactor: 0.18,
    color: "#E27B58",
    opacity: 0.18,
    ring: false,
    angle: 0,
    rotationSpeed: (Math.PI * 2) / 20,
    driftFactor: 0.04,
  },
];

const NEBULA_PRESETS: NebulaCloud[] = [
  {
    baseX: 0.25,
    baseY: 0.6,
    radius: 420,
    colors: [
      { stop: 0, color: "rgba(125, 73, 201, 0.25)" },
      { stop: 0.5, color: "rgba(61, 30, 99, 0.18)" },
      { stop: 1, color: "rgba(10, 16, 40, 0)" },
    ],
    opacity: 0.12,
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.05,
    driftDistance: 40,
  },
  {
    baseX: 0.65,
    baseY: 0.35,
    radius: 520,
    colors: [
      { stop: 0, color: "rgba(78, 33, 109, 0.3)" },
      { stop: 0.7, color: "rgba(39, 16, 71, 0.15)" },
      { stop: 1, color: "rgba(10, 16, 40, 0)" },
    ],
    opacity: 0.1,
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.03,
    driftDistance: 60,
  },
  {
    baseX: 0.5,
    baseY: 0.8,
    radius: 480,
    colors: [
      { stop: 0, color: "rgba(226, 68, 146, 0.18)" },
      { stop: 0.6, color: "rgba(88, 21, 76, 0.12)" },
      { stop: 1, color: "rgba(10, 16, 40, 0)" },
    ],
    opacity: 0.09,
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.04,
    driftDistance: 45,
  },
];

const GOLDEN_COLOR = "#FFD700";
const ORBITING_PLANET_PRESETS: Omit<OrbitingPlanet, "angle">[] = [
  {
    radiusA: 140,
    radiusB: 80,
    size: 18,
    color: "#9fc2ff",
    speed: 0.35,
    glow: "rgba(159, 194, 255, 0.5)",
  },
  {
    radiusA: 190,
    radiusB: 110,
    size: 14,
    color: "#ffd7b5",
    speed: 0.28,
    glow: "rgba(255, 215, 180, 0.45)",
  },
  {
    radiusA: 230,
    radiusB: 150,
    size: 16,
    color: "#f8a5c2",
    speed: 0.22,
    glow: "rgba(248, 165, 194, 0.4)",
  },
];

export default function GalaxyBackground({ targetRef, paused = false, onMerge }: GalaxyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const nebulaRef = useRef<NebulaCloud[]>(NEBULA_PRESETS.map((cloud) => ({ ...cloud })));
  const sparkleParticlesRef = useRef<SparkleParticle[]>([]);
  const orbitingPlanetsRef = useRef<OrbitingPlanet[]>([]);
  const goldenRef = useRef<GoldenStar>({
    active: false,
    startTime: 0,
    trail: [],
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    lastSparkle: 0,
    nextSparkleDelay: 1000,
    life: 0,
    maxLife: 11000,
  });
  const pauseRef = useRef(paused);
  const lastTimeRef = useRef<number | null>(null);
  pauseRef.current = paused;

  const createStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    const isSmall = width < 640;
    const isMedium = width < 1024;
    const scale = isSmall ? 0.6 : isMedium ? 0.85 : 1;

    (Object.keys(STAR_LAYER_CONFIG) as StarLayer[]).forEach((layer) => {
      const config = STAR_LAYER_CONFIG[layer];
      const count = Math.round(config.baseCount * scale);
      for (let i = 0; i < count; i++) {
        const size = randomRange(config.sizeRange[0], config.sizeRange[1]);
        const twinkleSpeed = randomRange(config.twinkleSpeed[0], config.twinkleSpeed[1]);
        const twinkleRange = randomRange(config.twinkleRange[0], config.twinkleRange[1]);
        const driftMagnitude = randomRange(config.driftSpeed[0], config.driftSpeed[1]);
        const driftAngle = Math.random() * Math.PI * 2;
        stars.push({
          layer,
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          baseAlpha: randomRange(0.2, 0.6),
          twinkleRange,
          twinkleSpeed,
          twinklePhase: Math.random() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          driftX: Math.cos(driftAngle) * driftMagnitude,
          driftY: Math.sin(driftAngle) * driftMagnitude,
        });
      }
    });
    starsRef.current = stars;
  }, []);

  const createPlanets = useCallback((width: number, height: number) => {
    const minDim = Math.min(width, height);
    planetsRef.current = PLANET_PRESETS.map((preset) => ({
      ...preset,
      radius: minDim * preset.radiusFactor,
      x: preset.baseX * width,
      y: preset.baseY * height,
      angle: Math.random() * Math.PI * 2,
    }));
  }, []);

  const createOrbitingPlanets = useCallback((scale: number) => {
    const clamped = Math.max(0.55, Math.min(1, scale));
    orbitingPlanetsRef.current = ORBITING_PLANET_PRESETS.map((preset) => ({
      ...preset,
      radiusA: preset.radiusA * clamped,
      radiusB: preset.radiusB * clamped,
      size: preset.size * clamped,
      speed: preset.speed * (0.9 + Math.random() * 0.2),
      angle: Math.random() * Math.PI * 2,
    }));
  }, []);

  const launchGoldenStar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas;
    const targetRect = targetRef.current?.getBoundingClientRect();
    const target = targetRect
      ? {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        }
      : { x: width / 2, y: height / 2 };

    const spawnEdges = [
      { x: Math.random() * width, y: -80 },
      { x: width + 80, y: Math.random() * height },
      { x: Math.random() * width, y: height + 80 },
      { x: -80, y: Math.random() * height },
    ];
    const start = spawnEdges[Math.floor(Math.random() * spawnEdges.length)];
    const baseAngle = Math.atan2(target.y - start.y, target.x - start.x);
    const perturbedAngle = baseAngle + randomRange(-0.25, 0.25);
    const speed = randomRange(80, 150);

    goldenRef.current = {
      active: true,
      startTime: performance.now(),
      trail: [],
      position: { x: start.x, y: start.y },
      velocity: {
        x: Math.cos(perturbedAngle) * speed,
        y: Math.sin(perturbedAngle) * speed,
      },
      target,
      lastSparkle: performance.now(),
      nextSparkleDelay: randomRange(700, 1200),
      life: 0,
      maxLife: randomRange(9000, 13000),
    };
  }, [targetRef]);

  const scheduleGoldenStar = useCallback(() => {
    if (delayTimeoutRef.current) {
      window.clearTimeout(delayTimeoutRef.current);
    }
    const delay = randomRange(6000, 10000);
    delayTimeoutRef.current = window.setTimeout(() => {
      if (!pauseRef.current) {
        launchGoldenStar();
      } else {
        scheduleGoldenStar();
      }
    }, delay);
  }, [launchGoldenStar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createStars(canvas.width, canvas.height);
      createPlanets(canvas.width, canvas.height);
      const minDim = Math.min(canvas.width, canvas.height);
      createOrbitingPlanets(minDim / 1200);
    };

    setSize();
    const handleResize = () => setSize();
    window.addEventListener("resize", handleResize);

    const drawBackground = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0a1628");
      gradient.addColorStop(0.5, "#1a2a4e");
      gradient.addColorStop(1, "#2d1b4e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawNebula = (delta: number) => {
      for (const cloud of nebulaRef.current) {
        if (!pauseRef.current) {
          cloud.driftAngle += cloud.driftSpeed * delta;
        }
        const offsetX = Math.cos(cloud.driftAngle) * cloud.driftDistance;
        const offsetY = Math.sin(cloud.driftAngle) * cloud.driftDistance;
        const centerX = cloud.baseX * canvas.width + offsetX;
        const centerY = cloud.baseY * canvas.height + offsetY;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cloud.radius);
        cloud.colors.forEach(({ stop, color }) => gradient.addColorStop(stop, color));
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawStars = (delta: number) => {
      const width = canvas.width;
      const height = canvas.height;
      for (const star of starsRef.current) {
        if (!pauseRef.current) {
          star.twinklePhase += delta * star.twinkleSpeed;
          star.x += star.driftX * delta;
          star.y += star.driftY * delta;
          if (star.x < -10) star.x = width + 10;
          if (star.x > width + 10) star.x = -10;
          if (star.y < -10) star.y = height + 10;
          if (star.y > height + 10) star.y = -10;
        }
        const alpha = star.baseAlpha + Math.sin(star.twinklePhase) * star.twinkleRange;
        ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawPlanets = (delta: number) => {
      for (const planet of planetsRef.current) {
        if (!pauseRef.current) {
          planet.angle += planet.rotationSpeed * delta;
        }
        ctx.save();
        ctx.translate(planet.x, planet.y);
        ctx.rotate(planet.angle * planet.driftFactor);
        ctx.globalAlpha = planet.opacity;

        const gradient = ctx.createRadialGradient(-planet.radius * 0.3, -planet.radius * 0.3, planet.radius * 0.2, 0, 0, planet.radius);
        gradient.addColorStop(0, `${planet.color}ff`);
        gradient.addColorStop(1, `${planet.color}00`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        if (planet.ring) {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = planet.ringColor ?? "rgba(255,255,255,0.3)";
          ctx.lineWidth = planet.radius * 0.08;
          ctx.beginPath();
          ctx.ellipse(0, 0, planet.radius * 1.45, planet.radius * 0.65, -Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const spawnSparkles = (x: number, y: number) => {
      const count = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(30, 80);
        sparkleParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: randomRange(220, 380),
          size: randomRange(1, 2),
        });
      }
    };

    const drawSparkles = (delta: number) => {
      ctx.save();
      for (let i = sparkleParticlesRef.current.length - 1; i >= 0; i--) {
        const particle = sparkleParticlesRef.current[i];
        if (!pauseRef.current) {
          particle.life += delta * 1000;
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
        }
        const alpha = 1 - particle.life / particle.maxLife;
        if (alpha <= 0) {
          sparkleParticlesRef.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = alpha;
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const drawOrbitingPlanets = (center: { x: number; y: number }, delta: number) => {
      const bodies = orbitingPlanetsRef.current.map((planet) => {
        if (!pauseRef.current) {
          planet.angle = (planet.angle + planet.speed * delta) % (Math.PI * 2);
        }
        const x = center.x + Math.cos(planet.angle) * planet.radiusA;
        const y = center.y + Math.sin(planet.angle) * planet.radiusB;
        const depth = Math.sin(planet.angle);
        return { ...planet, x, y, depth };
      });

      bodies
        .sort((a, b) => a.depth - b.depth)
        .forEach((body) => {
          ctx.save();
          const depthLight = 0.55 + ((body.depth + 1) / 2) * 0.25;
          ctx.globalAlpha = depthLight;
          const gradient = ctx.createRadialGradient(
            body.x - body.size * 0.2,
            body.y - body.size * 0.2,
            body.size * 0.3,
            body.x,
            body.y,
            body.size * 1.2
          );
          gradient.addColorStop(0, body.color);
          gradient.addColorStop(1, "rgba(10,10,20,0.4)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(body.x, body.y, body.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = depthLight * 0.7;
          ctx.strokeStyle = body.glow;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(body.x, body.y, body.size * 1.35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      ctx.globalAlpha = 1;
    };

    const drawGoldenStar = (
      time: number,
      delta: number,
      targetCenter: { x: number; y: number }
    ) => {
      const golden = goldenRef.current;
      if (!golden.active) return;

      if (!pauseRef.current) {
        golden.life += delta * 1000;
        golden.target = targetCenter;

        const dx = golden.target.x - golden.position.x;
        const dy = golden.target.y - golden.position.y;
        const distance = Math.max(20, Math.hypot(dx, dy));
        const gravity = Math.min(140000 / (distance * distance), 280);

        golden.velocity.x += (dx / distance) * gravity * delta;
        golden.velocity.y += (dy / distance) * gravity * delta;

        const driftNoise = 10;
        golden.velocity.x += (Math.random() - 0.5) * driftNoise * delta;
        golden.velocity.y += (Math.random() - 0.5) * driftNoise * delta;

        const speed = Math.hypot(golden.velocity.x, golden.velocity.y);
        const maxSpeed = 320;
        if (speed > maxSpeed) {
          const scale = maxSpeed / speed;
          golden.velocity.x *= scale;
          golden.velocity.y *= scale;
        }

        golden.position.x += golden.velocity.x * delta;
        golden.position.y += golden.velocity.y * delta;

        golden.velocity.x *= 0.996;
        golden.velocity.y *= 0.996;

        golden.trail.push({ x: golden.position.x, y: golden.position.y });
        if (golden.trail.length > 30) {
          golden.trail.shift();
        }
      }

      if (golden.trail.length) {
        ctx.lineWidth = 1.2;
        for (let i = 0; i < golden.trail.length - 1; i++) {
          const alpha = (i + 1) / golden.trail.length;
          ctx.strokeStyle = `rgba(255, 200, 140, ${alpha * 0.3})`;
          ctx.beginPath();
          ctx.moveTo(golden.trail[i].x, golden.trail[i].y);
          ctx.lineTo(golden.trail[i + 1].x, golden.trail[i + 1].y);
          ctx.stroke();
        }
      }

      const { x, y } = golden.position;

      if (!pauseRef.current && time - golden.lastSparkle >= golden.nextSparkleDelay) {
        spawnSparkles(x, y);
        golden.lastSparkle = time;
        golden.nextSparkleDelay = randomRange(700, 1200);
      }

      const distanceToTarget = Math.hypot(golden.target.x - x, golden.target.y - y);
      const sizeGrowth = Math.max(0, 1 - Math.min(distanceToTarget / 420, 1));
      const starSize = 8 + sizeGrowth * 6;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, starSize * 3.5);
      glow.addColorStop(0, "rgba(255, 215, 0, 0.95)");
      glow.addColorStop(0.5, "rgba(255, 200, 120, 0.55)");
      glow.addColorStop(1, "rgba(255, 200, 120, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, starSize * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = GOLDEN_COLOR;
      ctx.beginPath();
      ctx.arc(x, y, starSize * 0.85, 0, Math.PI * 2);
      ctx.fill();

      if (
        distanceToTarget < 24 ||
        golden.life > golden.maxLife ||
        x < -200 ||
        x > canvas.width + 200 ||
        y < -200 ||
        y > canvas.height + 200
      ) {
        golden.active = false;
        golden.trail = [];
        golden.life = 0;
        onMerge?.();
        scheduleGoldenStar();
      }
    };

    const animate = (time: number) => {
      const lastTime = lastTimeRef.current ?? time;
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTimeRef.current = time;

      const targetRect = targetRef.current?.getBoundingClientRect();
      const targetCenter = targetRect
        ? {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2,
          }
        : { x: canvas.width / 2, y: canvas.height / 2 };

      drawBackground();
      drawNebula(delta);
      drawStars(delta);
      drawPlanets(delta);
      drawOrbitingPlanets(targetCenter, delta);
      drawGoldenStar(time, delta, targetCenter);
      drawSparkles(delta);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    scheduleGoldenStar();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (delayTimeoutRef.current) window.clearTimeout(delayTimeoutRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [createOrbitingPlanets, createPlanets, createStars, onMerge, scheduleGoldenStar, targetRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full will-change-transform"
    />
  );
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

