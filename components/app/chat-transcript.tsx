import { useEffect, useRef } from 'react';
import { type ReceivedChatMessage } from '@livekit/components-react';
import { ChatEntry } from '@/components/livekit/chat-entry';

import { cn } from '@/lib/utils';

interface ChatTranscriptProps {
  hidden?: boolean;
  messages?: ReceivedChatMessage[];
  className?: string;
}

export function ChatTranscript({
  messages = [],
  className = '',
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Native smooth scroll
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutMsg = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timeoutMsg);
  }, [messages]);

  // Simple rendering - NO animations, NO motion, NO opacity changes
  // Messages always visible, always in DOM
  return (
    <div className={cn("flex flex-col justify-end min-h-0", className)}>
      {messages.map(({ id, timestamp, from, message, editTimestamp }: ReceivedChatMessage) => {
        const locale = navigator?.language ?? 'en-US';
        const messageOrigin = from?.isLocal ? 'local' : 'remote';
        const hasBeenEdited = !!editTimestamp;

        return (
          <ChatEntry
            key={id}
            locale={locale}
            timestamp={timestamp}
            message={message}
            messageOrigin={messageOrigin}
            hasBeenEdited={hasBeenEdited}
          />
        );
      })}
      <div ref={bottomRef} className="h-[1px] w-full" />
    </div>
  );
}
