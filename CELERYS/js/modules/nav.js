/* ============================================
   nav.js — Module Navigation
   ============================================ */

export function initNav() {
  const nav      = document.querySelector('.nav');
  const menuBtn  = document.querySelector('.nav__menu-btn');
  const drawer   = document.querySelector('.nav-drawer');
  const backdrop = document.querySelector('.nav-drawer__backdrop');
  const closeBtn = document.querySelector('.nav-drawer__close');

  if (!nav) return;

  // ── Scroll : ajout de classe "scrolled" ──
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // état initial

  // ── Menu mobile ──
  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
    menuBtn?.setAttribute('aria-expanded', 'true');
  };

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    document.body.style.overflow = '';
    menuBtn?.setAttribute('aria-expanded', 'false');
  };

  menuBtn?.addEventListener('click', openDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  closeBtn?.addEventListener('click', closeDrawer);

  // Fermer avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Liens actifs
  const links = document.querySelectorAll('.nav__link');
  const currentPath = window.location.pathname;

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href)) {
      link.setAttribute('aria-current', 'page');
    }
  });
}
