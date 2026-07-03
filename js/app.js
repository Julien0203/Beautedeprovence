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

});

/* ================================================================
   SIMULATOR ENGINE
================================================================ */
const SIM_DATA = {
  diagnostic: {
    questions: [
      {
        id: 'type',
        q: 'Comment se sent votre peau en milieu de journée ?',
        opts: [
          { icon: '✨', label: 'Brillante, zone T luisante', val: 'oily' },
          { icon: '🌿', label: 'Équilibrée, confortable', val: 'normal' },
          { icon: '🍂', label: 'Tiraillante, inconfortable', val: 'dry' },
          { icon: '🎭', label: 'Mixte — grasse et sèche', val: 'mixed' },
        ]
      },
      {
        id: 'concern',
        q: 'Votre principale préoccupation cutanée ?',
        opts: [
          { icon: '💧', label: 'Hydratation & confort', val: 'hydration' },
          { icon: '✨', label: 'Éclat & luminosité', val: 'radiance' },
          { icon: '⏳', label: 'Anti-âge & fermeté', val: 'antiage' },
          { icon: '🌿', label: 'Pureté & détox', val: 'detox' },
        ]
      },
      {
        id: 'sensitivity',
        q: 'Votre peau est-elle réactive ?',
        opts: [
          { icon: '🚨', label: 'Oui, souvent', val: 'sensitive' },
          { icon: '⚡', label: 'Parfois', val: 'moderate' },
          { icon: '💪', label: 'Rarement', val: 'resilient' },
        ]
      }
    ],
    results: {
      oily_hydration:  { icon: '💧', type: 'Peau grasse déshydratée',   desc: 'Une peau qui brille mais manque d\'eau : le Soin signature nourrit en profondeur sans effet gras, avec les actifs OLIV\'.', soins: ['Soin signature — 130€', 'Cocon lavande — 50€'], url: 'visage.html' },
      oily_radiance:   { icon: '✨', type: 'Peau grasse à illuminer',    desc: 'Le Kobido, massage facial japonais, affine le grain de peau et ravive l\'éclat naturel de votre teint.', soins: ['Kobido — 95€', '+ Vapeur — 10€'], url: 'visage.html' },
      oily_antiage:    { icon: '⏳', type: 'Peau grasse mature',         desc: 'Le Rituel Kobido raffermit et lisse tout en régulant, pour une peau tonique et équilibrée.', soins: ['Rituel Kobido — 130€'], url: 'visage.html' },
      oily_detox:      { icon: '🌿', type: 'Peau grasse à purifier',     desc: 'Le Soin rénovateur purifie et rééquilibre en profondeur pour un teint net et mat.', soins: ['Soin rénovateur — sur demande', '+ Vapeur — 10€'], url: 'visage.html' },
      dry_hydration:   { icon: '💧', type: 'Peau sèche à nourrir',       desc: 'Nutrition intense : le Soin signature et les huiles OLIV\' réconfortent durablement les peaux sèches.', soins: ['Soin signature — 130€', 'Cocon lavande — 50€'], url: 'visage.html' },
      dry_radiance:    { icon: '🌸', type: 'Peau sèche à illuminer',     desc: 'Le Kobido relance la microcirculation pour retrouver un teint lumineux et confortable.', soins: ['Kobido — 95€'], url: 'visage.html' },
      dry_antiage:     { icon: '⏳', type: 'Peau sèche à revitaliser',   desc: 'Le Rituel Kobido raffermit et nourrit en profondeur pour une peau repulpée et détendue.', soins: ['Rituel Kobido — 130€'], url: 'visage.html' },
      dry_detox:       { icon: '🌿', type: 'Peau sèche sensibilisée',    desc: 'Le Soin rénovateur rééquilibre en douceur la barrière cutanée fragilisée.', soins: ['Soin rénovateur — sur demande'], url: 'visage.html' },
      mixed_hydration: { icon: '💧', type: 'Peau mixte à équilibrer',    desc: 'Le Soin signature hydrate zone par zone pour un teint homogène et confortable.', soins: ['Soin signature — 130€'], url: 'visage.html' },
      mixed_radiance:  { icon: '✨', type: 'Peau mixte à illuminer',     desc: 'Le Kobido unifie et illumine, révélant la luminosité naturelle des peaux mixtes.', soins: ['Kobido — 95€', '+ Vapeur — 10€'], url: 'visage.html' },
      mixed_antiage:   { icon: '⏳', type: 'Peau mixte mature',          desc: 'Le Rituel Kobido conjugue fermeté et équilibre pour une peau lissée et rééquilibrée.', soins: ['Rituel Kobido — 130€'], url: 'visage.html' },
      mixed_detox:     { icon: '🌿', type: 'Peau mixte à purifier',      desc: 'Le Soin rénovateur cible les impuretés de la zone T tout en respectant les joues.', soins: ['Soin rénovateur — sur demande'], url: 'visage.html' },
      normal_hydration:{ icon: '💧', type: 'Peau équilibrée à hydrater', desc: 'Le Soin signature entretient le confort et la souplesse de votre peau avec les soins OLIV\'.', soins: ['Soin signature — 130€'], url: 'visage.html' },
      normal_radiance: { icon: '🌸', type: 'Peau équilibrée à sublimer', desc: 'Offrez à votre peau saine le Kobido pour un éclat immédiat et une détente profonde.', soins: ['Kobido — 95€', '+ Vapeur — 10€'], url: 'visage.html' },
      normal_antiage:  { icon: '⏳', type: 'Peau à préserver',           desc: 'Le Rituel Kobido, en prévention, entretient fermeté et jeunesse naturellement.', soins: ['Rituel Kobido — 130€'], url: 'visage.html' },
      normal_detox:    { icon: '🌿', type: 'Peau à purifier',            desc: 'Le Soin rénovateur élimine les impuretés et redonne fraîcheur au teint.', soins: ['Soin rénovateur — sur demande'], url: 'visage.html' },
      default:         { icon: '💆', type: 'Soin sur mesure',            desc: 'Votre profil mérite une consultation personnalisée. Andréa établira le protocole idéal lors de votre rendez-vous.', soins: ['Consultation & bilan peau', 'Soin visage — dès 95€'], url: 'rendez-vous.html' }
    }
  },
  conseiller: {
    questions: [
      {
        id: 'goal',
        q: 'Qu\'attendez-vous de votre séance aujourd\'hui ?',
        opts: [
          { icon: '😌', label: 'Détente & relâchement des tensions', val: 'relax' },
          { icon: '✨', label: 'Prendre soin de mon visage', val: 'skin' },
          { icon: '🌿', label: 'Un rituel corps immersif', val: 'ritual' },
          { icon: '🌸', label: 'Épilation & finitions', val: 'beauty' },
        ]
      },
      {
        id: 'duration',
        q: 'Quelle durée souhaitez-vous consacrer ?',
        opts: [
          { icon: '⏱', label: 'Express — 30 à 45 min', val: 'short' },
          { icon: '⏰', label: 'Confortable — 1h à 1h30', val: 'medium' },
          { icon: '🌙', label: 'Immersif — 2h et plus', val: 'long' },
        ]
      }
    ],
    results: {
      relax_short:  { icon: '💆', soin: 'Massage Sieste',              desc: 'Une parenthèse de 30 minutes pour relâcher dos et nuque et repartir apaisé(e).', duree: '30 min', tarif: '50€', url: 'massages.html' },
      relax_medium: { icon: '🌊', soin: 'Massage Pause',               desc: 'Une heure de détente enveloppante, effleurages longs aux huiles OLIV\' pour dénouer les tensions.', duree: '1h', tarif: '100€', url: 'massages.html' },
      relax_long:   { icon: '🌙', soin: 'Massage de l\'Oléraie',       desc: 'Un modelage complet de 1h30, l\'immersion sensorielle absolue signée Beauté de Provence.', duree: '1h30', tarif: '150€', url: 'massages.html' },
      skin_short:   { icon: '✨', soin: 'Kobido',                       desc: 'Le massage facial japonais, liftant et éclatant. Nos soins visage démarrent en 1h.', duree: '1h', tarif: '95€', url: 'visage.html' },
      skin_medium:  { icon: '🌸', soin: 'Soin signature',              desc: 'Un soin visage complet sur mesure : nettoyage, modelage et actifs OLIV\'.', duree: '1h30', tarif: '130€', url: 'visage.html' },
      skin_long:    { icon: '🌸', soin: 'Rituel Kobido',               desc: 'Kobido et soin complet réunis pour une peau raffermie, lumineuse et détendue.', duree: '1h30', tarif: '130€', url: 'visage.html' },
      ritual_short: { icon: '🌿', soin: 'Instant corps',               desc: 'Gommage sablé ou cocon lavande : une bulle express de 30 à 45 minutes.', duree: '30–45 min', tarif: '50–70€', url: 'corps.html' },
      ritual_medium:{ icon: '🫒', soin: 'Rituel corps de Provence',    desc: 'Un rituel corps aux essences de Provence — des Oliviers au rituel des Alpilles.', duree: '1h–1h30', tarif: '100–145€', url: 'corps.html' },
      ritual_long:  { icon: '🌙', soin: 'Rituel des Bastides',         desc: 'L\'expérience longue : 2h à 2h30 de soin corps complet, jusqu\'au Rituel signature.', duree: '2h–2h30', tarif: '190–220€', url: 'corps.html' },
      beauty_short: { icon: '🌸', soin: 'Épilation express',           desc: 'Sourcils, lèvre ou menton : une finition nette en quelques minutes.', duree: '10–15 min', tarif: 'dès 8€', url: 'epilations.html' },
      beauty_medium:{ icon: '🌸', soin: 'Épilation visage ou jambes',  desc: 'Visage complet ou demi-jambes : une épilation soignée et durable.', duree: '20–30 min', tarif: '20–30€', url: 'epilations.html' },
      beauty_long:  { icon: '🌸', soin: 'Épilation complète',          desc: 'Jambes, maillot et aisselles : le combo complet pour une peau douce.', duree: '45 min–1h', tarif: 'dès 45€', url: 'epilations.html' },
      default:      { icon: '🤝', soin: 'Consultation personnalisée',  desc: 'Andréa compose votre séance idéale selon votre profil. Appelez pour en discuter.', duree: 'Sur mesure', tarif: 'Sur devis', url: 'rendez-vous.html' }
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
               `<div class="sim-result__tags"><span class="sim-tag">⏱ ${r.duree}</span><span class="sim-tag">💰 ${r.tarif}</span></div>`}
      <div class="sim-result__actions">
        <a href="${r.url}" class="btn btn--outline">Découvrir</a>
        <a href="rendez-vous.html" class="btn btn--olive">Prendre RDV</a>
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
