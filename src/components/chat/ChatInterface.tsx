import { useState, useRef, useEffect, useCallback } from 'react';
import { useEncryptedChat } from '@/hooks/useEncryptedChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Lock, Camera, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatInterfaceProps {
  chatId: string;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { messages, loading, sendMessage } = useEncryptedChat(chatId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg: any) => msg.sender_id !== currentUserId && !msg.read_at
    );

    if (unreadMessages.length > 0) {
      const markAsRead = async () => {
        const messageIds = unreadMessages.map(m => m.id);
        try {
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', messageIds);
        } catch (error) {
          console.error('Error updating read receipts:', error);
        }
      };
      
      markAsRead();
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    const channel = supabase.channel(`chat_typing_${chatId}`, {
      config: {
        presence: {
          key: currentUserId || 'unknown',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state).flat().filter(
          (user: any) => user.user_id !== currentUserId && user.typing
        );
        setIsTyping(typingUsers.length > 0);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleTyping = useCallback(() => {
    if (channelRef.current && currentUserId) {
      channelRef.current.track({ user_id: currentUserId, typing: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({ user_id: currentUserId, typing: false });
        }
      }, 2000);
    }
  }, [currentUserId]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    
    if (channelRef.current && currentUserId) {
      channelRef.current.track({ user_id: currentUserId, typing: false });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    await sendMessage(newMessage);
    setNewMessage('');
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await sendMessage(base64); 
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredMessages = messages.filter((msg: any) =>
    (msg.decryptedText || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">End-to-End Encrypted</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="flex items-center bg-background border rounded-md px-2 py-1">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-32 md:w-48"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-1" 
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSearching(true)}>
              <Search className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground p-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">No messages yet</div>
          ) : (
            <>
              {filteredMessages.map((msg: any) => (
                <MessageBubble
                  key={msg.id}
                  text={msg.decryptedText}
                  createdAt={msg.created_at}
                  isOwnMessage={msg.sender_id === currentUserId}
                  messageId={msg.id}
                  chatId={chatId}
                   reactions={msg.reactions}
                  isDeleted={msg.is_deleted}
                  isEdited={msg.is_edited}
                  isRead={!!msg.read_at}
                />
              ))}
              {isTyping && <TypingIndicator />}
              
              {searchQuery && filteredMessages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No messages match your search.
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Take Photo"
          >
            <Camera className="w-4 h-4" />
          </Button>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
