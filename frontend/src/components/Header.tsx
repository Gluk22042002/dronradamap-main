import { useState } from 'react';
import Logo from './Logo';
import SafetyInfo from './SafetyInfo';

interface Props {
  light?: boolean;
  onToggleTheme?: () => void;
}

export default function Header({ light, onToggleTheme }: Props) {
  const [safetyOpen, setSafetyOpen] = useState(false);

  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
        background: 'rgba(5,5,10,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <div>
            <span style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #f0f0f5 30%, #6b6b85 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              BplaScope
            </span>
            <span style={{
              fontSize: 7,
              color: 'var(--text-muted)',
              marginLeft: 6,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              verticalAlign: 'super',
            }}>
              Radar
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setSafetyOpen(true)}
            style={{
              padding: '4px 9px', borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.08)',
              background: 'rgba(239,68,68,0.04)',
              color: '#fca5a5',
              fontSize: 9, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'inherit',
              letterSpacing: '0.03em',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>⚠️</span>
            Безопасность
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              width: 26, height: 26, borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
            }}
            title={light ? 'Тёмная тема' : 'Светлая тема'}
          >
            {light ? '🌙' : '☀️'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px 3px 8px', borderRadius: 20,
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.08)',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: '#22c55e',
              boxShadow: '0 0 10px rgba(34,197,94,0.6)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 9, color: '#4ade80', fontWeight: 700,
              letterSpacing: '0.06em',
            }}>
              LIVE
            </span>
          </div>
          <div style={{
            width: 1, height: 16,
            background: 'var(--border)',
          }} />
          <span style={{
            fontSize: 8, color: 'var(--text-muted)',
            fontWeight: 500, letterSpacing: '0.03em',
          }}>
            OSINT
          </span>
        </div>
      </header>

      {safetyOpen && <SafetyInfo onClose={() => setSafetyOpen(false)} />}
    </>
  );
}
