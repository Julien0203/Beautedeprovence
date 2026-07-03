/* ================================================================
   BEAUTÉ DE PROVENCE — app.js
   Nav · Scroll reveal · Counters · Back to top · Simulators
================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav scroll state ──────────────────────────────────── */
  const nav = document.querySelector('.nav');
  const backTop = document.querySelector('.back-top');

  const isDarkNav = nav?.classList.contains('nav--dark');
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle('solid', !isDarkNav || y > 30);
    backTop?.classList.toggle('show', y > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Burger ────────────────────────────────────────────── */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.nav__mobile');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger?.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }));

  /* ── Active nav link ───────────────────────────────────── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === page ||
      (page === '' && l.getAttribute('href') === 'index.html'));
  });

  /* ── Scroll reveal ─────────────────────────────────────── */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ── Counters ──────────────────────────────────────────── */
  document.querySelectorAll('[data-count]').forEach(el => {
    const io2 = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / dur, 1);
        const v = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(v * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io2.disconnect();
    }, { threshold: .6 });
    io2.observe(el);
  });

  /* ── Hero video : autoplay + fallback image si bloqué ──── */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    const swapToImage = () => {
      const src = heroVideo.getAttribute('data-fallback');
      if (!src || heroVideo.dataset.swapped) return;
      heroVideo.dataset.swapped = '1';
      const img = document.createElement('img');
      img.src = src;
      img.alt = heroVideo.getAttribute('aria-label') || '';
      img.className = 'hero__video';
      heroVideo.replaceWith(img);
    };
    heroVideo.addEventListener('error', swapToImage);
    const p = heroVideo.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => swapToImage());
    }
  }

  /* ── Back to top ───────────────────────────────────────── */
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Smooth anchor scroll ──────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      window.scrollTo({ top: el.offsetTop - offset - 16, behavior: 'smooth' });
    });
  });

  /* ── Newsletter (pied de page) ─────────────────────────── */
  const NL_API = 'https://script.google.com/macros/s/AKfycbzfZJN3mzVBElYgBPvO76YjFnlDTMeRxDxcny7QwigXoSQINDJn3jTxC8crj6BGuR-q/exec';
  document.querySelectorAll('.nl-form').forEach(form => {
    const input = form.querySelector('.nl-form__input');
    const check = form.querySelector('.nl-form__check');
    const btn = form.querySelector('.nl-form__btn');
    const msg = form.querySelector('.nl-form__msg');
    const setMsg = (t, ok) => { msg.textContent = t; msg.className = 'nl-form__msg ' + (ok ? 'is-ok' : 'is-err'); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('Merci d\'indiquer une adresse e-mail valide.', false); return; }
      if (check && !check.checked) { setMsg('Merci d\'accepter de recevoir la newsletter.', false); return; }
      btn.disabled = true;
      const prev = btn.textContent;
      btn.textContent = 'Envoi…';
      try {
        await fetch(NL_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ type: 'subscribe', email, source: location.pathname.split('/').pop() || 'index.html' })
        });
        setMsg('Merci ! Votre inscription est bien enregistrée.', true);
        form.reset();
      } catch (err) {
        setMsg('Une erreur est survenue. Merci de réessayer plus tard.', false);
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });

});

