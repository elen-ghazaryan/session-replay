package com.tracker.backend.mapper

import com.tracker.backend.dto.EventDetailDto
import com.tracker.backend.dto.SessionSummaryDto
import com.tracker.backend.model.Event
import com.tracker.backend.model.Session
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

@Component
class TrackerMapper(
    private val objectMapper: ObjectMapper,
) {
    fun toSessionSummary(session: Session): SessionSummaryDto =
        SessionSummaryDto(
            id = session.id,
            appId = session.appId,
            startTime = session.startTime,
            endTime = session.endTime,
            eventCount = session.eventCount,
            userAgent = session.userAgent,
            screenResolution = session.screenResolution,
            timezone = session.timezone,
            deviceInfo = session.deviceInfo?.let { objectMapper.readTree(it) },
        )

    fun toEventDetail(event: Event): EventDetailDto =
        EventDetailDto(
            id = event.id ?: error("Event id is null after persistence"),
            eventType = event.eventType,
            timestamp = event.timestamp,
            data = objectMapper.readTree(event.data),
            pageUrl = event.pageUrl,
        )
}
