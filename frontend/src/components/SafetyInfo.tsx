interface Props {
  onClose: () => void;
}

export default function SafetyInfo({ onClose }: Props) {
  const sections = [
    {
      title: 'Если вы получили оповещение о БПЛА',
      items: [
        'сохраняйте спокойствие и не поддавайтесь панике;',
        'уточняйте информацию только в официальных источниках;',
        'ограничьте пребывание на открытых пространствах;',
        'при возможности перейдите в помещение без окон или с минимальным остеклением;',
        'следите за обновлениями и дальнейшими рекомендациями.',
      ],
    },
    {
      title: 'Находясь в помещении',
      items: [
        'отойдите от окон, витражей и балконов;',
        'не выходите на крышу и не подходите к окнам для наблюдения;',
        'при наличии укрытия (подвал, цокольный этаж) — используйте его;',
        'держите при себе средства связи и зарядные устройства.',
      ],
    },
    {
      title: 'На улице',
      items: [
        'по возможности зайдите в ближайшее капитальное здание;',
        'избегайте открытых площадок, мостов, парковок и промышленных зон;',
        'не приближайтесь к подозрительным объектам или обломкам;',
        'не используйте дроны, радиостанции и другие передающие устройства без необходимости.',
      ],
    },
    {
      title: 'Если вы заметили БПЛА или его обломки',
      items: [
        'не подходите к объекту и не трогайте его;',
        'зафиксируйте место и время обнаружения;',
        'сообщите информацию в экстренные службы или по официальным каналам;',
        'предупредите находящихся рядом людей и отойдите на безопасное расстояние.',
      ],
    },
    {
      title: 'Что делать нельзя',
      items: [
        'распространять непроверенную информацию и слухи;',
        'публиковать фото и видео с указанием точного места и времени;',
        'обсуждать маршруты полётов и работу систем противодействия;',
        'игнорировать сигналы и рекомендации экстренных служб.',
      ],
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      {/* Modal */}
      <div className="animate-down" style={{
        position: 'relative',
        width: '100%', maxWidth: 540,
        maxHeight: '85vh',
        background: 'rgba(10,10,22,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.04)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, border: '1px solid rgba(239,68,68,0.08)',
            }}>⚠️</div>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}>
              Меры безопасности
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
              transition: 'all var(--transition-fast)',
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div className="scrollable" style={{
          padding: '12px 16px 16px',
          flex: 1, overflowY: 'auto',
        }}>
          {/* Emergency banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(245,158,11,0.04))',
            border: '1px solid rgba(239,68,68,0.1)',
            marginBottom: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🆘</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                Важная информация
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171', letterSpacing: '-0.01em' }}>
                Единый номер: 112
              </div>
              <div style={{ fontSize: 9, color: '#fca5a5', marginTop: 3, opacity: 0.8 }}>
                При тревоге — укрыться в защищённом месте. Не снимайте БПЛА на видео.
              </div>
            </div>
          </div>

          {/* Intro */}
          <p style={{
            fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6,
            marginBottom: 14, padding: '0 2px',
          }}>
            Беспилотные летательные аппараты (БПЛА) могут использоваться в различных целях, включая разведку и нанесение ударов. В случае фиксации полётов БПЛА или получения оповещений важно соблюдать базовые меры личной безопасности и следовать рекомендациям официальных служб.
          </p>

          {/* Sections */}
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: i < sections.length - 1 ? 14 : 0 }}>
              <h3 style={{
                fontSize: 10, fontWeight: 700, color: '#60a5fa',
                marginBottom: 6, textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {s.title}
              </h3>
              <ul style={{
                margin: 0, paddingLeft: 14,
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                {s.items.map((item, j) => (
                  <li key={j} style={{
                    fontSize: 9.5, color: 'var(--text-secondary)',
                    lineHeight: 1.5, listStyle: 'disc',
                    paddingLeft: 2,
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Footer note */}
          <div style={{
            marginTop: 16, paddingTop: 12,
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.5,
              maxWidth: 400, margin: '0 auto',
            }}>
              Соблюдение простых правил безопасности снижает риски для жизни и здоровья. Оповещения о БПЛА предназначены для информирования и подготовки, а не для создания паники.
            </p>
            <p style={{
              fontSize: 8, color: '#4b5563', marginTop: 6,
            }}>
              Следите за обновлениями на BplaScope.ru и официальных ресурсах.
            </p>
            <div style={{
              fontSize: 7, color: '#374151', marginTop: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Обновлено: 16.12.2025 02:41
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