/* ================================================================
   SIMULATOR ENGINE
================================================================ */
/* Jeu d'icônes fines (traits, style ligne — remplace les emojis) */
const _svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  sparkle:  _svg('<path d="M12 2l1.9 6.6L20 10l-6.1 1.4L12 18l-1.9-6.6L4 10l6.1-1.4Z"/>'),
  leaf:     _svg('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>'),
  droplet:  _svg('<path d="M12 2.7 6.5 9.2a7 7 0 1 0 11 0Z"/>'),
  clock:    _svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  moon:     _svg('<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>'),
  flower:   _svg('<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 0 1 0-6 3 3 0 0 1 0 6ZM12 15a3 3 0 0 0 0 6 3 3 0 0 0 0-6ZM15 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0ZM9 12a3 3 0 0 0-6 0 3 3 0 0 0 6 0Z"/>'),
  wave:     _svg('<path d="M2 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/><path d="M2 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2"/>'),
  shield:   _svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'),
  alert:    _svg('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>'),
  layers:   _svg('<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/>'),
  activity: _svg('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
  heart:    _svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>'),
  smile:    _svg('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'),
  euro:     _svg('<path d="M18 7a7 7 0 1 0 0 10M4 10h8M4 14h7"/>')
};
const SIM_DATA = {
  diagnostic: {
    questions: [
      {
        id: 'type',
        q: 'Comment se sent votre peau en milieu de journée ?',
        opts: [
          { icon: ICONS.sparkle, label: 'Brillante, zone T luisante', val: 'oily' },
          { icon: ICONS.leaf, label: 'Équilibrée, confortable', val: 'normal' },
          { icon: ICONS.leaf, label: 'Tiraillante, inconfortable', val: 'dry' },
          { icon: ICONS.layers, label: 'Mixte — grasse et sèche', val: 'mixed' },
        ]
      },
      {
        id: 'concern',
        q: 'Votre principale préoccupation cutanée ?',
        opts: [
          { icon: ICONS.droplet, label: 'Hydratation & confort', val: 'hydration' },
          { icon: ICONS.sparkle, label: 'Éclat & luminosité', val: 'radiance' },
          { icon: ICONS.clock, label: 'Anti-âge & fermeté', val: 'antiage' },
          { icon: ICONS.leaf, label: 'Pureté & détox', val: 'detox' },
        ]
      },
      {
        id: 'sensitivity',
        q: 'Votre peau est-elle réactive ?',
        opts: [
          { icon: ICONS.alert, label: 'Oui, souvent', val: 'sensitive' },
          { icon: ICONS.activity, label: 'Parfois', val: 'moderate' },
          { icon: ICONS.shield, label: 'Rarement', val: 'resilient' },
        ]
      }
    ],
    results: {
      oily_hydration:  { icon: ICONS.droplet, type: 'Peau grasse déshydratée',   desc: 'Une peau qui brille mais manque d\'eau : le soin signature nourrit en profondeur sans effet gras, avec les actifs OLIV\'.', soins: ['Le soin signature — 130€'], serviceId: 'visage-signature', url: 'visage.html' },
      oily_radiance:   { icon: ICONS.sparkle, type: 'Peau grasse à illuminer',    desc: 'Le Kobido provençal, massage facial japonais, affine le grain de peau et ravive l\'éclat naturel de votre teint.', soins: ['Le Kobido provençal — 95€'], serviceId: 'visage-kobido', url: 'visage.html' },
      oily_antiage:    { icon: ICONS.clock, type: 'Peau grasse mature',         desc: 'Le rituel Kobido raffermit et lisse tout en régulant, pour une peau tonique et équilibrée.', soins: ['Le rituel Kobido provençal — 130€'], serviceId: 'visage-rituel-kobido', url: 'visage.html' },
      oily_detox:      { icon: ICONS.leaf, type: 'Peau grasse à purifier',     desc: 'Le renouveau provençal purifie et rééquilibre en profondeur pour un teint net et mat.', soins: ['Le renouveau provençal — 90€'], serviceId: 'visage-renouveau', url: 'visage.html' },
      dry_hydration:   { icon: ICONS.droplet, type: 'Peau sèche à nourrir',       desc: 'Nutrition intense : le soin signature et les huiles OLIV\' réconfortent durablement les peaux sèches.', soins: ['Le soin signature — 130€'], serviceId: 'visage-signature', url: 'visage.html' },
      dry_radiance:    { icon: ICONS.flower, type: 'Peau sèche à illuminer',     desc: 'Le Kobido provençal relance la microcirculation pour retrouver un teint lumineux et confortable.', soins: ['Le Kobido provençal — 95€'], serviceId: 'visage-kobido', url: 'visage.html' },
      dry_antiage:     { icon: ICONS.clock, type: 'Peau sèche à revitaliser',   desc: 'Le rituel Kobido raffermit et nourrit en profondeur pour une peau repulpée et détendue.', soins: ['Le rituel Kobido provençal — 130€'], serviceId: 'visage-rituel-kobido', url: 'visage.html' },
      dry_detox:       { icon: ICONS.leaf, type: 'Peau sèche sensibilisée',    desc: 'Le renouveau provençal rééquilibre en douceur la barrière cutanée fragilisée.', soins: ['Le renouveau provençal — 90€'], serviceId: 'visage-renouveau', url: 'visage.html' },
      mixed_hydration: { icon: ICONS.droplet, type: 'Peau mixte à équilibrer',    desc: 'Le soin signature hydrate zone par zone pour un teint homogène et confortable.', soins: ['Le soin signature — 130€'], serviceId: 'visage-signature', url: 'visage.html' },
      mixed_radiance:  { icon: ICONS.sparkle, type: 'Peau mixte à illuminer',     desc: 'Le Kobido provençal unifie et illumine, révélant la luminosité naturelle des peaux mixtes.', soins: ['Le Kobido provençal — 95€'], serviceId: 'visage-kobido', url: 'visage.html' },
      mixed_antiage:   { icon: ICONS.clock, type: 'Peau mixte mature',          desc: 'Le rituel Kobido conjugue fermeté et équilibre pour une peau lissée et rééquilibrée.', soins: ['Le rituel Kobido provençal — 130€'], serviceId: 'visage-rituel-kobido', url: 'visage.html' },
      mixed_detox:     { icon: ICONS.leaf, type: 'Peau mixte à purifier',      desc: 'Le renouveau provençal cible les impuretés de la zone T tout en respectant les joues.', soins: ['Le renouveau provençal — 90€'], serviceId: 'visage-renouveau', url: 'visage.html' },
      normal_hydration:{ icon: ICONS.droplet, type: 'Peau équilibrée à hydrater', desc: 'Le soin signature entretient le confort et la souplesse de votre peau avec les soins OLIV\'.', soins: ['Le soin signature — 130€'], serviceId: 'visage-signature', url: 'visage.html' },
      normal_radiance: { icon: ICONS.flower, type: 'Peau équilibrée à sublimer', desc: 'Offrez à votre peau saine le Kobido provençal pour un éclat immédiat et une détente profonde.', soins: ['Le Kobido provençal — 95€'], serviceId: 'visage-kobido', url: 'visage.html' },
      normal_antiage:  { icon: ICONS.clock, type: 'Peau à préserver',           desc: 'Le rituel Kobido, en prévention, entretient fermeté et jeunesse naturellement.', soins: ['Le rituel Kobido provençal — 130€'], serviceId: 'visage-rituel-kobido', url: 'visage.html' },
      normal_detox:    { icon: ICONS.leaf, type: 'Peau à purifier',            desc: 'Le renouveau provençal élimine les impuretés et redonne fraîcheur au teint.', soins: ['Le renouveau provençal — 90€'], serviceId: 'visage-renouveau', url: 'visage.html' },
      default:         { icon: ICONS.flower, type: 'Soin sur mesure',            desc: 'Votre profil mérite une consultation personnalisée. Andréa établira le protocole idéal lors de votre diagnostic beauté.', soins: ['Diagnostic beauté — 35€'], serviceId: 'diagnostic-peau', url: 'visage.html' }
    }
  },
  conseiller: {
    questions: [
      {
        id: 'goal',
        q: 'Qu\'attendez-vous de votre séance aujourd\'hui ?',
        opts: [
          { icon: ICONS.smile, label: 'Détente & relâchement des tensions', val: 'relax' },
          { icon: ICONS.sparkle, label: 'Prendre soin de mon visage', val: 'skin' },
          { icon: ICONS.leaf, label: 'Un rituel corps immersif', val: 'ritual' },
          { icon: ICONS.flower, label: 'Épilation & finitions', val: 'beauty' },
        ]
      },
      {
        id: 'duration',
        q: 'Quelle durée souhaitez-vous consacrer ?',
        opts: [
          { icon: ICONS.clock, label: 'Express — 30 à 45 min', val: 'short' },
          { icon: ICONS.clock, label: 'Confortable — 1h à 1h30', val: 'medium' },
          { icon: ICONS.moon, label: 'Immersif — 2h et plus', val: 'long' },
        ]
      }
    ],
    results: {
      relax_short:  { icon: ICONS.flower, soin: 'Massage Sieste',              desc: 'Une parenthèse de 30 minutes pour relâcher dos et nuque et repartir apaisé(e).', duree: '30 min', tarif: '50€', url: 'massages.html' },
      relax_medium: { icon: ICONS.wave, soin: 'Massage Pause',               desc: 'Une heure de détente enveloppante, effleurages longs aux huiles OLIV\' pour dénouer les tensions.', duree: '1h', tarif: '100€', url: 'massages.html' },
      relax_long:   { icon: ICONS.moon, soin: 'Massage de l\'Oléraie',       desc: 'Un modelage complet de 1h30, l\'immersion sensorielle absolue signée Beauté de Provence.', duree: '1h30', tarif: '150€', url: 'massages.html' },
      skin_short:   { icon: ICONS.sparkle, soin: 'Kobido',                       desc: 'Le massage facial japonais, liftant et éclatant. Nos soins visage démarrent en 1h.', duree: '1h', tarif: '95€', url: 'visage.html' },
      skin_medium:  { icon: ICONS.flower, soin: 'Soin signature',              desc: 'Un soin visage complet sur mesure : nettoyage, modelage et actifs OLIV\'.', duree: '1h30', tarif: '130€', url: 'visage.html' },
      skin_long:    { icon: ICONS.flower, soin: 'Rituel Kobido',               desc: 'Kobido et soin complet réunis pour une peau raffermie, lumineuse et détendue.', duree: '1h30', tarif: '130€', url: 'visage.html' },
      ritual_short: { icon: ICONS.leaf, soin: 'Instant corps',               desc: 'Gommage sablé ou cocon lavande : une bulle express de 30 à 45 minutes.', duree: '30–45 min', tarif: '50–70€', url: 'corps.html' },
      ritual_medium:{ icon: ICONS.leaf, soin: 'Rituel corps de Provence',    desc: 'Un rituel corps aux essences de Provence — des Oliviers au rituel des Alpilles.', duree: '1h–1h30', tarif: '100–145€', url: 'corps.html' },
      ritual_long:  { icon: ICONS.moon, soin: 'Rituel des Bastides',         desc: 'L\'expérience longue : 2h à 2h30 de soin corps complet, jusqu\'au Rituel signature.', duree: '2h–2h30', tarif: '190–220€', url: 'corps.html' },
      beauty_short: { icon: ICONS.flower, soin: 'Épilation express',           desc: 'Sourcils, lèvre ou menton : une finition nette en quelques minutes.', duree: '10–15 min', tarif: 'dès 8€', url: 'epilations.html' },
      beauty_medium:{ icon: ICONS.flower, soin: 'Épilation visage ou jambes',  desc: 'Visage complet ou demi-jambes : une épilation soignée et durable.', duree: '20–30 min', tarif: '20–30€', url: 'epilations.html' },
      beauty_long:  { icon: ICONS.flower, soin: 'Épilation complète',          desc: 'Jambes, maillot et aisselles : le combo complet pour une peau douce.', duree: '45 min–1h', tarif: 'dès 45€', url: 'epilations.html' },
      default:      { icon: ICONS.heart, soin: 'Consultation personnalisée',  desc: 'Andréa compose votre séance idéale selon votre profil. Appelez pour en discuter.', duree: 'Sur mesure', tarif: 'Sur devis', url: 'rendez-vous.html' }
    }
  }
};

