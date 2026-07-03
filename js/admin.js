/* ================================================================
   BEAUTÉ DE PROVENCE — admin.js
   Espace de gestion (démo). S'appuie sur window.Store.
   L'authentification démo est locale ; en réel → Supabase Auth.
================================================================ */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DEMO_PASS = 'demo';

  const SOURCE_LABEL = { salon: 'Au salon', newsletter: 'Newsletter', rdv: 'Prise de RDV', autre: 'Autre' };
  const firstName = nom => (nom || '').trim().split(' ')[0] || '';
  const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = iso => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

  let toastTimer;
  function toast(msg) {
    const t = $('#adm-toast');
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.hidden = true, 300); }, 2600);
  }

  /* ── Connexion ───────────────────────────────────────────── */
  function boot() {
    if (sessionStorage.getItem('bdp_admin') === '1') showApp();
  }
  $('#adm-login-form').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#adm-login-err');
    if ($('#adm-pass').value === DEMO_PASS) {
      sessionStorage.setItem('bdp_admin', '1');
      err.hidden = true;
      showApp();
    } else {
      err.hidden = false;
    }
  });
  $('#adm-logout').addEventListener('click', () => {
    sessionStorage.removeItem('bdp_admin');
    $('#adm-app').hidden = true;
    $('#adm-login').style.display = '';
  });
  $('#adm-reset').addEventListener('click', () => {
    if (confirm('Réinitialiser les données de démonstration ?')) { Store.reset(); renderAll(); toast('Données de démo réinitialisées'); }
  });

  function showApp() {
    $('#adm-login').style.display = 'none';
    $('#adm-app').hidden = false;
    renderAll();
  }

  /* ── Onglets ─────────────────────────────────────────────── */
  $$('.adm-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.adm-tab').forEach(t => t.classList.toggle('active', t === tab));
    const name = tab.dataset.tab;
    $('#tab-clients').hidden = name !== 'clients';
    $('#tab-emails').hidden = name !== 'emails';
  }));

  /* ── Rendu global ────────────────────────────────────────── */
  function renderAll() { renderStats(); renderClients(); renderCampaigns(); updatePreview(); }

  function renderStats() {
    const s = Store.stats();
    $('#adm-stats').innerHTML = [
      ['Clientes', s.total],
      ['Consentement email', s.consent],
      ['Anniversaires ce mois', s.birthdays],
    ].map(([l, n]) => `<div class="adm-stat"><div class="adm-stat__n">${n}</div><div class="adm-stat__l">${l}</div></div>`).join('');
  }

  /* ── Fiches clientes ─────────────────────────────────────── */
  function renderClients() {
    const q = $('#adm-search').value.trim().toLowerCase();
    let list = Store.clients.all();
    if (q) list = list.filter(c => `${c.nom} ${c.email} ${c.tel}`.toLowerCase().includes(q));
    const tb = $('#adm-clients');
    tb.innerHTML = list.map(c => `
      <tr>
        <td><div class="adm-cell-name">${esc(c.nom)}</div>${c.notes ? `<div class="adm-cell-sub">${esc(c.notes)}</div>` : ''}</td>
        <td>${c.email ? esc(c.email) : ''}${c.email && c.tel ? '<br>' : ''}<span class="adm-cell-sub">${esc(c.tel)}</span></td>
        <td>${fmtDate(c.naissance)}</td>
        <td>${c.consent ? '<span class="adm-pill adm-pill--yes">Oui</span>' : '<span class="adm-pill adm-pill--no">Non</span>'}</td>
        <td><span class="adm-pill">${SOURCE_LABEL[c.source] || c.source || '—'}</span></td>
        <td><div class="adm-row-actions">
          <button class="adm-icon-btn" data-edit="${c.id}">Modifier</button>
        </div></td>
      </tr>`).join('');
    $('#adm-empty').hidden = list.length > 0;
    $$('[data-edit]', tb).forEach(b => b.addEventListener('click', () => openForm(b.dataset.edit)));
  }

  $('#adm-search').addEventListener('input', renderClients);

  /* ── Modale fiche ────────────────────────────────────────── */
  const modalBg = $('#adm-modal-bg');
  function openForm(id) {
    const c = id ? Store.get(id) : null;
    $('#adm-modal-title').textContent = c ? 'Modifier la fiche' : 'Nouvelle cliente';
    $('#f-id').value = c?.id || '';
    $('#f-nom').value = c?.nom || '';
    $('#f-email').value = c?.email || '';
    $('#f-tel').value = c?.tel || '';
    $('#f-naissance').value = c?.naissance || '';
    $('#f-source').value = c?.source || 'salon';
    $('#f-notes').value = c?.notes || '';
    $('#f-consent').checked = !!c?.consent;
    $('#adm-delete').hidden = !c;
    modalBg.hidden = false;
  }
  function closeForm() { modalBg.hidden = true; }
  $('#adm-modal-close').addEventListener('click', closeForm);
  $('#adm-add').addEventListener('click', () => openForm(null));
  modalBg.addEventListener('click', e => { if (e.target === modalBg) closeForm(); });

  $('#adm-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      nom: $('#f-nom').value.trim(),
      email: $('#f-email').value.trim(),
      tel: $('#f-tel').value.trim(),
      naissance: $('#f-naissance').value,
      source: $('#f-source').value,
      notes: $('#f-notes').value.trim(),
      consent: $('#f-consent').checked,
    };
    if (!data.nom) return;
    const id = $('#f-id').value;
    if (id) { Store.clients.update(id, data); toast('Fiche mise à jour'); }
    else { Store.clients.add(data); toast('Cliente ajoutée'); }
    closeForm(); renderStats(); renderClients(); updatePreview();
  });

  $('#adm-delete').addEventListener('click', () => {
    const id = $('#f-id').value;
    if (id && confirm('Supprimer définitivement cette fiche ?')) {
      Store.clients.remove(id); closeForm(); renderStats(); renderClients(); updatePreview();
      toast('Fiche supprimée');
    }
  });

  /* ── Export CSV ──────────────────────────────────────────── */
  $('#adm-export').addEventListener('click', () => {
    const rows = [['Nom', 'Email', 'Téléphone', 'Naissance', 'Consentement', 'Source', 'Notes', 'Ajout']];
    Store.clients.all().forEach(c => rows.push([
      c.nom, c.email, c.tel, c.naissance, c.consent ? 'oui' : 'non', SOURCE_LABEL[c.source] || c.source, c.notes, c.cree,
    ]));
    const csv = rows.map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes-beaute-de-provence-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('Export CSV téléchargé');
  });

  /* ── Emails ──────────────────────────────────────────────── */
  function audienceCount(aud) {
    const list = Store.clients.all();
    if (aud === 'all') return list.length;
    if (aud === 'newsletter') return list.filter(c => c.source === 'newsletter' && c.consent).length;
    return list.filter(c => c.consent).length; // consent
  }
  function updatePreview() {
    const objet = $('#em-objet').value.trim() || 'Objet de l\'email';
    const msg = $('#em-msg').value.trim() || 'Votre message apparaîtra ici…';
    $('#pv-objet').textContent = objet;
    $('#pv-msg').textContent = msg.replace(/\{prénom\}/g, 'Claire');
    const n = audienceCount($('#em-audience').value);
    $('#em-count').textContent = `${n} destinataire${n > 1 ? 's' : ''} pour cette audience.`;
  }
  ['#em-objet', '#em-msg', '#em-audience', '#em-type'].forEach(sel => {
    $(sel).addEventListener('input', updatePreview);
    $(sel).addEventListener('change', updatePreview);
  });

  $('#adm-compose').addEventListener('submit', e => {
    e.preventDefault();
    const objet = $('#em-objet').value.trim();
    if (!objet) { toast('Ajoutez un objet à l\'email'); return; }
    const aud = $('#em-audience').value;
    const audLabel = $('#em-audience').selectedOptions[0].textContent;
    const n = audienceCount(aud);
    Store.campaigns.add({ type: $('#em-type').value, objet, audience: audLabel, destinataires: n });
    $('#em-objet').value = ''; $('#em-msg').value = '';
    updatePreview(); renderCampaigns();
    toast(`Campagne simulée — ${n} destinataire${n > 1 ? 's' : ''} (aucun envoi réel)`);
  });

  function renderCampaigns() {
    $('#adm-campaigns').innerHTML = Store.campaigns.all().map(c => `
      <tr>
        <td>${fmtDate(c.date)}</td>
        <td>${esc(c.type)}</td>
        <td>${esc(c.objet)}</td>
        <td class="adm-cell-sub">${esc(c.audience)}</td>
        <td>${c.destinataires}</td>
        <td><span class="adm-pill adm-pill--yes">${esc(c.statut)}</span></td>
      </tr>`).join('');
  }

  boot();
})();
