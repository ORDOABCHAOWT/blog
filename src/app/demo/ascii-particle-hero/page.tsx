import AsciiHeroDemo from './AsciiHeroDemo';

export const metadata = {
  title: 'ASCII Hero Demo',
};

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f3f1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '960px',
          maxWidth: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        <div style={{ fontFamily: 'serif' }}>
          <p
            style={{
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#8a8a86',
              margin: 0,
            }}
          >
            Personal Writing Archive
          </p>
          <h1
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '72px',
              lineHeight: 1.05,
              margin: '12px 0 24px',
              color: '#1c1c1a',
            }}
          >
            Taffy
            <br />
            Wang
          </h1>
          <p style={{ color: '#4a4a47', fontSize: '15px' }}>
            Take it easy, just thinking.
          </p>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.7 }}>
            Essays, project notes, and field observations on AI, work, images,
            travel, and the ordinary details worth holding onto.
          </p>
        </div>

        <AsciiHeroDemo />
      </div>
    </main>
  );
}
