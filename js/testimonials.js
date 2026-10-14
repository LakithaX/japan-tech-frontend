// Testimonial slider. Works on any element with the data-testimonials attribute.
// Optional: data-interval="6000" sets the time between slides in milliseconds.

document.querySelectorAll('[data-testimonials]').forEach(function (root) {
  const slides = Array.from(root.querySelectorAll('.testimonial-card'));
  const dotsBox = root.querySelector('.testimonial-dots');
  const interval = Number(root.dataset.interval) || 6000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let timer = null;
  let dots = [];

  function show(index) {
    current = (index + slides.length) % slides.length;     // wraps around at both ends

    slides.forEach(function (slide, i) {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach(function (dot, i) {
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function start() {
    if (reduceMotion || slides.length < 2) return;        // no auto-rotate for people who prefer less motion
    stop();
    timer = setInterval(function () { show(current + 1); }, interval);
    root.setAttribute('aria-live', 'off');
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    root.setAttribute('aria-live', 'polite');             // screen readers announce changes only when it is not rotating by itself
  }

  // build one dot per slide
  if (dotsBox && slides.length > 1) {
    slides.forEach(function (slide, i) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonial-dot';
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () {
        show(i);
        start();                                          // restart the timer so the slide is not skipped right away
      });
      dotsBox.appendChild(dot);
      dots.push(dot);
    });

    // left / right arrow keys move between the dots
    dotsBox.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      const next = current + (event.key === 'ArrowRight' ? 1 : -1);
      show(next);
      dots[current].focus();
      start();
    });
  }

  // pause while the pointer is over the slider or focus is inside it
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  // pause when the browser tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  // swipe left / right on touch screens
  let touchStartX = 0;
  root.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  root.addEventListener('touchend', function (event) {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 50) return;                  // ignore small movements and taps
    show(current + (distance < 0 ? 1 : -1));
    start();
  });

  // previous / next arrows (shown by the CSS on wide screens)
  root.querySelectorAll('.testimonial-arrow').forEach(function (arrow) {
    if (slides.length < 2) { arrow.hidden = true; return; }
    arrow.addEventListener('click', function () {
      show(current + (arrow.classList.contains('testimonial-arrow--next') ? 1 : -1));
      start();
    });
  });

  root.classList.add('is-ready');
  show(0);
  start();
});