/* ================================================================
   BEAUTÉ DE PROVENCE — store.js
   Couche de données CRM (fiches clientes + campagnes emails).

   MODE = 'demo'  → données locales (localStorage), aucun email réel.
   MODE = 'live'  → à brancher sur Supabase + Brevo (voir _live_* plus bas).

   Pour passer en réel : renseigner CONFIG puis MODE='live'.
   Rien de sensible ici : en réel, la clé "anon" Supabase est publique
   (protégée par les règles RLS) ; l'envoi Brevo passe par une Edge
   Function côté serveur (jamais la clé API dans ce fichier).
================================================================ */
(function (global) {
  'use strict';

  const MODE = 'demo';

  const CONFIG = {
    supabaseUrl: '',      // ex : https://xxxx.supabase.co   (à remplir en live)
    supabaseAnonKey: '',  // clé "anon public"               (à remplir en live)
  };

  /* ── Utilitaires ─────────────────────────────────────────── */
  const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const norm = s => (s || '').toString().trim().toLowerCase();

  const LS = {
    clients: 'bdp_clients',
    campaigns: 'bdp_campaigns',
  };
  const read = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ── Données de démonstration (semées une seule fois) ────── */
  function seed() {
    if (localStorage.getItem(LS.clients)) return;
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    const demo = [
      { nom: 'Claire Fontaine',   email: 'claire.fontaine@email.fr',  tel: '06 12 34 56 78', naissance: `1988-${m}-14`, consent: true,  source: 'salon',      notes: 'Adore le Kobido',        cree: '2025-02-11' },
      { nom: 'Sophie Meyer',      email: 'sophie.meyer@email.fr',     tel: '06 23 45 67 89', naissance: '1979-03-22',   consent: true,  source: 'newsletter', notes: '',                       cree: '2025-03-02' },
      { nom: 'Émilie Roux',       email: 'emilie.roux@email.fr',      tel: '06 34 56 78 90', naissance: `1992-${m}-03`, consent: true,  source: 'salon',      notes: 'Épilations régulières',  cree: '2025-01-19' },
      { nom: 'Nathalie Blanc',    email: 'nathalie.blanc@email.fr',   tel: '06 45 67 89 01', naissance: '1985-07-09',   consent: false, source: 'salon',      notes: 'Pas de démarchage',      cree: '2024-11-30' },
      { nom: 'Julie Garnier',     email: 'julie.garnier@email.fr',    tel: '06 56 78 90 12', naissance: '1996-09-17',   consent: true,  source: 'newsletter', notes: '',                       cree: '2025-04-06' },
      { nom: 'Camille Petit',     email: 'camille.petit@email.fr',    tel: '06 67 89 01 23', naissance: '1990-12-01',   consent: true,  source: 'rdv',        notes: 'Rituel des Bastides',    cree: '2025-05-21' },
      { nom: 'Laure Dumas',       email: 'laure.dumas@email.fr',      tel: '06 78 90 12 34', naissance: '1983-06-28',   consent: true,  source: 'salon',      notes: '',                       cree: '2024-09-14' },
      { nom: 'Manon Girard',      email: 'manon.girard@email.fr',     tel: '06 89 01 23 45', naissance: '2000-02-11',   consent: true,  source: 'newsletter', notes: 'Nouvelle cliente',       cree: `${y}-06-02` },
    ].map(c => ({ id: uid(), ...c }));
    write(LS.clients, demo);

    const campaigns = [
      { id: uid(), type: 'Newsletter', objet: 'Les nouveautés du printemps 🌿', audience: 'Toutes les clientes consenties', destinataires: 6, date: '2025-04-08', statut: 'Envoyée (démo)' },
      { id: uid(), type: 'Promotion',  objet: '-15% sur les rituels corps ce mois-ci', audience: 'Clientes consenties', destinataires: 6, date: '2025-05-12', statut: 'Envoyée (démo)' },
    ];
    write(LS.campaigns, campaigns);
  }

  /* ── API démo ────────────────────────────────────────────── */
  const demoAPI = {
    clients: {
      all() { return read(LS.clients, []).slice().sort((a, b) => a.nom.localeCompare(b.nom)); },
      get(id) { return read(LS.clients, []).find(c => c.id === id) || null; },
      add(data) {
        const list = read(LS.clients, []);
        const c = { id: uid(), consent: false, source: 'salon', notes: '', cree: todayISO(), ...data };
        list.push(c); write(LS.clients, list); return c;
      },
      update(id, data) {
        const list = read(LS.clients, []);
        const i = list.findIndex(c => c.id === id);
        if (i < 0) return null;
        list[i] = { ...list[i], ...data, id };
        write(LS.clients, list); return list[i];
      },
      remove(id) {
        write(LS.clients, read(LS.clients, []).filter(c => c.id !== id));
      },
    },
    campaigns: {
      all() { return read(LS.campaigns, []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')); },
      add(data) {
        const list = read(LS.campaigns, []);
        const c = { id: uid(), date: todayISO(), statut: 'Envoyée (démo)', ...data };
        list.unshift(c); write(LS.campaigns, list); return c;
      },
    },
    /* Inscription depuis le formulaire public (dédoublonnage par email) */
    subscribe({ email, nom }) {
      const list = read(LS.clients, []);
      const exists = list.find(c => norm(c.email) === norm(email));
      if (exists) {
        if (!exists.consent) { exists.consent = true; write(LS.clients, list); }
        return { ok: true, already: true };
      }
      list.push({ id: uid(), nom: nom || '', email, tel: '', naissance: '', consent: true, source: 'newsletter', notes: '', cree: todayISO() });
      write(LS.clients, list);
      return { ok: true, already: false };
    },
    stats() {
      const list = read(LS.clients, []);
      const mm = String(new Date().getMonth() + 1).padStart(2, '0');
      return {
        total: list.length,
        consent: list.filter(c => c.consent).length,
        birthdays: list.filter(c => c.naissance && c.naissance.slice(5, 7) === mm).length,
      };
    },
    reset() { localStorage.removeItem(LS.clients); localStorage.removeItem(LS.campaigns); seed(); },
  };

  /* ── API live (Supabase + Brevo) — squelette à activer ───── */
  /*  En 'live', on remplace demoAPI par des appels au client Supabase.
      Le formulaire public fera un insert protégé par RLS ; l'envoi des
      campagnes appellera une Edge Function qui parle à Brevo. Structure
      identique à demoAPI pour que l'admin ne change pas d'une ligne.   */
  const liveAPI = null; // TODO à l'étape "branchement réel"

  if (MODE === 'demo') seed();

  global.Store = (MODE === 'demo') ? Object.assign({ MODE, CONFIG }, demoAPI)
                                   : Object.assign({ MODE, CONFIG }, liveAPI);

})(window);
