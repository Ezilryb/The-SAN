// =============================================================================
// FILE: assets/js/components/header.js
// DESC: Header — scroll sticky, burger mobile, lien actif selon hash/page
// =============================================================================

'use strict';

const Header = (() => {

  // --- Sélecteurs ---
  const siteHeader   = document.querySelector('.site-header');
  const burger       = document.querySelector('.burger');
  const mobileMenu   = document.querySelector('.mobile-menu');
  const navLinks     = document.querySelectorAll('.nav-link, .mobile-nav-link');

  // --- Scroll : classe scrolled sur le header ---
  function handleScroll() {
    if (!siteHeader) return;
    siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  }

  // --- Burger : toggle menu mobile ---
  function toggleMobileMenu() {
    if (!burger || !mobileMenu) return;
    const isOpen = mobileMenu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    // Bloquer le scroll du body quand le menu est ouvert
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  // --- Fermer le menu mobile si clic en dehors ---
  function handleOverlayClick(e) {
    if (!mobileMenu || !burger) return;
    if (!mobileMenu.contains(e.target) && !burger.contains(e.target)) {
      closeMobileMenu();
    }
  }

  function closeMobileMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // --- Fermer au clic sur un lien mobile ---
  function handleMobileLinkClick(e) {
    if (e.currentTarget.classList.contains('mobile-nav-link')) {
      closeMobileMenu();
    }
  }

  // --- Marquer le lien actif selon la page courante ---
  function setActiveLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
      const linkPath = link.getAttribute('href')?.split('/').pop() || '';
      const isActive = linkPath === currentPath ||
        (currentPath === '' && linkPath === 'index.html');
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  // --- Fermer avec Escape ---
  function handleKeydown(e) {
    if (e.key === 'Escape') closeMobileMenu();
  }

  // --- Init ---
  function init() {
    // Scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Vérifier état initial

    // Burger
    if (burger) {
      burger.addEventListener('click', toggleMobileMenu);
    }

    // Liens mobiles
    navLinks.forEach(link => {
      link.addEventListener('click', handleMobileLinkClick);
    });

    // Overlay click
    document.addEventListener('click', handleOverlayClick);

    // Escape
    document.addEventListener('keydown', handleKeydown);

    // Lien actif
    setActiveLink();
  }

  return { init };

})();

export default Header;
