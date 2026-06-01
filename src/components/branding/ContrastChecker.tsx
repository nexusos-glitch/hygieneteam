import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ContrastCheckerProps {
  foregroundHsl: string;
  backgroundHsl: string;
  label?: string;
}

// Convert HSL string "h s% l%" to RGB values
function hslToRgb(hslString: string): { r: number; g: number; b: number } {
  try {
    const parts = hslString.trim().split(/\s+/);
    if (parts.length < 3) return { r: 0, g: 0, b: 0 };
    
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1].replace("%", "")) / 100;
    const l = parseFloat(parts[2].replace("%", "")) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
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
  } catch {
    return { r: 0, g: 0, b: 0 };
  }
}

// Calculate relative luminance per WCAG 2.1
function getRelativeLuminance(r: number, g: number, b: number): number {
  const sRGB = [r, g, b].map((v) => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// Calculate contrast ratio per WCAG 2.1
function getContrastRatio(fg: string, bg: string): number {
  const fgRgb = hslToRgb(fg);
  const bgRgb = hslToRgb(bg);
  
  const fgLum = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG thresholds
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3;
const WCAG_AAA_NORMAL = 7;
const WCAG_AAA_LARGE = 4.5;

export function ContrastChecker({ foregroundHsl, backgroundHsl, label }: ContrastCheckerProps) {
  const ratio = getContrastRatio(foregroundHsl, backgroundHsl);
  
  const passesAANormal = ratio >= WCAG_AA_NORMAL;
  const passesAALarge = ratio >= WCAG_AA_LARGE;
  const passesAAANormal = ratio >= WCAG_AAA_NORMAL;
  const passesAAALarge = ratio >= WCAG_AAA_LARGE;

  const getOverallStatus = () => {
    if (passesAAANormal) return { icon: CheckCircle, color: "text-green-600", label: "Excellent" };
    if (passesAANormal) return { icon: CheckCircle, color: "text-green-500", label: "Good" };
    if (passesAALarge) return { icon: AlertTriangle, color: "text-yellow-500", label: "Large text only" };
    return { icon: XCircle, color: "text-red-500", label: "Fails WCAG" };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <div className="p-3 bg-muted/50 rounded-lg border">
      {label && <p className="text-xs text-muted-foreground mb-2">{label}</p>}
      
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className="font-medium text-sm">{ratio.toFixed(2)}:1</span>
        </div>
        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
      </div>

      {/* Preview sample */}
      <div 
        className="p-2 rounded text-center text-sm font-medium mb-3"
        style={{ 
          backgroundColor: `hsl(${backgroundHsl})`, 
          color: `hsl(${foregroundHsl})` 
        }}
      >
        Sample Text
      </div>

      {/* WCAG breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          {passesAANormal ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-400" />
          )}
          <span className="text-muted-foreground">AA Normal</span>
        </div>
        <div className="flex items-center gap-1">
          {passesAALarge ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-400" />
          )}
          <span className="text-muted-foreground">AA Large</span>
        </div>
        <div className="flex items-center gap-1">
          {passesAAANormal ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-400" />
          )}
          <span className="text-muted-foreground">AAA Normal</span>
        </div>
        <div className="flex items-center gap-1">
          {passesAAALarge ? (
            <CheckCircle className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-400" />
          )}
          <span className="text-muted-foreground">AAA Large</span>
        </div>
      </div>
    </div>
  );
}

