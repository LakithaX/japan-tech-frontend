const form = document.getElementById('contactForm');
const statusBox = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

const fields = {
  name:    { el: document.getElementById('name'),    err: document.getElementById('nameError') },
  email:   { el: document.getElementById('email'),   err: document.getElementById('emailError') },
  message: { el: document.getElementById('message'), err: document.getElementById('messageError') }
};

// returns an error message, or '' if the field is fine
function validate(key) {
  const value = fields[key].el.value.trim();

  if (key === 'name') {
    if (!value) return 'Please enter your name.';
    if (value.length < 2) return 'Your name looks too short.';
  }
  if (key === 'email') {
    if (!value) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Please enter a valid email, like name@example.com.';
  }
  if (key === 'message') {
    if (!value) return 'Please write a message.';
    if (value.length < 10) return 'Please write at least 10 characters so we can help.';
  }
  return '';
}

function showError(key, message) {
  const { el, err } = fields[key];
  err.textContent = message;
  el.closest('.form-field').classList.toggle('invalid', Boolean(message));
  el.setAttribute('aria-invalid', message ? 'true' : 'false');
}

// validate when leaving a field; once a field is marked invalid, re-check while typing
Object.keys(fields).forEach(function (key) {
  const { el } = fields[key];
  el.addEventListener('blur', function () { showError(key, validate(key)); });
  el.addEventListener('input', function () {
    if (el.closest('.form-field').classList.contains('invalid')) {
      showError(key, validate(key));
    }
  });
});

form.addEventListener('submit', function (event) {
  event.preventDefault();
  statusBox.textContent = '';
  statusBox.className = 'form-status';

  let firstInvalid = null;
  Object.keys(fields).forEach(function (key) {
    const message = validate(key);
    showError(key, message);
    if (message && !firstInvalid) firstInvalid = fields[key].el;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const data = {
    name: fields.name.el.value.trim(),
    email: fields.email.el.value.trim(),
    message: fields.message.el.value.trim()
  };

  sendMessage(data)
    .then(function () {
      form.reset();
      statusBox.textContent = 'Thanks, your message has been sent. We will reply within one business day.';
      statusBox.classList.add('success');
    })
    .catch(function () {
      statusBox.textContent = 'Your message could not be sent. Please try again or call us.';
      statusBox.classList.add('error');
    })
    .finally(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    });
});

// TODO: replace this with a real request, e.g. to Formspree, EmailJS or your own backend:
// return fetch('https://your-endpoint', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
//   .then(r => { if (!r.ok) throw new Error('failed'); });
function sendMessage(data) {
  console.log('Contact form data:', data);
  return new Promise(function (resolve) { setTimeout(resolve, 800); });
}
