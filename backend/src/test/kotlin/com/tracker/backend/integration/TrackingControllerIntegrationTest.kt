package com.tracker.backend.integration

import com.tracker.backend.repository.EventRepository
import com.tracker.backend.repository.SessionRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import tools.jackson.databind.ObjectMapper
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals

class TrackingControllerIntegrationTest
    @Autowired
    constructor(
        private val mockMvc: MockMvc,
        private val sessionRepository: SessionRepository,
        private val eventRepository: EventRepository,
        private val objectMapper: ObjectMapper,
    ) : AbstractIntegrationTest() {
        @BeforeEach
        fun cleanDatabase() {
            eventRepository.deleteAll()
            sessionRepository.deleteAll()
        }

        @Test
        fun `POST track persists session and events and returns 202`() {
            val sessionId = UUID.randomUUID()
            val payload = trackPayload(sessionId, eventCount = 2)

            mockMvc
                .post("/api/track") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(payload)
                }.andExpect {
                    status { isAccepted() }
                    jsonPath("$.success") { value(true) }
                }

            val saved = sessionRepository.findById(sessionId).orElseThrow()
            assertEquals(2, saved.eventCount)
            assertEquals("demo-app", saved.appId)
            assertEquals(2, eventRepository.findBySessionIdOrderByTimestampAsc(sessionId).size)
        }

        @Test
        fun `POST track twice with same clientEventId persists the event only once`() {
            val sessionId = UUID.randomUUID()
            val eventId = UUID.randomUUID()
            val payload =
                mapOf(
                    "session" to
                        mapOf(
                            "id" to sessionId.toString(),
                            "appId" to "demo-app",
                            "startTime" to Instant.parse("2026-05-15T10:00:00Z").toString(),
                        ),
                    "events" to
                        listOf(
                            mapOf(
                                "clientEventId" to eventId.toString(),
                                "eventType" to "click",
                                "timestamp" to Instant.parse("2026-05-15T10:00:01Z").toString(),
                                "data" to mapOf("tag" to "button"),
                            ),
                        ),
                )

            repeat(2) {
                mockMvc
                    .post("/api/track") {
                        contentType = MediaType.APPLICATION_JSON
                        content = objectMapper.writeValueAsString(payload)
                    }.andExpect { status { isAccepted() } }
            }

            assertEquals(1, eventRepository.findBySessionIdOrderByTimestampAsc(sessionId).size)
            assertEquals(1, sessionRepository.findById(sessionId).orElseThrow().eventCount)
        }

        @Test
        fun `POST track with empty events list returns 400 VALIDATION_FAILED`() {
            val payload = trackPayload(UUID.randomUUID(), eventCount = 0)

            mockMvc
                .post("/api/track") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(payload)
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.success") { value(false) }
                    jsonPath("$.error.code") { value("VALIDATION_FAILED") }
                }
        }

        @Test
        fun `POST track with malformed JSON returns 400 MALFORMED_REQUEST`() {
            mockMvc
                .post("/api/track") {
                    contentType = MediaType.APPLICATION_JSON
                    content = "{ not valid json"
                }.andExpect {
                    status { isBadRequest() }
                    jsonPath("$.error.code") { value("MALFORMED_REQUEST") }
                }
        }

        @Test
        fun `GET sessions returns list with previously tracked session`() {
            val sessionId = UUID.randomUUID()
            postTrack(sessionId)

            mockMvc.get("/api/sessions").andExpect {
                status { isOk() }
                jsonPath("$.success") { value(true) }
                jsonPath("$.data.total") { value(1) }
                jsonPath("$.data.items[0].id") { value(sessionId.toString()) }
            }
        }

        @Test
        fun `GET session detail returns 404 for unknown id`() {
            mockMvc.get("/api/sessions/{id}", UUID.randomUUID()).andExpect {
                status { isNotFound() }
                jsonPath("$.success") { value(false) }
                jsonPath("$.error.code") { value("SESSION_NOT_FOUND") }
            }
        }

        @Test
        fun `GET session replay returns 404 for unknown id`() {
            mockMvc.get("/api/sessions/{id}/replay", UUID.randomUUID()).andExpect {
                status { isNotFound() }
                jsonPath("$.error.code") { value("SESSION_NOT_FOUND") }
            }
        }

        private fun postTrack(sessionId: UUID) {
            mockMvc
                .post("/api/track") {
                    contentType = MediaType.APPLICATION_JSON
                    content = objectMapper.writeValueAsString(trackPayload(sessionId, eventCount = 1))
                }.andExpect { status { isAccepted() } }
        }

        private fun trackPayload(
            sessionId: UUID,
            eventCount: Int,
        ): Map<String, Any> =
            mapOf(
                "session" to
                    mapOf(
                        "id" to sessionId.toString(),
                        "appId" to "demo-app",
                        "startTime" to Instant.parse("2026-05-15T10:00:00Z").toString(),
                        "userAgent" to "test-agent",
                        "screenResolution" to "1920x1080",
                        "deviceInfo" to mapOf("os" to "Mac"),
                        "timezone" to "UTC",
                    ),
                "events" to
                    (1..eventCount).map { i ->
                        mapOf(
                            "clientEventId" to UUID.randomUUID().toString(),
                            "eventType" to "click",
                            "timestamp" to Instant.parse("2026-05-15T10:00:0${i}Z").toString(),
                            "pageUrl" to "https://example.com",
                            "data" to mapOf("tag" to "button", "index" to i),
                        )
                    },
            )
    }
