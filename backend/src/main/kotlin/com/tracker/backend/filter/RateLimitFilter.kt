package com.tracker.backend.filter

import com.tracker.backend.dto.ApiError
import com.tracker.backend.dto.ApiResponse
import com.github.benmanes.caffeine.cache.Cache
import com.github.benmanes.caffeine.cache.Caffeine
import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.util.concurrent.TimeUnit

@Component
class RateLimitFilter(
    private val objectMapper: ObjectMapper,
    @Value("\${ratelimit.track.capacity}") private val capacity: Long,
    @Value("\${ratelimit.track.refill-per-minute}") private val refillPerMinute: Long,
    @Value("\${ratelimit.track.bucket-ttl-minutes}") private val bucketTtlMinutes: Long,
) : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    private val buckets: Cache<String, Bucket> = Caffeine.newBuilder()
        .expireAfterAccess(Duration.ofMinutes(bucketTtlMinutes))
        .build()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        if (request.method != "POST" || request.requestURI != "/api/track") {
            chain.doFilter(request, response)
            return
        }

        // Behind a proxy/LB this returns the proxy IP — set
        // `server.forward-headers-strategy: native` in the prod profile.
        val ip = request.remoteAddr
        val bucket = buckets.get(ip) { newBucket() }
        val probe = bucket.tryConsumeAndReturnRemaining(1)

        if (probe.isConsumed) {
            chain.doFilter(request, response)
            return
        }

        val retryAfterSeconds = TimeUnit.NANOSECONDS
            .toSeconds(probe.nanosToWaitForRefill)
            .coerceAtLeast(1L)

        log.warn("Rate-limited POST /api/track from IP={}", ip)

        response.status = HttpStatus.TOO_MANY_REQUESTS.value()
        response.setHeader(HttpHeaders.RETRY_AFTER, retryAfterSeconds.toString())
        response.contentType = MediaType.APPLICATION_JSON_VALUE

        val body = ApiResponse.fail(
            ApiError(
                code = "RATE_LIMITED",
                message = "Too many requests. Retry after ${retryAfterSeconds}s.",
            ),
        )
        response.writer.write(objectMapper.writeValueAsString(body))
    }

    private fun newBucket(): Bucket = Bucket.builder()
        .addLimit(
            Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(refillPerMinute, Duration.ofMinutes(1))
                .build(),
        )
        .build()
}
