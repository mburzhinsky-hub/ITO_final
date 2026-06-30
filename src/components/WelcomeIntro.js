export function mountWelcomeIntro() {
  const key = 'vizhuIntroSeen';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (sessionStorage.getItem(key) === '1') return;
  sessionStorage.setItem(key, '1');
  const overlay = document.createElement('section');
  overlay.className = `welcomeIntro${reduceMotion ? ' reduced' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Добро пожаловать в мир ВИЖУ');
  overlay.innerHTML = `
    <div class="welcomeGlow" aria-hidden="true"></div>
    <div class="welcomeCard">
      <div class="welcomeLogo" aria-hidden="true">ВИЖУ</div>
      <p>Добро пожаловать в мир ВИЖУ</p>
      <div class="welcomeLoader" aria-hidden="true"><span></span></div>
      <button class="btn ghost small welcomeSkip" type="button">Пропустить</button>
    </div>`;
  document.body.appendChild(overlay);
  const app = document.getElementById('app');
  app?.classList.add('appEntering');
  const close = () => {
    overlay.classList.add('isLeaving');
    window.setTimeout(() => {
      overlay.remove();
      app?.classList.remove('appEntering');
      app?.setAttribute('tabindex', '-1');
      app?.focus?.({ preventScroll: true });
    }, reduceMotion ? 50 : 420);
  };
  overlay.querySelector('.welcomeSkip')?.addEventListener('click', close);
  window.setTimeout(close, reduceMotion ? 200 : 2100);
}
