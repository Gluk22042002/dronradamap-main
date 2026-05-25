export default function Logo({ size = 32 }: { size?: number }) {
  const s = size;
  return (
    <div style={{
      width: s, height: s, borderRadius: 10, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.1))',
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 0 20px rgba(59,130,246,0.06)',
      animation: 'float 3s ease-in-out infinite',
    }}>
      <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        {/* Radar rings */}
        <circle cx="16" cy="16" r="12" stroke="rgba(96,165,250,0.15)" strokeWidth="0.6" />
        <circle cx="16" cy="16" r="8" stroke="rgba(96,165,250,0.1)" strokeWidth="0.5" />
        <circle cx="16" cy="16" r="4" stroke="rgba(96,165,250,0.12)" strokeWidth="0.5" />
        {/* Sweep arc */}
        <path d="M16 4 A12 12 0 0 1 27 14" stroke="rgba(96,165,250,0.3)" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M16 4 A12 12 0 0 1 27 14 L24 12" stroke="rgba(96,165,250,0.15)" strokeWidth="0.4" fill="rgba(96,165,250,0.04)" />
        {/* Drone silhouette */}
        <ellipse cx="16" cy="18" rx="5" ry="2" stroke="rgba(96,165,250,0.5)" strokeWidth="0.7" fill="rgba(96,165,250,0.06)" />
        <rect x="12" y="17.5" width="1.5" height="0.7" rx="0.3" fill="rgba(96,165,250,0.35)" />
        <rect x="18.5" y="17.5" width="1.5" height="0.7" rx="0.3" fill="rgba(96,165,250,0.35)" />
        <line x1="13" y1="15" x2="19" y2="15" stroke="rgba(96,165,250,0.2)" strokeWidth="0.5" />
        {/* Center dot */}
        <circle cx="16" cy="18" r="1" fill="rgba(96,165,250,0.4)" />
        {/* B letter */}
        <text x="16" y="6" textAnchor="middle" fontSize="5" fill="rgba(96,165,250,0.4)" fontWeight="700" fontFamily="Inter, sans-serif">B</text>
      </svg>
    </div>
  );
}
