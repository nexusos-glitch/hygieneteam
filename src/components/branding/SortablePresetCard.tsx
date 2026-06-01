import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, CopyPlus, Pencil, Link2, Copy, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPreset {
  id: string;
  name: string;
  description: string | null;
  primary_color: string;
  primary_hover: string;
  accent_color: string;
  accent_hover: string;
  created_by: string;
  created_at: string;
  share_token: string | null;
  sort_order: number;
}

interface SortablePresetCardProps {
  preset: CustomPreset;
  isActive: boolean;
  onApply: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function SortablePresetCard({
  preset,
  isActive,
  onApply,
  onDuplicate,
  onEdit,
  onShare,
  onDelete,
}: SortablePresetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preset.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative p-3 rounded-lg border-2 transition-all text-left group",
        isActive
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-muted-foreground/50",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <button onClick={onApply} className="w-full text-left pl-4">
        {isActive && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        <div className="flex gap-1.5 mb-2">
          <div
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: `hsl(${preset.primary_color})` }}
          />
          <div
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: `hsl(${preset.accent_color})` }}
          />
        </div>
        <p className="font-medium text-sm">{preset.name}</p>
        {preset.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {preset.description}
          </p>
        )}
      </button>

      {/* Action buttons - show on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80"
          title="Duplicate preset"
        >
          <CopyPlus className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80"
          title="Edit preset"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
          className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
          title={preset.share_token ? "Copy share link" : "Generate share link"}
        >
          {preset.share_token ? <Copy className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
          title="Delete preset"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

