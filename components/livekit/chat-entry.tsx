import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The locale to use for the timestamp. */
  locale: string;
  /** The timestamp of the message. */
  timestamp: number;
  /** The message to display. */
  message: string;
  /** The origin of the message. */
  messageOrigin: 'local' | 'remote';
  /** The sender's name. */
  name?: string;
  /** Whether the message has been edited. */
  hasBeenEdited?: boolean;
}

export const ChatEntry = ({
  name,
  locale,
  timestamp,
  message,
  messageOrigin,
  hasBeenEdited = false,
  className,
  ...props
}: ChatEntryProps) => {
  const time = new Date(timestamp);
  const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn('group flex w-full flex-col gap-3 animate-slide-up', className)}
      {...props}
    >
      <div className={cn(
        'flex w-full',
        messageOrigin === 'local' ? 'justify-end' : 'justify-start'
      )}>
        <div className={cn(
          'max-w-3xl relative',
          messageOrigin === 'local' ? 'ml-12' : 'mr-12'
        )}>
          {/* Message Card */}
          <div className={cn(
            'effect-3d rounded-2xl p-4 transition-all duration-300 hover:border-white/20',
            messageOrigin === 'local'
              ? 'bg-white/10 border border-white/10 text-white shadow-lg shadow-black/20'
              : 'bg-white/5 border border-white/5 text-white/90 shadow-md shadow-black/10'
          )}>
            {/* Message Header */}
            <header className={cn(
              'flex items-center gap-2 text-sm mb-2',
              messageOrigin === 'local' ? 'flex-row-reverse' : 'text-left'
            )}>
              {name && (
                <strong className="font-semibold text-white/90">
                  {name}
                </strong>
              )}
              <span className="font-mono text-xs opacity-40 transition-opacity ease-linear group-hover:opacity-80">
                {hasBeenEdited && '*'}
                {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
              </span>
            </header>

            {/* Message Content */}
            <div className="text-sm leading-relaxed text-white/80">
              {message}
            </div>
          </div>

          {/* Avatar */}
          <div className={cn(
            'absolute top-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#0a0a0a]',
            messageOrigin === 'local'
              ? 'right-0 bg-white text-black'
              : 'left-0 bg-[#222] text-white border border-white/10'
          )}>
            {messageOrigin === 'local' ? 'U' : 'AI'}
          </div>
        </div>
      </div>
    </li>
  );
};