class Sim {
  constructor({ type, overlayId, modalId, triggers }) {
    this.type = type;
    this.data = SIM_DATA[type];
    this.overlay = document.getElementById(overlayId);
    this.modal = document.getElementById(modalId);
    this.triggers = document.querySelectorAll(triggers);
    this.step = 0;
    this.answers = {};
    if (this.modal) this._init();
  }

  _init() {
    this.triggers.forEach(t => t.addEventListener('click', () => this.open()));
    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    this.modal.querySelector('.modal__close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.overlay.classList.contains('open')) this.close(); });
    this.render();
  }

  open() { this.step = 0; this.answers = {}; this.render(); this.overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  close() { this.overlay.classList.remove('open'); document.body.style.overflow = ''; }

  render() {
    const body = this.modal.querySelector('.modal__body');
    const total = this.data.questions.length;
    if (this.step >= total) { body.innerHTML = this._result(); this._bindResult(); return; }
    const q = this.data.questions[this.step];
    const pct = (this.step / total) * 100;
    body.innerHTML = `
      <div class="sim-progress"><div class="sim-progress__fill" style="width:${pct}%"></div></div>
      <p style="font-size:.8125rem;color:var(--text-muted);margin-bottom:1.25rem;letter-spacing:.05em">${this.step + 1} / ${total}</p>
      <p class="sim-q">${q.q}</p>
      <div class="sim-options">
        ${q.opts.map(o => `<button class="sim-opt" data-val="${o.val}"><span class="sim-opt__icon">${o.icon}</span><span>${o.label}</span></button>`).join('')}
      </div>
      <div class="sim-nav">
        ${this.step > 0 ? `<button class="btn btn--outline" id="sim-back" style="padding:.625rem 1.25rem">← Retour</button>` : '<span></span>'}
        <span style="font-size:.75rem;color:var(--text-muted)">${this.step + 1} sur ${total}</span>
      </div>`;
    body.querySelectorAll('.sim-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.answers[q.id] = btn.dataset.val;
        btn.classList.add('selected');
        setTimeout(() => { this.step++; this.render(); }, 280);
      });
    });
    body.querySelector('#sim-back')?.addEventListener('click', () => { this.step--; this.render(); });
  }

  _getResult() {
    const a = this.answers;
    if (this.type === 'diagnostic') {
      return this.data.results[`${a.type}_${a.concern}`] || this.data.results.default;
    }
    return this.data.results[`${a.goal}_${a.duration}`] || this.data.results.default;
  }

  _result() {
    const r = this._getResult();
    const isD = this.type === 'diagnostic';
    return `<div class="sim-result">
      <div class="sim-result__icon">${r.icon}</div>
      <p class="sim-result__type d3">${isD ? r.type : r.soin}</p>
      <p class="sim-result__desc body">${r.desc}</p>
      ${isD ? `<div class="sim-result__tags">${r.soins.map(s => `<span class="sim-tag">${s}</span>`).join('')}</div>` :
               `<div class="sim-result__tags"><span class="sim-tag"><span class="sim-tag__ic">${ICONS.clock}</span>${r.duree}</span><span class="sim-tag"><span class="sim-tag__ic">${ICONS.euro}</span>${r.tarif}</span></div>`}
      <div class="sim-result__actions">
        <a href="${r.url}" class="btn btn--outline">Découvrir</a>
        <a href="rendez-vous.html${r.serviceId ? '?service=' + r.serviceId : ''}" class="btn btn--olive">Prendre RDV</a>
        <button class="btn btn--outline" id="sim-restart" style="padding:.625rem 1.25rem">↺ Recommencer</button>
      </div>
    </div>`;
  }

  _bindResult() {
    this.modal.querySelector('#sim-restart')?.addEventListener('click', () => { this.step = 0; this.answers = {}; this.render(); });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sim-diag'))
    new Sim({ type: 'diagnostic', overlayId: 'sim-diag-bg', modalId: 'sim-diag', triggers: '[data-sim="diagnostic"]' });
  if (document.getElementById('sim-cons'))
    new Sim({ type: 'conseiller', overlayId: 'sim-cons-bg', modalId: 'sim-cons', triggers: '[data-sim="conseiller"]' });
});
