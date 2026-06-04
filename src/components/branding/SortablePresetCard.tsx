import React from "react";
import { Card } from "@/components/ui/card";
import { BrandingSettings } from "@/hooks/useBrandingSettings";
import { Check, Edit, Loader2, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SortablePresetCardProps {
  preset: any;
  isActive: boolean;
  onApply: (preset: any) => void;
  onEdit: (preset: any) => void;
  onShare: (preset: any) => void;
  onDelete: (preset: any) => void;
  isApplying: boolean;
  isDeleting: boolean;
}

export function SortablePresetCard({
  preset,
  isActive,
  onApply,
  onEdit,
  onShare,
  onDelete,
  isApplying,
  isDeleting
}: SortablePresetCardProps) {
  return (
    <Card className={cn("relative p-4 border", isActive && "border-indigo-500 ring-1 ring-indigo-500")}>
      <div className="flex justify-between">
        <div>
          <h4 className="font-medium text-sm">{preset.name}</h4>
          {preset.description && <p className="text-xs text-muted-foreground line-clamp-1">{preset.description}</p>}
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary_color }} title="Primary" />
        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent_color }} title="Accent" />
      </div>
      <div className="flex justify-between mt-4">
        <Button variant="outline" size="sm" onClick={() => onApply(preset)} disabled={isApplying}>
          {isActive ? <Check className="w-4 h-4 mr-2" /> : null}
          {isActive ? "Active" : "Apply"}
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(preset)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onShare(preset)}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(preset)} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
