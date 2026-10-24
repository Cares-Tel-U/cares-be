import { Response } from 'express';

export interface RealtimeEvent {
  type:
    | 'REPORT_CREATED'
    | 'REPORT_UPDATED'
    | 'REPORT_STATUS_CHANGED'
    | 'NOTIFICATION_CREATED'
    | 'NOTIFICATION_PREFERENCE_CHANGED'
    | 'USER_AVATAR_CHANGED'
    | 'PING';
  data?: any;
  timestamp: string;
}

interface SSEClient {
  id: string;
  res: Response;
  userId: string | undefined;
}

const clients: Map<string, SSEClient> = new Map();

export const addSSEClient = (id: string, res: Response, userId?: string) => {
  clients.set(id, { id, res, userId });
};

export const removeSSEClient = (id: string) => {
  clients.delete(id);
};

export const getSSEClientCount = (): number => {
  return clients.size;
};

export const clearAllSSEClients = () => {
  clients.clear();
};

export const broadcastRealtimeEvent = (event: {
  type: RealtimeEvent['type'];
  data?: any;
}) => {
  const payload: RealtimeEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const message = `data: ${JSON.stringify(payload)}\n\n`;

  for (const [id, client] of clients.entries()) {
    try {
      client.res.write(message);
    } catch {
      clients.delete(id);
    }
  }
};
