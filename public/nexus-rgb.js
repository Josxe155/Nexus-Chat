(() => {
  const key = 'nexus-rgb';
  const triggerSelector = '[data-nexus-rgb-trigger]';
  const root = document.documentElement;
  let previousTrigger = null;
  let previousTap = 0;
  let taps = 0;

  const apply = (enabled) => {
    if (enabled) root.dataset.nexusRgb = 'on';
    else delete root.dataset.nexusRgb;
  };

  try { apply(localStorage.getItem(key) === 'on'); } catch {}
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) apply(event.newValue === 'on');
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element && event.target.closest(triggerSelector);
    const now = performance.now();
    if (!trigger || trigger !== previousTrigger || now - previousTap > 1100) taps = 0;
    previousTrigger = trigger;
    previousTap = now;
    if (!trigger || ++taps !== 5) return;

    taps = 0;
    const enabled = root.dataset.nexusRgb !== 'on';
    apply(enabled);
    try {
      if (enabled) localStorage.setItem(key, 'on');
      else localStorage.removeItem(key);
    } catch {}
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ') &&
        event.target instanceof Element && event.target.closest(triggerSelector)) event.preventDefault();
  });

  document.addEventListener('scroll', ({target}) => {
    if (root.dataset.nexusRgb !== 'on' || !(target instanceof HTMLElement) ||
        getComputedStyle(target).getPropertyValue('--nexus-rgb-surface') !== '1') return;
    target.style.setProperty('--nexus-rgb-scroll-x', `${target.scrollLeft}px`);
    target.style.setProperty('--nexus-rgb-scroll-y', `${target.scrollTop}px`);
  }, {capture: true, passive: true});
})();
