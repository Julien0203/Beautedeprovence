/* ================================================================
   BEAUTÉ DE PROVENCE — newsletter.js
   Formulaire d'inscription public (RGPD). S'appuie sur window.Store.
   En démo : enregistre localement (localStorage) via Store.subscribe.
   En réel : Store passera en mode 'live' (Supabase) sans changer ce code.
================================================================ */
(function () {
  'use strict';
  const form = document.getElementById('nl-form');
  if (!form || !window.Store) return;

  const email = document.getElementById('nl-email');
  const nom = document.getElementById('nl-nom');
  const consent = document.getElementById('nl-consent');
  const msg = document.getElementById('nl-msg');

  const show = (text, ok) => {
    msg.textContent = text;
    msg.hidden = false;
    msg.classList.toggle('nl__msg--ok', !!ok);
    msg.classList.toggle('nl__msg--err', !ok);
  };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const val = email.value.trim();
    if (!validEmail(val)) { show('Merci d\'indiquer un email valide.', false); email.focus(); return; }
    if (!consent.checked) { show('Merci de cocher la case de consentement.', false); return; }

    const res = Store.subscribe({ email: val, nom: nom.value.trim() });
    if (res && res.ok) {
      show(res.already ? 'Vous êtes déjà des nôtres — à très vite à l\'institut.'
                       : 'Merci ! Votre inscription est bien enregistrée.', true);
      form.reset();
    } else {
      show('Une erreur est survenue, réessayez.', false);
    }
  });
})();
