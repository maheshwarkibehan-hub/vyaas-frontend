import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // ✅ Check environment variables
    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      throw new Error('Missing LiveKit environment variables');
    }

    // ✅ Parse configuration from frontend request body
    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;

    // ✅ Generate random unique participant info
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    // ✅ Create fresh token for this participant
    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName
    );

    // ✅ Return connection details to frontend
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName,
      participantToken,
    };

    const headers = new Headers({ 'Cache-Control': 'no-store' });
    return NextResponse.json(data, { headers });

  } catch (error) {
    console.error('❌ Error creating LiveKit token:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
}

/**
 * ✅ Token generator helper
 * - Token TTL (expiry) increased to 1 hour
 * - Clean structure for reliability
 */
async function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {

  // ✅ AccessToken with extended TTL (1 hour)
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: 60 * 60, // seconds → 1 hour validity
  });

  // ✅ Grant permissions
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  // ✅ Optional room configuration if agentName provided
  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  // ✅ Return the signed JWT token
  return at.toJwt();
}
