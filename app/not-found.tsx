import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        .nf-root {
          min-height: 100vh;
          background: #0B0816;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .nf-orb-1 {
          position: absolute;
          width: 560px;
          height: 560px;
          top: -20%;
          right: -10%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%);
          filter: blur(90px);
          pointer-events: none;
          animation: nfFloat1 22s ease-in-out infinite;
        }

        .nf-orb-2 {
          position: absolute;
          width: 440px;
          height: 440px;
          bottom: -15%;
          left: -8%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%);
          filter: blur(90px);
          pointer-events: none;
          animation: nfFloat2 28s ease-in-out infinite;
        }

        @keyframes nfFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }

        @keyframes nfFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, -20px); }
        }

        .nf-card {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 3rem 2.5rem;
          max-width: 460px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 10;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.025) inset, 0 32px 80px rgba(0,0,0,0.45);
        }

        .nf-icon-wrap {
          width: 76px;
          height: 76px;
          background: rgba(124, 58, 237, 0.12);
          border: 1px solid rgba(124, 58, 237, 0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.75rem;
          animation: nfPulse 3.5s ease-in-out infinite;
        }

        @keyframes nfPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.2); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.45), 0 0 70px rgba(236,72,153,0.15); }
        }

        .nf-404 {
          font-family: 'Clash Display', 'DM Sans', sans-serif;
          font-size: 5.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #7c3aed, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.05;
          margin-bottom: 0.25rem;
          letter-spacing: -0.04em;
          overflow: visible;
          padding-right: 0.05em;
          padding-bottom: 0.05em;
        }

        .nf-title {
          font-family: 'Clash Display', 'DM Sans', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.875rem;
          letter-spacing: -0.025em;
          line-height: 1.3;
          overflow: visible;
          padding-right: 0.05em;
          padding-bottom: 0.05em;
        }

        .nf-subtitle {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.45);
          margin-bottom: 2.25rem;
          line-height: 1.65;
          font-weight: 300;
        }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 0.925rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 28px rgba(124,58,237,0.45), 0 4px 16px rgba(236,72,153,0.2);
          transition: all 0.25s ease;
          letter-spacing: 0.01em;
        }

        .nf-btn:hover {
          box-shadow: 0 0 36px rgba(124,58,237,0.6), 0 6px 20px rgba(236,72,153,0.3);
          transform: translateY(-2px);
        }

        .nf-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #7c3aed, #ec4899);
          border-radius: 2px;
          margin: 1.25rem auto;
          box-shadow: 0 0 8px rgba(124,58,237,0.5);
        }
      `}</style>
      <div className="nf-root">
        <div className="nf-orb-1" />
        <div className="nf-orb-2" />
        <div className="nf-card">
          <div className="nf-icon-wrap">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#nfGrad)" strokeWidth="1.6"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="url(#nfGrad)" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M9 15l6-6M15 15L9 9" stroke="url(#nfGrad)" strokeWidth="1.6" strokeLinecap="round"/>
              <defs>
                <linearGradient id="nfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed"/>
                  <stop offset="100%" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="nf-404">404</div>
          <div className="nf-divider" />
          <h1 className="nf-title">Ce créneau a disparu dans le futur</h1>
          <p className="nf-subtitle">
            Oups ! La page que vous cherchez n&apos;existe pas ou a été déplacée.
            Revenez à l&apos;accueil et reprenez votre parcours.
          </p>
          <Link href="/" className="nf-btn">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </>
  )
}
