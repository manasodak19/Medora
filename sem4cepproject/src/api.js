/**
 * MEDORA API Service Layer
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = '/api';

// ── Token Management ─────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('medora_token');
}

export function setToken(token) {
  localStorage.setItem('medora_token', token);
}

export function clearToken() {
  localStorage.removeItem('medora_token');
}

// ── HTTP Helper ──────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data.detail || 'Something went wrong';
    throw new Error(message);
  }

  return data;
}

// ── Auth API ─────────────────────────────────────────────────

/**
 * Sign up a new user or pharmacist.
 * @param {Object} formData
 * @returns {Promise<{access_token, token_type, user}>}
 */
export async function signup(formData) {
  const payload = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    role: formData.role || 'user',
  };

  // Add pharmacist fields if applicable
  if (formData.role === 'pharmacist') {
    payload.pharmacy_name = formData.pharmacyName;
    payload.city = formData.city;
    payload.phone = formData.phone;
    payload.timings = formData.timings;
    payload.license_number = formData.licenseNumber;
    if (formData.lat) payload.lat = parseFloat(formData.lat);
    if (formData.lng) payload.lng = parseFloat(formData.lng);
  }

  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  // Store token
  setToken(data.access_token);
  return data;
}

/**
 * Sign in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token, token_type, user}>}
 */
export async function signin(email, password) {
  const data = await request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store token
  setToken(data.access_token);
  return data;
}

/**
 * Get current authenticated user from token.
 * @returns {Promise<{id, name, email, role, status}>}
 */
export async function getMe() {
  return request('/auth/me');
}

/**
 * Logout — clear token.
 */
export function logout() {
  clearToken();
}

// ── Admin API ────────────────────────────────────────────────

/**
 * Get all pharmacies (Admin only).
 */
export async function getPharmacies() {
  return request('/admin/pharmacies');
}

/**
 * Update pharmacy status (Admin only).
 * @param {string} id
 * @param {string} status 'verified', 'pending', 'denied', 'banned'
 */
export async function updatePharmacyStatus(id, status) {
  return request(`/admin/pharmacies/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Inventory API ────────────────────────────────────────────

export async function getMyInventory() {
  return request('/inventory/my');
}

export async function addInventoryItem(data) {
  return request('/inventory/my', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function addInventoryBatch(dataArray) {
  return request('/inventory/my/batch', {
    method: 'POST',
    body: JSON.stringify(dataArray),
  });
}

export async function updateInventoryItem(id, data) {
  return request(`/inventory/my/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInventoryItem(id) {
  return request(`/inventory/my/${id}`, {
    method: 'DELETE',
  });
}

// ── Search API ───────────────────────────────────────────────

export async function searchMedicines(query = '', category = 'All', lat = null, lng = null) {
  let url = `/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
  if (lat !== null && lng !== null) {
    url += `&lat=${lat}&lng=${lng}`;
  }
  return request(url);
}

// ── Booking API ──────────────────────────────────────────────

export async function createBooking(pharmacyId, items) {
  return request('/bookings/', {
    method: 'POST',
    body: JSON.stringify({
      pharmacy_id: pharmacyId,
      items: items
    }),
  });
}

export async function verifyBooking(qrToken) {
  return request('/bookings/verify', {
    method: 'POST',
    body: JSON.stringify({ qr_token: qrToken }),
  });
}
