import type { AppTheme } from '../telegram';

interface Props {
  theme: AppTheme;
}

export default function SafetyView({ theme }: Props) {
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
    <div style={{ height: '100%', overflowY: 'auto', padding: '12px 14px', paddingBottom: 24 }}>
      {/* Emergency banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.05))',
        border: '1px solid rgba(239,68,68,0.1)',
        marginBottom: 12,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, flexShrink: 0,
        }}>🆘</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fca5a5', marginBottom: 1 }}>
            Важная информация
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>
            Единый номер: 112
          </div>
          <div style={{ fontSize: 8, color: '#fca5a5', marginTop: 2, opacity: 0.8, lineHeight: 1.3 }}>
            При тревоге — укрыться в защищённом месте. Не снимайте БПЛА на видео.
          </div>
        </div>
      </div>

      {/* Intro */}
      <p style={{
        fontSize: 9, color: theme.hint, lineHeight: 1.5,
        marginBottom: 12, padding: '0 2px',
      }}>
        Беспилотные летательные аппараты (БПЛА) могут использоваться в различных целях, включая разведку и нанесение ударов. В случае фиксации полётов БПЛА или получения оповещений важно соблюдать базовые меры личной безопасности и следовать рекомендациям официальных служб.
      </p>

      {/* Sections */}
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: i < sections.length - 1 ? 12 : 0 }}>
          <h3 style={{
            fontSize: 9, fontWeight: 700, color: theme.accent,
            marginBottom: 5, textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {s.title}
          </h3>
          <ul style={{
            margin: 0, paddingLeft: 12,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {s.items.map((item, j) => (
              <li key={j} style={{
                fontSize: 8.5, color: theme.hint,
                lineHeight: 1.4,
                paddingLeft: 2,
              }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: 14, paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 8, color: theme.hint, lineHeight: 1.4,
          maxWidth: 350, margin: '0 auto',
        }}>
          Соблюдение простых правил безопасности снижает риски для жизни и здоровья. Оповещения о БПЛА предназначены для информирования и подготовки, а не для создания паники.
        </p>
        <p style={{
          fontSize: 7, color: '#4b5563', marginTop: 5,
        }}>
          Следите за обновлениями на BplaScope.ru и официальных ресурсах.
        </p>
        <div style={{
          fontSize: 6, color: '#374151', marginTop: 5,
        }}>
          Обновлено: 16.12.2025 02:41
        </div>
      </div>
    </div>
  );
}
