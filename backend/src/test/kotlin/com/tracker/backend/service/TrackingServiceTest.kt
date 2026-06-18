package com.tracker.backend.service

import com.tracker.backend.dto.CreateTrackRequest
import com.tracker.backend.dto.EventDetailDto
import com.tracker.backend.dto.EventDto
import com.tracker.backend.dto.SessionDto
import com.tracker.backend.dto.SessionSummaryDto
import com.tracker.backend.exception.SessionNotFoundException
import com.tracker.backend.mapper.TrackerMapper
import com.tracker.backend.model.Event
import com.tracker.backend.model.Session
import com.tracker.backend.repository.EventRepository
import com.tracker.backend.repository.SessionRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper
import java.time.Instant
import java.util.Optional
import java.util.UUID

class TrackingServiceTest {
    private lateinit var sessionRepository: SessionRepository
    private lateinit var eventRepository: EventRepository
    private lateinit var trackerMapper: TrackerMapper
    private lateinit var objectMapper: ObjectMapper
    private lateinit var service: TrackingService

    private val sessionId: UUID = UUID.fromString("11111111-1111-1111-1111-111111111111")

    @BeforeEach
    fun setUp() {
        sessionRepository = mockk()
        eventRepository = mockk()
        trackerMapper = mockk()
        objectMapper = JsonMapper.builder().build()
        service = TrackingService(sessionRepository, eventRepository, objectMapper, trackerMapper)
    }

    @Test
    fun `listSessions returns mapped sessions with total count`() {
        val session = buildSession()
        val dto = buildSessionSummaryDto()
        every { sessionRepository.findRecent(20, 0) } returns listOf(session)
        every { sessionRepository.count() } returns 5L
        every { trackerMapper.toSessionSummary(session) } returns dto

        val result = service.listSessions(limit = 20, offset = 0)

        assertThat(result.items).containsExactly(dto)
        assertThat(result.total).isEqualTo(5L)
        assertThat(result.limit).isEqualTo(20)
        assertThat(result.offset).isEqualTo(0)
    }

    @Test
    fun `listSessions clamps limit above max to 100`() {
        every { sessionRepository.findRecent(100, 0) } returns emptyList()
        every { sessionRepository.count() } returns 0L

        val result = service.listSessions(limit = 9999, offset = 0)

        assertThat(result.limit).isEqualTo(100)
        verify { sessionRepository.findRecent(100, 0) }
    }

    @Test
    fun `listSessions clamps negative offset to 0`() {
        every { sessionRepository.findRecent(20, 0) } returns emptyList()
        every { sessionRepository.count() } returns 0L

        val result = service.listSessions(limit = 20, offset = -5)

        assertThat(result.offset).isEqualTo(0)
        verify { sessionRepository.findRecent(20, 0) }
    }

    @Test
    fun `getDetail returns session with events when session exists`() {
        val session = buildSession()
        val event = buildEvent()
        val sessionDto = buildSessionSummaryDto()
        val eventDto = buildEventDetailDto()
        every { sessionRepository.findById(sessionId) } returns Optional.of(session)
        every { eventRepository.findBySessionIdOrderByTimestampAsc(sessionId) } returns listOf(event)
        every { trackerMapper.toSessionSummary(session) } returns sessionDto
        every { trackerMapper.toEventDetail(event) } returns eventDto

        val result = service.getDetail(sessionId)

        assertThat(result.session).isEqualTo(sessionDto)
        assertThat(result.events).containsExactly(eventDto)
    }

    @Test
    fun `getDetail throws SessionNotFoundException when session missing`() {
        every { sessionRepository.findById(sessionId) } returns Optional.empty()

        assertThrows<SessionNotFoundException> {
            service.getDetail(sessionId)
        }
    }

    @Test
    fun `getReplay returns events when session exists`() {
        val event = buildEvent()
        val eventDto = buildEventDetailDto()
        every { sessionRepository.existsById(sessionId) } returns true
        every { eventRepository.findBySessionIdOrderByTimestampAsc(sessionId) } returns listOf(event)
        every { trackerMapper.toEventDetail(event) } returns eventDto

        val result = service.getReplay(sessionId)

        assertThat(result.sessionId).isEqualTo(sessionId)
        assertThat(result.events).containsExactly(eventDto)
    }

    @Test
    fun `getReplay throws SessionNotFoundException when session missing`() {
        every { sessionRepository.existsById(sessionId) } returns false

        assertThrows<SessionNotFoundException> {
            service.getReplay(sessionId)
        }
    }

