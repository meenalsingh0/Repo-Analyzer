'use client';

const FEATURES = [
  { icon: '❤️', title: 'Health Score', desc: 'Stars, forks, issue ratios & recency combined into a 0–100 score.' },
  { icon: '📈', title: 'Commit Trends', desc: 'Weekly commit heatmap, busiest periods, and recent activity.' },
  { icon: '👥', title: 'Contributors', desc: 'Top contributors ranked by share with percentage breakdown.' },
  { icon: '💡', title: 'AI Summary', desc: 'Groq-powered architecture analysis and contribution suggestions.' },
  { icon: '🗂️', title: 'Structure', desc: 'File tree, entry points, README presence and dependencies.' },
  { icon: '🌍', title: 'Languages', desc: 'Byte-level language breakdown with visual percentage bars.' },
];

export default function FeatureCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
      {FEATURES.map(f => (
        <div
          key={f.title}
          className="card"
          style={{ padding: '28px 24px', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,106,255,0.3)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '';
            (e.currentTarget as HTMLElement).style.transform = '';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
          <div style={{ fontWeight: 700, marginBottom: '8px' }}>{f.title}</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</div>
        </div>
      ))}
    </div>
  );
}
