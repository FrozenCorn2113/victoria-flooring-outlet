export const GA_MEASUREMENT_ID = 'G-3SH7W4SG49';

const isBrowser = () => typeof window !== 'undefined';

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
    ...params,
  });
};

export const trackEcommerce = (eventName, params) => {
  if (!isBrowser()) return;
  safeGtag('event', eventName, params);
};
