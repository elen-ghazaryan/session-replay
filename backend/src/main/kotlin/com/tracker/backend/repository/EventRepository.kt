package com.tracker.backend.repository

import com.tracker.backend.model.Event
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface EventRepository : JpaRepository<Event, Long> {
    fun findBySessionIdOrderByTimestampAsc(sessionId: UUID): List<Event>

    @Query("SELECT e.clientEventId FROM Event e WHERE e.sessionId = :sessionId AND e.clientEventId IN :ids")
    fun findExistingClientEventIds(
        sessionId: UUID,
        ids: Collection<UUID>,
    ): List<UUID>
}
