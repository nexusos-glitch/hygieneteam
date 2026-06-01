import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Upload, Palette, Building2, Settings2, Eye, Check, Plus, Save, Download, FileUp, CopyPlus, DollarSign } from "lucide-react";
import { PerformanceGoalsSettings } from "@/components/settings/PerformanceGoalsSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useBrandingSettings, useUpdateBrandingSettings, applyBrandingToDocument, BrandingSettings } from "@/hooks/useBrandingSettings";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortablePresetCard } from "@/components/branding/SortablePresetCard";
import { ColorPickerInput, generateHoverColor } from "@/components/branding/ColorPickerInput";
import { ContrastChecker } from "@/components/branding/ContrastChecker";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/hooks/useCurrency";

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

// Preset color themes
const colorPresets = [
  {
    name: "Bold Red",
    description: "Energetic and attention-grabbing",
    primary: "11 100% 49%",
    primaryHover: "11 100% 42%",
    accent: "38 92% 50%",
    accentHover: "38 92% 43%",
  },
  {
    name: "Professional Blue",
    description: "Trust and reliability",
    primary: "210 100% 45%",
    primaryHover: "210 100% 38%",
    accent: "175 60% 45%",
    accentHover: "175 60% 38%",
  },
  {
    name: "Modern Green",
    description: "Growth and sustainability",
    primary: "142 76% 36%",
    primaryHover: "142 76% 29%",
    accent: "38 92% 50%",
    accentHover: "38 92% 43%",
  },
  {
    name: "Royal Purple",
    description: "Creativity and luxury",
    primary: "270 70% 50%",
    primaryHover: "270 70% 43%",
    accent: "330 80% 60%",
    accentHover: "330 80% 53%",
  },
  {
    name: "Sunset Orange",
    description: "Warmth and enthusiasm",
    primary: "25 95% 53%",
    primaryHover: "25 95% 46%",
    accent: "45 93% 47%",
    accentHover: "45 93% 40%",
  },
  {
    name: "Ocean Teal",
    description: "Calm and professional",
    primary: "175 60% 45%",
    primaryHover: "175 60% 38%",
    accent: "200 85% 45%",
    accentHover: "200 85% 38%",
  },
  {
    name: "Slate Dark",
    description: "Sleek and modern",
    primary: "220 15% 30%",
    primaryHover: "220 15% 23%",
    accent: "200 85% 55%",
    accentHover: "200 85% 48%",
  },
  {
    name: "Rose Pink",
    description: "Friendly and approachable",
    primary: "340 82% 52%",
    primaryHover: "340 82% 45%",
    accent: "280 70% 55%",
    accentHover: "280 70% 48%",
  },
];

