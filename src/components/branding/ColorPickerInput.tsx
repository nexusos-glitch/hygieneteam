import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function generateHoverColor(hex: string): string {
  // A simple function just to prevent errors
  return hex;
}

interface ColorPickerInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function ColorPickerInput({ id, label, value, onChange, readOnly }: ColorPickerInputProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-3">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="flex-1 uppercase font-mono"
          maxLength={7}
        />
      </div>
    </div>
  );
}
