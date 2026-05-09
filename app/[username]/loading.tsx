'use client'

export default function PublicProfileLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Hero Skeleton */}
      <div style={{ position: 'relative', height: 280, background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Avatar Skeleton */}
          <div
            className="skel-glass"
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '4px solid white',
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite linear',
            }}
          />
        </div>
      </div>

      {/* Content Skeleton */}
      <div style={{ maxWidth: 720, margin: '80px auto 0', padding: '0 1rem 3rem' }}>
        {/* Name */}
        <div
          className="skel-glass"
          style={{
            height: 32,
            width: 200,
            margin: '0 auto 0.5rem',
            borderRadius: 8,
            background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear 0.1s',
          }}
        />

        {/* Category */}
        <div
          className="skel-glass"
          style={{
            height: 20,
            width: 120,
            margin: '0 auto 1rem',
            borderRadius: 100,
            background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear 0.2s',
          }}
        />

        {/* Bio */}
        <div style={{ marginBottom: '2rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skel-glass"
              style={{
                height: 16,
                width: i === 3 ? '60%' : '100%',
                marginBottom: 8,
                borderRadius: 4,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${0.2 + i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Services Title */}
        <div
          className="skel-glass"
          style={{
            height: 24,
            width: 140,
            marginBottom: 16,
            borderRadius: 6,
            background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear 0.3s',
          }}
        />

        {/* Service Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skel-glass"
              style={{
                height: 80,
                borderRadius: 16,
                background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2s infinite linear ${0.3 + i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div
          className="skel-glass"
          style={{
            height: 56,
            marginTop: 24,
            borderRadius: 16,
            background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.8) 0%, rgba(203, 213, 225, 0.9) 50%, rgba(226, 232, 240, 0.8) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear 0.4s',
          }}
        />
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
