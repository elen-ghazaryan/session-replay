import { EventType } from 'rrweb';
import type { TrackPayload } from '../core/Batcher';

export type CreateTrackRequest = {
  session: {
    id: string;
    appId: string;
    startTime: string;
    userAgent: string;
    screenResolution: string;
    timezone: string;
  };
  events: Array<{
    eventType: string;
    timestamp: string;
    data: unknown;
    pageUrl: string;
  }>;
};

export function toCreateTrackRequest(payload: TrackPayload): CreateTrackRequest {
  return {
    session: {
      id: payload.session.sessionId,
      appId: payload.session.appId,
      startTime: new Date(payload.session.startedAt).toISOString(),
      userAgent: payload.session.userAgent,
      screenResolution: `${payload.session.screenWidth}x${payload.session.screenHeight}`,
      timezone: payload.session.timezone,
    },
    events: payload.events.map(({ event, pageUrl }) => ({
      eventType: EventType[event.type] ?? 'Unknown',
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data,
      pageUrl,
    })),
  };
}
