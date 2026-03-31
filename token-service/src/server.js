import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const app = express();
const port = Number(process.env.PORT || 3000);

const {
  ALLOWED_ORIGIN,
  SHARED_BEARER_TOKEN,
  LIVEKIT_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  DEFAULT_CAN_PUBLISH,
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !SHARED_BEARER_TOKEN) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const allowedOrigins = ALLOWED_ORIGIN
  ? ALLOWED_ORIGIN.split(',').map((value) => value.trim())
  : true;

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'uzeed-live-token-api' });
});

app.get('/live/check-audio', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${SHARED_BEARER_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const rooms = await roomService.listRooms();

    if (rooms.length === 0) {
      return res.json({ ok: true, activeRooms: 0, rooms: [], message: 'No hay salas activas' });
    }

    const results = await Promise.all(
      rooms.map(async (room) => {
        const participants = await roomService.listParticipants(room.name);

        const participantDetails = participants.map((p) => {
          const audioTracks = (p.tracks || []).filter(
            (t) => t.type === 'AUDIO' || t.source === 'MICROPHONE',
          );
          const hasAudio = audioTracks.length > 0;
          const isMuted = hasAudio && audioTracks.every((t) => t.muted);

          return {
            identity: p.identity,
            name: p.name,
            hasAudio,
            isMuted,
            audioTracks: audioTracks.map((t) => ({
              sid: t.sid,
              name: t.name,
              muted: t.muted,
              source: t.source,
            })),
          };
        });

        const publishersWithAudio = participantDetails.filter((p) => p.hasAudio);

        return {
          room: room.name,
          sid: room.sid,
          numParticipants: room.numParticipants,
          receivingAudio: publishersWithAudio.some((p) => !p.isMuted),
          publishersWithAudio: publishersWithAudio.length,
          participants: participantDetails,
        };
      }),
    );

    return res.json({
      ok: true,
      activeRooms: rooms.length,
      rooms: results,
    });
  } catch (err) {
    console.error('Error checking audio:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/live/token', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${SHARED_BEARER_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    identity,
    room,
    name,
    metadata,
    canPublish = DEFAULT_CAN_PUBLISH === 'true',
    canSubscribe = true,
    canPublishData = true,
    ttl = '1h',
  } = req.body || {};

  if (!identity || !room) {
    return res.status(400).json({ error: 'identity and room are required' });
  }

  const encodedMetadata =
    metadata === undefined
      ? undefined
      : typeof metadata === 'string'
        ? metadata
        : JSON.stringify(metadata);

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: String(identity),
    name: name ? String(name) : String(identity),
    ttl: String(ttl),
    metadata: encodedMetadata,
  });

  token.addGrant({
    roomJoin: true,
    room: String(room),
    canPublish: Boolean(canPublish),
    canSubscribe: Boolean(canSubscribe),
    canPublishData: Boolean(canPublishData),
  });

  return res.json({
    token: await token.toJwt(),
    url: LIVEKIT_URL,
    room: String(room),
    identity: String(identity),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`uzeed-live-token-api listening on ${port}`);
});
