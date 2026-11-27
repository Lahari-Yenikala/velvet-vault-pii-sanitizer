import React, { useEffect, useRef } from 'react';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const ICOSAHEDRON_VERTS: Vec3[] = [
  { x: -1, y: PHI, z: 0 },
  { x: 1, y: PHI, z: 0 },
  { x: -1, y: -PHI, z: 0 },
  { x: 1, y: -PHI, z: 0 },
  { x: 0, y: -1, z: PHI },
  { x: 0, y: 1, z: PHI },
  { x: 0, y: -1, z: -PHI },
  { x: 0, y: 1, z: -PHI },
  { x: PHI, y: 0, z: -1 },
  { x: PHI, y: 0, z: 1 },
  { x: -PHI, y: 0, z: -1 },
  { x: -PHI, y: 0, z: 1 },
].map((v) => {
  const len = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
});

const ICOSAHEDRON_EDGES: [number, number][] = [
  [0, 11], [0, 5], [0, 1], [0, 7], [0, 10],
  [1, 5], [5, 11], [11, 10], [10, 7], [7, 1],
  [3, 9], [3, 4], [3, 2], [3, 6], [3, 8],
  [4, 9], [9, 8], [8, 6], [6, 2], [2, 4],
  [1, 9], [5, 4], [11, 2], [10, 6], [7, 8],
  [4, 11], [9, 5], [8, 1], [6, 7], [2, 10],
];

