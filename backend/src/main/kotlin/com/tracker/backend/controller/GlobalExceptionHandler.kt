package com.tracker.backend.controller

import com.tracker.backend.dto.ApiError
import com.tracker.backend.dto.ApiResponse
import com.tracker.backend.exception.SessionNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(e: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Unit>> {
        val fields = e.bindingResult.fieldErrors.associate {
            it.field to (it.defaultMessage ?: "invalid")
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiResponse.fail(
                ApiError(
                    code = "VALIDATION_FAILED",
                    message = "Request validation failed",
                    fields = fields,
                )
            )
        )
    }

    @ExceptionHandler(SessionNotFoundException::class)
    fun handleSessionNotFound(e: SessionNotFoundException): ResponseEntity<ApiResponse<Unit>> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiResponse.fail(
                ApiError(
                    code = "SESSION_NOT_FOUND",
                    message = e.message ?: "Session not found",
                )
            )
        )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleMalformedJson(e: HttpMessageNotReadableException): ResponseEntity<ApiResponse<Unit>> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiResponse.fail(
                ApiError(
                    code = "MALFORMED_REQUEST",
                    message = "Request body is not valid JSON or has wrong types",
                )
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleAny(e: Exception): ResponseEntity<ApiResponse<Unit>> {
        log.error("Unhandled exception", e)
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiResponse.fail(
                ApiError(
                    code = "INTERNAL_ERROR",
                    message = "Unexpected server error",
                )
            )
        )
    }
}
