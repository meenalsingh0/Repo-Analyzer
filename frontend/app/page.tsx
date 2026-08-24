import RepoForm from '@/components/RepoForm';
import FeatureCards from '@/components/FeatureCards';

const EXAMPLES = [
  'https://github.com/vercel/next.js',
  'https://github.com/microsoft/vscode',
  'https://github.com/facebook/react',
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="fade-up" style={{ textAlign: 'center', maxWidth: '760px', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '99px',
            background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)',
            fontSize: '13px', color: 'var(--accent)', fontWeight: 600, marginBottom: '28px',
          }}>
            <span className="pulse-dot" />
            AI-Powered · Real-time · Free
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 900, lineHeight: 1.05, marginBottom: '20px' }}>
            Deep insights for any<br />
            <span className="gradient-text">GitHub repository</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--muted)', maxWidth: '540px', margin: '0 auto 48px', lineHeight: 1.7 }}>
            Health scores, commit trends, contributor breakdowns, language analysis, and AI architecture summaries — all in seconds.
          </p>

          <RepoForm />

          <div style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Try:</span>
            {EXAMPLES.map(url => (
              <a key={url} href={`/?prefill=${encodeURIComponent(url)}`}
                style={{ fontSize: '13px', color: 'var(--accent)', background: 'rgba(124,106,255,0.1)', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(124,106,255,0.2)', transition: 'all 0.2s' }}
              >
                {url.replace('https://github.com/', '')}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <FeatureCards />
      </section>
    </div>
  );
}
