import { useEffect } from 'react';
import { Platform } from 'react-native';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap';

/**
 * Inject Google Fonts on web so letter typography actually loads.
 */
export default function WebFonts() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('meeting-fonts')) return;

    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const link = document.createElement('link');
    link.id = 'meeting-fonts';
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.id = 'meeting-font-base';
    style.textContent = `
      html, body, #root {
        font-family: "Vazirmatn", Tahoma, sans-serif;
        background: #2A1520;
      }
      @keyframes letter-shimmer {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
