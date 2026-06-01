import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MarkdownTextarea } from "@/components/updates/MarkdownTextarea";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface AppUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  features: string[];
  type: "major" | "minor" | "fix";
  published: boolean;
  published_at: string | null;
  created_at: string;
}

interface FormData {
  version: string;
  title: string;
  description: string;
  features: string[];
  type: "major" | "minor" | "fix";
}

const emptyUpdate: FormData = {
  version: "",
  title: "",
  description: "",
  features: [""],
  type: "minor",
};

export default function UpdatesAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useRole();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<AppUpdate | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyUpdate);
  const [updateToDelete, setUpdateToDelete] = useState<AppUpdate | null>(null);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadUpdates();
    }
  }, [roleLoading, isAdmin]);

  const loadUpdates = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("app_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error loading updates:", error);
      toast({
        title: "Error",
        description: "Failed to load updates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (update?: AppUpdate) => {
    if (update) {
      setEditingUpdate(update);
      setFormData({
        version: update.version,
        title: update.title,
        description: update.description,
        features: update.features.length > 0 ? update.features : [""],
        type: update.type,
      });
    } else {
      setEditingUpdate(null);
      setFormData(emptyUpdate);
    }
    setDialogOpen(true);
  };

  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };

  const handleSave = async () => {
    if (!formData.version || !formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const features = formData.features.filter((f) => f.trim() !== "");
    if (features.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one feature",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        version: formData.version,
        title: formData.title,
        description: formData.description,
        features,
        type: formData.type,
      };

      if (editingUpdate) {
        const { error } = await (supabase as any)
          .from("app_updates")
          .update(updateData)
          .eq("id", editingUpdate.id);

        if (error) throw error;
        toast({ title: "Update saved successfully" });
      } else {
        const { error } = await (supabase as any)
          .from("app_updates")
          .insert(updateData);

        if (error) throw error;
        toast({ title: "Update created successfully" });
      }

      setDialogOpen(false);
      loadUpdates();
    } catch (error: any) {
      console.error("Error saving update:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save update",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (update: AppUpdate) => {
    try {
      const newPublished = !update.published;
      const { error } = await (supabase as any)
        .from("app_updates")
        .update({
          published: newPublished,
          published_at: newPublished ? new Date().toISOString() : null,
        })
        .eq("id", update.id);

      if (error) throw error;
      toast({
        title: newPublished ? "Update published" : "Update unpublished",
      });
      loadUpdates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!updateToDelete) return;

    try {
      const { error } = await (supabase as any)
        .from("app_updates")
        .delete()
        .eq("id", updateToDelete.id);

      if (error) throw error;
      toast({ title: "Update deleted" });
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
      loadUpdates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "major":
        return <Badge className="bg-primary">Major</Badge>;
      case "minor":
        return <Badge variant="secondary">Minor</Badge>;
      case "fix":
        return <Badge variant="outline">Fix</Badge>;
      default:
        return null;
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            Only administrators can manage app updates.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Manage Updates</h2>
            <p className="text-muted-foreground">Create and publish app updates</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          New Update
        </Button>
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : updates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No updates yet. Create your first update!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">v{update.version}</span>
                    {getTypeBadge(update.type)}
                    {update.published ? (
                      <Badge className="bg-green-500">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground">{update.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{update.description}</p>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {update.features.length} features •{" "}
                      Created {format(new Date(update.created_at), "PPP")}
                      {update.published_at && (
                        <> • Published {format(new Date(update.published_at), "PPP")}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePublish(update)}
                    title={update.published ? "Unpublish" : "Publish"}
                  >
                    {update.published ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(update)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setUpdateToDelete(update);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? "Edit Update" : "Create New Update"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  placeholder="1.5.0"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, version: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "major" | "minor" | "fix") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="fix">Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="New Features & Improvements"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <MarkdownTextarea
                id="description"
                placeholder="A brief description of this update... (drag & drop or paste images)"
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddFeature}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="relative border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Feature {index + 1}</span>
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleRemoveFeature(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <MarkdownTextarea
                      placeholder="Feature description... (drag & drop images)"
                      value={feature}
                      onChange={(value) => handleFeatureChange(index, value)}
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Update?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete v{updateToDelete?.version} - {updateToDelete?.title}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
