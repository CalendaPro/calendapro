'use client'

export default function MarketplaceLoading() {
  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh', padding: '2rem' }}>
      {/* Header Skeleton */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 2rem' }}>
        <div
          className="skel-glass"
          style={{
            height: 120,
            borderRadius: 24,
            background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      </div>

      {/* Filters Skeleton */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 2rem', display: 'flex', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skel-glass"
            style={{
              height: 48,
              width: 160,
              borderRadius: 14,
              background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 2s infinite linear ${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Cards Grid Skeleton */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: 24,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div
                className="skel-glass"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                  backgroundSize: '200% 100%',
                  animation: `shimmer 2s infinite linear ${i * 0.15}s`,
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  className="skel-glass"
                  style={{
                    height: 16,
                    width: '55%',
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 2s infinite linear ${i * 0.15}s`,
                  }}
                />
                <div
                  className="skel-glass"
                  style={{
                    height: 12,
                    width: '35%',
                    borderRadius: 100,
                    background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 2s infinite linear ${i * 0.15}s`,
                  }}
                />
              </div>
            </div>
            <div
              className="skel-glass"
              style={{
                height: 1,
                borderRadius: 1,
                background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${i * 0.15}s`,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="skel-glass"
                  style={{
                    height: 12,
                    width: j === 1 ? '100%' : j === 2 ? '85%' : '70%',
                    borderRadius: 6,
                    background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 2s infinite linear ${i * 0.15 + j * 0.05}s`,
                  }}
                />
              ))}
            </div>
            <div
              className="skel-glass"
              style={{
                height: 44,
                borderRadius: 14,
                marginTop: '0.5rem',
                background: 'linear-gradient(90deg, rgba(243, 244, 246, 0.6) 0%, rgba(229, 231, 235, 0.8) 50%, rgba(243, 244, 246, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${i * 0.15}s`,
              }}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
