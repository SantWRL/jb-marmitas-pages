const ADMIN_PASSWORD = 'marmita2026';
const ADMIN_SESSION_KEY = 'marmitaria_admin_session';

export function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'authenticated';
}

export function loginAdmin(password) {
  if (password !== ADMIN_PASSWORD) return false;
  sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated');
  return true;
}

export function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.reload();
}
