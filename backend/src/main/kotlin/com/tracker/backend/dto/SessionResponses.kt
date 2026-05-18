package com.tracker.backend.dto

import tools.jackson.databind.JsonNode
import java.time.Instant
import java.util.UUID

data class SessionSummaryDto(
    val id: UUID,
    val appId: String,
    val startTime: Instant,
    val endTime: Instant?,
    val eventCount: Int,
    val userAgent: String?,
    val screenResolution: String?,
    val timezone: String?,
    val deviceInfo: JsonNode?,
)

data class EventDetailDto(
    val id: Long,
    val eventType: String,
    val timestamp: Instant,
    val data: JsonNode,
    val pageUrl: String?,
)

data class SessionListDto(
    val items: List<SessionSummaryDto>,
    val total: Long,
    val limit: Int,
    val offset: Int,
)

data class SessionDetailDto(
    val session: SessionSummaryDto,
    val events: List<EventDetailDto>,
)

data class ReplayDto(
    val sessionId: UUID,
    val events: List<EventDetailDto>,
)
