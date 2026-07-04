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
var SALON_EMAIL = 'aombry@gmail.com';  // e-mail qui reçoit une copie (laisser vide pour ignorer)
var SALON_PHONE = '07 83 03 53 19';    // téléphone affiché dans l'e-mail de confirmation
var SALON_ADDR  = '13510 Éguilles';    // adresse affichée dans l'e-mail de confirmation
var SEND_CLIENT_EMAIL = true;          // envoyer un e-mail de confirmation à la cliente (true/false)

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
    var date  = e.parameter.date;                        // 'YYYY-MM-DD'
    var block = parseInt(e.parameter.dur, 10) || 60;     // durée totale à bloquer (soin + battement)
    return json({ slots: getSlots(date, block) });
  }
  return json({ ok: true, service: SALON_NAME + ' — booking API' });
}

/* ─── POINT D'ENTRÉE POST (création du RDV) ────────────────────── */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data && data.type === 'subscribe') return json(subscribe(data));
    return json(book(data));
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ─── CALCUL DES CRÉNEAUX LIBRES ───────────────────────────────────
   blockMin = durée totale à bloquer dans l'agenda (soin + battement).
   L'horaire renvoyé = début du rendez-vous. Le bloc réservé = [t , t + blockMin]
   part TOUJOURS de l'heure choisie (aucune marge avant) → créneaux garantis à
   l'heure pile ou à la demi-heure. Un événement existant (RDV saisi à la main
   inclus) qui chevauche le bloc rend le créneau indisponible : aucun doublon. */
