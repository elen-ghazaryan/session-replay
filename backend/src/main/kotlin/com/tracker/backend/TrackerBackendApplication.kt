package com.tracker.backend

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class TrackerBackendApplication

fun main(args: Array<String>) {
	runApplication<TrackerBackendApplication>(*args)
}
