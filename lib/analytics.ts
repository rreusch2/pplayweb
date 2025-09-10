declare global {
  interface Window {
    fbq: any;
    gtag: any;
  }
}

// Facebook Pixel tracking functions
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Load Facebook Pixel
  (function(f: any, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
};

// Track specific events
export const trackEvent = (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  console.log(`📊 Tracking FB Pixel Event: ${eventName}`, parameters);
  window.fbq('track', eventName, parameters);
};

// Custom events for your conversion funnel
export const trackSignupStart = () => {
  trackEvent('InitiateCheckout', {
    content_name: 'Account Signup',
    content_category: 'Registration'
  });
};

export const trackSignupComplete = (userId?: string) => {
  trackEvent('CompleteRegistration', {
    content_name: 'Account Created',
    status: 'completed',
    user_id: userId
  });
};

export const trackSubscriptionStart = (plan: string) => {
  trackEvent('InitiateCheckout', {
    content_name: `${plan} Subscription`,
    content_category: 'Subscription'
  });
};

export const trackSubscriptionComplete = (plan: string, value: number) => {
  trackEvent('Purchase', {
    value: value,
    currency: 'USD',
    content_name: `${plan} Plan`,
    content_category: 'Subscription'
  });
};

export const trackAppStoreClick = () => {
  trackEvent('Lead', {
    content_name: 'App Store Download',
    content_category: 'Mobile App'
  });
};

export const trackCTAClick = (ctaName: string) => {
  trackEvent('Lead', {
    content_name: ctaName,
    content_category: 'CTA Button'
  });
};

// Google Analytics functions (recommended additional tracking)
export const initGoogleAnalytics = (measurementId: string) => {
  if (typeof window === 'undefined') return;

  // Load Google Analytics
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.gtag = function() {
    // @ts-ignore
    window.dataLayer = window.dataLayer || [];
    // @ts-ignore
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
};

export const trackGoogleEvent = (eventName: string, parameters?: any) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  console.log(`📈 Tracking GA Event: ${eventName}`, parameters);
  window.gtag('event', eventName, parameters);
};