    @Test
    fun `track creates a new session when none exists and saves events`() {
        val request = buildTrackRequest(eventsCount = 2)
        every { sessionRepository.findById(request.session.id) } returns Optional.empty()
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { eventRepository.findExistingClientEventIds(any()) } returns emptyList()
        every { eventRepository.saveAll(any<List<Event>>()) } answers { firstArg() }

        service.track(request, ipAddress = "1.2.3.4")

        val sessionSlot = slot<Session>()
        verify { sessionRepository.save(capture(sessionSlot)) }
        assertThat(sessionSlot.captured.id).isEqualTo(request.session.id)
        assertThat(sessionSlot.captured.appId).isEqualTo("demo-app")
        assertThat(sessionSlot.captured.ipAddress).isEqualTo("1.2.3.4")
        assertThat(sessionSlot.captured.eventCount).isEqualTo(2)

        val eventsSlot = slot<List<Event>>()
        verify { eventRepository.saveAll(capture(eventsSlot)) }
        assertThat(eventsSlot.captured).hasSize(2)
        assertThat(eventsSlot.captured[0].sessionId).isEqualTo(request.session.id)
        assertThat(eventsSlot.captured[0].eventType).isEqualTo("click")
    }

    @Test
    fun `track reuses existing session and increments eventCount`() {
        val existing = buildSession(eventCount = 10)
        val request = buildTrackRequest(eventsCount = 3)
        every { sessionRepository.findById(request.session.id) } returns Optional.of(existing)
        every { sessionRepository.save(existing) } returns existing
        every { eventRepository.findExistingClientEventIds(any()) } returns emptyList()
        every { eventRepository.saveAll(any<List<Event>>()) } answers { firstArg() }

        service.track(request, ipAddress = "1.2.3.4")

        assertThat(existing.eventCount).isEqualTo(13)
        verify { sessionRepository.save(existing) }
    }

    @Test
    fun `track skips events whose clientEventId already exists and counts only new`() {
        val request = buildTrackRequest(eventsCount = 3)
        val alreadyStored = request.events[0].clientEventId
        every { sessionRepository.findById(request.session.id) } returns Optional.empty()
        every { sessionRepository.save(any()) } answers { firstArg() }
        every { eventRepository.findExistingClientEventIds(any()) } returns listOf(alreadyStored)
        every { eventRepository.saveAll(any<List<Event>>()) } answers { firstArg() }

        service.track(request, ipAddress = "1.2.3.4")

        val eventsSlot = slot<List<Event>>()
        verify { eventRepository.saveAll(capture(eventsSlot)) }
        assertThat(eventsSlot.captured).hasSize(2)
        assertThat(eventsSlot.captured.map { it.clientEventId }).doesNotContain(alreadyStored)

        val sessionSlot = slot<Session>()
        verify { sessionRepository.save(capture(sessionSlot)) }
        assertThat(sessionSlot.captured.eventCount).isEqualTo(2)
    }

    private fun buildSession(
        id: UUID = sessionId,
        appId: String = "demo-app",
        startTime: Instant = Instant.parse("2026-05-05T10:00:00Z"),
        eventCount: Int = 0,
    ): Session =
        Session(
            id = id,
            appId = appId,
            startTime = startTime,
            eventCount = eventCount,
        )

    private fun buildEvent(
        sessionId: UUID = this.sessionId,
        clientEventId: UUID = UUID.randomUUID(),
        eventType: String = "click",
    ): Event =
        Event(
            sessionId = sessionId,
            clientEventId = clientEventId,
            eventType = eventType,
            timestamp = Instant.parse("2026-05-05T10:05:00Z"),
            data = """{"x":50}""",
            id = 1L,
        )

    private fun buildSessionSummaryDto(id: UUID = sessionId): SessionSummaryDto =
        SessionSummaryDto(
            id = id,
            appId = "demo-app",
            startTime = Instant.parse("2026-05-05T10:00:00Z"),
            endTime = null,
            eventCount = 0,
            userAgent = null,
            screenResolution = null,
            timezone = null,
            deviceInfo = null,
        )

    private fun buildEventDetailDto(id: Long = 1L): EventDetailDto =
        EventDetailDto(
            id = id,
            eventType = "click",
            timestamp = Instant.parse("2026-05-05T10:05:00Z"),
            data = objectMapper.readTree("""{"x":50}"""),
            pageUrl = null,
        )

    private fun buildTrackRequest(
        sessionId: UUID = this.sessionId,
        eventsCount: Int = 2,
    ): CreateTrackRequest =
        CreateTrackRequest(
            session =
                SessionDto(
                    id = sessionId,
                    appId = "demo-app",
                    startTime = Instant.parse("2026-05-05T10:00:00Z"),
                    userAgent = "Mozilla/5.0",
                ),
            events =
                (1..eventsCount).map {
                    EventDto(
                        clientEventId = UUID.randomUUID(),
                        eventType = "click",
                        timestamp = Instant.parse("2026-05-05T10:0$it:00Z"),
                        data = objectMapper.readTree("""{"i":$it}"""),
                    )
                },
        )
}
