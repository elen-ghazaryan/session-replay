import type {EventDetail} from "../types";
import {EventType} from "rrweb";
import type {eventWithTime} from "rrweb";

// Reverse of the SDK's mapper.ts: string name → rrweb numeric type.
function toRrwebEvent(e: EventDetail): eventWithTime | null {
    const type = EventType[e.eventType as keyof typeof EventType];
    if(type === undefined) return null;

    return {
        type,
        data: e.data,
        timestamp: new Date(e.timestamp).getTime(),
    } as eventWithTime;
}

export function toRrwebEvents(events: EventDetail[]): eventWithTime[] {
    return events.map(toRrwebEvent).filter((e): e is eventWithTime => e !== null);
}