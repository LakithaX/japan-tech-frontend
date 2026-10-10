console.log('nav.js is running');

const nav = document.querySelector('.nav');

window.addEventListener('scroll', function () {
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});