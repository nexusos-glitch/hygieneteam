import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface ColorPickerInputProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  sourceColor?: string;
  onAutoGenerate?: () => void;
}

// Convert HSL string "h s% l%" to hex
function hslToHex(hslString: string): string {
  try {
    const parts = hslString.trim().split(/\s+/);
    if (parts.length < 3) return "#000000";
    
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

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return "#000000";
  }
}

// Convert hex to HSL string "h s% l%"
function hexToHsl(hex: string): string {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 0%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

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
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return "0 0% 0%";
  }
}

export function ColorPickerInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  sourceColor,
  onAutoGenerate,
}: ColorPickerInputProps) {
  const hexValue = hslToHex(value || placeholder);

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hsl = hexToHsl(e.target.value);
    onChange(hsl);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {onAutoGenerate && sourceColor && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAutoGenerate}
            className="h-6 px-2 text-xs gap-1"
            title="Auto-generate darker shade"
          >
            <Wand2 className="h-3 w-3" />
            Auto
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <input
          type="color"
          value={hexValue}
          onChange={handleColorPickerChange}
          className="w-10 h-10 rounded border border-input cursor-pointer flex-shrink-0 p-0.5 bg-background"
          title="Pick a color"
        />
        <div
          className="w-10 h-10 rounded border flex-shrink-0"
          style={{ backgroundColor: `hsl(${value || placeholder})` }}
          title={`Preview: hsl(${value || placeholder})`}
        />
      </div>
    </div>
  );
}

// Utility function to generate a darker hover shade from a base HSL color
export function generateHoverColor(hslString: string): string {
  try {
    const parts = hslString.trim().split(/\s+/);
    if (parts.length < 3) return hslString;
    
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace("%", ""));
    let l = parseFloat(parts[2].replace("%", ""));
    
    // Darken by reducing lightness by 10%, with a minimum of 5%
    l = Math.max(5, l - 10);
    
    return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
  } catch {
    return hslString;
  }
}

