import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

interface ChatItem {
  id: string;
  title: string;
  type: string;
  updated_at: string;
  other_user_id?: string;
}

export const ChatList = ({ onSelectChat, selectedChatId }: ChatListProps) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
        .subscribe();
    }

    setupPresence();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    loadChats();

    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        { event: '*', scheme: 'public', table: 'chats' },
        () => loadChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadChats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('members', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedChats = data.map((chat) => {
        const otherUserId = chat.members?.find((m: string) => m !== user.id);
        return {
          id: chat.id,
          title: chat.title || 'Unknown Chat',
          type: chat.type,
          updated_at: chat.updated_at || chat.created_at,
          other_user_id: otherUserId,
        };
      });

      setChats(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading chats...</div>;
  }

  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y">
      {chats.map((chat) => {
        const isOnline = chat.other_user_id && onlineUsers.has(chat.other_user_id);
        
        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              "flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 text-left",
              selectedChatId === chat.id && "bg-muted"
            )}
          >
            <div className="relative">
              <Avatar>
                <AvatarFallback>{chat.title[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {chat.other_user_id && (
                <span 
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    isOnline ? "bg-green-500" : "bg-muted-foreground"
                  )} 
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium truncate pr-2">{chat.title}</p>
                {chat.updated_at && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

