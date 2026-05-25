import { useState, useEffect, useCallback } from 'react';

interface Blip {
  id: number;
  top: number;
  left: number;
  delay: number;
  size: number;
}

function genBlips(): Blip[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    top: 12 + Math.random() * 76,
    left: 12 + Math.random() * 76,
    delay: Math.random() * 3,
    size: 2 + Math.random() * 2.5,
  }));
}

interface Props {
  flash?: boolean;
  quiet?: boolean;
}

export default function RadarWidget({ flash, quiet }: Props) {
  const [blips, setBlips] = useState<Blip[]>([]);

  useEffect(() => {
    setBlips(genBlips());
    const id = setInterval(() => setBlips(genBlips()), 5000);
    return () => clearInterval(id);
  }, []);

  const size = 68;
  const rings = [22, 38, 54];
  const baseColor = quiet ? 'rgba(100,116,139,0.35)' : 'rgba(34,197,94,0.5)';
  const ringColor = quiet ? 'rgba(100,116,139,0.05)' : 'rgba(34,197,94,0.07)';
  const sweepColor = quiet ? 'rgba(100,116,139,0.04)' : 'rgba(34,197,94,0.08)';
  const sweepLine = quiet ? 'rgba(100,116,139,0.25)' : 'rgba(34,197,94,0.5)';
  const blipColor = quiet ? 'rgba(100,116,139,0.3)' : 'rgba(34,197,94,0.5)';
  const blipGlow = quiet ? 'rgba(100,116,139,0.15)' : 'rgba(34,197,94,0.3)';
  const borderColor = quiet ? 'rgba(100,116,139,0.08)' : 'rgba(34,197,94,0.12)';
  const boxShadow = quiet ? '0 0 24px rgba(100,116,139,0.02)' : '0 0 24px rgba(34,197,94,0.04)';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      background: quiet ? 'rgba(100,116,139,0.1)' : 'rgba(0,20,0,0.2)',
      border: `1px solid ${borderColor}`,
      boxShadow: `${boxShadow}, inset 0 0 20px rgba(0,0,0,0.4)`,
      transition: 'all 0.5s ease',
      animation: flash ? 'radar-flash 0.6s ease-out' : 'none',
    }}>
      {/* Center dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 2, height: 2, transform: 'translate(-50%, -50%)',
        borderRadius: '50%', background: baseColor,
        transition: 'background 0.5s ease',
      }} />

      {/* Rings */}
      {rings.map(r => (
        <div key={r} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: r, height: r,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: `0.5px solid ${ringColor}`,
          transition: 'border-color 0.5s ease',
        }} />
      ))}

      {/* Sweep cone */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '100%', height: '100%',
        transform: 'translate(-50%, -50%)',
        background: `conic-gradient(from 0deg, ${sweepColor} 0deg, transparent 30deg, transparent 360deg)`,
        borderRadius: '50%',
        animation: quiet ? 'none' : 'radar-sweep 3s linear infinite',
        willChange: 'transform',
        opacity: quiet ? 0.3 : 1,
        transition: 'opacity 0.5s ease',
      }} />

      {/* Sweep line */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        width: 1, height: '50%', marginLeft: -0.5,
        background: `linear-gradient(to bottom, ${sweepLine}, transparent)`,
        transformOrigin: 'bottom center',
        animation: quiet ? 'none' : 'radar-sweep 3s linear infinite',
        willChange: 'transform',
        opacity: quiet ? 0.2 : 1,
        transition: 'opacity 0.5s ease',
      }} />

      {/* Blips */}
      {!quiet && blips.map(b => (
        <div key={b.id} style={{
          position: 'absolute',
          top: `${b.top}%`, left: `${b.left}%`,
          width: b.size, height: b.size,
          borderRadius: '50%',
          background: blipColor,
          boxShadow: `0 0 5px ${blipGlow}`,
          animation: `radar-blip 3s ease-out ${b.delay}s infinite`,
          willChange: 'transform, opacity',
        }} />
      ))}

      <style>{`
        @keyframes radar-sweep {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes radar-blip {
          0% { opacity: 1; transform: scale(1); }
          60% { opacity: 0.2; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(3); }
        }
        @keyframes radar-flash {
          0% { box-shadow: 0 0 24px rgba(34,197,94,0.04), inset 0 0 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 24px rgba(34,197,94,0.04), inset 0 0 20px rgba(0,0,0,0.4), 0 0 30px 8px rgba(34,197,94,0.15); }
          100% { box-shadow: 0 0 24px rgba(34,197,94,0.04), inset 0 0 20px rgba(0,0,0,0.4), 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}
