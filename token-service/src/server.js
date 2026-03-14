import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

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

app.use(cors({ origin: ALLOWED_ORIGIN?.split(',').map((v) => v.trim()) || true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'uzeed-live-token-api' });
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

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: String(identity),
    name: name ? String(name) : String(identity),
    ttl,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });

  at.addGrant({
    roomJoin: true,
    room: String(room),
    canPublish: Boolean(canPublish),
    canSubscribe: Boolean(canSubscribe),
    canPublishData: Boolean(canPublishData),
  });

  return res.json({
    token: await at.toJwt(),
    url: LIVEKIT_URL,
    room: String(room),
    identity: String(identity),
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`uzeed-live-token-api listening on ${port}`);
});
