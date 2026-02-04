import axios from 'axios';
import confetti from 'canvas-confetti';

export const formatCurrency = (amount = 0, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(amount / 100);

export const upgradeWixImageUrl = (url, width = 1600, quality = 85) => {
  if (!url) return url;

  // Handle /v1/fit/ format: /v1/fit/w_500,h_500,q_90/
  const fitReplaced = url.replace(
    /\/v1\/fit\/w_\d+,h_\d+,q_\d+\//,
    `/v1/fit/w_${width},h_${width},q_${quality}/`
  );
  if (fitReplaced !== url) return fitReplaced;

  // Handle /v1/fill/ format with various parameters including blur
  // Example: /v1/fill/w_100,h_60,al_c,q_80,usm_0.66_1.00_0.01,blur_2,enc_avif,quality_auto/filename.jpg
  const fillMatch = url.match(/\/v1\/fill\/[^/]+\/([^/]+)$/);
  if (fillMatch) {
    const filename = fillMatch[1];
    // Replace the entire fill parameters with clean high-res settings
    return url.replace(
      /\/v1\/fill\/[^/]+\/[^/]+$/,
      `/v1/fill/w_${width},h_${width},al_c,q_${quality}/${filename}`
    );
  }

  return url;
};

export const isClient = typeof window === 'object';

export const fetcher = url => axios.get(url).then(res => res.data);

export const shootFireworks = () => {
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 },
      })
    );
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 },
      })
    );
  }, 250);
};
