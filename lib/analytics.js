export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-F4Z6M1ZHVN';

const isBrowser = () => typeof window !== 'undefined';

const getDebugMode = () => {
  if (!isBrowser()) return false;
  return window.location.search.includes('ga_debug=1');
};

const safeGtag = (...args) => {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
    return;
  }
  window.dataLayer.push(args);
};

export const pageview = (url) => {
  if (!isBrowser() || !GA_MEASUREMENT_ID) return;
  safeGtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value, ...params }) => {
  if (!isBrowser()) return;
  safeGtag('event', action, {
    event_category: category,
    event_label: label,
    value,
    ...(getDebugMode() ? { debug_mode: true } : {}),
    ...params,
  });
};

export const trackEcommerce = (eventName, params) => {
  if (!isBrowser()) return;
  safeGtag('event', eventName, {
    ...(getDebugMode() ? { debug_mode: true } : {}),
    ...params,
  });
};
