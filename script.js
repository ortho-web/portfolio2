document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    doctolibUrl: 'https://www.doctolib.fr/orthodontiste/caen/michel-lancelot-caen?pid=practice-698478&phs=true&page=1',
    googleApiKey: '', // Renseignez pour charger les avis Google en direct
    googlePlaceId: '' // Place ID Google Maps du cabinet
  };
  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && header && nav) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close on nav click (mobile)
    nav.addEventListener('click', (e) => {
      if (e.target instanceof HTMLAnchorElement) {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Smooth scrolling for internal links (CSS handles baseline)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = (e.currentTarget instanceof HTMLAnchorElement) ? e.currentTarget.getAttribute('href') : null;
      if (!href) return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${id}`);
      }
    });
  });

  // Active link highlighting on scroll
  const sections = ['team', 'services', 'urgences', 'guides', 'galerie', 'avis', 'rdv', 'faq', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  const navLinks = new Map();
  document.querySelectorAll('#site-nav a[href^="#"]').forEach(a => {
    navLinks.set(a.getAttribute('href')?.slice(1), a);
  });
  const setActive = (id) => {
    navLinks.forEach(link => link.classList.remove('is-active'));
    const link = navLinks.get(id);
    if (link) link.classList.add('is-active');
  };
  // Account for header height
  const headerH = header instanceof HTMLElement ? header.offsetHeight : 72;
  document.documentElement.style.setProperty('--header-offset', `${headerH + 8}px`);
  // IntersectionObserver tuned with header offset
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        if (id) setActive(id);
      }
    });
  }, { rootMargin: `-${headerH + 10}px 0px -60% 0px`, threshold: 0.1 });
  sections.forEach(s => io.observe(s));
  // Scroll fallback for precise active detection
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const y = window.scrollY + headerH + 12;
        let currentId = sections[0]?.id;
        sections.forEach(sec => {
          if (sec.offsetTop <= y) currentId = sec.id;
        });
        if (currentId) setActive(currentId);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Contact form handling


  // Contact form handling
  const form = document.getElementById('contact-form');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function showError(input, message) {
    const field = input.closest('.field');
    const error = field ? field.querySelector('.error') : null;
    if (error) error.textContent = message || '';
  }
  function clearErrors() {
    form?.querySelectorAll('.error').forEach(e => e.textContent = '');
  }
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();
    const name = /** @type {HTMLInputElement} */(document.getElementById('name'));
    const email = /** @type {HTMLInputElement} */(document.getElementById('email'));
    const phone = /** @type {HTMLInputElement} */(document.getElementById('phone'));
    const message = /** @type {HTMLTextAreaElement} */(document.getElementById('message'));
    const status = document.querySelector('.form-status');

    let valid = true;
    if (!name.value.trim()) { showError(name, 'Veuillez renseigner votre nom.'); valid = false; }
    if (!email.value.trim() || !emailRe.test(email.value)) { showError(email, 'Email invalide.'); valid = false; }
    if (!message.value.trim()) { showError(message, 'Merci d’indiquer votre message.'); valid = false; }
    if (!valid) { status && (status.textContent = 'Veuillez corriger les erreurs.'); return; }

    // Build a mailto with the form content
    const subject = encodeURIComponent(`Demande de rendez-vous - ${name.value.trim()}`);
    const bodyLines = [
      `Nom: ${name.value.trim()}`,
      `Email: ${email.value.trim()}`,
      `Téléphone: ${phone.value.trim()}`,
      '',
      message.value.trim()
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailto = `mailto:contact@cabinet-ortho.fr?subject=${subject}&body=${body}`;

    status && (status.textContent = 'Ouverture de votre messagerie…');
    window.location.href = mailto;
  });

  // Before/After sliders
  document.querySelectorAll('.ba-view').forEach(view => {
    const slider = view.querySelector('.ba-slider');
    const afterImg = view.querySelector('.ba-after');
    const beforeImg = view.querySelector('.ba-before');
    if (!slider || !afterImg || !beforeImg) return;

    const applySplit = (value) => {
      const clamped = Math.min(Math.max(Number(value), 0), 100);
      afterImg.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      view.style.setProperty('--split', String(clamped));
      slider.setAttribute('aria-valuenow', String(clamped));
      slider.setAttribute('aria-valuetext', `${clamped}%`);
    };

    const update = () => applySplit(slider.value);
    slider.addEventListener('input', update);
    slider.addEventListener('change', update);
    update();
  });

  // Doctolib integration: buttons scroll to RDV section and focus embed
  document.querySelectorAll('[data-doctolib]').forEach(el => {
    if (el instanceof HTMLAnchorElement) {
      el.href = '#rdv';
      el.addEventListener('click', (e) => {
        const targetSec = document.getElementById('rdv');
        if (!targetSec) return;
        e.preventDefault();
        targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Nudge focus to embed for accessibility
        const embed = document.getElementById('doctolib-embed');
        if (embed) embed.setAttribute('tabindex', '-1'), embed.focus({ preventScroll: true });
      });
    }
  });
  // Doctolib embed inside iframe (best-effort; may be blocked by X-Frame-Options)
  const iframe = document.getElementById('doctolib-iframe');
  if (iframe instanceof HTMLIFrameElement && CONFIG.doctolibUrl) {
    try {
      iframe.src = CONFIG.doctolibUrl;
      // If the site forbids embedding, iframe will fail silently; keep fallback visible
      iframe.addEventListener('load', () => {
        const fb = document.querySelector('#doctolib-embed .embed-fallback');
        if (fb) fb.textContent = '';
      });
    } catch {}
  }

  // Update header offset on resize (for accurate scroll-margin / active links)
  window.addEventListener('resize', () => {
    const hh = header instanceof HTMLElement ? header.offsetHeight : 72;
    document.documentElement.style.setProperty('--header-offset', `${hh + 8}px`);
  });

  // Google Reviews (optional live load)
  async function loadGoogleReviews() {
    const { googleApiKey, googlePlaceId } = CONFIG;
    if (!googleApiKey || !googlePlaceId) return; // fallback on static
    const container = document.getElementById('reviews');
    if (!container) return;
    try {
      // Places API v1 (requires proper CORS/Referer setup)
      const fields = encodeURIComponent('rating,userRatingCount,reviews');
      const url = `https://places.googleapis.com/v1/places/${googlePlaceId}?fields=${fields}&key=${googleApiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.reviews || !Array.isArray(data.reviews)) return;
      container.innerHTML = '';
      data.reviews.slice(0, 6).forEach(r => {
        const stars = '★★★★★'.slice(0, Math.round(r.rating || 5));
        const card = document.createElement('article');
        card.className = 'review';
        card.innerHTML = `
          <div class="stars" aria-label="${r.rating || 5} sur 5">${stars}</div>
          <p>${(r.text?.text || '').slice(0, 280)}</p>
          <span class="author">— ${r.authorAttribution?.displayName || 'Patient Google'}</span>
        `;
        container.appendChild(card);
      });
    } catch (e) {
      // Silencieux: conserver le fallback statique
      console.warn('Impossible de charger les avis Google:', e);
    }
  }
  loadGoogleReviews();

  // Live open/close status (Europe/Paris)
  (function setupOpenStatus(){
    const statusEl = document.getElementById('status-text');
    const hoursList = document.querySelectorAll('.hours-list li');
    if (!statusEl || hoursList.length === 0) return;

    const tz = 'Europe/Paris';
    const schedule = {
      0: null,
      1: { open: '08:30', close: '17:00' },
      2: { open: '08:30', close: '17:00' },
      3: { open: '08:30', close: '17:00' },
      4: { open: '08:30', close: '17:00' },
      5: { open: '08:30', close: '17:00' },
      6: null
    };
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    const toMinutes = (value) => {
      const [h, m] = value.split(':').map(Number);
      return h * 60 + m;
    };
    const findNextOpen = (day) => {
      for (let i = 1; i <= 7; i++) {
        const idx = (day + i) % 7;
        if (schedule[idx]) return { day: idx, time: schedule[idx].open };
      }
      return null;
    };
    const getParisNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    const formatHM = (value) => String(value).padStart(2, '0');

    let localTimeEl = statusEl.nextElementSibling;
    if (!(localTimeEl instanceof HTMLElement) || !localTimeEl.classList.contains('local-time')) {
      localTimeEl = document.createElement('p');
      localTimeEl.className = 'local-time';
      statusEl.insertAdjacentElement('afterend', localTimeEl);
    }

    const updateStatus = () => {
      const now = getParisNow();
      const day = now.getDay();
      const minutes = now.getHours() * 60 + now.getMinutes();

      localTimeEl.textContent = 'Heure locale (Paris) : ' + formatHM(now.getHours()) + ':' + formatHM(now.getMinutes());

      hoursList.forEach(li => li.classList.remove('today'));
      const todayLi = document.querySelector('.hours-list li[data-day="' + day + '"]');
      if (todayLi) todayLi.classList.add('today');

      const today = schedule[day];
      statusEl.classList.remove('status-open', 'status-soon', 'status-closed');

      if (!today) {
        const next = findNextOpen(day);
        statusEl.textContent = next ? 'Fermé - ouvre ' + dayNames[next.day] + ' à ' + next.time : 'Fermé';
        statusEl.classList.add('status-closed');
        return;
      }

      const openMinutes = toMinutes(today.open);
      const closeMinutes = toMinutes(today.close);

      if (minutes < openMinutes) {
        statusEl.textContent = 'Fermé - ouvre à ' + today.open;
        statusEl.classList.add('status-closed');
      } else if (minutes >= closeMinutes) {
        const next = findNextOpen(day);
        if (next && next.day === (day + 1) % 7) {
          statusEl.textContent = 'Fermé - rouvre demain à ' + next.time;
        } else if (next) {
          statusEl.textContent = 'Fermé - ouvre ' + dayNames[next.day] + ' à ' + next.time;
        } else {
          statusEl.textContent = 'Fermé';
        }
        statusEl.classList.add('status-closed');
      } else {
        const remaining = closeMinutes - minutes;
        if (remaining <= 30) {
          statusEl.textContent = 'Ferme bientôt - à ' + today.close;
          statusEl.classList.add('status-soon');
        } else {
          statusEl.textContent = 'Ouvert - ferme à ' + today.close;
          statusEl.classList.add('status-open');
        }
      }
    };

    updateStatus();
    setInterval(updateStatus, 60 * 1000);
  })();

  // Footer modal links
  function openModal(id) {
    const dlg = document.getElementById(id);
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }
  document.querySelectorAll('[data-open-modal]')
    .forEach(link => link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = /** @type {HTMLElement} */(e.currentTarget).getAttribute('data-open-modal');
      if (id) openModal(id);
    }));
  // Close modal on backdrop click
  document.querySelectorAll('dialog.modal').forEach(dlg => {
    dlg.addEventListener('click', (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog = (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
      if (!inDialog) dlg.close();
    });
  });

  // Cookie consent banner + preferences
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const rejectBtn = document.getElementById('cookie-reject');
  const settingsBtn = document.getElementById('cookie-settings');
  const cookieSave = document.getElementById('cookie-save');
  const cookieAnalytics = document.getElementById('cookie-analytics');

  function readConsent() {
    try { return JSON.parse(localStorage.getItem('cookieConsent') || 'null'); } catch { return null; }
  }
  function writeConsent(c) {
    localStorage.setItem('cookieConsent', JSON.stringify({ ...c, date: new Date().toISOString() }));
  }
  const consent = readConsent();
  if (!consent) {
    banner?.removeAttribute('hidden');
  } else if (cookieAnalytics instanceof HTMLInputElement) {
    cookieAnalytics.checked = !!consent.analytics;
  }
  acceptBtn?.addEventListener('click', () => {
    writeConsent({ necessary: true, analytics: true });
    banner?.setAttribute('hidden', '');
  });
  rejectBtn?.addEventListener('click', () => {
    writeConsent({ necessary: true, analytics: false });
    banner?.setAttribute('hidden', '');
  });
  settingsBtn?.addEventListener('click', () => {
    banner?.setAttribute('hidden', '');
    openModal('modal-cookies');
  });
  cookieSave?.addEventListener('click', () => {
    const enabled = cookieAnalytics instanceof HTMLInputElement ? !!cookieAnalytics.checked : false;
    writeConsent({ necessary: true, analytics: enabled });
    const dlg = document.getElementById('modal-cookies');
    if (dlg && 'close' in dlg) dlg.close();
  });

  // Back-to-top button
  (function setupBackToTop(){
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const showAt = 300;
    let raf = false;
    function toggle() {
      const y = window.scrollY || window.pageYOffset;
      if (y > showAt) btn.classList.add('show'); else btn.classList.remove('show');
      raf = false;
    }
    window.addEventListener('scroll', () => {
      if (!raf) { requestAnimationFrame(toggle); raf = true; }
    }, { passive: true });
    btn.addEventListener('click', () => {
      const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersNoMotion ? 'auto' : 'smooth' });
    });
  })();
});
