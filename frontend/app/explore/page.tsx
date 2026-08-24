import Link from 'next/link';
import { api } from '@/lib/api';
import ExploreGrid from '@/components/ExploreGrid';

export const dynamic = 'force-dynamic';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? '1', 10));
  let data: { items: import('@/lib/api').ExploreItem[]; total: number; page: number; limit: number; totalPages: number };
  try { data = await api.explore(page, 12); } catch { data = { items: [], total: 0, page, limit: 12, totalPages: 0 }; }

  const totalPages = data.totalPages;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div className="fade-up" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>🌐 Explore</h1>
        <p style={{ color: 'var(--muted)', marginTop: '6px' }}>Public repository analyses from the community</p>
      </div>

      {data.items.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔭</div>
          <p>No public analyses yet. Be the first to analyse a repo!</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Analyse a Repo</Link>
        </div>
      ) : (
        <>
          <ExploreGrid items={data.items} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
              {page > 1 && <Link href={`/explore?page=${page - 1}`} className="btn btn-secondary">← Prev</Link>}
              <span className="btn" style={{ cursor: 'default', color: 'var(--muted)', background: 'none' }}>Page {page} of {totalPages}</span>
              {page < totalPages && <Link href={`/explore?page=${page + 1}`} className="btn btn-secondary">Next →</Link>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
