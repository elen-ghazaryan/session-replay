package com.tracker.backend.controller

import com.tracker.backend.dto.ApiResponse
import com.tracker.backend.dto.CreateTrackRequest
import com.tracker.backend.dto.ReplayDto
import com.tracker.backend.dto.SessionDetailDto
import com.tracker.backend.dto.SessionListDto
import com.tracker.backend.service.TrackingService
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api")
class TrackingController(
    private val trackingService: TrackingService,
) {
    @PostMapping("/track")
    fun track(
        @Valid @RequestBody request: CreateTrackRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<ApiResponse<Unit>> {
        trackingService.track(request, httpRequest.remoteAddr)
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok())
    }

    @GetMapping("/sessions")
    fun listSessions(
        @RequestParam(defaultValue = "20") limit: Int,
        @RequestParam(defaultValue = "0") offset: Int,
    ): ApiResponse<SessionListDto> = ApiResponse.ok(trackingService.listSessions(limit, offset))

    @GetMapping("/sessions/{id}")
    fun getDetail(
        @PathVariable id: UUID,
    ): ApiResponse<SessionDetailDto> = ApiResponse.ok(trackingService.getDetail(id))

    @GetMapping("/sessions/{id}/replay")
    fun getReplay(
        @PathVariable id: UUID,
    ): ApiResponse<ReplayDto> = ApiResponse.ok(trackingService.getReplay(id))
}
