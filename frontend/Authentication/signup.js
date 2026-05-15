const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = IS_LOCAL ? 'http://127.0.0.1:5000' : 'https://devfinder-backend-ll4g.onrender.com';
const API = `${BASE_URL}/api`;

// ── Redirect if already logged in ──────────────────────
if (localStorage.getItem('token') && localStorage.getItem('user')) {
  window.location.href = '../Dashboard/dashboard.html';
}

// ── Toggle password visibility ──────────────────────────
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁';
  }
}

// ── Social login placeholder ────────────────────────────
function socialComingSoon() {
  const errorEl = document.getElementById('error-msg');
  errorEl.style.color = '#f59e0b';
  errorEl.textContent = 'Social login coming soon!';
  setTimeout(() => { errorEl.textContent = ''; }, 3000);
}

// ── Password strength tracker ───────────────────────────
let currentStrength = 0;

document.getElementById('signup-password').addEventListener('input', (e) => {
  const val = e.target.value;
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');

  let strength = 0;
  if (val.length >= 6) strength++;
  if (val.length >= 10) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  currentStrength = strength;

  // Reset fair-warning flag when user edits the password
  delete document.getElementById('signup-btn').dataset.fairWarned;

  // Clear any lingering strength error
  const errorEl = document.getElementById('error-msg');
  if (errorEl.dataset.source === 'strength') {
    errorEl.textContent = '';
    delete errorEl.dataset.source;
  }

  const levels = [
    { label: '', color: 'transparent', width: '0%' },
    { label: '⚠️ Weak — too easy to guess', color: '#e53935', width: '25%' },
    { label: '💡 Fair — try adding numbers or symbols', color: '#fb8c00', width: '50%' },
    { label: '👍 Good', color: '#fdd835', width: '75%' },
    { label: '✅ Strong', color: '#43a047', width: '90%' },
    { label: '🔒 Very Strong', color: '#1b5e20', width: '100%' },
  ];

  const level = levels[strength];
  fill.style.width = level.width;
  fill.style.background = level.color;
  label.textContent = level.label;
  label.style.color = level.color;
});

// ── Signup form submit ──────────────────────────────────
document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errorEl = document.getElementById('error-msg');
  const btn = document.getElementById('signup-btn');

  errorEl.style.color = '#e53935';
  errorEl.textContent = '';
  delete errorEl.dataset.source;

  // ── Basic field validation ────────────────────────────
  if (!name || !email || !password || !confirm)
    return (errorEl.textContent = 'All fields are required');

  if (password.length < 6)
    return (errorEl.textContent = 'Password must be at least 6 characters');

  // ── Password strength enforcement ─────────────────────
  if (currentStrength <= 1) {
    // Weak — block entirely
    errorEl.style.color = '#e53935';
    errorEl.textContent = '🚫 Password is too weak. Add uppercase letters, numbers, or symbols.';
    errorEl.dataset.source = 'strength';
    document.getElementById('signup-password').focus();
    return;
  }

  if (currentStrength === 2 && !btn.dataset.fairWarned) {
    // Fair — warn on first attempt, allow on second
    errorEl.style.color = '#fb8c00';
    errorEl.textContent = '💡 Your password is fair. Consider making it stronger — or click Create Account again to proceed anyway.';
    errorEl.dataset.source = 'strength';
    btn.dataset.fairWarned = 'true';
    return;
  }

  // Past strength check — clear the fair-warning flag
  delete btn.dataset.fairWarned;

  if (password !== confirm)
    return (errorEl.textContent = 'Passwords do not match');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return (errorEl.textContent = 'Enter a valid email address');

  // ── Loading state ─────────────────────────────────────
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.style.color = '#e53935';
      errorEl.textContent = data.error || 'Registration failed. Please try again.';
      return;
    }

    // Success
    errorEl.style.color = '#43a047';
    errorEl.textContent = '✅ Account created! Redirecting to login...';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);

  } catch (err) {
    errorEl.style.color = '#e53935';
    errorEl.textContent = 'Cannot reach server. Is the backend running?';
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
});