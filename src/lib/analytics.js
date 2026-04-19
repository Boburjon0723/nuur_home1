export function trackEvent(name, payload = {}) {
  const event = { name, payload, ts: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent('catalog:analytics', { detail: event }));
  } catch {
    /* ignore analytics errors */
  }
  if (import.meta.env.DEV) {
    // Keep debug visibility in dev without external integrations.
    console.debug('[analytics]', event);
  }
}
