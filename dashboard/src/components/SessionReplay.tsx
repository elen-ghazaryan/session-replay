import {useEffect, useMemo, useRef, useState} from "react";
import {Replayer} from "rrweb";
import "rrweb/dist/style.css";
import type {EventDetail} from "../types";
import {toRrwebEvents} from "../lib/replay";

const SPEEDS = [1, 2, 4, 8];
const MAX_HEIGHT = 640; // cap the replay viewport so controls stay on screen

function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function SessionReplay({events}: {events: EventDetail[]}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const replayerRef = useRef<Replayer | null>(null);

    const [ready, setReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1);

    const rrwebEvents = useMemo(() => toRrwebEvents(events), [events]);
    const hasReplay = rrwebEvents.length >= 2;

    useEffect(() => {
        const root = containerRef.current;
        if (!root || !hasReplay) return; // need a Meta + snapshot to build

        // Drive rrweb's Replayer directly: it builds its sandboxed iframe synchronously while our root
        // is connected to the document (guaranteed inside useEffect). rrweb-player's Svelte wrapper
        // builds that iframe in a deferred onMount that races StrictMode's remount and fails the
        // connected-root check, so we render the engine ourselves and supply our own controls below.
        const replayer = new Replayer(rrwebEvents, {root, speed: 1, skipInactive: true});
        replayer.on("finish", () => setPlaying(false));
        replayerRef.current = replayer;
        setDuration(replayer.getMetaData().totalTime);
        setReady(true);

        // The Replayer renders at the recorded viewport size (e.g. a 1700px desktop), which overflows
        // our card. Scale its wrapper down to fit our width and size the root to the scaled height.
        // offsetWidth/Height ignore the transform, so fit() stays correct when re-run on resize.
        const wrapper = root.querySelector<HTMLElement>(".replayer-wrapper");
        const fit = () => {
            if (!wrapper) return;
            const recW = wrapper.offsetWidth;
            const recH = wrapper.offsetHeight;
            if (!recW || !recH) return;
            // fit within both width and a capped height; never upscale past 1:1
            const scale = Math.min(root.clientWidth / recW, MAX_HEIGHT / recH, 1);
            wrapper.style.transformOrigin = "top left";
            wrapper.style.transform = `scale(${scale})`;
            root.style.height = `${recH * scale}px`;
        };
        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(root);

        return () => {
            observer.disconnect();
            replayer.pause();
            replayerRef.current = null;
            setReady(false);
            setPlaying(false);
            setCurrentTime(0);
            setSpeed(1);
            root.replaceChildren();
            root.style.height = "";
        };
    }, [rrwebEvents, hasReplay]);

    // Advance the progress bar while playing; rrweb owns the clock, we just read it.
    useEffect(() => {
        if (!playing) return;
        let raf = 0;
        const tick = () => {
            const r = replayerRef.current;
            if (r) setCurrentTime(Math.min(r.getCurrentTime(), duration));
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [playing, duration]);

    function togglePlay() {
        const r = replayerRef.current;
        if (!r) return;
        if (playing) {
            r.pause();
            setPlaying(false);
        } else {
            const from = currentTime >= duration ? 0 : currentTime; // restart if finished
            r.play(from);
            setPlaying(true);
        }
    }

    function seek(ms: number) {
        const r = replayerRef.current;
        if (!r) return;
        setCurrentTime(ms);
        if (playing) r.play(ms);
        else r.pause(ms);
    }

    function changeSpeed(s: number) {
        replayerRef.current?.setConfig({speed: s});
        setSpeed(s);
    }

    if (!hasReplay) {
        return (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-md ring-1 ring-slate-200">
                Not enough data to replay this session.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
            <div ref={containerRef} className="relative overflow-hidden bg-slate-50" />

            <div className="flex items-center gap-4 border-t border-slate-100 px-5 py-3">
                <button
                    onClick={togglePlay}
                    disabled={!ready}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40"
                    aria-label={playing ? "Pause" : "Play"}
                >
                    {playing ? "❚❚" : "▶"}
                </button>

                <span className="w-10 shrink-0 text-right font-mono text-xs text-slate-500">
                    {formatTime(currentTime)}
                </span>

                <input
                    type="range"
                    min={0}
                    max={duration}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    disabled={!ready}
                    className="h-1 flex-1 cursor-pointer accent-indigo-600"
                />

                <span className="w-10 shrink-0 font-mono text-xs text-slate-500">
                    {formatTime(duration)}
                </span>

                <div className="flex shrink-0 gap-1">
                    {SPEEDS.map((s) => (
                        <button
                            key={s}
                            onClick={() => changeSpeed(s)}
                            className={`rounded px-2 py-1 text-xs font-medium transition ${
                                speed === s
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {s}×
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
