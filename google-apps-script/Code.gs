/**
 * BEAUTÉ DE PROVENCE — Connecteur de réservation Google Agenda
 * ------------------------------------------------------------------
 * Ce script se colle dans script.google.com (compte Google d'Andréa),
 * puis se déploie en « Application Web » (Déployer → Nouveau déploiement).
 * Il permet au site de :
 *   1. lire les créneaux libres de l'agenda  (action=slots)
 *   2. créer un rendez-vous dans l'agenda     (POST)
 * Aucune donnée n'est stockée ailleurs que dans l'agenda Google.
 * ------------------------------------------------------------------
 */

/* ─── RÉGLAGES ─────────────────────────────────────────────────── */
var CALENDAR_ID = 'primary';          // 'primary' = agenda principal, ou l'e-mail d'un agenda dédié
var TIMEZONE    = 'Europe/Paris';
var SLOT_MIN    = 30;                  // granularité des créneaux (minutes)
var LEAD_HOURS  = 2;                   // délai minimum avant un RDV (heures)
var BUFFER_MIN  = 0;                   // marge entre deux RDV (minutes)
var SALON_NAME  = 'Beauté de Provence';
var SALON_EMAIL = '';                  // e-mail qui reçoit une copie (laisser vide pour ignorer)

// Horaires d'ouverture par jour : 0 = dimanche … 6 = samedi. [heureOuverture, heureFermeture]
var OPEN_HOURS = {
  1: [9, 19],   // lundi
  2: [9, 19],   // mardi
  3: [9, 19],   // mercredi
  4: [9, 19],   // jeudi
  5: [9, 19],   // vendredi
  6: [9, 19]    // samedi (sur RDV)
  // dimanche fermé (absent)
};

/* ─── POINT D'ENTRÉE GET (créneaux libres) ─────────────────────── */
function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'slots') {
    var date = e.parameter.date;                 // 'YYYY-MM-DD'
    var dur  = parseInt(e.parameter.dur, 10) || 60;
    return json({ slots: getSlots(date, dur) });
  }
  return json({ ok: true, service: SALON_NAME + ' — booking API' });
}

/* ─── POINT D'ENTRÉE POST (création du RDV) ────────────────────── */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return json(book(data));
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ─── CALCUL DES CRÉNEAUX LIBRES ───────────────────────────────── */
function getSlots(dateStr, durMin) {
  var open = OPEN_HOURS[dayOfWeek(dateStr)];
  if (!open) return [];

  var cal = getCalendar();
  var dayStart = dateTime(dateStr, open[0], 0);
  var dayEnd   = dateTime(dateStr, open[1], 0);

  // Événements occupés du jour
  var events = cal.getEvents(dayStart, dayEnd);
  var busy = events
    .filter(function (ev) { return !ev.isAllDayEvent() && ev.getMyStatus() !== CalendarApp.GuestStatus.NO; })
    .map(function (ev) { return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() }; });

  var now = Date.now();
  var minTime = now + LEAD_HOURS * 3600 * 1000;
  var slots = [];

  for (var t = dayStart.getTime(); t + durMin * 60000 <= dayEnd.getTime(); t += SLOT_MIN * 60000) {
    if (t < minTime) continue;
    var slotEnd = t + durMin * 60000;
    var overlap = busy.some(function (b) {
      return t < (b.e + BUFFER_MIN * 60000) && (slotEnd + BUFFER_MIN * 60000) > b.s;
    });
    if (!overlap) slots.push(Utilities.formatDate(new Date(t), TIMEZONE, 'HH:mm'));
  }
  return slots;
}

/* ─── CRÉATION DU RENDEZ-VOUS ──────────────────────────────────── */
function book(d) {
  if (!d.date || !d.time || !d.service || !d.name || !d.phone) {
    return { ok: false, error: 'Champs manquants' };
  }
  // Vérifie que le créneau est toujours libre
  var still = getSlots(d.date, d.duration || 60);
  if (still.indexOf(d.time) === -1) {
    return { ok: false, error: 'Créneau déjà pris', slots: still };
  }

  var hm = d.time.split(':');
  var start = dateTime(d.date, parseInt(hm[0], 10), parseInt(hm[1], 10));
  var end = new Date(start.getTime() + (d.duration || 60) * 60000);

  var priceTxt = (d.price == null || d.price === '') ? 'Sur devis' : d.price + ' €';
  var desc =
    'Prestation : ' + d.service + '\n' +
    'Durée : ' + (d.duration || 60) + ' min\n' +
    'Tarif : ' + priceTxt + '\n' +
    'Client : ' + d.name + '\n' +
    'Téléphone : ' + d.phone + '\n' +
    (d.email ? 'E-mail : ' + d.email + '\n' : '') +
    (d.notes ? 'Message : ' + d.notes + '\n' : '') +
    '\nRéservé en ligne via le site.';

  var options = { description: desc, location: SALON_NAME };
  if (d.email) options.guests = d.email; // invite le client (envoie l'invitation Google)

  var event = getCalendar().createEvent(d.service + ' — ' + d.name, start, end, options);

  // Copie e-mail au salon (optionnel)
  if (SALON_EMAIL) {
    try {
      MailApp.sendEmail(SALON_EMAIL,
        'Nouveau RDV — ' + d.name + ' (' + d.service + ')',
        desc + '\n\nLe ' + Utilities.formatDate(start, TIMEZONE, 'EEEE d MMMM yyyy \'à\' HH:mm'));
    } catch (err) { /* silencieux */ }
  }

  return {
    ok: true,
    id: event.getId(),
    date: d.date,
    time: d.time,
    service: d.service
  };
}

/* ─── OUTILS ───────────────────────────────────────────────────── */
function getCalendar() {
  return CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CALENDAR_ID);
}
function dayOfWeek(dateStr) {
  var p = dateStr.split('-');
  return new Date(p[0], p[1] - 1, p[2]).getDay();
}
function dateTime(dateStr, h, m) {
  var p = dateStr.split('-');
  return new Date(p[0], p[1] - 1, p[2], h, m, 0, 0);
}
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
