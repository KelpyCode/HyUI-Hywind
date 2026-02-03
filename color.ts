function mul3x3(A: number[], v: number[]): number[] {
    return [
        A[0] * v[0] + A[1] * v[1] + A[2] * v[2],
        A[3] * v[0] + A[4] * v[1] + A[5] * v[2],
        A[6] * v[0] + A[7] * v[1] + A[8] * v[2],
    ];
}

// OKLCH (L: 0–1, C: ~0–0.4, H: 0–360) → OKLab
function oklchToOklab(lch: [number, number, number]): [number, number, number] {
    const [L, C, H] = lch;
    const hRad = H * Math.PI / 180;
    return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

// OKLab → linear sRGB (D65)
function oklabToLinearSrgb(lab: [number, number, number]): [number, number, number] {
    const [L, a, b] = lab;

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;

    return mul3x3(
        [
            +4.0767416621, -3.3077115913, +0.2309699292,
            -1.2684380046, +2.6097574011, -0.3413193965,
            -0.0041960863, -0.7034186147, +1.7076147010,
        ],
        [l, m, s]
    );
}

// linear sRGB → gamma-corrected sRGB (0–1)
function linearToSrgbComponent(v: number): number {
    return v <= 0.0031308
        ? 12.92 * v
        : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function linearToSrgb(lin: number[]): number[] {
    return lin.map(linearToSrgbComponent);
}

// Parse "oklch(98.7% 0.022 95.277)" → [0.987, 0.022, 95.277]
function parseOklch(css: string): [number, number, number] | null {
    const match = css.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i);
    if (!match) return null;

    let [, lStr, cStr, hStr] = match;
    let L = parseFloat(lStr);
    if (css.includes('%')) L /= 100; // normalize lightness to 0–1

    return [L, parseFloat(cStr), parseFloat(hStr)];
}

// Main converter: string → { r,g,b } 0–255
export function oklchStringToRgb255(oklchStr: string): { r: number; g: number; b: number } | null {
    const lch = parseOklch(oklchStr);
    if (!lch) return null;

    const lab = oklchToOklab(lch);
    const lin = oklabToLinearSrgb(lab);
    const srgb = linearToSrgb(lin);

    // Clamp to sRGB gamut (simple clip — good enough for most palettes)
    const clamped = srgb.map(v => Math.max(0, Math.min(1, v)));

    return {
        r: Math.round(clamped[0] * 255),
        g: Math.round(clamped[1] * 255),
        b: Math.round(clamped[2] * 255),
    };
}

// Bonus: to hex
export function oklchStringToHex(oklchStr: string): string | null {
    const rgb = oklchStringToRgb255(oklchStr);
    if (!rgb) return null;
    return '#' + [rgb.r, rgb.g, rgb.b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    return '#' + [rgb.r, rgb.g, rgb.b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

export function rgbToString(rgb: { r: number; g: number; b: number }): string {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function stringToRgb(rgbStr: string): { r: number; g: number; b: number } | null {
    const match = rgbStr.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
    if (!match) return null;
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
    };
}
