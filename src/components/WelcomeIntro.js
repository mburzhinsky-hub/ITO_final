export function mountWelcomeIntro() {
  if (typeof document === 'undefined') return;

  const reduceMotion = globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('section');
  overlay.className = `welcomeIntro${reduceMotion ? ' reduced' : ''}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Добро пожаловать в мир ВИЖУ');
  overlay.innerHTML = `
    <div class="welcomeVideo" aria-hidden="true">
      <div class="welcomeBeam welcomeBeamA"></div>
      <div class="welcomeBeam welcomeBeamB"></div>
      <div class="welcomeOrbit welcomeOrbitA"></div>
      <div class="welcomeOrbit welcomeOrbitB"></div>
      <div class="welcomeParticles"><span></span><span></span><span></span><span></span></div>
    </div>
    <div class="welcomeGlow" aria-hidden="true"></div>
    <div class="welcomeCard">
      <div class="welcomeLogo" aria-hidden="true">ВИЖУ</div>
      <p>Добро пожаловать в мир ВИЖУ</p>
      <div class="welcomeLoader" aria-hidden="true"><span></span></div>
      <button class="btn ghost small welcomeSkip" type="button">Пропустить</button>
    </div>`;

  document.body.appendChild(overlay);
  const app = document.getElementById('app');
  app?.classList?.add('appEntering');

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.classList.add('isLeaving');
    globalThis.window?.setTimeout?.(() => {
      overlay.remove();
      app?.classList?.remove('appEntering');
      app?.setAttribute?.('tabindex', '-1');
      app?.focus?.({ preventScroll: true });
    }, reduceMotion ? 50 : 420);
  };

  overlay.querySelector('.welcomeSkip')?.addEventListener('click', close);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
  globalThis.window?.setTimeout?.(close, reduceMotion ? 250 : 2500);
}
