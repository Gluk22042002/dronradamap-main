import { useState } from 'react';

const FEATURES = ['Мгновенные уведомления', 'По регионам', 'Только важное'];

export default function TelegramBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      position: 'relative', zIndex: 2,
      padding: '16px 20px',
      background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(6,182,212,0.04) 100%)',
      borderBottom: '1px solid rgba(59,130,246,0.08)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60%', right: '-10%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40%', left: '-5%', width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{
              fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 4,
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Все оповещения в Telegram!
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
              Получайте мгновенные уведомления о новых инцидентах
            </p>

            <a
              href="https://t.me/bpla_scope_bot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', textDecoration: 'none', cursor: 'pointer',
                border: 'none', fontFamily: 'inherit',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Подписаться
            </a>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {FEATURES.map(f => (
              <span key={f} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.12)',
                whiteSpace: 'nowrap',
              }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          style={{
            position: 'absolute', top: -4, right: -4,
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: 16, lineHeight: 1, padding: 4, fontFamily: 'inherit',
          }}
          title="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
