package com.tracker.backend.mapper

import com.tracker.backend.model.Event
import com.tracker.backend.model.Session
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper
import java.time.Instant
import java.util.UUID

class TrackerMapperTest {

    private val objectMapper: ObjectMapper = JsonMapper.builder().build()
    private val mapper = TrackerMapper(objectMapper)

    @Test
    fun `toSessionSummary copies all fields and parses deviceInfo JSON`() {
        val session = buildSession(
            deviceInfo = """{"os":"macOS","browser":"Chrome"}""",
        )

        val result = mapper.toSessionSummary(session)

        assertThat(result.id).isEqualTo(session.id)
        assertThat(result.appId).isEqualTo(session.appId)
        assertThat(result.startTime).isEqualTo(session.startTime)
        assertThat(result.endTime).isEqualTo(session.endTime)
        assertThat(result.eventCount).isEqualTo(session.eventCount)
        assertThat(result.userAgent).isEqualTo(session.userAgent)
        assertThat(result.screenResolution).isEqualTo(session.screenResolution)
        assertThat(result.timezone).isEqualTo(session.timezone)
        assertThat(result.deviceInfo).isNotNull
        assertThat(result.deviceInfo!!.get("os").asString()).isEqualTo("macOS")
        assertThat(result.deviceInfo.get("browser").asString()).isEqualTo("Chrome")
    }

    @Test
    fun `toSessionSummary returns null deviceInfo when input is null`() {
        val session = buildSession(deviceInfo = null)

        val result = mapper.toSessionSummary(session)

        assertThat(result.deviceInfo).isNull()
    }

    @Test
    fun `toSessionSummary preserves null optional fields`() {
        val session = buildSession(
            endTime = null,
            userAgent = null,
            screenResolution = null,
            timezone = null,
        )

        val result = mapper.toSessionSummary(session)

        assertThat(result.endTime).isNull()
        assertThat(result.userAgent).isNull()
        assertThat(result.screenResolution).isNull()
        assertThat(result.timezone).isNull()
    }

    @Test
    fun `toEventDetail copies all fields and parses data JSON`() {
        val event = buildEvent(
            id = 42L,
            data = """{"x":100,"y":200}""",
        )

        val result = mapper.toEventDetail(event)

        assertThat(result.id).isEqualTo(42L)
        assertThat(result.eventType).isEqualTo(event.eventType)
        assertThat(result.timestamp).isEqualTo(event.timestamp)
        assertThat(result.pageUrl).isEqualTo(event.pageUrl)
        assertThat(result.data.get("x").asInt()).isEqualTo(100)
        assertThat(result.data.get("y").asInt()).isEqualTo(200)
    }

    @Test
    fun `toEventDetail throws when id is null`() {
        val event = buildEvent(id = null)

        val exception = assertThrows<IllegalStateException> {
            mapper.toEventDetail(event)
        }
        assertThat(exception.message).contains("id is null")
    }

    private fun buildSession(
        id: UUID = UUID.fromString("11111111-1111-1111-1111-111111111111"),
        appId: String = "demo-app",
        startTime: Instant = Instant.parse("2026-05-05T10:00:00Z"),
        endTime: Instant? = Instant.parse("2026-05-05T10:30:00Z"),
        eventCount: Int = 5,
        userAgent: String? = "Mozilla/5.0",
        deviceInfo: String? = """{"os":"macOS"}""",
        screenResolution: String? = "1920x1080",
        timezone: String? = "America/New_York",
    ): Session = Session(
        id = id,
        appId = appId,
        startTime = startTime,
        endTime = endTime,
        eventCount = eventCount,
        userAgent = userAgent,
        deviceInfo = deviceInfo,
        screenResolution = screenResolution,
        timezone = timezone,
    )

    private fun buildEvent(
        id: Long? = 1L,
        sessionId: UUID = UUID.fromString("11111111-1111-1111-1111-111111111111"),
        clientEventId: UUID = UUID.randomUUID(),
        eventType: String = "click",
        timestamp: Instant = Instant.parse("2026-05-05T10:05:00Z"),
        data: String = """{"x":50}""",
        pageUrl: String? = "https://example.com/home",
    ): Event = Event(
        sessionId = sessionId,
        clientEventId = clientEventId,
        eventType = eventType,
        timestamp = timestamp,
        data = data,
        pageUrl = pageUrl,
        id = id,
    )
}
