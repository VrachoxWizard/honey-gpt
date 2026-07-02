import { useCallback, useEffect, useRef, useState } from 'react';

export function useChatScroll(
  messageCount: number,
  isSending: boolean,
  showTypingIndicator: boolean
) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView?.({ block: 'end' });
    }
  }, [messageCount, isSending, showTypingIndicator]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 48;
    setShowScrollButton(distanceFromBottom > 260);
  }, []);

  const scrollToBottom = useCallback(
    () => scrollRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' }),
    []
  );

  return {
    showScrollButton,
    scrollRef,
    containerRef,
    handleScroll,
    scrollToBottom,
  };
}
