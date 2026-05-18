/* ── Helpers ────────────────────────────────────────────────── */
function showError(msg) {
  const el = document.getElementById('errorAlert');
  const msgEl = document.getElementById('errorMsg');
  if (el && msgEl) { msgEl.textContent = msg; el.classList.add('show'); }
}

function hideError() {
  const el = document.getElementById('errorAlert');
  if (el) el.classList.remove('show');
}

function showSuccess() {
  const el = document.getElementById('successAlert');
  if (el) el.classList.add('show');
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁';
}

/* ── Login ──────────────────────────────────────────────────── */
async function handleLogin() {
  hideError();
  const email    = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;

  if (!email || !password) { showError('Please fill in all fields.'); return; }

  setLoading('loginBtn', true);

  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.redirected) { window.location.href = res.url; return; }

    const data = await res.json();

    if (res.ok) {
      window.location.href = '/projects';
    } else {
      showError(data.error || data.errors?.[0]?.msg || 'Login failed.');
    }
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    setLoading('loginBtn', false);
  }
}

/* ── Register ───────────────────────────────────────────────── */
async function handleRegister() {
  hideError();

  const name            = document.getElementById('name')?.value.trim();
  const email           = document.getElementById('email')?.value.trim();
  const password        = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const role            = document.getElementById('role')?.value;
  const terms           = document.getElementById('terms')?.checked;

  if (!name || !email || !password || !confirmPassword) {
    showError('Please fill in all required fields.'); return;
  }
  if (password !== confirmPassword) {
    showError('Passwords do not match.'); return;
  }
  if (password.length < 8) {
    showError('Password must be at least 8 characters.'); return;
  }
  if (!terms) {
    showError('You must agree to the Terms of Service.'); return;
  }

  setLoading('registerBtn', true);

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (res.redirected) { window.location.href = res.url; return; }

    const data = await res.json();

    if (res.ok) {
      showSuccess();
      setTimeout(() => window.location.href = '/projects', 1500);
    } else {
      showError(data.error || data.errors?.[0]?.msg || 'Registration failed.');
    }
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    setLoading('registerBtn', false);
  }
}

/* ── Password Strength ──────────────────────────────────────── */
function checkStrength(pw) {
  const bars = [
    document.getElementById('bar1'),
    document.getElementById('bar2'),
    document.getElementById('bar3'),
  ];
  const hint = document.getElementById('pwHint');
  if (!bars[0]) return;

  bars.forEach(b => b.className = 'pw-bar');

  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;

  const levels = [
    { cls: 'weak',   label: 'Weak — add uppercase and numbers.' },
    { cls: 'weak',   label: 'Weak — add uppercase and numbers.' },
    { cls: 'medium', label: 'Medium — try adding a symbol.' },
    { cls: 'strong', label: 'Strong password!' },
  ];

  const lvl = levels[Math.max(0, score - 1)] || levels[0];

  for (let i = 0; i < score; i++) {
    if (bars[i]) bars[i].classList.add(lvl.cls);
  }
  if (hint) hint.textContent = pw.length ? lvl.label : 'Use 8+ characters with uppercase and a number.';
}

/* ── Logout ─────────────────────────────────────────────────── */
async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/auth/login';
}

/* ── Enter key support ──────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (document.getElementById('loginBtn'))    handleLogin();
  if (document.getElementById('registerBtn')) handleRegister();
});
