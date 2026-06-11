package com.tracker.backend.dto

import tools.jackson.databind.JsonNode
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class CreateTrackRequest(
    @field:Valid
    @field:NotNull
    val session: SessionDto,

    @field:Valid
    @field:NotEmpty
    val events: List<EventDto>,
)

data class SessionDto(
    @field:NotNull
    val id: UUID,

    @field:NotBlank
    val appId: String,

    @field:NotNull
    val startTime: Instant,

    val userAgent: String? = null,

    val deviceInfo: JsonNode? = null,

    val screenResolution: String? = null,

    val timezone: String? = null,
)

data class EventDto(
    @field:NotNull
    val clientEventId: UUID,

    @field:NotBlank
    val eventType: String,

    @field:NotNull
    val timestamp: Instant,

    @field:NotNull
    val data: JsonNode,

    val pageUrl: String? = null,
)
