export default function SkeletonCard({ count = 5 }: { count?: number }) {
  return (
    <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          padding: 0, borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: `slideUp 0.3s ease-out both`,
          animationDelay: `${i * 0.04}s`,
        }}>
          <div style={{ height: 2.5, background: 'rgba(255,255,255,0.02)' }} />
          <div style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="shimmer" style={{ width: 60, height: 15, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
              <div className="shimmer" style={{ width: 50, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.02)', marginLeft: 'auto' }} />
            </div>
            <div className="shimmer" style={{ width: '85%', height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
            <div className="shimmer" style={{ width: '50%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.015)' }} />
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
              <div className="shimmer" style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.02)' }} />
              <div className="shimmer" style={{ width: 24, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.02)' }} />
            </div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        .shimmer { animation: shimmer 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
