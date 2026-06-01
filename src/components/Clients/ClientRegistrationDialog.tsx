import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, X, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const clientSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name cannot exceed 100 characters"),
  contact_name: z.string().min(1, "Contact name is required").max(100),
  contact_email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  contact_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface StaffMember {
  full_name: string;
  email?: string;
}

interface ClientRegistrationDialogProps {
  onSuccess?: () => void;
}

export function ClientRegistrationDialog({ onSuccess }: ClientRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([{ full_name: "", email: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStaffMember = () => {
    setStaffMembers([...staffMembers, { full_name: "", email: "" }]);
  };

  const removeStaffMember = (index: number) => {
    setStaffMembers(staffMembers.filter((_, i) => i !== index));
  };

  const updateStaffMember = (index: number, field: keyof StaffMember, value: string) => {
    const updated = [...staffMembers];
    updated[index][field] = value;
    setStaffMembers(updated);
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      let profilePhotoUrl = "";

      // Upload profile photo if provided
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("client-photos")
          .upload(fileName, profilePhoto);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("client-photos")
          .getPublicUrl(fileName);
        profilePhotoUrl = urlData.publicUrl;
      }

      // Create client
      const { data: clientData, error: clientError } = await supabase
        .from("clients" as any)
        .insert([
          {
            ...data,
            profile_photo_url: profilePhotoUrl,
          },
        ])
        .select()
        .single();

      if (clientError) throw clientError;

      // Create staff members
      const validStaffMembers = staffMembers.filter((s) => s.full_name.trim());
      if (validStaffMembers.length > 0) {
        const { error: staffError } = await supabase.from("staff").insert(
          validStaffMembers.map((staff) => ({
            full_name: staff.full_name,
            active: true,
          }))
        );

        if (staffError) throw staffError;
      }

      toast({
        title: "Success!",
        description: "Client registered successfully",
      });

      setOpen(false);
      form.reset();
      setProfilePhoto(null);
      setPhotoPreview("");
      setStaffMembers([{ full_name: "", email: "" }]);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview} />
                <AvatarFallback>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="profile-photo"
                />
                <Label htmlFor="profile-photo" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Upload Photo</span>
                  </Button>
                </Label>
              </div>
            </div>

            {/* Client Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Staff Members */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Staff Members
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={addStaffMember}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Staff
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {staffMembers.map((staff, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Staff Name"
                        value={staff.full_name}
                        onChange={(e) => updateStaffMember(index, "full_name", e.target.value)}
                      />
                    </div>
                    {staffMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStaffMember(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