function getSlots(dateStr, blockMin) {
  blockMin = blockMin || 60;

  var open = OPEN_HOURS[dayOfWeek(dateStr)];
  if (!open) return [];

  var cal = getCalendar();
  var dayStart = dateTime(dateStr, open[0], 0);
  var dayEnd   = dateTime(dateStr, open[1], 0);

  // Événements occupés du jour (élargis pour capter les blocs qui débordent avant l'ouverture)
  var events = cal.getEvents(new Date(dayStart.getTime() - blockMin * 60000), dayEnd);
  var busy = events
    .filter(function (ev) { return !ev.isAllDayEvent() && ev.getMyStatus() !== CalendarApp.GuestStatus.NO; })
    .map(function (ev) { return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() }; });

  var minTime = Date.now() + LEAD_HOURS * 3600 * 1000;
  var slots = [];

  // t = début du RDV ; le bloc [t , t + blockMin] doit tenir dans les horaires d'ouverture
  for (var t = dayStart.getTime();
       t + blockMin * 60000 <= dayEnd.getTime();
       t += SLOT_MIN * 60000) {
    if (t < minTime) continue;
    var blockEnd = t + blockMin * 60000;
    var overlap = busy.some(function (b) {
      return t < (b.e + BUFFER_MIN * 60000) && (blockEnd + BUFFER_MIN * 60000) > b.s;
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
  var block = d.duration || 60;                          // temps total bloqué dans l'agenda (soin + battement)
  var soin  = d.soinDuration || d.soldDuration || block; // durée réelle du soin (affichée à la cliente)

  // Vérifie que le créneau est toujours libre (bloc complet)
  var still = getSlots(d.date, block);
  if (still.indexOf(d.time) === -1) {
    return { ok: false, error: 'Créneau déjà pris', slots: still };
  }

  var hm = d.time.split(':');
  var start = dateTime(d.date, parseInt(hm[0], 10), parseInt(hm[1], 10));  // début du RDV
  var soinEnd = new Date(start.getTime() + soin * 60000);                  // fin du soin
  var end     = new Date(start.getTime() + block * 60000);                 // fin du bloc agenda (soin + battement)
  var battement = block - soin;

  var priceTxt = (d.price == null || d.price === '') ? 'Sur devis' : d.price + ' €';
  var soinTxt = Utilities.formatDate(start, TIMEZONE, 'HH:mm') + ' → ' +
    Utilities.formatDate(soinEnd, TIMEZONE, 'HH:mm');
  var desc =
    'Prestation : ' + d.service + '\n' +
    'Durée du soin : ' + durFr(soin) + ' (' + soinTxt + ')\n' +
    (battement > 0 ? 'Battement : ' + battement + ' min (créneau bloqué jusqu\'à ' + Utilities.formatDate(end, TIMEZONE, 'HH:mm') + ')\n' : '') +
    'Tarif : ' + priceTxt + '\n' +
    'Client : ' + d.name + '\n' +
    'Téléphone : ' + d.phone + '\n' +
    (d.email ? 'E-mail : ' + d.email + '\n' : '') +
    (d.notes ? 'Message : ' + d.notes + '\n' : '') +
    '\nRéservé en ligne via le site.';

  // Aucun invité ajouté : la cliente reçoit UNIQUEMENT l'e-mail « Beauté de Provence »
  // (pas l'invitation Google Agenda). L'événement reste sur l'agenda du salon.
  var options = { description: desc, location: SALON_NAME };

  var event = getCalendar().createEvent(d.service + ' — ' + d.name, start, end, options);

  // Copie e-mail au salon (optionnel)
  if (SALON_EMAIL) {
    try {
      MailApp.sendEmail(SALON_EMAIL,
        'Nouveau RDV — ' + d.name + ' (' + d.service + ')',
        desc + '\n\nLe ' + Utilities.formatDate(start, TIMEZONE, 'EEEE d MMMM yyyy \'à\' HH:mm'));
    } catch (err) { /* silencieux */ }
  }

  // E-mail de confirmation à la cliente (optionnel)
  if (SEND_CLIENT_EMAIL && d.email) {
    try { sendClientConfirmation(d, start, soin, priceTxt); } catch (err) { /* silencieux */ }
  }

  return {
    ok: true,
    id: event.getId(),
    date: d.date,
    time: d.time,
    service: d.service
  };
}

/* ─── E-MAIL DE CONFIRMATION CLIENTE ───────────────────────────── */
function sendClientConfirmation(d, start, soin, priceTxt) {
  var prenom  = String(d.name || '').trim().split(' ')[0] || '';
  var jourTxt = Utilities.formatDate(start, TIMEZONE, 'EEEE d MMMM yyyy');
  var heureTxt = Utilities.formatDate(start, TIMEZONE, 'HH\'h\'mm');
  var dureeTxt = durFr(soin);
  jourTxt = jourTxt.charAt(0).toUpperCase() + jourTxt.slice(1);   // Lundi 14 juillet 2025

  var subject = 'Votre rendez-vous est confirmé — ' + SALON_NAME;

  var text =
    'Bonjour ' + prenom + ',\n\n' +
    'Votre rendez-vous chez ' + SALON_NAME + ' est confirmé.\n\n' +
    'Prestation : ' + d.service + '\n' +
    'Date : ' + jourTxt + ' à ' + heureTxt + '\n' +
    'Durée du soin : ' + dureeTxt + '\n' +
    'Tarif : ' + priceTxt + '\n\n' +
    SALON_ADDR + '\n' +
    'Tél. ' + SALON_PHONE + '\n\n' +
    'Un empêchement ? Prévenez-nous au ' + SALON_PHONE + '.\n\n' +
    'À très bientôt,\n' + SALON_NAME;

  var html =
    '<div style="margin:0;padding:24px 0;background:#EFEDE4;font-family:Georgia,\'Times New Roman\',serif;color:#2b2b28">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
        '<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border:1px solid #e2ddcf">' +
          '<tr><td style="background:#818260;padding:26px 32px;text-align:center;color:#fff;font-size:20px;letter-spacing:.04em">' + SALON_NAME + '</td></tr>' +
          '<tr><td style="padding:32px 32px 8px">' +
            '<p style="margin:0 0 14px;font-size:16px">Bonjour ' + escapeHtml(prenom) + ',</p>' +
            '<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#55534b">Votre rendez-vous est <strong style="color:#818260">confirmé</strong>. Nous avons hâte de vous accueillir.</p>' +
          '</td></tr>' +
          '<tr><td style="padding:0 32px">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ef;border:1px solid #ece7da">' +
              row('Prestation', escapeHtml(d.service)) +
              row('Date', escapeHtml(jourTxt)) +
              row('Heure', escapeHtml(heureTxt)) +
              row('Durée du soin', escapeHtml(dureeTxt)) +
              row('Tarif', escapeHtml(priceTxt)) +
            '</table>' +
          '</td></tr>' +
          '<tr><td style="padding:24px 32px 8px;font-size:14px;line-height:1.7;color:#55534b">' +
            '<strong style="color:#2b2b28">' + SALON_NAME + '</strong><br>' + escapeHtml(SALON_ADDR) + '<br>' +
            'Tél. <a href="tel:' + SALON_PHONE.replace(/\s/g,'') + '" style="color:#818260;text-decoration:none">' + SALON_PHONE + '</a>' +
          '</td></tr>' +
          '<tr><td style="padding:12px 32px 30px;font-size:12.5px;line-height:1.6;color:#8a877c">Un empêchement ? Prévenez-nous au ' + SALON_PHONE + ' et nous décalerons votre rendez-vous.</td></tr>' +
        '</table>' +
      '</td></tr></table>' +
    '</div>';

  MailApp.sendEmail({ to: d.email, name: SALON_NAME, subject: subject, body: text, htmlBody: html });
}
function row(label, value) {
  return '<tr>' +
    '<td style="padding:11px 16px;border-bottom:1px solid #ece7da;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#9a978c;font-family:Arial,sans-serif">' + label + '</td>' +
    '<td style="padding:11px 16px;border-bottom:1px solid #ece7da;font-size:14px;color:#2b2b28;text-align:right">' + value + '</td>' +
    '</tr>';
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* ─── NEWSLETTER ───────────────────────────────────────────────────
   Enregistre l'e-mail dans une feuille Google (créée automatiquement au
   premier abonné, id stocké dans les propriétés du script) + envoie un
   message de bienvenue à la cliente et une notification au salon. */
function subscribe(d) {
  var email = String(d && d.email ? d.email : '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'email_invalide' };
  }
  var source = String(d && d.source ? d.source : '').slice(0, 120);

  var sheet = getNlSheet();
  // Anti-doublon : si l'e-mail existe déjà, on renvoie ok sans re-créer
  var existing = sheet.getRange(1, 2, Math.max(sheet.getLastRow(), 1), 1).getValues();
  var already = existing.some(function (r) {
    return String(r[0]).trim().toLowerCase() === email.toLowerCase();
  });
  if (!already) {
    sheet.appendRow([new Date(), email, source]);
    // Message de bienvenue à la cliente
    try {
      MailApp.sendEmail({
        to: email,
        name: SALON_NAME,
        subject: 'Bienvenue chez ' + SALON_NAME,
        htmlBody:
          '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#2b2823">' +
            '<div style="background:#818260;color:#EFEDE4;padding:22px 24px;font-size:20px;letter-spacing:.02em">' +
              SALON_NAME +
            '</div>' +
            '<div style="background:#EFEDE4;padding:24px">' +
              '<p>Merci pour votre inscription à notre newsletter.</p>' +
              '<p>Vous recevrez quelques nouvelles par an&nbsp;: nouveautés, soins de saison ' +
              'et petites attentions — jamais d\'excès.</p>' +
              '<p style="margin-top:20px;font-size:13px;color:#6b665f">' +
                SALON_NAME + ' · ' + SALON_ADDR + ' · ' + SALON_PHONE +
              '</p>' +
              '<p style="font-size:12px;color:#9a938a">Vous pouvez vous désinscrire à tout moment ' +
              'en répondant à cet e-mail.</p>' +
            '</div>' +
          '</div>'
      });
    } catch (err) { /* silencieux */ }
    // Notification au salon
    if (SALON_EMAIL) {
      try {
        MailApp.sendEmail(SALON_EMAIL,
          'Nouvel abonné newsletter — ' + email,
          'Nouvel abonné à la newsletter :\n\n' + email +
          '\nPage : ' + (source || '—') +
          '\nDate : ' + Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm'));
      } catch (err) { /* silencieux */ }
    }
  }
  return { ok: true, already: already };
}

function getNlSheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('NL_SHEET_ID');
  var ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SALON_NAME + ' — Newsletter');
    props.setProperty('NL_SHEET_ID', ss.getId());
    var sh = ss.getSheets()[0];
    sh.appendRow(['Date', 'E-mail', 'Source']);
  }
  return ss.getSheets()[0];
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
// Formate une durée en minutes → « 1h30 », « 1h », « 30 min »
function durFr(min) {
  min = parseInt(min, 10) || 0;
  var h = Math.floor(min / 60);
  var m = min % 60;
  if (h && m) return h + 'h' + (m < 10 ? '0' + m : m);
  if (h) return h + 'h';
  return m + ' min';
}