// Currency Settings Component
const CurrencySettings = () => {
  const { currencyCode, updateCurrency, isUpdating } = useCurrency();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Set the default currency for invoices and financial displays
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="currency">Default Currency</Label>
            <Select
              value={currencyCode}
              onValueChange={(value) => updateCurrency(value)}
              disabled={isUpdating}
            >
              <SelectTrigger id="currency" className="mt-1.5">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminBranding = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, loading: roleLoading } = useRole();
  const { user } = useAuth();
  const { data: settings, isLoading } = useBrandingSettings();
  const updateSettings = useUpdateBrandingSettings();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<BrandingSettings>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [sharedPresetImported, setSharedPresetImported] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [presetToDuplicate, setPresetToDuplicate] = useState<CustomPreset | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<CustomPreset | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Fetch custom presets
  const { data: customPresets = [] } = useQuery({
    queryKey: ["custom-color-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_color_presets")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CustomPreset[];
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Save custom preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (preset: Omit<CustomPreset, "id" | "created_at" | "share_token" | "sort_order">) => {
      const { data, error } = await supabase
        .from("custom_color_presets")
        .insert(preset)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      toast.success("Custom preset saved!");
      setSavePresetOpen(false);
      setNewPresetName("");
      setNewPresetDescription("");
    },
    onError: () => {
      toast.error("Failed to save preset");
    },
  });

  // Generate share token mutation
  const generateShareTokenMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const token = crypto.randomUUID();
      const { data, error } = await supabase
        .from("custom_color_presets")
        .update({ share_token: token })
        .eq("id", presetId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      const shareUrl = `${window.location.origin}/admin/branding?preset=${data.share_token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    },
    onError: () => {
      toast.error("Failed to generate share link");
    },
  });

  // Delete custom preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_color_presets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      toast.success("Preset deleted");
    },
    onError: () => {
      toast.error("Failed to delete preset");
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      if (settings.company_logo_url) {
        setLogoPreview(settings.company_logo_url);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  // Handle shared preset import from URL
  useEffect(() => {
    const sharedToken = searchParams.get("preset");
    if (sharedToken && !sharedPresetImported && user?.id) {
      const importSharedPreset = async () => {
        try {
          const { data: sharedPreset, error } = await supabase
            .from("custom_color_presets")
            .select("*")
            .eq("share_token", sharedToken)
            .single();

          if (error || !sharedPreset) {
            toast.error("Shared preset not found or expired");
            setSearchParams({});
            return;
          }

          // Check if user already has this preset (by name)
          const existingPreset = customPresets.find(p => p.name === sharedPreset.name);
          if (existingPreset) {
            applyCustomPreset(existingPreset);
            toast.info(`Preset "${sharedPreset.name}" already exists - applied existing preset`);
          } else {
            // Import the preset for this user
            const { error: insertError } = await supabase
              .from("custom_color_presets")
              .insert({
                name: sharedPreset.name,
                description: sharedPreset.description,
                primary_color: sharedPreset.primary_color,
                primary_hover: sharedPreset.primary_hover,
                accent_color: sharedPreset.accent_color,
                accent_hover: sharedPreset.accent_hover,
                created_by: user.id,
              });

            if (!insertError) {
              queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
              // Apply the imported preset immediately
              setFormData((prev) => ({
                ...prev,
                primary_color: sharedPreset.primary_color,
                primary_hover: sharedPreset.primary_hover,
                accent_color: sharedPreset.accent_color,
                accent_hover: sharedPreset.accent_hover,
              }));
              toast.success(`Imported and applied "${sharedPreset.name}" preset!`);
            }
          }

          setSharedPresetImported(true);
          setSearchParams({});
        } catch {
          toast.error("Failed to import shared preset");
        }
      };

      importSharedPreset();
    }
  }, [searchParams, user?.id, sharedPresetImported, customPresets, queryClient, setSearchParams]);

  const handleCopyShareLink = (preset: CustomPreset) => {
    if (preset.share_token) {
      const shareUrl = `${window.location.origin}/admin/branding?preset=${preset.share_token}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } else {
      generateShareTokenMutation.mutate(preset.id);
    }
  };

  const handleOpenDuplicateDialog = (preset: CustomPreset) => {
    setPresetToDuplicate(preset);
    setDuplicateName(`${preset.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicatePreset = async () => {
    if (!presetToDuplicate || !user?.id || !duplicateName.trim()) {
      toast.error("Please enter a name for the duplicate");
      return;
    }

    try {
      const { error } = await supabase.from("custom_color_presets").insert({
        name: duplicateName.trim(),
        description: presetToDuplicate.description,
        primary_color: presetToDuplicate.primary_color,
        primary_hover: presetToDuplicate.primary_hover,
        accent_color: presetToDuplicate.accent_color,
        accent_hover: presetToDuplicate.accent_hover,
        created_by: user.id,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      toast.success(`Created "${duplicateName.trim()}"`);
      setDuplicateDialogOpen(false);
      setPresetToDuplicate(null);
      setDuplicateName("");
    } catch {
      toast.error("Failed to duplicate preset");
    }
  };

  const handleOpenEditDialog = (preset: CustomPreset) => {
    setPresetToEdit(preset);
    setEditName(preset.name);
    setEditDescription(preset.description || "");
    setEditDialogOpen(true);
  };

  const handleEditPreset = async () => {
    if (!presetToEdit || !editName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      const { error } = await supabase
        .from("custom_color_presets")
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
        })
        .eq("id", presetToEdit.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      toast.success("Preset updated");
      setEditDialogOpen(false);
      setPresetToEdit(null);
      setEditName("");
      setEditDescription("");
    } catch {
      toast.error("Failed to update preset");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = customPresets.findIndex((p) => p.id === active.id);
    const newIndex = customPresets.findIndex((p) => p.id === over.id);

    const reorderedPresets = arrayMove(customPresets, oldIndex, newIndex);

    // Optimistically update the UI
    queryClient.setQueryData(["custom-color-presets"], reorderedPresets);

    // Update sort_order in database
    try {
      const updates = reorderedPresets.map((preset, index) => ({
        id: preset.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("custom_color_presets")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    } catch {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
      toast.error("Failed to save order");
    }
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.company_logo_url || null;

    setUploading(true);
    try {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const logoUrl = await uploadLogo();
    
    const updates: Partial<BrandingSettings> = {
      ...formData,
      company_logo_url: logoUrl,
    };

    updateSettings.mutate(updates, {
      onSuccess: (data) => {
        if (data) {
          applyBrandingToDocument(data as BrandingSettings);
        }
      },
    });
  };

  const handlePreview = () => {
    if (formData.primary_color && formData.accent_color) {
      applyBrandingToDocument(formData as BrandingSettings);
      toast.success("Preview applied - save to make permanent");
    }
  };

  const applyPreset = (preset: { primary: string; primaryHover: string; accent: string; accentHover: string; name: string }) => {
    setFormData((prev) => ({
      ...prev,
      primary_color: preset.primary,
      primary_hover: preset.primaryHover,
      accent_color: preset.accent,
      accent_hover: preset.accentHover,
    }));
    toast.success(`Applied "${preset.name}" theme - save to make permanent`);
  };

  const applyCustomPreset = (preset: CustomPreset) => {
    setFormData((prev) => ({
      ...prev,
      primary_color: preset.primary_color,
      primary_hover: preset.primary_hover,
      accent_color: preset.accent_color,
      accent_hover: preset.accent_hover,
    }));
    toast.success(`Applied "${preset.name}" theme - save to make permanent`);
  };

  const isPresetActive = (preset: { primary: string; accent: string }) => {
    return (
      formData.primary_color === preset.primary &&
      formData.accent_color === preset.accent
    );
  };

  const isCustomPresetActive = (preset: CustomPreset) => {
    return (
      formData.primary_color === preset.primary_color &&
      formData.accent_color === preset.accent_color
    );
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }
    
    savePresetMutation.mutate({
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || null,
      primary_color: formData.primary_color || "11 100% 49%",
      primary_hover: formData.primary_hover || "11 100% 42%",
      accent_color: formData.accent_color || "38 92% 50%",
      accent_hover: formData.accent_hover || "38 92% 43%",
      created_by: user.id,
    });
  };

  const handleExportPresets = () => {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      presets: customPresets.map((p) => ({
        name: p.name,
        description: p.description,
        primary_color: p.primary_color,
        primary_hover: p.primary_hover,
        accent_color: p.accent_color,
        accent_hover: p.accent_hover,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-presets-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${customPresets.length} preset(s)`);
  };

  const handleImportPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.presets || !Array.isArray(data.presets)) {
          toast.error("Invalid preset file format");
          return;
        }

        let imported = 0;
        for (const preset of data.presets) {
          if (preset.name && preset.primary_color && preset.accent_color) {
            const { error } = await supabase
              .from("custom_color_presets")
              .insert({
                name: preset.name,
                description: preset.description || null,
                primary_color: preset.primary_color,
                primary_hover: preset.primary_hover || preset.primary_color,
                accent_color: preset.accent_color,
                accent_hover: preset.accent_hover || preset.accent_color,
                created_by: user.id,
              });
            if (!error) imported++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["custom-color-presets"] });
        toast.success(`Imported ${imported} preset(s)`);
        setImportDialogOpen(false);
      } catch {
        toast.error("Failed to parse preset file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center gap-4 h-16 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Business Branding</h1>
            <p className="text-sm text-muted-foreground">Customize your company appearance</p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={updateSettings.isPending || uploading}
          >
            {updateSettings.isPending || uploading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="container px-4 py-6 max-w-4xl">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update your business details and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 512x512px PNG with transparency
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name || ""}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_tagline">Tagline</Label>
                    <Input
                      id="company_tagline"
                      value={formData.company_tagline || ""}
                      onChange={(e) => handleInputChange("company_tagline", e.target.value)}
                      placeholder="Your company tagline"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email || ""}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone || ""}
                      onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            {/* Preset Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Themes</CardTitle>
                <CardDescription>
                  Choose a preset color theme to get started quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all text-left hover:shadow-md",
                        isPresetActive(preset)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      {isPresetActive(preset) && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex gap-1.5 mb-2">
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.primary})` }}
                        />
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.accent})` }}
                        />
                      </div>
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Saved Presets */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Saved Presets</CardTitle>
                  <CardDescription>
                    Your custom saved color combinations
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {customPresets.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleExportPresets}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <FileUp className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Import Presets</DialogTitle>
                        <DialogDescription>
                          Upload a JSON file containing color presets
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="import-file" className="cursor-pointer">
                          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                            <FileUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Click to select a file</p>
                            <p className="text-xs text-muted-foreground mt-1">JSON files only</p>
                          </div>
                          <Input
                            id="import-file"
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImportPresets}
                          />
                        </Label>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Save Current
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Custom Preset</DialogTitle>
                        <DialogDescription>
                          Save your current color settings as a reusable preset
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${formData.primary_color || "11 100% 49%"})` }}
                          />
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${formData.accent_color || "38 92% 50%"})` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preset-name">Preset Name</Label>
                          <Input
                            id="preset-name"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="e.g., My Brand Colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preset-description">Description (optional)</Label>
                          <Input
                            id="preset-description"
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            placeholder="e.g., Main brand colors for 2025"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSavePresetOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSavePreset}
                          disabled={savePresetMutation.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {savePresetMutation.isPending ? "Saving..." : "Save Preset"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {customPresets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No custom presets saved yet</p>
                    <p className="text-xs">Customize colors below and save them as a preset</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={customPresets.map((p) => p.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                        {customPresets.map((preset) => (
                          <SortablePresetCard
                            key={preset.id}
                            preset={preset}
                            isActive={isCustomPresetActive(preset)}
                            onApply={() => applyCustomPreset(preset)}
                            onDuplicate={() => handleOpenDuplicateDialog(preset)}
                            onEdit={() => handleOpenEditDialog(preset)}
                            onShare={() => handleCopyShareLink(preset)}
                            onDelete={() => deletePresetMutation.mutate(preset.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Edit Preset Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Preset</DialogTitle>
                      <DialogDescription>
                        Update the name and description of your preset
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {presetToEdit && (
                        <div className="flex gap-2 justify-center">
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${presetToEdit.primary_color})` }}
                          />
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${presetToEdit.accent_color})` }}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Preset Name</Label>
                        <Input
                          id="edit-name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g., My Brand Colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Description (optional)</Label>
                        <Input
                          id="edit-description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="e.g., Main brand colors for 2025"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditPreset}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Duplicate Preset Dialog */}
                <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Duplicate Preset</DialogTitle>
                      <DialogDescription>
                        Create a copy of "{presetToDuplicate?.name}" with a new name
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {presetToDuplicate && (
                        <div className="flex gap-2 justify-center">
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${presetToDuplicate.primary_color})` }}
                          />
                          <div
                            className="w-12 h-12 rounded-lg border-2"
                            style={{ backgroundColor: `hsl(${presetToDuplicate.accent_color})` }}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="duplicate-name">New Preset Name</Label>
                        <Input
                          id="duplicate-name"
                          value={duplicateName}
                          onChange={(e) => setDuplicateName(e.target.value)}
                          placeholder="e.g., My Brand Colors (Copy)"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleDuplicatePreset}>
                        <CopyPlus className="w-4 h-4 mr-2" />
                        Duplicate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Custom Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Colors</CardTitle>
                <CardDescription>
                  Fine-tune colors using HSL format (e.g., "11 100% 49%")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Primary Color */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Primary Color</h3>
                    <ColorPickerInput
                      id="primary_color"
                      label="Primary (HSL)"
                      value={formData.primary_color || ""}
                      placeholder="11 100% 49%"
                      onChange={(value) => handleInputChange("primary_color", value)}
                    />
                    <ColorPickerInput
                      id="primary_hover"
                      label="Hover State (HSL)"
                      value={formData.primary_hover || ""}
                      placeholder="11 100% 42%"
                      onChange={(value) => handleInputChange("primary_hover", value)}
                      sourceColor={formData.primary_color}
                      onAutoGenerate={() => {
                        const source = formData.primary_color || "11 100% 49%";
                        handleInputChange("primary_hover", generateHoverColor(source));
                      }}
                    />
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Accent Color</h3>
                    <ColorPickerInput
                      id="accent_color"
                      label="Accent (HSL)"
                      value={formData.accent_color || ""}
                      placeholder="38 92% 50%"
                      onChange={(value) => handleInputChange("accent_color", value)}
                    />
                    <ColorPickerInput
                      id="accent_hover"
                      label="Hover State (HSL)"
                      value={formData.accent_hover || ""}
                      placeholder="38 92% 43%"
                      onChange={(value) => handleInputChange("accent_hover", value)}
                      sourceColor={formData.accent_color}
                      onAutoGenerate={() => {
                        const source = formData.accent_color || "38 92% 50%";
                        handleInputChange("accent_hover", generateHoverColor(source));
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Contrast Accessibility Checker */}
                <div>
                  <h4 className="font-medium mb-3">Accessibility Contrast Check</h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ContrastChecker
                      foregroundHsl="0 0% 100%"
                      backgroundHsl={formData.primary_color || "11 100% 49%"}
                      label="White text on Primary"
                    />
                    <ContrastChecker
                      foregroundHsl="0 0% 0%"
                      backgroundHsl={formData.primary_color || "11 100% 49%"}
                      label="Dark text on Primary"
                    />
                    <ContrastChecker
                      foregroundHsl="0 0% 100%"
                      backgroundHsl={formData.accent_color || "38 92% 50%"}
                      label="White text on Accent"
                    />
                    <ContrastChecker
                      foregroundHsl="0 0% 0%"
                      backgroundHsl={formData.accent_color || "38 92% 50%"}
                      label="Dark text on Accent"
                    />
                  </div>
                </div>

                <Separator />

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Color Format Help</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Colors use HSL format: <code className="bg-background px-1 rounded">hue saturation% lightness%</code>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Red/Orange: <code className="bg-background px-1 rounded">11 100% 49%</code></li>
                    <li>• Amber/Gold: <code className="bg-background px-1 rounded">38 92% 50%</code></li>
                    <li>• Blue: <code className="bg-background px-1 rounded">200 85% 45%</code></li>
                    <li>• Green: <code className="bg-background px-1 rounded">142 76% 36%</code></li>
                    <li>• Purple: <code className="bg-background px-1 rounded">280 80% 50%</code></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            {/* Currency Settings */}
            <CurrencySettings />
            
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Control which features are visible in the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Scheduling</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable visit scheduling and calendar features
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_scheduling ?? true}
                      onCheckedChange={(checked) => handleInputChange("show_scheduling", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Invoicing</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable invoice generation and billing features
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_invoicing ?? true}
                      onCheckedChange={(checked) => handleInputChange("show_invoicing", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reporting</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable revenue reports and analytics dashboard
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_reporting ?? true}
                      onCheckedChange={(checked) => handleInputChange("show_reporting", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Team Management</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable staff management and team features
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_team_management ?? true}
                      onCheckedChange={(checked) => handleInputChange("show_team_management", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Goals */}
            <PerformanceGoalsSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBranding;