const OCTAHEDRON_VERTS: Vec3[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const OCTAHEDRON_EDGES: [number, number][] = [
  [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 4], [4, 3], [3, 5], [5, 2],
];

function rotatePoint(p: Vec3, rx: number, ry: number, rz: number): Vec3 {
  // Rotate X
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y1 = p.y * cosX - p.z * sinX;
  const z1 = p.y * sinX + p.z * cosX;

  // Rotate Y
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x2 = p.x * cosY + z1 * sinY;
  const z2 = -p.x * sinY + z1 * cosY;

  // Rotate Z
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const x3 = x2 * cosZ - y1 * sinZ;
  const y3 = x2 * sinZ + y1 * cosZ;

  return { x: x3, y: y3, z: z2 };
}

function project(p: Vec3, cx: number, cy: number, fov = 560, camDist = 620): ProjectedPoint {
  const zOffset = Math.max(80, camDist - p.z);
  const scale = fov / zOffset;
  return {
    x: cx + p.x * scale,
    y: cy + p.y * scale,
    z: p.z,
    scale,
  };
}

export const Vault3DBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const palette = [
      'rgba(243, 229, 171, 0.9)', // Soft Champagne Gold
      'rgba(251, 113, 133, 0.85)', // Luminous Ruby Rose
      'rgba(52, 211, 153, 0.85)', // Bright Security Emerald
      'rgba(251, 191, 36, 0.85)', // Radiant Amber Gold
    ];

    const particles: Particle3D[] = Array.from({ length: 78 }, (_, idx) => ({
      x: (Math.random() - 0.5) * 1400,
      y: (Math.random() - 0.5) * 900,
      z: (Math.random() - 0.5) * 600,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.35,
      vz: (Math.random() - 0.5) * 0.42,
      size: 1.5 + Math.random() * 2.4,
      color: palette[idx % palette.length],
    }));

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / Math.max(1, width) - 0.5) * 0.55;
      targetMouseY = (e.clientY / Math.max(1, height) - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let angle = 0;
    let animId = 0;

    const drawGrid = (cx: number, horizonY: number, time: number) => {
      ctx.save();
      const gridCols = 16;
      const gridRows = 10;
      const spreadX = Math.max(width * 1.15, 1100);
      const depth = 650;
      const zShift = (time * 36) % (depth / gridRows);

      for (let i = -gridCols / 2; i <= gridCols / 2; i++) {
        const xWorld = (i / (gridCols / 2)) * (spreadX * 0.65);
        const pNear = project({ x: xWorld, y: 260, z: 240 }, cx, horizonY, 540, 620);
        const pFar = project({ x: xWorld, y: 260, z: -depth }, cx, horizonY, 540, 620);

        const grad = ctx.createLinearGradient(pNear.x, pNear.y, pFar.x, pFar.y);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0.22)');
        grad.addColorStop(0.5, 'rgba(225, 29, 72, 0.14)');
        grad.addColorStop(1, 'rgba(225, 29, 72, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pNear.x, pNear.y);
        ctx.lineTo(pFar.x, pFar.y);
        ctx.stroke();
      }

      for (let r = 0; r < gridRows; r++) {
        const zWorld = 240 - r * (depth / gridRows) - zShift;
        const pLeft = project({ x: -spreadX * 0.65, y: 260, z: zWorld }, cx, horizonY, 540, 620);
        const pRight = project({ x: spreadX * 0.65, y: 260, z: zWorld }, cx, horizonY, 540, 620);
        const alpha = Math.max(0, Math.min(0.24, (zWorld + depth) / (depth + 240) * 0.24));
        ctx.strokeStyle = `rgba(243, 229, 171, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawRing = (
      cx: number,
      cy: number,
      radius: number,
      rx: number,
      ry: number,
      rz: number,
      color: string,
      lineWidth: number
    ) => {
      const segments = 64;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const raw: Vec3 = {
          x: Math.cos(theta) * radius,
          y: Math.sin(theta) * radius,
          z: 0,
        };
        const rot = rotatePoint(raw, rx, ry, rz);
        const proj = project(rot, cx, cy);
        if (i === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const cx = width * 0.5 + mouseX * 45;
      const cy = Math.min(height * 0.38, 320) + mouseY * 35;

      // 1. 3D Perspective Grid Floor
      drawGrid(width * 0.5 + mouseX * 25, height * 0.64, angle);

      // 2. Central 3D Core Glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 290);
      coreGlow.addColorStop(0, 'rgba(251, 191, 36, 0.20)');
      coreGlow.addColorStop(0.35, 'rgba(225, 29, 72, 0.16)');
      coreGlow.addColorStop(0.7, 'rgba(16, 185, 129, 0.06)');
      coreGlow.addColorStop(1, 'rgba(9, 9, 11, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 290, 0, Math.PI * 2);
      ctx.fill();

      // 3. Three 3D Gyroscopic Rings
      const vaultRadius = Math.min(width, height) < 640 ? 135 : 195;
      drawRing(cx, cy, vaultRadius * 1.38, 1.15 + mouseY, angle * 0.8 + mouseX, 0.35, 'rgba(243, 229, 171, 0.38)', 1.5);
      drawRing(cx, cy, vaultRadius * 1.2, -0.75 + mouseY, -angle * 1.1 + mouseX, 1.05, 'rgba(251, 113, 133, 0.36)', 1.4);
      drawRing(cx, cy, vaultRadius * 1.56, 0.45 + mouseY, angle * 0.55 + mouseX, -0.85, 'rgba(52, 211, 153, 0.28)', 1.1);

      // 4. Outer 3D Icosahedron Shield
      const icoProjected = ICOSAHEDRON_VERTS.map((v) => {
        const scaled = { x: v.x * vaultRadius, y: v.y * vaultRadius, z: v.z * vaultRadius };
        const rotated = rotatePoint(scaled, angle * 0.55 + mouseY, angle * 0.85 + mouseX, angle * 0.25);
        return project(rotated, cx, cy);
      });

      for (const [a, b] of ICOSAHEDRON_EDGES) {
        const pa = icoProjected[a];
        const pb = icoProjected[b];
        const avgDepth = (pa.z + pb.z) / (2 * vaultRadius);
        const alpha = Math.max(0.12, Math.min(0.62, 0.34 + avgDepth * 0.28));
        ctx.strokeStyle = `rgba(243, 229, 171, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      for (const p of icoProjected) {
        const alpha = Math.max(0.25, Math.min(0.95, 0.55 + (p.z / vaultRadius) * 0.4));
        ctx.fillStyle = `rgba(253, 230, 138, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.8 * p.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Inner 3D Octahedron Ruby Core
      const coreRadius = vaultRadius * 0.52;
      const octProjected = OCTAHEDRON_VERTS.map((v) => {
        const scaled = { x: v.x * coreRadius, y: v.y * coreRadius, z: v.z * coreRadius };
        const rotated = rotatePoint(scaled, -angle * 0.95 + mouseY, -angle * 1.25 + mouseX, angle * 0.5);
        return project(rotated, cx, cy);
      });

      for (const [a, b] of OCTAHEDRON_EDGES) {
        const pa = octProjected[a];
        const pb = octProjected[b];
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }

      // 6. 3D Floating Encrypted Particles + Filaments
      const projParticles: (ProjectedPoint & { color: string; size: number })[] = [];
      for (const pt of particles) {
        if (!prefersReducedMotion) {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.z += pt.vz;

          if (pt.x > 700 || pt.x < -700) pt.vx *= -1;
          if (pt.y > 450 || pt.y < -450) pt.vy *= -1;
          if (pt.z > 300 || pt.z < -300) pt.vz *= -1;
        }

        const rotated = rotatePoint(pt, mouseY * 0.35, mouseX * 0.45, 0);
        const p = project(rotated, width * 0.5, height * 0.5, 560, 640);
        projParticles.push({ ...p, color: pt.color, size: pt.size });
      }

      for (let i = 0; i < projParticles.length; i++) {
        const a = projParticles[i];
        for (let j = i + 1; j < projParticles.length; j++) {
          const b = projParticles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 15000) {
            const alpha = (1 - distSq / 15000) * 0.22;
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of projParticles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, p.size * p.scale), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        angle += 0.0065;
        animId = window.requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Bright multi-stop atmospheric aurora glows */}
      <div
        className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.28) 0%, rgba(114,20,34,0.08) 60%, transparent 100%)' }}
      />
      <div
        className="absolute top-1/4 right-1/5 h-[460px] w-[460px] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(243,229,171,0.20) 0%, rgba(212,175,55,0.06) 60%, transparent 100%)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[420px] w-[540px] rounded-full blur-[140px]"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(155,27,48,0.12) 55%, transparent 100%)' }}
      />
      <canvas ref={canvasRef} className="h-full w-full opacity-95" aria-hidden="true" />
    </div>
  );
};
