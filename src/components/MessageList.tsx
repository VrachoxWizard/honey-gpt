import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { welcomeMessage } from '../store/chatStore';
import type { Message } from '@shared/types';

const VIRTUALIZATION_THRESHOLD = 30;
const MIN_MESSAGE_HEIGHT = 80;
const MAX_MESSAGE_HEIGHT = 600;
const BASE_MESSAGE_HEIGHT = 60;
const CHARS_PER_LINE = 80;
const LINE_HEIGHT = 22;
const CODE_BLOCK_LINE_BONUS = 18;
const OVERSCAN = 4;

function estimateMessageHeight(message: Message): number {
  const content = typeof message.content === 'string' ? message.content : '';
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const lines = Math.ceil(content.length / CHARS_PER_LINE) + codeBlocks * CODE_BLOCK_LINE_BONUS;
  return Math.max(
    MIN_MESSAGE_HEIGHT,
    Math.min(MAX_MESSAGE_HEIGHT, BASE_MESSAGE_HEIGHT + lines * LINE_HEIGHT)
  );
}

function getMessageHeight(message: Message, measuredHeights: Record<string, number>): number {
  return measuredHeights[message.id] ?? estimateMessageHeight(message);
}

function getMessageOffsets(messages: Message[], measuredHeights: Record<string, number>): number[] {
  const offsets: number[] = [0];
  for (const message of messages) {
    offsets.push(offsets[offsets.length - 1] + getMessageHeight(message, measuredHeights));
  }
  return offsets;
}

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
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const fallbackRef = useRef<HTMLDivElement>(null);
  const observersRef = useRef<Map<string, ResizeObserver>>(new Map());

  const updateMeasurements = useCallback(() => {
    const container = scrollContainerRef?.current ?? fallbackRef.current?.parentElement;
    if (!container) return;
    setScrollTop(container.scrollTop);
    setViewportHeight(container.clientHeight);
  }, [scrollContainerRef]);

  const registerMessageRef = useCallback((messageId: string, node: HTMLDivElement | null) => {
    const existing = observersRef.current.get(messageId);
    if (existing) {
      existing.disconnect();
      observersRef.current.delete(messageId);
    }

    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const height = Math.ceil(entry.contentRect.height);
      setMeasuredHeights((current) => {
        if (current[messageId] === height) return current;
        return { ...current, [messageId]: height };
      });
    });

    observer.observe(node);
    observersRef.current.set(messageId, observer);
  }, []);

  useEffect(() => {
    const observers = observersRef.current;
    return () => {
      for (const observer of observers.values()) {
        observer.disconnect();
      }
      observers.clear();
    };
  }, []);

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

  const messageOffsets = useMemo(
    () => getMessageOffsets(visible, measuredHeights),
    [visible, measuredHeights]
  );

  const { startIndex, endIndex, topSpacer, bottomSpacer } = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: visible.length,
        topSpacer: 0,
        bottomSpacer: 0,
      };
    }

    const totalHeight = messageOffsets[messageOffsets.length - 1] ?? 0;
    let start = 0;
    while (start < visible.length && messageOffsets[start + 1] <= scrollTop) {
      start += 1;
    }
    start = Math.max(0, start - OVERSCAN);

    const bottomEdge = scrollTop + viewportHeight;
    let end = start;
    while (end < visible.length && messageOffsets[end] < bottomEdge) {
      end += 1;
    }
    end = Math.min(visible.length, end + OVERSCAN);

    return {
      startIndex: start,
      endIndex: end,
      topSpacer: messageOffsets[start] ?? 0,
      bottomSpacer: Math.max(0, totalHeight - (messageOffsets[end] ?? totalHeight)),
    };
  }, [shouldVirtualize, scrollTop, viewportHeight, visible.length, messageOffsets]);

  const renderedMessages = shouldVirtualize ? visible.slice(startIndex, endIndex) : visible;

  return (
    <AnimatePresence initial={false}>
      <div
        ref={fallbackRef}
        role="list"
        aria-label="Poruke razgovora"
        className="space-y-10 w-full"
      >
        {shouldVirtualize && topSpacer > 0 && <div aria-hidden style={{ height: topSpacer }} />}
        {renderedMessages.map((message) => (
          <div
            key={message.id}
            ref={(node) => registerMessageRef(message.id, node)}
            role="listitem"
          >
            <ChatMessage
              message={message}
              isWelcome={message.id === 'welcome' && message.content === welcomeMessage.content}
              isLastAssistant={message.id === lastAssistantMessageId}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
            />
          </div>
        ))}
        {shouldVirtualize && bottomSpacer > 0 && (
          <div aria-hidden style={{ height: bottomSpacer }} />
        )}
      </div>
    </AnimatePresence>
  );
}
