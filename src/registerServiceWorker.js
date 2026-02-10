export function register() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  // Só registra em produção e quando sw.js existir (PWA build)
  if (import.meta.env.DEV) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                const event = new CustomEvent('new-pwa-update-available', {
                  detail: {
                    onUpdate: () => {
                      installingWorker.postMessage({ type: 'SKIP_WAITING' });
                      // After the SW has been instructed to skip waiting, we reload the page
                      // to let the new SW take control. We add a small delay to give it time.
                      setTimeout(() => {
                        window.location.reload();
                      }, 100);
                    }
                  }
                });
                window.dispatchEvent(event);
              }
            }
          };
        };
    }).catch((error) => {
      if (error?.message?.includes('404')) return;
      console.error('Error during service worker registration:', error);
    });
  });
}