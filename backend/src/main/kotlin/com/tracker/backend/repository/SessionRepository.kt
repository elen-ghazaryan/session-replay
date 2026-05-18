package com.tracker.backend.repository

import com.tracker.backend.model.Session
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface SessionRepository : JpaRepository<Session, UUID> {

    @Query(
        value = "SELECT * FROM sessions ORDER BY start_time DESC LIMIT :limit OFFSET :offset",
        nativeQuery = true,
    )
    fun findRecent(
        @Param("limit") limit: Int,
        @Param("offset") offset: Int,
    ): List<Session>
}
