CREATE TABLE sessions (
    id                UUID         PRIMARY KEY,
    app_id            VARCHAR(64)  NOT NULL,
    start_time        TIMESTAMPTZ  NOT NULL,
    end_time          TIMESTAMPTZ,
    event_count       INTEGER      NOT NULL DEFAULT 0,
    user_agent        TEXT,
    device_info       JSONB,
    screen_resolution VARCHAR(32),
    timezone          VARCHAR(64),
    ip_address        VARCHAR(45),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
    id          BIGSERIAL    PRIMARY KEY,
    session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type  VARCHAR(32)  NOT NULL,
    timestamp   TIMESTAMPTZ  NOT NULL,
    received_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    data        JSONB        NOT NULL,
    page_url    TEXT
);
