package com.tracker.backend.dto

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null,
) {
    companion object {
        fun <T> ok(data: T): ApiResponse<T> = ApiResponse(success = true, data = data)

        fun ok(): ApiResponse<Unit> = ApiResponse(success = true)

        fun fail(error: ApiError): ApiResponse<Unit> = ApiResponse(success = false, error = error)
    }
}

data class ApiError(
    val code: String,
    val message: String,
    val fields: Map<String, String>? = null,
)
