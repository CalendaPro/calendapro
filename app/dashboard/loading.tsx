'use client'

export default function DashboardLoading() {
  return (
    <div style={{ padding: '2rem 2.2rem 4rem', maxWidth: '100%', minHeight: '100vh' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div
            className="skel-glass"
            style={{
              height: 14,
              width: 80,
              borderRadius: 4,
              marginBottom: 8,
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear',
            }}
          />
          <div
            className="skel-glass"
            style={{
              height: 36,
              width: 200,
              borderRadius: 8,
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear 0.1s',
            }}
          />
        </div>
        <div
          className="skel-glass"
          style={{
            height: 32,
            width: 100,
            borderRadius: 100,
            background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear 0.2s',
          }}
        />
      </div>

      {/* KPI Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.9rem', marginBottom: '1.2rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '1.3rem 1.4rem',
              border: '1px solid #ede9e3',
            }}
          >
            <div
              className="skel-glass"
              style={{
                height: 12,
                width: '60%',
                borderRadius: 4,
                marginBottom: 12,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${i * 0.1}s`,
              }}
            />
            <div
              className="skel-glass"
              style={{
                height: 36,
                width: '40%',
                borderRadius: 6,
                marginBottom: 8,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${i * 0.1 + 0.05}s`,
              }}
            />
            <div
              className="skel-glass"
              style={{
                height: 16,
                width: '70%',
                borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${i * 0.1 + 0.1}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Chart Panel */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            border: '1px solid #ede9e3',
            overflow: 'hidden',
            padding: '1rem 1.3rem',
          }}
        >
          <div
            className="skel-glass"
            style={{
              height: 20,
              width: '40%',
              borderRadius: 4,
              marginBottom: 16,
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear',
            }}
          />
          <div
            className="skel-glass"
            style={{
              height: 200,
              borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear 0.2s',
            }}
          />
        </div>

        {/* Appointments Panel */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            border: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <div
              className="skel-glass"
              style={{
                height: 20,
                width: '60%',
                borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear',
              }}
            />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ padding: '0.8rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: '1px solid #f8f7f4' }}
            >
              <div
                className="skel-glass"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                  backgroundSize: '200% 100%',
                  animation: `shimmer 2s infinite linear ${i * 0.1}s`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="skel-glass"
                  style={{
                    height: 14,
                    width: '70%',
                    borderRadius: 4,
                    marginBottom: 4,
                    background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 2s infinite linear ${i * 0.1}s`,
                  }}
                />
                <div
                  className="skel-glass"
                  style={{
                    height: 12,
                    width: '40%',
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.6) 0%, rgba(203, 213, 225, 0.8) 50%, rgba(226, 232, 240, 0.6) 100%)',
                    backgroundSize: '200% 100%',
                    animation: `shimmer 2s infinite linear ${i * 0.1 + 0.05}s`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Intelligence Panel */}
        <div
          style={{
            background: 'rgba(15,23,42,0.95)',
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1.3rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              className="skel-glass"
              style={{
                height: 20,
                width: '50%',
                borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(51, 65, 85, 0.6) 0%, rgba(71, 85, 105, 0.8) 50%, rgba(51, 65, 85, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear',
              }}
            />
          </div>
          <div style={{ padding: '1rem' }}>
            <div
              className="skel-glass"
              style={{
                height: 180,
                borderRadius: 12,
                background: 'linear-gradient(90deg, rgba(51, 65, 85, 0.6) 0%, rgba(71, 85, 105, 0.8) 50%, rgba(51, 65, 85, 0.6) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite linear 0.2s',
              }}
            />
          </div>
        </div>
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
