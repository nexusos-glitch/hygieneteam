import { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function Chat() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>();

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold mb-6">Secure Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-4rem)]">
        <Card className="md:col-span-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold">Conversations</h2>
            <NewChatDialog onChatCreated={setSelectedChatId} />
          </div>
          <div className="flex-1 overflow-auto">
            <ChatList
              onSelectChat={setSelectedChatId}
              selectedChatId={selectedChatId}
            />
          </div>
        </Card>

        <Card className="md:col-span-2 overflow-hidden flex flex-col">
          {selectedChatId ? (
            <ChatInterface chatId={selectedChatId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
