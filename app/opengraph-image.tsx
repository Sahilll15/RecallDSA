import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "RecallDSA - Reconstruct, don't just remember";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0a0c10',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(37,193,120,0.18), transparent 45%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: '#25C178',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: '#0a0c10',
            }}
          >
            {'</>'}
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#f2f4f6' }}>
            recalldsa
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            color: '#f2f4f6',
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Reconstruct, don&apos;t just remember.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 30,
            color: '#9aa4af',
            maxWidth: 900,
          }}
        >
          Syncs solved DSA problems from GitHub and trains true recall with
          spaced repetition.
        </div>
      </div>
    ),
    { ...size },
  );
}
