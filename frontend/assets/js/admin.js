const API_BASE = 'http://localhost:3000';
const TOKEN_KEY = 'docassist_admin_token';

const form = document.getElementById('loginForm');
const userInput = document.getElementById('user');
const passInput = document.getElementById('pass');
const errorEl = document.getElementById('loginError');
const submitButton = form.querySelector('button[type="submit"]');

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.textContent = '';
  errorEl.hidden = true;
}

async function login(user, password) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível fazer login.');
  }

  return data.token;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const user = userInput.value.trim();
  const password = passInput.value;

  if (!user || !password) {
    showError('Informe usuário e senha.');
    return;
  }

  submitButton.disabled = true;

  try {
    const token = await login(user, password);
    sessionStorage.setItem(TOKEN_KEY, token);
    window.location.href = 'admin_dashboard.html';
  } catch (error) {
    showError(error.message);
  } finally {
    submitButton.disabled = false;
  }
});
