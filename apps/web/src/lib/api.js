const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    credentials: "include"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }

  return res.json().catch(() => null);
}

export function apiGetMe() {
  return apiRequest("/me");
}

export function apiSignIn({ email, name }) {
  return apiRequest("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, name })
  });
}

export function apiSignOut() {
  return apiRequest("/auth/signout", { method: "POST" });
}

export function apiTrackEvent({ type, properties }) {
  return apiRequest("/track", {
    method: "POST",
    body: JSON.stringify({
      type,
      properties: properties || undefined
    })
  });
}

export function apiJoinWaitlist({ name, contact, referredBy }) {
  return apiRequest("/waitlist", {
    method: "POST",
    body: JSON.stringify({ name, contact, referredBy: referredBy || undefined })
  });
}

export function apiCheckReferrer({ name }) {
  return apiRequest("/waitlist/check-referrer", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function apiLookupRefCode(code) {
  return apiRequest(`/waitlist/referral/${encodeURIComponent(code)}`);
}
