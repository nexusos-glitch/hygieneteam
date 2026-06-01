import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useEncryptedChat(chatId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stub implementation
    setLoading(false);
  }, [chatId]);

  const sendMessage = async (text: string) => {
    // Stub implementation
  };

  return { messages, loading, sendMessage };
}
