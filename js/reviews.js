/* ============================================================
   Carrousel avis — défilement horizontal avec flèches
============================================================ */
(function () {
  const track = document.getElementById('review-track');
  if (!track) return;
  const prev = document.querySelector('.review-nav--prev');
  const next = document.querySelector('.review-nav--next');

  const step = function () {
    const card = track.querySelector('.review');
    if (!card) return track.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return card.getBoundingClientRect().width + gap;
  };

  const update = function () {
    const max = track.scrollWidth - track.clientWidth - 2;
    if (prev) prev.disabled = track.scrollLeft <= 2;
    if (next) next.disabled = track.scrollLeft >= max;
  };

  if (prev) prev.addEventListener('click', function () {
    track.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  if (next) next.addEventListener('click', function () {
    track.scrollBy({ left: step(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
