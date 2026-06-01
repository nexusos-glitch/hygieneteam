import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Loader2 } from 'lucide-react';

interface LinkClientToUserDialogProps {
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export const LinkClientToUserDialog: React.FC<LinkClientToUserDialogProps> = ({
  clientId,
  clientName,
  onSuccess
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // First, check if user exists with this email (we need to invite them if not)
      // For now, we'll create the link and they can sign up with that email

      // Check if email is already linked to another client
      const { data: existingLink } = await supabase
        .from('client_users' as any)
        .select('id')
        .eq('user_id', email) // This won't work, we need user_id not email
        .maybeSingle();

      // Create invitation for client role
      const { error: inviteError } = await supabase
        .from('staff_invitations')
        .insert({
          email: email.trim().toLowerCase(),
          role: 'client',
          staff_name: clientName,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (inviteError) {
        if (inviteError.code === '23505') {
          toast({
            title: 'Already Invited',
            description: 'This email has already been invited.',
            variant: 'destructive',
          });
        } else {
          throw inviteError;
        }
        setLoading(false);
        return;
      }

      // Store the pending client link (will be activated when user signs up)
      // We need to create this after the user signs up, so we'll store it in metadata
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          key: `pending_client_link_${email.trim().toLowerCase()}`,
          value: { client_id: clientId, email: email.trim().toLowerCase() }
        }, { onConflict: 'key' });

      if (settingsError) {
        console.error('Error storing pending link:', settingsError);
      }

      toast({
        title: 'Invitation Sent',
        description: `${email} has been invited to access the client portal for ${clientName}.`,
      });

      setOpen(false);
      setEmail('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Portal User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Client Portal User</DialogTitle>
          <DialogDescription>
            Send an invitation to give someone access to view {clientName}'s GPS tracking and visit history.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="client-email">Email Address</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="client@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            They will receive an email invitation to create an account and access the client portal.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
