import { AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { welcomeMessage } from '../store/chatStore';
import type { Message } from '@shared/types';

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
  // Hide the empty assistant placeholder while it's streaming — the typing
  // indicator stands in for it, so we don't show two avatars at once.
  const visible = messages.filter(
    (m) => !(m.role === 'assistant' && m.content === '')
  );

  return (
    <AnimatePresence initial={false}>
      <div className="space-y-10 w-full">
        {visible.map((message) => (
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
