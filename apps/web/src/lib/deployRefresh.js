const CURRENT_BUILD_ID = __LSD_BUILD_ID__;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_KEY = "lsd_last_reload_build_id";

async function clearAppShellCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.includes("workbox-precache"))
      .map((key) => caches.delete(key)),
  );
}

async function updateServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  await registration?.update();
}

async function checkForDeployUpdate() {
  if (document.visibilityState === "hidden") return;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return;
    const { buildId } = await res.json();
    if (!buildId || buildId === CURRENT_BUILD_ID) return;
    if (sessionStorage.getItem(RELOAD_KEY) === buildId) return;

    sessionStorage.setItem(RELOAD_KEY, buildId);
    await updateServiceWorker();
    await clearAppShellCaches();
    window.location.reload();
  } catch {
    // Offline or blocked version checks should never interrupt the site.
  }
}

function installServiceWorkerRefresh() {
  if (!("serviceWorker" in navigator)) return;
  let refreshing = false;
  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    updateServiceWorker().catch(() => {});
  });
}

export function installDeployRefresh() {
  installServiceWorkerRefresh();

  window.addEventListener("focus", checkForDeployUpdate);
  document.addEventListener("visibilitychange", checkForDeployUpdate);
  window.setInterval(checkForDeployUpdate, CHECK_INTERVAL_MS);
  checkForDeployUpdate();
}
