package com.tracker.backend.service

import com.tracker.backend.dto.CreateTrackRequest
import com.tracker.backend.dto.ReplayDto
import com.tracker.backend.dto.SessionDetailDto
import com.tracker.backend.dto.SessionListDto
import com.tracker.backend.exception.SessionNotFoundException
import com.tracker.backend.mapper.TrackerMapper
import com.tracker.backend.model.Event
import com.tracker.backend.model.Session
import com.tracker.backend.repository.EventRepository
import com.tracker.backend.repository.SessionRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.util.UUID

@Service
class TrackingService(
    private val sessionRepository: SessionRepository,
    private val eventRepository: EventRepository,
    private val objectMapper: ObjectMapper,
    private val trackerMapper: TrackerMapper,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Transactional(readOnly = true)
    fun listSessions(
        limit: Int,
        offset: Int,
    ): SessionListDto {
        val cappedLimit = limit.coerceIn(1, MAX_PAGE_SIZE)
        val cappedOffset = offset.coerceAtLeast(0)
        log.info("Listing sessions limit={} offset={}", cappedLimit, cappedOffset)
        val items =
            sessionRepository
                .findRecent(cappedLimit, cappedOffset)
                .map(trackerMapper::toSessionSummary)
        val total = sessionRepository.count()
        log.info("Listed {} sessions (total={})", items.size, total)
        return SessionListDto(
            items = items,
            total = total,
            limit = cappedLimit,
            offset = cappedOffset,
        )
    }

    @Transactional(readOnly = true)
    fun getDetail(id: UUID): SessionDetailDto {
        log.info("Fetching session detail for id={}", id)
        val session = sessionRepository.findById(id).orElseThrow { SessionNotFoundException(id) }
        val events =
            eventRepository.findBySessionIdOrderByTimestampAsc(id).map {
                trackerMapper.toEventDetail(it)
            }
        log.info("Loaded session detail id={} events={}", id, events.size)

        return SessionDetailDto(
            session = trackerMapper.toSessionSummary(session),
            events = events,
        )
    }

    @Transactional(readOnly = true)
    fun getReplay(id: UUID): ReplayDto {
        log.info("Fetching replay for session id={}", id)
        if (!sessionRepository.existsById(id)) throw SessionNotFoundException(id)
        val events =
            eventRepository
                .findBySessionIdOrderByTimestampAsc(id)
                .map(trackerMapper::toEventDetail)
        log.info("Loaded replay id={} events={}", id, events.size)
        return ReplayDto(
            sessionId = id,
            events = events,
        )
    }

    companion object {
        private const val MAX_PAGE_SIZE = 100
    }

    @Transactional
    fun track(
        request: CreateTrackRequest,
        ipAddress: String?,
    ) {
        log.info(
            "Tracking session={} appId={} incomingEvents={}",
            request.session.id,
            request.session.appId,
            request.events.size,
        )
        val session =
            sessionRepository.findById(request.session.id).orElseGet {
                Session(
                    id = request.session.id,
                    appId = request.session.appId,
                    startTime = request.session.startTime,
                    userAgent = request.session.userAgent,
                    deviceInfo = request.session.deviceInfo?.let { objectMapper.writeValueAsString(it) },
                    screenResolution = request.session.screenResolution,
                    timezone = request.session.timezone,
                    ipAddress = ipAddress,
                )
            }

        val uniqueIncomingEvents = request.events.distinctBy { it.clientEventId }
        val incomingIds = uniqueIncomingEvents.map { it.clientEventId }
        val existing = eventRepository.findExistingClientEventIds(incomingIds).toSet()
        val newEvents = uniqueIncomingEvents.filter { it.clientEventId !in existing }

        val latest = newEvents.maxOfOrNull { it.timestamp }
        if (latest != null && (session.endTime == null || latest.isAfter(session.endTime))) {
            session.endTime = latest
        }
        session.eventCount += newEvents.size
        sessionRepository.save(session)

        val events =
            newEvents.map { dto ->
                Event(
                    sessionId = session.id,
                    clientEventId = dto.clientEventId,
                    eventType = dto.eventType,
                    timestamp = dto.timestamp,
                    data = objectMapper.writeValueAsString(dto.data),
                    pageUrl = dto.pageUrl,
                )
            }
        eventRepository.saveAll(events)
        log.info(
            "Tracked session={} new={} duplicatesSkipped={} totalEventCount={}",
            session.id,
            newEvents.size,
            request.events.size - newEvents.size,
            session.eventCount,
        )
    }
}
