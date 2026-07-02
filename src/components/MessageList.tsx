import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { welcomeMessage } from '../store/chatStore';
import type { Message } from '@shared/types';

const VIRTUALIZATION_THRESHOLD = 30;
const ESTIMATED_MESSAGE_HEIGHT = 140;
const OVERSCAN = 4;

interface MessageListProps {
  messages: Message[];
  lastAssistantMessageId?: string;
  onRegenerate: () => void;
  onEdit: (messageId: string, newContent: string) => void;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export function MessageList({
  messages,
  lastAssistantMessageId,
  onRegenerate,
  onEdit,
  scrollContainerRef,
}: MessageListProps) {
  const visible = messages.filter((m) => !(m.role === 'assistant' && m.content === ''));
  const shouldVirtualize = visible.length > VIRTUALIZATION_THRESHOLD;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const fallbackRef = useRef<HTMLDivElement>(null);

  const updateMeasurements = useCallback(() => {
    const container = scrollContainerRef?.current ?? fallbackRef.current?.parentElement;
    if (!container) return;
    setScrollTop(container.scrollTop);
    setViewportHeight(container.clientHeight);
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef?.current ?? fallbackRef.current?.parentElement;
    if (!container || !shouldVirtualize) return;

    updateMeasurements();
    container.addEventListener('scroll', updateMeasurements, { passive: true });
    const resizeObserver = new ResizeObserver(updateMeasurements);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateMeasurements);
      resizeObserver.disconnect();
    };
  }, [scrollContainerRef, shouldVirtualize, updateMeasurements, visible.length]);

  const { startIndex, endIndex, topSpacer, bottomSpacer } = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: visible.length,
        topSpacer: 0,
        bottomSpacer: 0,
      };
    }

    const start = Math.max(0, Math.floor(scrollTop / ESTIMATED_MESSAGE_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ESTIMATED_MESSAGE_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(visible.length, start + visibleCount);

    return {
      startIndex: start,
      endIndex: end,
      topSpacer: start * ESTIMATED_MESSAGE_HEIGHT,
      bottomSpacer: Math.max(0, (visible.length - end) * ESTIMATED_MESSAGE_HEIGHT),
    };
  }, [shouldVirtualize, scrollTop, viewportHeight, visible.length]);

  const renderedMessages = shouldVirtualize ? visible.slice(startIndex, endIndex) : visible;

  return (
    <AnimatePresence initial={false}>
      <div ref={fallbackRef} className="space-y-10 w-full">
        {shouldVirtualize && topSpacer > 0 && <div aria-hidden style={{ height: topSpacer }} />}
        {renderedMessages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isWelcome={message.id === 'welcome' && message.content === welcomeMessage.content}
            isLastAssistant={message.id === lastAssistantMessageId}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
          />
        ))}
        {shouldVirtualize && bottomSpacer > 0 && (
          <div aria-hidden style={{ height: bottomSpacer }} />
        )}
      </div>
    </AnimatePresence>
  );
}
