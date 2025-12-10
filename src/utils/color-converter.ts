interface ColorRange {
  name: string;
  minR: number;
  maxR: number;
  minG: number;
  maxG: number;
  minB: number;
  maxB: number;
}

const COLOR_RANGES: ColorRange[] = [
  { name: 'Black', minR: 0, maxR: 50, minG: 0, maxG: 50, minB: 0, maxB: 50 },
  { name: 'White', minR: 240, maxR: 255, minG: 240, maxG: 255, minB: 240, maxB: 255 },
  { name: 'Gray', minR: 100, maxR: 180, minG: 100, maxG: 180, minB: 100, maxB: 180 },
  { name: 'Red', minR: 180, maxR: 255, minG: 0, maxG: 80, minB: 0, maxB: 80 },
  { name: 'Crimson', minR: 150, maxR: 220, minG: 0, maxG: 50, minB: 40, maxB: 90 },
  { name: 'Orange', minR: 200, maxR: 255, minG: 100, maxG: 180, minB: 0, maxB: 70 },
  { name: 'Yellow', minR: 200, maxR: 255, minG: 200, maxG: 255, minB: 0, maxB: 100 },
  { name: 'Gold', minR: 180, maxR: 255, minG: 150, maxG: 220, minB: 0, maxB: 80 },
  { name: 'Lime', minR: 150, maxR: 220, minG: 200, maxG: 255, minB: 0, maxB: 100 },
  { name: 'Green', minR: 0, maxR: 150, minG: 150, maxG: 255, minB: 0, maxB: 150 },
  { name: 'Teal', minR: 0, maxR: 100, minG: 150, maxG: 220, minB: 150, maxB: 220 },
  { name: 'Cyan', minR: 0, maxR: 100, minG: 200, maxG: 255, minB: 200, maxB: 255 },
  { name: 'Sky Blue', minR: 100, maxR: 180, minG: 180, maxG: 240, minB: 220, maxB: 255 },
  { name: 'Blue', minR: 0, maxR: 100, minG: 100, maxG: 180, minB: 200, maxB: 255 },
  { name: 'Navy', minR: 0, maxR: 80, minG: 0, maxG: 80, minB: 100, maxB: 180 },
  { name: 'Purple', minR: 100, maxR: 180, minG: 0, maxG: 100, minB: 150, maxB: 255 },
  { name: 'Violet', minR: 180, maxR: 255, minG: 100, maxG: 180, minB: 200, maxB: 255 },
  { name: 'Magenta', minR: 200, maxR: 255, minG: 0, maxG: 100, minB: 200, maxB: 255 },
  { name: 'Pink', minR: 220, maxR: 255, minG: 150, maxG: 220, minB: 180, maxB: 240 },
  { name: 'Rose', minR: 200, maxR: 255, minG: 100, maxG: 180, minB: 130, maxB: 200 },
  { name: 'Brown', minR: 100, maxR: 180, minG: 50, maxG: 120, minB: 0, maxB: 80 },
  { name: 'Beige', minR: 200, maxR: 245, minG: 200, maxG: 230, minB: 180, maxB: 220 },
  { name: 'Tan', minR: 180, maxR: 230, minG: 150, maxG: 200, minB: 100, maxB: 170 },
  { name: 'Silver', minR: 180, maxR: 220, minG: 180, maxG: 220, minB: 180, maxB: 220 },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');

  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return null;
  }

  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }

  return { r, g, b };
}

function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function hexToColorName(hex: string): string {
  if (!hex) return '';

  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const brightness = getBrightness(r, g, b);

  for (const colorRange of COLOR_RANGES) {
    if (
      r >= colorRange.minR && r <= colorRange.maxR &&
      g >= colorRange.minG && g <= colorRange.maxG &&
      b >= colorRange.minB && b <= colorRange.maxB
    ) {
      if (colorRange.name === 'Gray') {
        if (brightness < 80) return 'Dark Gray';
        if (brightness > 180) return 'Light Gray';
      }
      if (colorRange.name === 'Blue' && brightness < 100) return 'Dark Blue';
      if (colorRange.name === 'Green' && brightness < 100) return 'Dark Green';
      if (colorRange.name === 'Red' && brightness < 100) return 'Dark Red';

      return colorRange.name;
    }
  }

  if (brightness < 30) return 'Black';
  if (brightness > 240) return 'White';
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
    if (brightness < 100) return 'Dark Gray';
    if (brightness > 180) return 'Light Gray';
    return 'Gray';
  }

  // Determine dominant color channel and return generic name
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max - min < 30) {
    return brightness < 128 ? 'Dark Gray' : 'Light Gray';
  }

  if (r === max && g > b) return brightness < 128 ? 'Dark Orange' : 'Orange';
  if (r === max && b > g) return brightness < 128 ? 'Dark Red' : 'Red';
  if (g === max && r > b) return brightness < 128 ? 'Olive' : 'Yellow-Green';
  if (g === max) return brightness < 128 ? 'Dark Green' : 'Green';
  if (b === max && g > r) return brightness < 128 ? 'Teal' : 'Cyan';
  if (b === max) return brightness < 128 ? 'Navy' : 'Blue';

  return 'Custom Color';
}
