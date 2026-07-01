import { AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { welcomeMessage } from '../store/chatStore';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  lastAssistantMessageId?: string;
  onRegenerate: () => void;
  onEdit: (messageId: string, newContent: string) => void;
}

export function MessageList({
  messages,
  lastAssistantMessageId,
  onRegenerate,
  onEdit,
}: MessageListProps) {
  // Filter out the welcome message if there are other messages to avoid cluttering,
  // or show it if it's the welcome message.
  return (
    <AnimatePresence initial={false}>
      <div className="space-y-8 w-full">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isWelcome={
              message.id === 'welcome' && message.content === welcomeMessage.content
            }
            isLastAssistant={message.id === lastAssistantMessageId}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}
