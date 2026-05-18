package com.tracker.backend.filter

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockFilterChain
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import tools.jackson.databind.json.JsonMapper

class RateLimitFilterTest {

  private lateinit var filter: RateLimitFilter

  @BeforeEach
  fun setUp() {
    filter = RateLimitFilter(
      objectMapper = JsonMapper.builder().build(),
      capacity = 3,
      refillPerMinute = 60,
      bucketTtlMinutes = 10,
    )
  }

  @Test
  fun `passes through requests that are not POST to api track` () {
    //Arrange
    val request = MockHttpServletRequest("GET", "/api/lessons")
    request.remoteAddr = "1.2.3.4"

    val response = MockHttpServletResponse()
    val chain = MockFilterChain()

    //Act
    filter.doFilter(request, response, chain)

    //Assert
    assertThat(chain.request).isSameAs(request)
    assertThat(response.status).isEqualTo(200)
    assertThat(response.getHeader("Retry-After")).isNull()
  }

  @Test
  fun `passes through GET requests to api track`() {
    //Arrange
    val request = MockHttpServletRequest("GET", "/api/track")
    request.remoteAddr = "1.2.3.4"

    val response = MockHttpServletResponse()
    val chain = MockFilterChain()

    //Act
    filter.doFilter(request, response, chain)

    //Assert
    assertThat(chain.request).isSameAs(request)
    assertThat(response.status).isEqualTo(200)
    assertThat(response.getHeader("Retry-After")).isNull()
  }

  @Test
  fun `allows POST requests to api track up to the capacity`() {
    repeat(3) {
      //Arrange
      val request = MockHttpServletRequest("POST", "/api/track")
      request.remoteAddr = "1.2.3.4"
      val response = MockHttpServletResponse()
      val chain = MockFilterChain()

      //Act
      filter.doFilter(request, response, chain)

      //Assert
      assertThat(chain.request).isSameAs(request)
      assertThat(response.status).isEqualTo(200)
    }
  }

  @Test
  fun `returns 429 with Retry-After when capacity is exceeded`() {
    //Arrange — exhaust the bucket
    repeat(3) {
      val warmupRequest = MockHttpServletRequest("POST", "/api/track")
      warmupRequest.remoteAddr = "1.2.3.4"
      filter.doFilter(warmupRequest, MockHttpServletResponse(), MockFilterChain())
    }

    val request = MockHttpServletRequest("POST", "/api/track")
    request.remoteAddr = "1.2.3.4"
    val response = MockHttpServletResponse()
    val chain = MockFilterChain()

    //Act
    filter.doFilter(request, response, chain)

    //Assert
    assertThat(response.status).isEqualTo(429)
    assertThat(response.getHeader("Retry-After")).isNotNull()
    assertThat(response.getHeader("Retry-After")!!.toLong()).isGreaterThanOrEqualTo(1L)
    assertThat(response.contentType).isEqualTo("application/json")
    assertThat(response.contentAsString).contains("RATE_LIMITED")
    assertThat(response.contentAsString).contains("Too many requests")
    assertThat(chain.request).isNull()
  }

  @Test
  fun `tracks separate buckets per IP address`() {
    //Arrange — exhaust bucket for IP A
    repeat(3) {
      val warmupRequest = MockHttpServletRequest("POST", "/api/track")
      warmupRequest.remoteAddr = "1.2.3.4"
      filter.doFilter(warmupRequest, MockHttpServletResponse(), MockFilterChain())
    }

    //Act — request from a different IP
    val request = MockHttpServletRequest("POST", "/api/track")
    request.remoteAddr = "5.6.7.8"
    val response = MockHttpServletResponse()
    val chain = MockFilterChain()

    filter.doFilter(request, response, chain)

    //Assert — IP B has its own bucket, so this passes
    assertThat(chain.request).isSameAs(request)
    assertThat(response.status).isEqualTo(200)
  }
}
