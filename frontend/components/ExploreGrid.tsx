'use client';
import Link from 'next/link';
import { ExploreItem } from '@/lib/api';

export default function ExploreGrid({ items }: { items: ExploreItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' }}>
      {items.map(item => (
        <Link key={item.id} href={`/jobs/${item.id}`} style={{ display: 'block' }}>
          <div
            className="card"
            style={{ padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,106,255,0.35)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '';
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.repo}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
              {item.analyzedAt.slice(0, 10)}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.healthScore !== null && (
                <span className={`badge ${item.healthScore >= 70 ? 'badge-completed' : item.healthScore >= 40 ? 'badge-active' : 'badge-failed'}`}>
                  Score: {item.healthScore}
                </span>
              )}
              {item.stars !== null && (
                <span className="badge badge-queued">⭐ {item.stars}</span>
              )}
              {item.primaryLanguage && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>
                  {item.primaryLanguage}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
