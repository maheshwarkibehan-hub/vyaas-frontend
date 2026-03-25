import { useMemo } from 'react';
import { Room } from 'livekit-client';
import {
  type ReceivedChatMessage,
  type TextStreamData,
  useChat,
  useRoomContext,
  useTranscriptions,
} from '@livekit/components-react';

function transcriptionToChatMessage(textStream: TextStreamData, room: Room): ReceivedChatMessage {
  return {
    id: textStream.streamInfo.id,
    timestamp: textStream.streamInfo.timestamp,
    message: textStream.text,
    type: 'chatMessage',
    from:
      textStream.participantInfo.identity === room.localParticipant.identity
        ? room.localParticipant
        : Array.from(room.remoteParticipants.values()).find(
          (p) => p.identity === textStream.participantInfo.identity
        ),
  };
}

export function useChatMessages() {
  const chat = useChat();
  const room = useRoomContext();
  const transcriptions: TextStreamData[] = useTranscriptions();

  const mergedTranscriptions = useMemo(() => {
    const merged: Array<ReceivedChatMessage> = [
      ...transcriptions.map((transcription) => transcriptionToChatMessage(transcription, room)),
      ...chat.chatMessages,
    ];
    const sorted = merged.sort((a, b) => a.timestamp - b.timestamp);

    // Debug logging
    console.log('[useChatMessages] Total messages:', sorted.length);
    console.log('[useChatMessages] Chat messages:', chat.chatMessages.length);
    console.log('[useChatMessages] Transcriptions:', transcriptions.length);
    if (sorted.length > 0) {
      console.log('[useChatMessages] Latest message:', sorted[sorted.length - 1]);
    }

    return sorted;
  }, [transcriptions, chat.chatMessages, room]);

  return mergedTranscriptions;
}
