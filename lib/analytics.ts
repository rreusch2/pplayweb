declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any[];
    _fbq: any;
  }
}

// Facebook Pixel tracking functions
export const initFacebookPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Skip if already loaded
  if (window.fbq) return;

  // Initialize queue for commands before script loads
  const commandQueue: any[] = [];

  // Create stub function
  (window as any).fbq = function(...args: any[]) {
    commandQueue.push(args);
  };

  // Add required properties
  (window as any).fbq.queue = commandQueue;
  (window as any).fbq.push = (window as any).fbq;
  (window as any).fbq.loaded = true;
  (window as any).fbq.version = '2.0';

  // Set _fbq if not exists
  if (!(window as any)._fbq) {
    (window as any)._fbq = (window as any).fbq;
  }

  // Load Facebook Pixel script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  // Process queued commands when script loads
  script.onload = () => {
    commandQueue.forEach(args => {
      if (window.fbq && typeof window.fbq === 'function') {
        window.fbq(...args);
      }
    });
  };

  // Initialize pixel
  (window as any).fbq('init', pixelId);
  (window as any).fbq('track', 'PageView');
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
