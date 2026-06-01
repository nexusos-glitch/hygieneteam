import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquarePlus, Search, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  user_id: string;
  full_name: string;
}

interface Client {
  id: string;
  contact_name: string;
  company_name: string;
}

interface NewChatDialogProps {
  onChatCreated: (chatId: string) => void;
}

export function NewChatDialog({ onChatCreated }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadStaffAndClients();
    }
  }, [open]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;
    
    async function setupPresence() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      channel = supabase.channel('global_presence', {
        config: {
          presence: { key: user.id },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const online = new Set<string>();
          Object.values(state).flat().forEach((u: any) => {
            if (u.user_id) online.add(u.user_id);
          });
          setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        });
    }

    setupPresence();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function loadStaffAndClients() {
    try {
      const staffRes = await supabase
        .from('staff')
        .select('id, user_id, full_name')
        .eq('active', true);

      const clientsRes = await (supabase as any)
        .from('clients')
        .select('id, contact_name, company_name');

      if (staffRes.error) throw staffRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setStaff((staffRes.data as Staff[]) || []);
      setClients((clientsRes.data as Client[]) || []);
    } catch (error) {
      console.error('Error loading staff and clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    }
  }

  async function createChat(recipientId: string, title: string, type: 'direct' | 'client') {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .contains('members', [user.id, recipientId])
        .single();

      if (existingChat) {
        onChatCreated(existingChat.id);
        setOpen(false);
        return;
      }

      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          members: [user.id, recipientId],
          title,
          type,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Chat created successfully',
      });

      onChatCreated(newChat.id);
      setOpen(false);
      setSearch('');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staff.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClients = clients.filter((c) =>
    c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {filteredStaff.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Staff</h3>
                <div className="space-y-1">
                  {filteredStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => createChat(s.user_id, s.full_name, 'direct')}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>{s.full_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                            onlineUsers.has(s.user_id) ? 'bg-green-500' : 'bg-muted-foreground'
                          }`} 
                        />
                      </div>
                      <span className="font-medium">{s.full_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredClients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Clients</h3>
                <div className="space-y-1">
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => createChat(c.id, `${c.contact_name} (${c.company_name})`, 'client')}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback>{c.contact_name[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                            onlineUsers.has(c.id) ? 'bg-green-500' : 'bg-muted-foreground'
                          }`} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.contact_name}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.company_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredStaff.length === 0 && filteredClients.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No contacts found</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
