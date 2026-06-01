 import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReactionPicker } from './ReactionPicker';
import { MessageActions } from './MessageActions';
import { supabase } from '@/integrations/supabase/client';
import { encryptMessage, getChatKey } from '@/utils/encryption';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Check, CheckCheck } from 'lucide-react';

interface Reaction {
  emoji: string;
  users: string[];
}

interface MessageBubbleProps {
  text: string;
  createdAt: string;
  isOwnMessage: boolean;
  messageId: string;
  chatId: string;
  reactions?: Reaction[];
  isDeleted?: boolean;
  isEdited?: boolean;
  isRead?: boolean;
}

export function MessageBubble({
  text,
  createdAt,
  isOwnMessage,
  messageId,
  chatId,
  reactions = [],
  isDeleted = false,
  isEdited = false,
  isRead = false,
}: MessageBubbleProps) {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;

    try {
      const existingReaction = reactions.find((r) => r.emoji === emoji);
      let updatedReactions: Reaction[];

      if (existingReaction) {
        if (existingReaction.users.includes(currentUserId)) {
          updatedReactions = reactions
            .map((r) =>
              r.emoji === emoji
                ? { ...r, users: r.users.filter((id) => id !== currentUserId) }
                : r
            )
            .filter((r) => r.users.length > 0);
        } else {
          updatedReactions = reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, users: [...r.users, currentUserId] }
              : r
          );
        }
      } else {
        updatedReactions = [...reactions, { emoji, users: [currentUserId] }];
      }

      await (supabase as any)
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      const key = await getChatKey(chatId);
      const { encrypted, iv } = await encryptMessage(newText, key);

      await supabase
        .from('messages')
        .update({
          text: `${encrypted}::${iv}`,
          is_edited: true,
        })
        .eq('id', messageId);

      toast({
        title: 'Success',
        description: 'Message edited successfully',
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({
          text: '[Message deleted]',
          is_deleted: true,
        })
        .eq('id', messageId);

      toast({
        title: 'Success',
        description: 'Message deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  };

  if (isDeleted) {
    return (
      <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[70%] rounded-lg px-4 py-2 bg-muted/50">
          <p className="text-sm italic text-muted-foreground">{text}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {format(new Date(createdAt), 'HH:mm')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={cn(
            'group rounded-lg px-4 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
               {text.startsWith('data:image/') ? (
                 <img src={text} alt="Shared photo" className="max-w-full rounded-md object-cover max-h-[300px]" />
               ) : (
                 <p className="text-sm break-words">{text}</p>
               )}

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs opacity-70">
                  {format(new Date(createdAt), 'HH:mm')}
                </span>

                {isEdited && (
                  <span className="text-xs opacity-70 italic">(edited)</span>
                )}
                
                {isOwnMessage && (
                  <span className="ml-1 text-xs">
                    {isRead ? (
                      <CheckCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1">
              {isOwnMessage && (
                <MessageActions
                  messageId={messageId}
                  messageText={text}
                  createdAt={createdAt}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}

              <ReactionPicker onSelect={handleReaction} />
            </div>
          </div>
        </div>

        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2">
            {reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors',
                  reaction.users.includes(currentUserId)
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-xs font-medium">
                  {reaction.users.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 