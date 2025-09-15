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
  const sections = ['team', 'services', 'urgences', 'guides', 'galerie', 'avis', 'contact', 'rdv']
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
  // Harmonize nav items: remove "Infos" and "RDV", fix labels
  (function harmonizeNav(){
    const navEl = document.getElementById('site-nav');
    if (!navEl) return;
    const links = Array.from(navEl.querySelectorAll('a'));
    // Remove the link labeled exactly "Infos"
    const infos = links.find(a => a.textContent?.trim().toLowerCase() === 'infos');
    if (infos) infos.remove();
    // Fix label for team
    const team = navEl.querySelector('a[href="#team"]');
    if (team) team.textContent = 'Équipe';
    // Remove RDV link if present
    const rdv = navEl.querySelector('a[href="#rdv"]');
    if (rdv) rdv.remove();
  })();

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
    if (slider && afterImg) {
      const update = () => {
        const v = Number(slider.value);
        afterImg.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
      };
      slider.addEventListener('input', update);
      update();
    }
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

  // Replace contact map placeholder with Google Maps embed
  const mapPlaceholder = document.querySelector('.contact-info .img-placeholder[aria-label*="Carte"]');
  if (mapPlaceholder) {
    const wrap = document.createElement('div');
    wrap.className = 'map-embed';
    wrap.innerHTML = '<iframe title="Google Maps — Darien, CT" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=11%20Avenue%20du%20Sourire%2C%20Darien%2C%20CT%2006820&output=embed" allowfullscreen></iframe>';
    mapPlaceholder.replaceWith(wrap);
  }

  // Merge info into contact section and add live status
  const contactInfo = document.querySelector('.contact-info');
  if (contactInfo) {
    // Ensure heading reflects merged section
    const h2 = contactInfo.querySelector('h2');
    if (h2) h2.textContent = 'Notre cabinet & contact';

    // If no address present, prepend it
    const hasAddress = !!contactInfo.querySelector('p')?.textContent?.includes('Avenue du Sourire');
    if (!hasAddress) {
      const addressP = document.createElement('p');
      addressP.textContent = 'Adresse : 11 Avenue du Sourire, Darien, CT 06820';
      h2?.insertAdjacentElement('afterend', addressP);
    }

    // Insert hours card if not present
    if (!contactInfo.querySelector('.hours-card')) {
      const hours = document.createElement('div');
      hours.className = 'hours-card';
      hours.innerHTML = `
        <p id="status-text" class="status-text">Statut en cours…</p>
        <ul class="hours-list">
          <li data-day="1"><span>Lun</span><span>08:30–17:00</span></li>
          <li data-day="2"><span>Mar</span><span>08:30–17:00</span></li>
          <li data-day="3"><span>Mer</span><span>08:30–17:00</span></li>
          <li data-day="4"><span>Jeu</span><span>08:30–17:00</span></li>
          <li data-day="5"><span>Ven</span><span>08:30–17:00</span></li>
          <li data-day="6"><span>Sam</span><span>Fermé</span></li>
          <li data-day="0"><span>Dim</span><span>Fermé</span></li>
        </ul>`;
      // Place before map if present, else append
      const map = contactInfo.querySelector('.map-embed');
      if (map) map.insertAdjacentElement('beforebegin', hours);
      else contactInfo.appendChild(hours);
    }
  }

  // Live open/close status (Europe/Paris)
  (function setupOpenStatus(){
    const statusEl = document.getElementById('status-text');
    const hoursList = document.querySelectorAll('.hours-list li');
    if (!statusEl || hoursList.length === 0) return;

    const tz = 'Europe/Paris';
    const schedule = {
      0: null, // Sun
      1: { open: '08:30', close: '17:00' },
      2: { open: '08:30', close: '17:00' },
      3: { open: '08:30', close: '17:00' },
      4: { open: '08:30', close: '17:00' },
      5: { open: '08:30', close: '17:00' },
      6: null  // Sat
    };

    function getTZParts() {
      // Robust approach: build a Date in the target timezone via toLocaleString
      const nowTZ = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      return { hour: nowTZ.getHours(), minute: nowTZ.getMinutes(), day: nowTZ.getDay() };
    }
    const toMin = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number); return h*60 + m;
    };
    function nextOpenDay(fromDay){
      for (let i=1;i<=7;i++) {
        const d = (fromDay + i) % 7;
        if (schedule[d]) return { day: d, time: schedule[d].open };
      }
      return null;
    }
    // Ensure local time element exists
    let localTimeEl = statusEl.nextElementSibling;
    if (!(localTimeEl instanceof HTMLElement) || !localTimeEl.classList.contains('local-time')) {
      localTimeEl = document.createElement('p');
      localTimeEl.className = 'local-time';
      statusEl.insertAdjacentElement('afterend', localTimeEl);
    }

    function formatHM(h, m) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    function setStatus() {
      const { hour, minute, day } = getTZParts();
      const nowM = hour*60 + minute;
      localTimeEl.textContent = `Heure locale (Paris): ${formatHM(hour, minute)}`;
      hoursList.forEach(li => li.classList.remove('today'));
      const todayLi = document.querySelector(`.hours-list li[data-day="${day}"]`);
      if (todayLi) todayLi.classList.add('today');

      const today = schedule[day];
      statusEl.classList.remove('status-open','status-soon','status-closed');
      if (!today) {
        // Closed today — find next opening
        const nxt = nextOpenDay(day);
        if (nxt) {
          const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
          statusEl.textContent = `Fermé — ouvre ${dayNames[nxt.day]} à ${nxt.time}`;
        } else {
          statusEl.textContent = 'Fermé';
        }
        statusEl.classList.add('status-closed');
        return;
      }
      const openM = toMin(today.open);
      const closeM = toMin(today.close);
      if (nowM < openM) {
        statusEl.textContent = `Fermé — ouvre à ${today.open}`;
        statusEl.classList.add('status-closed');
      } else if (nowM >= closeM) {
        const nxt = nextOpenDay(day);
        if (nxt && nxt.day === (day+1)%7) {
          statusEl.textContent = `Fermé — rouvre demain à ${nxt.time}`;
        } else if (nxt) {
          const dayNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
          statusEl.textContent = `Fermé — ouvre ${dayNames[nxt.day]} à ${nxt.time}`;
        } else {
          statusEl.textContent = 'Fermé';
        }
        statusEl.classList.add('status-closed');
      } else {
        const minsLeft = closeM - nowM;
        if (minsLeft <= 30) {
          statusEl.textContent = `Ferme bientôt — à ${today.close}`;
          statusEl.classList.add('status-soon');
        } else {
          statusEl.textContent = `Ouvert — ferme à ${today.close}`;
          statusEl.classList.add('status-open');
        }
      }
    }
    setStatus();
    // Update every minute
    setInterval(setStatus, 60*1000);
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
