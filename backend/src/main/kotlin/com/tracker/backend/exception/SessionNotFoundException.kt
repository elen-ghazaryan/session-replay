package com.tracker.backend.exception

import java.util.UUID

class SessionNotFoundException(id: UUID) : RuntimeException("Session not found: $id")
