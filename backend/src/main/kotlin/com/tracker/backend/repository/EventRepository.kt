package com.tracker.backend.repository

import com.tracker.backend.model.Event
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EventRepository : JpaRepository<Event, Long> {

    fun findBySessionIdOrderByTimestampAsc(sessionId: UUID): List<Event>
}
