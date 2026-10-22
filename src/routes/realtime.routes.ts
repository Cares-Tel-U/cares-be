import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  addSSEClient,
  removeSSEClient,
  getSSEClientCount,
  broadcastRealtimeEvent,
} from '../utils/realtime.util';

const router = Router();

// Endpoint SSE Stream: GET /api/v1/realtime/events
router.get('/events', (req: Request, res: Response) => {
  const clientId = randomUUID();

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`:connected ${clientId}\n\n`);

  addSSEClient(clientId, res);

  // Kirim ping berkala agar koneksi tetap hidup
  const pingInterval = setInterval(() => {
    try {
      res.write(`:ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(pingInterval);
      removeSSEClient(clientId);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    removeSSEClient(clientId);
  });
});

// Endpoint status koneksi SSE: GET /api/v1/realtime/status
router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    activeConnections: getSSEClientCount(),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint broadcast event (berguna untuk testing atau integrasi manual)
router.post('/broadcast', (req: Request, res: Response) => {
  const { type, data } = req.body;
  if (!type) {
    return res.status(400).json({
      status: 'error',
      message: 'Field type wajib diisi.',
    });
  }

  broadcastRealtimeEvent({ type, data });

  return res.status(200).json({
    status: 'success',
    message: 'Event realtime berhasil disiarkan',
    data: { type, data },
  });
});

export default router;
