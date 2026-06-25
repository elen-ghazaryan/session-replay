package com.tracker.backend.config

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

@Configuration
class WebConfig {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val source = UrlBasedCorsConfigurationSource()

        val trackConfig =
            CorsConfiguration().apply {
                addAllowedOriginPattern("*")
                allowedMethods = listOf("POST", "OPTIONS")
                addAllowedHeader("*")
                allowCredentials = false
                maxAge = 3600
            }
        source.registerCorsConfiguration("/api/track", trackConfig)

        val dashboardConfig =
            CorsConfiguration().apply {
                addAllowedOrigin("http://localhost:5173")
                allowedMethods = listOf("GET", "OPTIONS")
                addAllowedHeader("*")
                allowCredentials = false
                maxAge = 3600
            }
        source.registerCorsConfiguration("/api/sessions/**", dashboardConfig)

        return source
    }

    @Bean
    fun corsFilter(
        @Qualifier("corsConfigurationSource") source: CorsConfigurationSource,
    ): CorsFilter = CorsFilter(source)
}
