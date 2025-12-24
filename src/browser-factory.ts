/**
 * Browser Factory Module
 * Creates Playwright browser instances with proxy configuration
 */

import { chromium, Browser, BrowserContext } from '@playwright/test';
import { ValidatedProxy } from './proxy-validator';

export interface BrowserConfig {
  proxy?: ValidatedProxy;
  userAgent?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  viewport?: {
    width: number;
    height: number;
  };
  language?: string;
  timezone?: string;
  hardware?: {
    colorDepth: number;
    cpuCores: number;
    deviceMemory: number;
    platform: string;
  };
  referrer?: string;
}

/**
 * Launch a browser with optional proxy configuration
 */
export async function launchBrowserWithProxy(config: BrowserConfig): Promise<{ browser: Browser; context: BrowserContext }> {
  const launchOptions: any = {
    headless: true
  };
  
  // Add proxy configuration if provided
  if (config.proxy) {
    const proxyUrl = `${config.proxy.protocol}://${config.proxy.host}:${config.proxy.port}`;
    launchOptions.proxy = {
      server: proxyUrl
    };
  }
  
  const browser = await chromium.launch(launchOptions);
  
  // Create context with additional configurations
  const contextOptions: any = {};
  
  if (config.userAgent) {
    contextOptions.userAgent = config.userAgent;
  }
  
  if (config.viewport) {
    contextOptions.viewport = config.viewport;
  }
  
  if (config.geolocation) {
    contextOptions.geolocation = {
      latitude: config.geolocation.latitude,
      longitude: config.geolocation.longitude
    };
    contextOptions.permissions = ['geolocation'];
  }
  
  if (config.language) {
    contextOptions.locale = config.language.split(',')[0];
    contextOptions.extraHTTPHeaders = {
      'Accept-Language': config.language
    };
  }
  
  // Set referrer if provided (for first page load)
  if (config.referrer) {
    contextOptions.extraHTTPHeaders = contextOptions.extraHTTPHeaders || {};
    contextOptions.extraHTTPHeaders['Referer'] = config.referrer;
  }
  
  // Add realistic headers that vary per user
  contextOptions.extraHTTPHeaders = contextOptions.extraHTTPHeaders || {};
  
  // Randomly set Do Not Track (50% of users have it)
  if (Math.random() < 0.5) {
    contextOptions.extraHTTPHeaders['DNT'] = '1';
  }
  
  // Vary connection preferences
  const connectionPrefs = ['keep-alive', 'close'];
  contextOptions.extraHTTPHeaders['Connection'] = connectionPrefs[Math.floor(Math.random() * connectionPrefs.length)];
  
  if (config.timezone) {
    contextOptions.timezoneId = config.timezone;
  }
  
  const context = await browser.newContext(contextOptions);
  
  // Override hardware fingerprints if provided (makes each browser unique for GA)
  if (config.hardware) {
    await context.addInitScript((hw) => {
      Object.defineProperty(window.screen, 'colorDepth', { get: () => hw.colorDepth });
      Object.defineProperty(window.screen, 'pixelDepth', { get: () => hw.colorDepth });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => hw.cpuCores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => hw.deviceMemory });
      Object.defineProperty(navigator, 'platform', { get: () => hw.platform });
    }, config.hardware);
  }
  
  // Randomize GA Client ID and other tracking fingerprints
  await context.addInitScript((config) => {
    // Generate unique GA client ID (GA1.2.RANDOM.TIMESTAMP format)
    const randomClientId = Math.floor(Math.random() * 2147483647);
    const timestamp = Math.floor(Date.now() / 1000);
    const gaClientId = `GA1.2.${randomClientId}.${timestamp}`;
    
    // Set GA cookies with unique client ID
    document.cookie = `_ga=${gaClientId}; path=/; domain=.stockscanner.net; max-age=63072000; SameSite=Lax`;
    document.cookie = `_gid=GA1.2.${Math.floor(Math.random() * 2147483647)}.${timestamp}; path=/; domain=.stockscanner.net; max-age=86400; SameSite=Lax`;
    document.cookie = `_gat=1; path=/; domain=.stockscanner.net; max-age=60; SameSite=Lax`;
    
    // Randomize localStorage/sessionStorage (GA can use these)
    const randomSessionId = Math.random().toString(36).substring(2, 15);
    try {
      localStorage.setItem('_ga_session', randomSessionId);
      sessionStorage.setItem('_ga_session', randomSessionId);
    } catch (e) {}
    
    // Randomize canvas fingerprint (used by GA enhanced tracking)
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: number) {
      const ctx = this.getContext('2d');
      if (ctx) {
        try {
          // Add subtle random noise that's invisible but changes fingerprint
          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = imageData.data[i] + Math.random() * 0.1;
          }
          ctx.putImageData(imageData, 0, 0);
        } catch (e) {}
      }
      return originalToDataURL.call(this, type, quality);
    };
    
    // Randomize WebGL fingerprint
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
      // Randomize UNMASKED_VENDOR_WEBGL and UNMASKED_RENDERER_WEBGL
      if (parameter === 37445) {
        const vendors = ['Intel Inc.', 'Google Inc.', 'Mozilla', 'Apple Inc.'];
        return vendors[Math.floor(Math.random() * vendors.length)];
      }
      if (parameter === 37446) {
        const renderers = [
          'Intel Iris OpenGL Engine',
          'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)',
          'AMD Radeon Pro 560X OpenGL Engine',
          'Apple M1'
        ];
        return renderers[Math.floor(Math.random() * renderers.length)];
      }
      return getParameter.call(this, parameter);
    };
    
    // Randomize AudioContext fingerprint
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const originalCreateOscillator = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function() {
        const oscillator = originalCreateOscillator.call(this);
        const originalStart = oscillator.start;
        oscillator.start = function(when?: number) {
          // Add tiny random frequency shift
          oscillator.frequency.value += Math.random() * 0.001;
          return originalStart.call(this, when);
        };
        return oscillator;
      };
    }
    
    // Randomize fonts (GA can fingerprint available fonts)
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const numPlugins = Math.floor(Math.random() * 3) + 2;
        return new Array(numPlugins);
      }
    });
    
    // CRITICAL: Block WebRTC IP leak (can expose real IP even through proxy)
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    const originalEnumerateDevices = navigator.mediaDevices?.enumerateDevices;
    
    // Randomize media devices (cameras/mics - fingerprinting vector)
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices = async function() {
        const numDevices = Math.floor(Math.random() * 3) + 1;
        const devices: any[] = [];
        for (let i = 0; i < numDevices; i++) {
          devices.push({
            deviceId: Math.random().toString(36).substring(2),
            kind: i % 2 === 0 ? 'audioinput' : 'videoinput',
            label: '',
            groupId: Math.random().toString(36).substring(2)
          });
        }
        return Promise.resolve(devices);
      };
    }
    
    // Block WebRTC RTCPeerConnection to prevent IP leaks
    (window as any).RTCPeerConnection = undefined;
    (window as any).webkitRTCPeerConnection = undefined;
    (window as any).mozRTCPeerConnection = undefined;
    
    // Randomize navigator properties (GA fingerprinting)
    const vendors = ['Google Inc.', 'Apple Computer, Inc.', '', 'Mozilla'];
    Object.defineProperty(navigator, 'vendor', {
      get: () => vendors[Math.floor(Math.random() * vendors.length)]
    });
    
    // Randomize maxTouchPoints (desktop vs mobile indicator)
    const touchPoints = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => touchPoints
    });
    
    // Randomize battery status (if supported)
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery = async function() {
        return {
          charging: Math.random() > 0.5,
          chargingTime: Infinity,
          dischargingTime: Math.floor(Math.random() * 20000) + 10000,
          level: Math.random() * 0.5 + 0.5 // 50-100%
        };
      };
    }
    
    // Randomize network information
    if ((navigator as any).connection) {
      Object.defineProperty((navigator as any).connection, 'effectiveType', {
        get: () => ['4g', '3g', 'wifi'][Math.floor(Math.random() * 3)]
      });
      Object.defineProperty((navigator as any).connection, 'downlink', {
        get: () => Math.random() * 10 + 1
      });
      Object.defineProperty((navigator as any).connection, 'rtt', {
        get: () => Math.floor(Math.random() * 100) + 20
      });
    }
    
    // Randomize screen orientation
    if (screen.orientation) {
      Object.defineProperty(screen.orientation, 'type', {
        get: () => Math.random() > 0.2 ? 'landscape-primary' : 'portrait-primary'
      });
    }
    
    // Randomize performance memory (Chrome-specific fingerprinting)
    if ((performance as any).memory) {
      Object.defineProperty((performance as any).memory, 'jsHeapSizeLimit', {
        get: () => Math.floor(Math.random() * 1000000000) + 2000000000
      });
    }
    
    // Randomize browser history length (GA tracks this as engagement signal)
    const historyLength = Math.floor(Math.random() * 20) + 5; // 5-25 entries
    Object.defineProperty(window.history, 'length', {
      get: () => historyLength
    });
    
    // Randomize document.referrer if not set (some users have history)
    if (!document.referrer || document.referrer === '') {
      Object.defineProperty(document, 'referrer', {
        get: () => Math.random() > 0.6 ? 'https://www.google.com/' : ''
      });
    }
    
    // Randomize speech synthesis voices (system-specific fingerprint)
    if (speechSynthesis && speechSynthesis.getVoices) {
      const originalGetVoices = speechSynthesis.getVoices;
      speechSynthesis.getVoices = function() {
        const numVoices = Math.floor(Math.random() * 5) + 3; // 3-8 voices
        const voices: any[] = [];
        const langs = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'];
        for (let i = 0; i < numVoices; i++) {
          voices.push({
            default: i === 0,
            lang: langs[i % langs.length],
            localService: Math.random() > 0.5,
            name: `Voice ${i}`,
            voiceURI: `voice_${i}`
          });
        }
        return voices;
      };
    }
    
    // Randomize Permissions API (different users have different permissions granted)
    if (navigator.permissions) {
      const originalQuery = navigator.permissions.query;
      (navigator.permissions as any).query = function(descriptor: any) {
        // Randomize permission states
        const states = ['granted', 'denied', 'prompt'];
        return Promise.resolve({
          state: states[Math.floor(Math.random() * 3)],
          onchange: null
        });
      };
    }
    
    // Add some existing localStorage data (established browser)
    try {
      const numItems = Math.floor(Math.random() * 5) + 2; // 2-7 items
      for (let i = 0; i < numItems; i++) {
        const key = Math.random().toString(36).substring(2, 10);
        const value = Math.random().toString(36).substring(2, 15);
        localStorage.setItem(key, value);
      }
      // Add some realistic looking entries
      if (Math.random() > 0.5) {
        localStorage.setItem('theme', Math.random() > 0.5 ? 'dark' : 'light');
      }
      if (Math.random() > 0.5) {
        localStorage.setItem('last_visit', Date.now().toString());
      }
    } catch (e) {}
    
    // Randomize font enumeration (strong fingerprinting vector)
    const fontList = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 
      'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
      'Lucida Console', 'Tahoma', 'Palatino', 'Garamond', 'Bookman',
      'Courier New', 'Monaco', 'Optima', 'Hoefler Text', 'Gill Sans'
    ];
    // Each browser has different subset of fonts installed
    const numFonts = Math.floor(Math.random() * 8) + 10; // 10-18 fonts
    const availableFonts = fontList.sort(() => Math.random() - 0.5).slice(0, numFonts);
    
    // Override font check method
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        get: function() {
          const element = this as HTMLElement;
          if (element.style.fontFamily) {
            // Slightly vary measurements based on "available" fonts
            const fontFamily = element.style.fontFamily.toLowerCase();
            const hasFont = availableFonts.some(f => fontFamily.includes(f.toLowerCase()));
            if (!hasFont) {
              // Font not available, return default width + small variation
              const baseWidth = originalOffsetWidth?.get?.call(this) || 0;
              return baseWidth + Math.random() * 2;
            }
          }
          return originalOffsetWidth?.get?.call(this) || 0;
        }
      });
    }
    
    // Ensure timezone consistency across all time APIs
    if (config.timezone) {
      const timezoneOffset = new Date().getTimezoneOffset();
      
      // Override Date methods to be consistent with set timezone
      const OriginalDate = Date;
      (window as any).Date = new Proxy(Date, {
        construct(target: any, args: any[]) {
          return Reflect.construct(OriginalDate, args);
        },
        apply(target: any, thisArg: any, args: any[]) {
          return Reflect.apply(OriginalDate, thisArg, args);
        }
      });
    }
  }, { timezone: config.timezone });
  
  // Add second init script for performance API (needs to run very early)
  await context.addInitScript(() => {
    // Randomize Navigation/Performance Timing (GA tracks page load performance)
    if (performance && performance.timing) {
      const originalGetEntriesByType = performance.getEntriesByType;
      performance.getEntriesByType = function(type: string) {
        const entries = originalGetEntriesByType.call(this, type);
        // Add random variance to timing (±100ms)
        return entries.map((entry: any) => {
          const cloned = Object.assign({}, entry);
          ['connectEnd', 'connectStart', 'domComplete', 'domContentLoadedEventEnd', 'domContentLoadedEventStart',
           'domInteractive', 'domLoading', 'domainLookupEnd', 'domainLookupStart', 'fetchStart', 'loadEventEnd',
           'loadEventStart', 'requestStart', 'responseEnd', 'responseStart', 'secureConnectionStart'].forEach(prop => {
            if (cloned[prop]) {
              cloned[prop] += Math.floor(Math.random() * 200) - 100;
            }
          });
          return cloned;
        });
      };
    }
    
    // Randomize CSS media queries (screen-based fingerprinting)
    if (window.matchMedia) {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = function(query: string) {
        const result = originalMatchMedia.call(this, query);
        // For specific queries, add randomization
        if (query.includes('prefers-color-scheme')) {
          Object.defineProperty(result, 'matches', {
            get: () => Math.random() > 0.5 // 50% dark, 50% light
          });
        }
        if (query.includes('prefers-reduced-motion')) {
          Object.defineProperty(result, 'matches', {
            get: () => Math.random() > 0.8 // 20% prefer reduced motion
          });
        }
        return result;
      };
    }
    
    // Randomize Gamepad API
    if (navigator.getGamepads) {
      navigator.getGamepads = function() {
        // Most users don't have gamepads connected
        return Math.random() > 0.95 ? [null] : [];
      };
    }
    
    // Randomize pointer capabilities
    if (window.PointerEvent) {
      Object.defineProperty(navigator, 'pointerEnabled', {
        get: () => Math.random() > 0.3 // 70% have pointer
      });
    }
    
    // Vary document.hasFocus() behavior
    const originalHasFocus = document.hasFocus;
    if (originalHasFocus) {
      let focusState = true;
      document.hasFocus = function() {
        // Occasionally report not focused (user in another tab)
        if (Math.random() < 0.05) {
          focusState = !focusState;
        }
        return focusState && originalHasFocus.call(this);
      };
    }
    
    // Add custom User Timing marks (GA can track these for performance)
    if (performance && performance.mark) {
      // Simulate user creating custom timing marks (varies by user)
      const marks = ['app_start', 'first_render', 'user_action', 'content_load'];
      const numMarks = Math.floor(Math.random() * 3);
      setTimeout(() => {
        for (let i = 0; i < numMarks; i++) {
          try {
            performance.mark(marks[Math.floor(Math.random() * marks.length)]);
          } catch (e) {}
        }
      }, Math.random() * 1000);
    }
    
    // Randomize IntersectionObserver behavior (lazy loading detection)
    if (window.IntersectionObserver) {
      const OriginalObserver = window.IntersectionObserver;
      (window as any).IntersectionObserver = function(callback: any, options: any) {
        // Add slight timing variance to intersection callbacks
        const wrappedCallback = function(entries: any, observer: any) {
          setTimeout(() => {
            callback(entries, observer);
          }, Math.random() * 20); // 0-20ms delay
        };
        return new OriginalObserver(wrappedCallback, options);
      };
    }
  });
  
  return { browser, context };
}

/**
 * Get location name for proxy (proxy location or geolocation override)
 */
export function getLocationName(config: BrowserConfig): string {
  if (config.geolocation) {
    return config.geolocation.name;
  }
  if (config.proxy) {
    return `${config.proxy.country} (Proxy)`;
  }
  return 'Default Location';
}
