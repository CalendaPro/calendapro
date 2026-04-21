// Avatar Generator Library
// Generate beautiful SVG avatars as fallback when no photo is uploaded

export interface AvatarConfig {
  name: string;
  accentColor: string;
  size?: number;
  style?: 'initials' | 'gradient' | 'custom';
}

export function generateAvatarSVG(config: AvatarConfig): string {
  const { name, accentColor, size = 128, style = 'initials' } = config;

  const initials = extractInitials(name);

  if (style === 'initials') {
    return generateInitialsAvatar(initials, accentColor, size);
  } else if (style === 'gradient') {
    return generateGradientAvatar(initials, accentColor, size);
  } else if (style === 'custom') {
    return generateCustomAvatar(initials, accentColor, size);
  }

  return generateInitialsAvatar(initials, accentColor, size);
}

// STYLE 1: Initiales + Gradient (default)
export function generateInitialsAvatar(
  initials: string,
  accentColor: string,
  size: number
): string {
  const bgColor = accentColor;
  const textColor = '#ffffff';
  const fontSize = Math.floor(size * 0.4);
  const darkerColor = darkenColor(bgColor, 20);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${darkerColor};stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad-${size})" />
    <text
      x="${size / 2}"
      y="${size / 2}"
      font-size="${fontSize}"
      font-weight="600"
      font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fill="${textColor}"
      text-anchor="middle"
      dominant-baseline="central"
      letter-spacing="1"
    >
      ${initials}
    </text>
  </svg>`;
}

// STYLE 2: Gradient abstract with decorative shapes
export function generateGradientAvatar(
  initials: string,
  accentColor: string,
  size: number
): string {
  const colors = generateComplementaryColors(accentColor);
  const fontSize = Math.floor(size * 0.35);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#grad-${size})" />
    <circle cx="${size / 4}" cy="${size / 4}" r="${size / 6}" fill="${colors.accent}" opacity="0.3" />
    <circle cx="${size * 0.75}" cy="${size * 0.75}" r="${size / 8}" fill="${colors.accent}" opacity="0.2" />
    <text
      x="${size / 2}"
      y="${size / 2}"
      font-size="${fontSize}"
      font-weight="600"
      font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fill="rgba(255, 255, 255, 0.5)"
      text-anchor="middle"
      dominant-baseline="central"
    >
      ${initials}
    </text>
  </svg>`;
}

// STYLE 3: Custom minimalist with rounded square
export function generateCustomAvatar(
  initials: string,
  accentColor: string,
  size: number
): string {
  const fontSize = Math.floor(size * 0.45);
  const cornerRadius = size / 6;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="0"
      y="0"
      width="${size}"
      height="${size}"
      rx="${cornerRadius}"
      fill="${accentColor}"
    />
    <text
      x="${size / 2}"
      y="${size / 2}"
      font-size="${fontSize}"
      font-weight="700"
      font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fill="#ffffff"
      text-anchor="middle"
      dominant-baseline="central"
    >
      ${initials}
    </text>
  </svg>`;
}

// HELPERS
function extractInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) - amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));
  return (
    '#' +
    (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
  );
}

function generateComplementaryColors(hexColor: string) {
  // Simple complementary colors generation
  const primary = hexColor;
  const secondary = rotateHue(hexColor, 30);
  const accent = rotateHue(hexColor, 60);

  return { primary, secondary, accent };
}

function rotateHue(hex: string, degrees: number): string {
  // Convert hex to HSL, rotate hue, convert back to hex
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Predefined color palettes for consistent branding
type ColorPalette = {
  name: string;
  colors: string[];
};

export const PREDEFINED_PALETTES: ColorPalette[] = [
  { name: 'Calm Blue', colors: ['#3B82F6', '#60A5FA', '#93C5FD'] },
  { name: 'Sunset Orange', colors: ['#F97316', '#FB923C', '#FDBA74'] },
  { name: 'Nature Green', colors: ['#22C55E', '#4ADE80', '#86EFAC'] },
  { name: 'Royal Purple', colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'] },
  { name: 'Rose Pink', colors: ['#F43F5E', '#FB7185', '#FDA4AF'] },
  { name: 'Ocean Teal', colors: ['#14B8A6', '#2DD4BF', '#5EEAD4'] },
  { name: 'Golden Amber', colors: ['#F59E0B', '#FBBF24', '#FCD34D'] },
  { name: 'Slate Gray', colors: ['#64748B', '#94A3B8', '#CBD5E1'] },
];

// Get a deterministic color from name for consistent avatars
export function getColorFromName(name: string): string {
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const paletteIndex = hash % PREDEFINED_PALETTES.length;
  return PREDEFINED_PALETTES[paletteIndex].colors[0];
}

// Encode SVG for use in data URI
export function svgToDataURI(svg: string): string {
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
