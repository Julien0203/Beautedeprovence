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
      oily_detox:      { icon: '🌿', type: 'Peau grasse à purifier',       desc: 'Soin purifiant + madérothérapie drainante pour un teint équilibré et mat.', soins: ['Soin visage purifiant — 68€', 'Madérothérapie corps', 'Gommage OLIV\''], url: 'visage.html' },
      oily_hydration:  { icon: '💧', type: 'Peau grasse déshydratée',       desc: 'Hydratation légère et non-comédogène avec les sérums OLIV\' — un teint équilibré et frais.', soins: ['Soin visage personnalisé — 65€', 'Sérum léger OLIV\''], url: 'visage.html' },
      oily_radiance:   { icon: '✨', type: 'Peau grasse à illuminer',        desc: 'Un soin éclat purifiant pour affiner le grain de peau et unifier le teint.', soins: ['Soin visage éclat & luminosité — 70€', 'Gommage OLIV\''], url: 'visage.html' },
      oily_antiage:    { icon: '⏳', type: 'Peau grasse mature',             desc: 'Soin anti-âge adapté aux peaux mixtes à grasses — fermeté sans occlusion.', soins: ['Soin visage anti-âge & fermeté — 80€', 'Madérothérapie visage'], url: 'maderotherapie.html' },
      dry_hydration:   { icon: '💧', type: 'Peau sèche à réhydrater',       desc: 'Nutrition intense avec les huiles OLIV\' et un massage californien enveloppant.', soins: ['Soin visage hydratant intense — 70€', 'Massage californien — 70€', 'Crème fondante OLIV\''], url: 'visage.html' },
      dry_radiance:    { icon: '🌸', type: 'Peau sèche à illuminer',         desc: 'Exfoliation douce + masque éclat OLIV\' pour retrouver un teint lumineux et confortable.', soins: ['Soin visage éclat & luminosité — 70€', 'Gommage doux OLIV\''], url: 'visage.html' },
      dry_antiage:     { icon: '⏳', type: 'Peau mature à revitaliser',      desc: 'La madérothérapie lifting et les actifs anti-âge OLIV\' pour retrouver fermeté et éclat.', soins: ['Madérothérapie visage lifting', 'Soin anti-âge & fermeté — 80€', 'Huile précieuse OLIV\''], url: 'maderotherapie.html' },
      dry_detox:       { icon: '🌿', type: 'Peau sèche sensibilisée',        desc: 'Nettoyage doux et rééquilibrage de la barrière cutanée avec les actifs OLIV\'.', soins: ['Soin visage personnalisé — 65€', 'Soin apaisant OLIV\''], url: 'visage.html' },
      mixed_radiance:  { icon: '✨', type: 'Peau mixte à illuminer',         desc: 'Soin rééquilibrant + gommage doux pour révéler votre luminosité naturelle.', soins: ['Soin visage éclat & luminosité — 70€', 'Gommage OLIV\'', 'Madérothérapie visage'], url: 'maderotherapie.html' },
      mixed_hydration: { icon: '💧', type: 'Peau mixte à équilibrer',        desc: 'Hydratation ciblée zone par zone pour un teint homogène et confortable.', soins: ['Soin visage personnalisé — 65€', 'Sérum hydratant OLIV\''], url: 'visage.html' },
      mixed_antiage:   { icon: '⏳', type: 'Peau mixte mature',              desc: 'Madérothérapie lifting + soin anti-âge pour combiner fermeté et équilibre du teint.', soins: ['Madérothérapie visage lifting', 'Soin anti-âge & fermeté — 80€'], url: 'maderotherapie.html' },
      mixed_detox:     { icon: '🌿', type: 'Peau mixte à purifier',          desc: 'Soin purifiant ciblé sur la zone T, douceur sur les joues — le protocole équilibre parfait.', soins: ['Soin visage purifiant — 68€', 'Gommage enzymatique OLIV\''], url: 'visage.html' },
      normal_radiance: { icon: '🌸', type: 'Peau équilibrée à sublimer',    desc: 'Profitez de votre peau saine pour lui offrir des soins d\'éclat et de bien-être.', soins: ['Soin visage éclat & luminosité — 70€', 'Massage californien — 70€'], url: 'massages.html' },
      normal_hydration:{ icon: '💧', type: 'Peau normale à entretenir',      desc: 'Un soin hydratant de maintenance pour garder votre peau souple et protégée.', soins: ['Soin visage personnalisé — 65€', 'Crème quotidienne OLIV\''], url: 'visage.html' },
      normal_antiage:  { icon: '⏳', type: 'Peau normale à préserver',       desc: 'La prévention anti-âge pour maintenir votre capital jeunesse avec les actifs OLIV\'.', soins: ['Soin visage anti-âge & fermeté — 80€', 'Madérothérapie visage'], url: 'maderotherapie.html' },
      normal_detox:    { icon: '🌿', type: 'Peau normale à détoxifier',      desc: 'Gommage et masque purifiant pour éliminer les impuretés et retrouver un teint frais.', soins: ['Soin visage prestige — 95€', 'Gommage OLIV\''], url: 'visage.html' },
      default:         { icon: '💆', type: 'Soin sur mesure',                desc: 'Votre profil mérite une consultation personnalisée. Andréa établira le protocole idéal lors de votre rendez-vous.', soins: ['Consultation & bilan peau', 'Soin visage sur mesure — dès 65€'], url: 'rendez-vous.html' }
    }
  },
  conseiller: {
    questions: [
      {
        id: 'goal',
        q: 'Qu\'attendez-vous de votre séance aujourd\'hui ?',
        opts: [
          { icon: '😌', label: 'Détente & relâchement des tensions', val: 'relax' },
          { icon: '✨', label: 'Prendre soin de ma peau', val: 'skin' },
          { icon: '💪', label: 'Récupérer & soulager mes muscles', val: 'sport' },
          { icon: '🌸', label: 'Soins de beauté & finitions', val: 'beauty' },
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
      },
      {
        id: 'zone',
        q: 'Quelle zone prioriser ?',
        opts: [
          { icon: '🫀', label: 'Corps entier', val: 'body' },
          { icon: '🧖', label: 'Visage & décolleté', val: 'face' },
          { icon: '👐', label: 'Mains ou pieds', val: 'hands' },
          { icon: '👁', label: 'Regard & contour des yeux', val: 'eyes' },
        ]
      }
    ],
    results: {
      relax_short_body:  { icon: '💆', soin: 'Massage Express Dos & Nuque',      desc: 'Ciblage des zones de tension prioritaires pour un relâchement rapide en pause déjeuner.', duree: '30–45 min', tarif: '40–50€', url: 'massages.html' },
      relax_medium_body: { icon: '🌊', soin: 'Massage Californien Corps Entier',  desc: 'Effleurages longs et enveloppants pour une détente sensorielle profonde — huiles OLIV\'.', duree: '1h', tarif: '70€', url: 'massages.html' },
      relax_long_body:   { icon: '🌊', soin: 'Massage Californien Prestige 2h',   desc: 'Immersion totale : corps, visage, cuir chevelu et soins OLIV\' pour une expérience absolue.', duree: '2h', tarif: '120€', url: 'massages.html' },
      relax_short_face:  { icon: '✨', soin: 'Soin Visage Express',               desc: 'Nettoyage et hydratation rapide pour un teint immédiat — parfait en 30 minutes.', duree: '30 min', tarif: '38€', url: 'visage.html' },
      relax_medium_face: { icon: '🌸', soin: 'Soin Visage Personnalisé',          desc: 'Diagnostic + nettoyage + masque OLIV\' sur mesure. Teint lumineux, peau transformée.', duree: '1h', tarif: '65€', url: 'visage.html' },
      relax_long_face:   { icon: '🌸', soin: 'Soin Visage Prestige',              desc: 'Protocole complet : gommage, masque, modelage et soin OLIV\' spécifique. Le maximum de bien-être.', duree: '1h30', tarif: '95€', url: 'visage.html' },
      relax_short_hands: { icon: '💅', soin: 'Soin Mains Express',                desc: 'Mise en forme + soin cuticules pour des mains soignées rapidement.', duree: '20 min', tarif: '20€', url: 'mains-et-pieds.html' },
      relax_medium_hands:{ icon: '💅', soin: 'Soin Mains Complet',                desc: 'Gommage + massage + hydratation OLIV\' + vernis — des mains parfaitement soignées.', duree: '45 min', tarif: '38€', url: 'mains-et-pieds.html' },
      relax_short_eyes:  { icon: '👁', soin: 'Soin Regard Express',               desc: 'Sérum + contour yeux + drainage léger pour un regard reposé en quelques minutes.', duree: '20 min', tarif: '25€', url: 'regard.html' },
      relax_medium_eyes: { icon: '👁', soin: 'Soin Regard Complet',               desc: 'Masque froid + actifs anti-cernes + massage — un regard reposé et lumineux.', duree: '30 min', tarif: '35€', url: 'regard.html' },
      skin_short_face:   { icon: '✨', soin: 'Soin Visage Express',               desc: 'Nettoyage + hydratation ciblée pour un teint immédiat. Idéal en 30 minutes.', duree: '30 min', tarif: '38€', url: 'visage.html' },
      skin_medium_face:  { icon: '✨', soin: 'Soin Visage Personnalisé',          desc: 'Diagnostic + nettoyage + exfoliation + masque OLIV\' sur mesure. Teint transformé.', duree: '1h', tarif: '65–70€', url: 'visage.html' },
      skin_long_face:    { icon: '🌸', soin: 'Madérothérapie Visage Lifting',    desc: 'Modelage au bois pour drainer, raffermir et sculpter votre visage. Résultats visibles dès la 1ère séance.', duree: '1h30', tarif: 'À partir de 85€', url: 'maderotherapie.html' },
      skin_short_body:   { icon: '🌿', soin: 'Massage Jambes Légères',           desc: 'Drainage, effleurages veineux et lymphatiques pour des jambes légères et reposées.', duree: '45 min', tarif: '55€', url: 'massages.html' },
      skin_medium_body:  { icon: '🌿', soin: 'Madérothérapie Corps',             desc: 'Drainer, sculpter, raffermir — résultats visibles dès la 1ère séance avec les rouleaux en bois.', duree: '1h', tarif: 'À partir de 65€', url: 'maderotherapie.html' },
      skin_long_body:    { icon: '🌿', soin: 'Madérothérapie Corps Prestige',    desc: 'Séance intensive de sculpture et drainage corporel pour des résultats durables.', duree: '1h30+', tarif: 'À partir de 95€', url: 'maderotherapie.html' },
      sport_short_body:  { icon: '💪', soin: 'Massage Sportif Zones Ciblées',    desc: 'Travail musculaire ciblé sur jambes, dos ou épaules pour une récupération rapide.', duree: '45 min', tarif: '55€', url: 'massages.html' },
      sport_medium_body: { icon: '💪', soin: 'Massage Sportif Corps Entier',     desc: 'Pétrissage profond pour relancer la circulation, dénouer les contractures et optimiser la récupération.', duree: '1h', tarif: '70€', url: 'massages.html' },
      sport_long_body:   { icon: '💪', soin: 'Massage Sportif Récupération',     desc: 'Post-compétition : drainage + récupération complète pour une régénération musculaire optimale.', duree: '1h30', tarif: '90€', url: 'massages.html' },
      beauty_short_hands:{ icon: '💅', soin: 'Soin Mains Complet',               desc: 'Gommage, massage et hydratation intense pour des mains parfaitement soignées.', duree: '45 min', tarif: '38€', url: 'mains-et-pieds.html' },
      beauty_medium_hands:{ icon: '💅', soin: 'Soin Mains Prestige',             desc: 'Gommage + bain paraffine + massage + vernis semi-permanent — le soin mains ultime.', duree: '1h', tarif: '55€', url: 'mains-et-pieds.html' },
      beauty_short_eyes: { icon: '👁', soin: 'Soin Regard Complet',              desc: 'Soin ciblé anti-cernes, anti-poches et anti-ridules. Un regard reposé en 30 minutes.', duree: '30 min', tarif: '35€', url: 'regard.html' },
      beauty_medium_eyes:{ icon: '👁', soin: 'Lash Lift & Teinture',             desc: 'Rehaussement naturel des cils + coloration pour un effet maximal sans entretien quotidien.', duree: '1h15', tarif: '65€', url: 'regard.html' },
      beauty_short_face: { icon: '🌸', soin: 'Soin Visage Express',              desc: 'Nettoyage + hydratation rapide pour un teint immédiat. Résultat visible en 30 minutes.', duree: '30 min', tarif: '38€', url: 'visage.html' },
      beauty_medium_face:{ icon: '🌸', soin: 'Soin Visage Éclat & Luminosité',  desc: 'Protocole spécifique pour unifier le teint et illuminer le visage — résultat immédiat.', duree: '1h', tarif: '70€', url: 'visage.html' },
      default:           { icon: '🤝', soin: 'Consultation Personnalisée',       desc: 'Andréa compose votre séance idéale selon votre profil. Appelez pour en discuter.', duree: 'Sur mesure', tarif: 'Dès 35€', url: 'rendez-vous.html' }
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
    return this.data.results[`${a.goal}_${a.duration}_${a.zone}`] || this.data.results.default;
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
