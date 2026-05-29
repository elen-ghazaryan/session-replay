import type { TrackPayload } from '../core/Batcher';

const RRWEB_EVENT_TYPE_NAMES: Record<number, string> = {
  0: 'DomContentLoaded',
  1: 'Load',
  2: 'FullSnapshot',
  3: 'IncrementalSnapshot',
  4: 'Meta',
  5: 'Custom',
  6: 'Plugin',
};

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
      eventType: RRWEB_EVENT_TYPE_NAMES[event.type] ?? 'Unknown',
      timestamp: new Date(event.timestamp).toISOString(),
      data: event.data,
      pageUrl,
    })),
  };
}
