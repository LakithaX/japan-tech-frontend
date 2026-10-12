console.log('nav.js is running');

const nav = document.querySelector('.nav');

window.addEventListener('scroll', function () {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

const navToggle = document.getElementById('navToggle');   // find the burger button

navToggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('menu-open');     // adds or removes the class
    navToggle.setAttribute('aria-expanded', isOpen);      // keep screen readers informed
});