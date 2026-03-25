import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { PaperPlaneRightIcon, SpinnerIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/livekit/button';
import { cn } from '@/lib/utils';

const MOTION_PROPS = {
  variants: {
    hidden: {
      height: 0,
      opacity: 0,
      // Removed marginBottom: 0,
    },
    visible: {
      height: 'auto',
      opacity: 1,
      // Removed marginBottom: 12,
    },
  },
  initial: 'hidden' as const,
  transition: {
    duration: 0.3,
    ease: 'easeOut' as const,
  },
};

interface ChatInputProps {
  chatOpen: boolean;
  isAgentAvailable?: boolean;
  onSend?: (message: string) => void;
}

export function ChatInput({
  chatOpen,
  isAgentAvailable = false,
  onSend = async () => { },
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent sending empty or whitespace-only messages
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      return;
    }

    // Filter out dots-only messages (., .., ..., etc.) - these cause AI to respond unnecessarily
    if (/^[.\s]+$/.test(trimmedMessage)) {
      console.log('Ignoring dots-only message');
      setMessage('');
      return;
    }

    try {
      setIsSending(true);
      await onSend(trimmedMessage);
      setMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const isDisabled = isSending || !isAgentAvailable || message.trim().length === 0;

  useEffect(() => {
    if (chatOpen && isAgentAvailable) return;
    // when not disabled refocus on input
    inputRef.current?.focus();
  }, [chatOpen, isAgentAvailable]);

  return (
    <motion.div
      // @ts-ignore - inert is a valid HTML attribute
      inert={!chatOpen ? true : undefined}
      {...MOTION_PROPS}
      animate={chatOpen ? 'visible' : 'hidden'}
      // Removed border-b border-cyan-500/20 mb-4 to integrate with the new bar theme
      className="flex w-full items-start overflow-hidden"
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex grow items-end gap-3 rounded-full pl-4 pr-2 py-2 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/30 focus-within:bg-[#252525]/80 focus-within:border-white/40 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"
      >
        <input
          autoFocus
          ref={inputRef}
          type="text"
          value={message}
          disabled={!chatOpen}
          placeholder="Type your message..."
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder-white/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm font-medium tracking-wide"
        />
        <Button
          size="icon"
          type="submit"
          disabled={isDisabled}
          variant="secondary"
          title={isSending ? 'Sending...' : 'Send'}
          className={cn(
            "relative self-center rounded-full h-8 w-8 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
            !isDisabled && "bg-[#1a1a1a]/80 backdrop-blur-xl text-white border border-white/30 hover:bg-[#252525]/80 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          )}
        >
          {isSending ? (
            <SpinnerIcon className="animate-spin" weight="bold" />
          ) : (
            <PaperPlaneRightIcon weight="bold" />
          )}
        </Button>
      </form>
    </motion.div>
  );
}