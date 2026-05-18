package com.tracker.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "events")
class Event(
    @Column(name = "session_id", nullable = false)
    val sessionId: UUID,

    @Column(name = "event_type", nullable = false)
    val eventType: String,

    @Column(name = "timestamp", nullable = false)
    val timestamp: Instant,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", nullable = false, columnDefinition = "jsonb")
    val data: String,

    @Column(name = "page_url")
    val pageUrl: String? = null,

    @Column(name = "received_at", nullable = false, updatable = false)
    val receivedAt: Instant = Instant.now(),

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
)
