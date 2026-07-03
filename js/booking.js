/* ================================================================
   BEAUTÉ DE PROVENCE — booking.js
   Module de réservation en ligne (style Planity)
   4 étapes : Prestation → Date → Horaire → Coordonnées
   Connecté à Google Agenda via un script Google Apps (voir CONFIG.apiUrl).
================================================================ */
(function () {
  'use strict';

  /* ── CONFIGURATION ─────────────────────────────────────────────
     apiUrl : URL du script Google Apps déployé (se termine par /exec).
              Tant qu'elle est vide, le module fonctionne en mode démo
              (créneaux générés localement, confirmation par téléphone).
  ---------------------------------------------------------------- */
  var CONFIG = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbzfZJN3mzVBElYgBPvO76YjFnlDTMeRxDxcny7QwigXoSQINDJn3jTxC8crj6BGuR-q/exec',
    phone: '+33783035319',
    phoneDisplay: '07 83 03 53 19',
    slotStep: 30,                     // granularité des créneaux (minutes)
    leadHours: 2,                     // délai minimum avant un RDV (heures)
    maxDaysAhead: 60,                 // horizon de réservation
    // Horaires d'ouverture par jour (0 = dimanche … 6 = samedi). [ouverture, fermeture] en heures.
    hours: { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 19] }
  };

  /* ── CARTE DES PRESTATIONS (tarifs réels) ──────────────────────
     dur    = durée du soin (annoncée à la cliente), en minutes
     cabine = temps réellement occupé en cabine, en minutes (bloqué dans l'agenda).
              Le supplément (cabine − dur) est réparti moitié avant / moitié après le soin.
              Si cabine est absent, le blocage = dur.
     price  = prix en € (null = « Sur devis »)
  ---------------------------------------------------------------- */
  var SERVICES = [
    { cat: 'Diagnostic de peau', items: [
      { id: 'diagnostic-peau',  name: 'Diagnostic beauté',         dur: 30,  cabine: 45,  price: 35, desc: 'Bilan complet de votre peau en institut pour définir votre routine et vos soins adaptés. Montant déduit si vous réservez un soin.' }
    ]},
    { cat: 'Massages', items: [
      { id: 'massage-sieste',   name: 'Massage Sieste',            dur: 30,  price: 50 },
      { id: 'massage-pause',    name: 'Massage Pause',             dur: 60,  price: 100 },
      { id: 'massage-balade',   name: 'Balade sous les oliviers',  dur: 60,  cabine: 90, price: 100, desc: 'Drainage lymphatique — dégonfle le corps, stimule la circulation, sensation de légèreté.' },
      { id: 'massage-oleraie',  name: 'Massage Oléraie',           dur: 90,  price: 150 }
    ]},
    { cat: 'Soins visage', items: [
      { id: 'visage-eveil',     name: "L'éveil provençal",         dur: 45,  cabine: 75,  price: 65,  desc: 'Un soin personnalisé adapté aux besoins de votre peau pour retrouver confort, fraîcheur et équilibre.' },
      { id: 'visage-eclat',     name: "L'éclat des oliviers",      dur: 60,  cabine: 90,  price: 90,  desc: "Un soin drainant qui réveille les traits, illumine le teint et révèle l'éclat naturel de la peau." },
      { id: 'visage-renouveau', name: 'Le renouveau provençal',    dur: 60,  cabine: 90,  price: 90,  desc: "Un soin rénovateur à base d'actifs végétaux qui exfolient en douceur, affine le grain de peau et révèle l'éclat du teint." },
      { id: 'visage-signature', name: 'Le soin signature Beauté de Provence', dur: 90, cabine: 120, price: 130, desc: 'Rituel expert : travail musculaire, stimulation circulatoire et action cellulaire. Les traits sont détendus, le teint rayonnant.' },
      { id: 'visage-kobido',    name: 'Le Kobido provençal',       dur: 60,  cabine: 90,  price: 95,  desc: "Massage facialiste inspiré de l'art japonais : stimule, draine et redessine les contours du visage, pour un effet naturellement liftant." },
      { id: 'visage-rituel-kobido', name: 'Le rituel Kobido provençal', dur: 90, cabine: 120, price: 130, desc: "L'alliance d'un soin visage sur mesure et du Kobido provençal pour une expérience complète de beauté et de bien-être." }
    ]},
    { cat: 'Rituels corps', items: [
      { id: 'corps-oliviers',   name: 'Rituel des Oliviers',       dur: 60,  price: 100 },
      { id: 'corps-provencal',  name: 'Rituel Provençal',          dur: 60,  price: 100 },
      { id: 'corps-alpilles',   name: 'Rituel des Alpilles',       dur: 90,  price: 145 },
      { id: 'corps-bastides',   name: 'Rituel des Bastides',       dur: 120, price: 190 },
      { id: 'corps-signature',  name: 'Rituel signature',          dur: 150, price: 220 }
    ]},
    { cat: 'Instants corps', items: [
      { id: 'instant-sable',    name: 'Gommage sablé',             dur: 30,  price: 50 },
      { id: 'instant-cocon',    name: 'Cocon lavande',             dur: 30,  price: 50 },
      { id: 'instant-detente',  name: 'Pause détente',             dur: 45,  price: 70 }
    ]},
    { cat: 'Épilations', items: [
      { id: 'epil-sourcils',    name: 'Sourcils',                  dur: 15,  price: 20 },
      { id: 'epil-levres',      name: 'Lèvres',                    dur: 15,  price: 8 },
      { id: 'epil-menton',      name: 'Menton',                    dur: 15,  price: 8 },
      { id: 'epil-visage',      name: 'Visage complet',            dur: 30,  price: 25 },
      { id: 'epil-aisselles',   name: 'Aisselles',                 dur: 15,  price: 15 },
      { id: 'epil-bras',        name: 'Bras',                      dur: 20,  price: 20 },
      { id: 'epil-demijambes',  name: 'Demi-jambes',               dur: 20,  price: 20 },
      { id: 'epil-jambes',      name: 'Jambes complètes',          dur: 30,  price: 30 },
      { id: 'epil-maillot-s',   name: 'Maillot simple',            dur: 15,  price: 15 },
      { id: 'epil-maillot-e',   name: 'Maillot échancré',          dur: 20,  price: 22 },
      { id: 'epil-maillot-i',   name: 'Maillot intégral',          dur: 30,  price: 30 },
      { id: 'epil-dos',         name: 'Dos',                       dur: 30,  price: 35 },
      { id: 'epil-torse',       name: 'Torse',                     dur: 30,  price: 35 }
    ]}
  ];

  /* Icônes SVG (trait fin, style premium) */
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>';

  var MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  var WDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  var WDAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  /* ── ÉTAT ──────────────────────────────────────────────────── */
  var state = {
    step: 1,
    service: null,
    date: null,        // 'YYYY-MM-DD'
    time: null,        // 'HH:MM'
    view: new Date(),  // mois affiché dans le calendrier
    contact: { name: '', phone: '', email: '', notes: '' }
  };

  var root = document.getElementById('booking-app');
  if (!root) return;

  /* ── HELPERS ───────────────────────────────────────────────── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  /* Durée à BLOQUER dans l'agenda = temps en cabine (cabine) si défini, sinon la durée vendue. */
  function blockDur(s) { return (s && s.cabine) ? s.cabine : (s ? s.dur : 0); }
  function priceLabel(p) { return p == null ? 'Sur devis' : p + '\u00A0€'; }
  function durLabel(m) {
    var h = Math.floor(m / 60), mn = m % 60;
    if (h && mn) return h + 'h' + pad(mn);
    if (h) return h + 'h';
    return mn + ' min';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function prettyDate(ymdStr) {
    var p = ymdStr.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return WDAYS_FULL[d.getDay()] + ' ' + (+p[2]) + ' ' + MONTHS[+p[1] - 1].toLowerCase();
  }

  /* ── GÉNÉRATION LOCALE DES CRÉNEAUX (mode démo / fallback) ────
     cabineMin = temps total bloqué en cabine ; soldMin = durée du soin.
     L'horaire proposé à la cliente = début du SOIN. Le supplément
     (cabineMin − soldMin) est réparti moitié avant / moitié après :
     le bloc agenda = [soin − avant , soin + soldMin + après]. */
  function localSlots(ymdStr, cabineMin, soldMin) {
    soldMin = soldMin || cabineMin;
    var before = Math.floor((cabineMin - soldMin) / 2);
    var after = cabineMin - soldMin - before;
    var p = ymdStr.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var open = CONFIG.hours[d.getDay()];
    if (!open) return [];
    var out = [];
    var start = open[0] * 60, end = open[1] * 60;
    var now = new Date();
    var minStart = 0;
    if (ymd(now) === ymdStr) minStart = now.getHours() * 60 + now.getMinutes() + CONFIG.leadHours * 60;
    // t = début du soin ; le bloc [t−before , t+soldMin+after] doit tenir dans l'ouverture
    for (var t = start + before; t + soldMin + after <= end; t += CONFIG.slotStep) {
      if (t < minStart) continue;
      out.push(pad(Math.floor(t / 60)) + ':' + pad(t % 60));
    }
    return out;
  }

  /* ── APPELS BACKEND (Google Apps Script) ───────────────────── */
  function fetchSlots(ymdStr, cabineMin, soldMin) {
    soldMin = soldMin || cabineMin;
    if (!CONFIG.apiUrl) return Promise.resolve({ slots: localSlots(ymdStr, cabineMin, soldMin), demo: true });
    var url = CONFIG.apiUrl + '?action=slots&date=' + encodeURIComponent(ymdStr) +
      '&dur=' + cabineMin + '&sold=' + soldMin;
    return fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (d) { return { slots: d.slots || [], demo: false }; })
      .catch(function () { return { slots: localSlots(ymdStr, cabineMin, soldMin), demo: true, error: true }; });
  }

  function sendBooking(payload) {
    if (!CONFIG.apiUrl) return Promise.resolve({ ok: false, demo: true });
    return fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // évite le preflight CORS
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: true }; });
  }

  /* ── RENDU ─────────────────────────────────────────────────── */
  function render() {
    root.innerHTML =
      stepsBar() +
      '<div class="bk__body">' + panel() + '</div>' +
      footer();
    bind();
  }

  function stepsBar() {
    var labels = ['Prestation', 'Date', 'Horaire', 'Coordonnées'];
    var html = '<ol class="bk__steps" aria-hidden="true">';
    for (var i = 0; i < labels.length; i++) {
      var n = i + 1;
      var cls = 'bk__step' + (state.step === n ? ' is-active' : '') + (state.step > n ? ' is-done' : '');
      html += '<li class="' + cls + '"><span class="bk__step-no">' + (state.step > n ? ICON_CHECK : n) + '</span>' +
        '<span class="bk__step-lbl">' + labels[i] + '</span></li>';
    }
    return html + '</ol>';
  }

  function panel() {
    if (state.step === 1) return panelServices();
    if (state.step === 2) return panelDate();
    if (state.step === 3) return panelTime();
    if (state.step === 4) return panelForm();
    return panelDone();
  }

  /* Étape 1 — Prestations (liste groupée par catégorie) */
  function panelServices() {
    var html = '<div class="bk__panel bk__panel--services">';
    SERVICES.forEach(function (g) {
      html += '<div class="bk__cat"><h3 class="bk__cat-title">' + esc(g.cat) + '</h3>';
      g.items.forEach(function (s) {
        var sel = state.service && state.service.id === s.id;
        html += '<button type="button" class="bk__service' + (sel ? ' is-selected' : '') + '" data-svc="' + s.id + '">' +
          '<span class="bk__service-main">' +
            '<span class="bk__service-name">' + esc(s.name) + '</span>' +
            '<span class="bk__service-dur">' + durLabel(s.dur) + '</span>' +
            (s.desc ? '<span class="bk__service-desc">' + esc(s.desc) + '</span>' : '') +
          '</span>' +
          '<span class="bk__service-side">' +
            '<span class="bk__service-price">' + priceLabel(s.price) + '</span>' +
            '<span class="bk__service-cta">Choisir</span>' +
          '</span>' +
        '</button>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }

  /* Étape 2 — Calendrier */
  function panelDate() {
    var v = state.view;
    var y = v.getFullYear(), m = v.getMonth();
    var first = new Date(y, m, 1);
    var offset = (first.getDay() + 6) % 7; // lundi = 0
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // Réservation possible à partir du lendemain (pas de RDV le jour même)
    var minDay = new Date(today); minDay.setDate(minDay.getDate() + 1);
    var maxDate = new Date(); maxDate.setDate(maxDate.getDate() + CONFIG.maxDaysAhead);

    var prevDisabled = (y === today.getFullYear() && m === today.getMonth());
    var html = '<div class="bk__panel bk__panel--date">' +
      '<div class="bk__cal">' +
        '<div class="bk__cal-head">' +
          '<button type="button" class="bk__cal-nav" data-nav="-1"' + (prevDisabled ? ' disabled' : '') + ' aria-label="Mois précédent">‹</button>' +
          '<span class="bk__cal-month">' + MONTHS[m] + ' ' + y + '</span>' +
          '<button type="button" class="bk__cal-nav" data-nav="1" aria-label="Mois suivant">›</button>' +
        '</div>' +
        '<div class="bk__cal-grid bk__cal-wdays">';
    WDAYS.forEach(function (d) { html += '<span class="bk__cal-wday">' + d + '</span>'; });
    html += '</div><div class="bk__cal-grid">';
    for (var i = 0; i < offset; i++) html += '<span class="bk__cal-cell is-empty"></span>';
    for (var day = 1; day <= daysInMonth; day++) {
      var d = new Date(y, m, day);
      var dow = d.getDay();
      var isOpen = !!CONFIG.hours[dow];
      var disabled = d < minDay || d > maxDate || !isOpen;
      var iso = ymd(d);
      var sel = state.date === iso;
      var cls = 'bk__cal-cell' + (disabled ? ' is-disabled' : '') + (sel ? ' is-selected' : '');
      html += '<button type="button" class="' + cls + '"' + (disabled ? ' disabled' : ' data-date="' + iso + '"') + '>' + day + '</button>';
    }
    html += '</div></div><p class="bk__hint">Institut ouvert du lundi au samedi · 9h–19h · fermé le dimanche</p></div>';
    return html;
  }

  /* Étape 3 — Créneaux */
  function panelTime() {
    return '<div class="bk__panel bk__panel--time">' +
      '<p class="bk__time-date">' + esc(prettyDate(state.date)) + '</p>' +
      '<div class="bk__slots" id="bk-slots"><p class="bk__loading">Recherche des créneaux disponibles…</p></div>' +
    '</div>';
  }

  function renderSlots(res) {
    var wrap = document.getElementById('bk-slots');
    if (!wrap) return;
    if (!res.slots.length) {
      wrap.innerHTML = '<p class="bk__empty">Aucun créneau disponible ce jour-là. Choisissez une autre date, ou appelez le ' +
        '<a href="tel:' + CONFIG.phone + '">' + CONFIG.phoneDisplay + '</a>.</p>';
      return;
    }
    var am = [], pm = [];
    res.slots.forEach(function (t) { (parseInt(t) < 13 ? am : pm).push(t); });
    var html = '';
    function group(title, arr) {
      if (!arr.length) return '';
      var g = '<p class="bk__slots-label">' + title + '</p><div class="bk__slots-grid">';
      arr.forEach(function (t) {
        g += '<button type="button" class="bk__slot' + (state.time === t ? ' is-selected' : '') + '" data-time="' + t + '">' + t + '</button>';
      });
      return g + '</div>';
    }
    html += group('Matin', am) + group('Après-midi', pm);
    if (res.demo) html += '<p class="bk__demo-note">Créneaux indicatifs — la synchronisation avec l\'agenda s\'active dès la connexion Google.</p>';
    wrap.innerHTML = html;
    wrap.querySelectorAll('.bk__slot').forEach(function (b) {
      b.addEventListener('click', function () {
        state.time = b.dataset.time;
        wrap.querySelectorAll('.bk__slot').forEach(function (x) { x.classList.remove('is-selected'); });
        b.classList.add('is-selected');
        updateFooter();
      });
    });
  }

  /* Étape 4 — Coordonnées */
  function panelForm() {
    var c = state.contact;
    return '<div class="bk__panel bk__panel--form">' +
      recap() +
      '<form class="bk__form" id="bk-form" novalidate>' +
        field('name', 'Nom et prénom', 'text', c.name, true) +
        field('phone', 'Téléphone', 'tel', c.phone, true) +
        field('email', 'E-mail', 'email', c.email, false) +
        '<label class="bk__field bk__field--full"><span class="bk__label">Message (optionnel)</span>' +
          '<textarea name="notes" rows="3" class="bk__input">' + esc(c.notes) + '</textarea></label>' +
        '<label class="bk__consent"><input type="checkbox" name="consent" required> ' +
          'J\'accepte d\'être recontacté(e) au sujet de ce rendez-vous.</label>' +
        '<p class="bk__form-err" id="bk-err" hidden></p>' +
      '</form>' +
    '</div>';
  }

  function field(name, label, type, val, req) {
    return '<label class="bk__field"><span class="bk__label">' + label + (req ? ' *' : '') + '</span>' +
      '<input class="bk__input" type="' + type + '" name="' + name + '" value="' + esc(val || '') + '"' + (req ? ' required' : '') + '></label>';
  }

  function recap() {
    var s = state.service;
    return '<div class="bk__recap">' +
      '<div class="bk__recap-row"><span>Soin</span><strong>' + esc(s.name) + '</strong></div>' +
      '<div class="bk__recap-row"><span>Durée</span><strong>' + durLabel(s.dur) + '</strong></div>' +
      '<div class="bk__recap-row"><span>Date</span><strong>' + esc(prettyDate(state.date)) + '</strong></div>' +
      '<div class="bk__recap-row"><span>Horaire</span><strong>' + esc(state.time) + '</strong></div>' +
      '<div class="bk__recap-row bk__recap-row--total"><span>Tarif</span><strong>' + priceLabel(s.price) + '</strong></div>' +
    '</div>';
  }

  /* Écran final */
  function panelDone() {
    var s = state.service;
    var confirmed = state.result && state.result.ok;
    var telLine = '<a href="tel:' + CONFIG.phone + '" class="btn btn--outline">Appeler l\'institut</a>';
    if (confirmed) {
      return '<div class="bk__panel bk__done">' +
        '<div class="bk__done-icon">' + ICON_CHECK + '</div>' +
        '<h3 class="bk__done-title">Rendez-vous confirmé</h3>' +
        '<p class="bk__done-text">Votre ' + esc(s.name) + ' est réservé le <strong>' + esc(prettyDate(state.date)) +
          '</strong> à <strong>' + esc(state.time) + '</strong>. Un e-mail de confirmation vous a été envoyé.</p>' +
        '<button type="button" class="btn btn--olive" data-restart>Réserver un autre soin</button>' +
      '</div>';
    }
    // Mode démo / agenda non connecté : on récapitule et on invite à confirmer par téléphone.
    return '<div class="bk__panel bk__done">' +
      '<div class="bk__done-icon">' + ICON_CAL + '</div>' +
      '<h3 class="bk__done-title">Demande enregistrée</h3>' +
      '<p class="bk__done-text">Merci ' + esc(state.contact.name || '') + '. Votre demande pour un <strong>' + esc(s.name) +
        '</strong> le <strong>' + esc(prettyDate(state.date)) + '</strong> à <strong>' + esc(state.time) +
        '</strong> a bien été prise en compte.<br>Andréa vous confirmera le créneau très vite.</p>' +
      '<div class="bk__done-actions">' + telLine +
        '<button type="button" class="btn btn--olive" data-restart>Réserver un autre soin</button></div>' +
    '</div>';
  }

  /* ── FOOTER (résumé + navigation) ──────────────────────────── */
  function footer() {
    if (state.step === 'done' || state.step > 4) return '';
    return '<div class="bk__bar">' +
      '<div class="bk__bar-summary" id="bk-summary"></div>' +
      '<div class="bk__bar-actions">' +
        (state.step > 1 ? '<button type="button" class="btn btn--outline bk__back">Retour</button>' : '') +
        '<button type="button" class="btn btn--olive bk__next" id="bk-next">' + nextLabel() + '</button>' +
      '</div>' +
    '</div>';
  }

  function nextLabel() { return state.step === 4 ? 'Confirmer le rendez-vous' : 'Continuer'; }

  function summaryText() {
    var bits = [];
    if (state.service) bits.push(state.service.name);
    if (state.date) bits.push(prettyDate(state.date));
    if (state.time) bits.push(state.time);
    return bits.join(' · ');
  }

  function canAdvance() {
    if (state.step === 1) return !!state.service;
    if (state.step === 2) return !!state.date;
    if (state.step === 3) return !!state.time;
    return true;
  }

  function updateFooter() {
    var sum = document.getElementById('bk-summary');
    if (sum) sum.textContent = summaryText();
    var next = document.getElementById('bk-next');
    if (next) { next.disabled = !canAdvance(); next.textContent = nextLabel(); }
  }

  /* ── BINDINGS ──────────────────────────────────────────────── */
  function bind() {
    updateFooter();

    // Étape 1 : sélection prestation
    root.querySelectorAll('.bk__service').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.svc;
        SERVICES.some(function (g) { return g.items.some(function (s) { if (s.id === id) { state.service = s; return true; } }); });
        state.time = null;
        go(2);
      });
    });

    // Étape 2 : calendrier
    root.querySelectorAll('.bk__cal-nav').forEach(function (b) {
      b.addEventListener('click', function () {
        state.view = new Date(state.view.getFullYear(), state.view.getMonth() + parseInt(b.dataset.nav), 1);
        render();
      });
    });
    root.querySelectorAll('[data-date]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.date = b.dataset.date;
        state.time = null;
        go(3);
      });
    });

    // Étape 3 : chargement des créneaux
    if (state.step === 3) {
      fetchSlots(state.date, blockDur(state.service), state.service.dur).then(renderSlots);
    }

    // Navigation
    var back = root.querySelector('.bk__back');
    if (back) back.addEventListener('click', function () { go(state.step - 1); });
    var next = root.querySelector('#bk-next');
    if (next) next.addEventListener('click', onNext);

    // Écran final : recommencer
    var restart = root.querySelector('[data-restart]');
    if (restart) restart.addEventListener('click', function () {
      state = { step: 1, service: null, date: null, time: null, view: new Date(), contact: { name: '', phone: '', email: '', notes: '' } };
      render();
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function onNext() {
    if (state.step < 4) { if (canAdvance()) go(state.step + 1); return; }
    submit();
  }

  function submit() {
    var form = document.getElementById('bk-form');
    var err = document.getElementById('bk-err');
    var fd = new FormData(form);
    var name = (fd.get('name') || '').trim();
    var phone = (fd.get('phone') || '').trim();
    var email = (fd.get('email') || '').trim();
    var consent = fd.get('consent');
    function fail(msg) { err.textContent = msg; err.hidden = false; }

    if (!name) return fail('Merci d\'indiquer votre nom.');
    if (!phone || phone.replace(/\D/g, '').length < 8) return fail('Merci d\'indiquer un téléphone valide.');
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('L\'adresse e-mail semble incorrecte.');
    if (!consent) return fail('Merci de cocher la case de consentement.');
    err.hidden = true;

    state.contact = { name: name, phone: phone, email: email, notes: (fd.get('notes') || '').trim() };

    var next = document.getElementById('bk-next');
    if (next) { next.disabled = true; next.textContent = 'Envoi…'; }

    var payload = {
      serviceId: state.service.id,
      service: state.service.name,
      duration: blockDur(state.service),   // temps réellement bloqué en cabine
      soldDuration: state.service.dur,     // durée annoncée à la cliente
      price: state.service.price,
      date: state.date,
      time: state.time,
      name: name, phone: phone, email: email, notes: state.contact.notes
    };

    sendBooking(payload).then(function (res) {
      state.result = res;
      go('done');
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function go(step) {
    state.step = step;
    render();
    if (typeof step === 'number' && step > 1) {
      var body = root.querySelector('.bk__body');
      if (body) body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  render();
})();
