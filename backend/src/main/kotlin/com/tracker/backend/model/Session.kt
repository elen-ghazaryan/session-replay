package com.tracker.backend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "sessions")
class Session(
    @Id
    val id: UUID,

    @Column(name = "app_id", nullable = false)
    val appId: String,

    @Column(name = "start_time", nullable = false)
    val startTime: Instant,

    @Column(name = "end_time")
    var endTime: Instant? = null,

    @Column(name = "event_count", nullable = false)
    var eventCount: Int = 0,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "device_info", columnDefinition = "jsonb")
    val deviceInfo: String? = null,

    @Column(name = "screen_resolution")
    val screenResolution: String? = null,

    @Column(name = "timezone")
    val timezone: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
