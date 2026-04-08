(function() {
  const script = document.currentScript
  const username = script.getAttribute('data-username')
  const buttonText = script.getAttribute('data-button-text') || 'Prendre rendez-vous'
  const buttonColor = script.getAttribute('data-color') || '#7c3aed'

  if (!username) {
    console.error('CalendaPro Widget: data-username manquant')
    return
  }

  const BASE_URL = 'https://calendapro.com'

  // Styles
  const style = document.createElement('style')
  style.textContent = `
    .calendapro-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: ${buttonColor};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: Inter, sans-serif;
      transition: opacity 0.2s;
    }
    .calendapro-btn:hover { opacity: 0.9; }
    .calendapro-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .calendapro-modal {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    }
    .calendapro-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
    .calendapro-iframe {
      width: 100%;
      border: none;
      border-radius: 20px;
      min-height: 560px;
    }
  `
  document.head.appendChild(style)

  // Bouton
  const button = document.createElement('button')
  button.className = 'calendapro-btn'
  button.innerHTML = `📅 ${buttonText}`
  script.parentNode.insertBefore(button, script.nextSibling)

  // Modal
  let overlay = null

  button.addEventListener('click', () => {
    overlay = document.createElement('div')
    overlay.className = 'calendapro-overlay'

    const modal = document.createElement('div')
    modal.className = 'calendapro-modal'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'calendapro-close'
    closeBtn.innerHTML = '✕'
    closeBtn.addEventListener('click', () => overlay.remove())

    const iframe = document.createElement('iframe')
    iframe.className = 'calendapro-iframe'
    iframe.src = `${BASE_URL}/widget/${username}`

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove()
    })

    modal.appendChild(closeBtn)
    modal.appendChild(iframe)
    overlay.appendChild(modal)
    document.body.appendChild(overlay)
  })
})()