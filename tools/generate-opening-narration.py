#!/usr/bin/env python3
"""Generate the approved InterviewRunway opening narration with Hume Pavitra2.

The API key is read only from HUME_API_KEY. It is never persisted or printed.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "audio"
OUTPUT_AUDIO = OUTPUT_DIR / "interviewrunway-three-stage-pavitra2.mp3"
OUTPUT_CUES = OUTPUT_DIR / "interviewrunway-three-stage-pavitra2.json"
VOICE_NAME = "Pavitra2"
VOICE_ID = "2e4f5fed-e691-4d6a-bdbe-82880007ad4b"

SCENES = [
    {
        "id": "signal",
        "caption": "TURN EXPERIENCE INTO INTERVIEW SIGNAL.",
        "text": "Most engineers don’t lack experience. They lose signal when an interview puts that experience under pressure. InterviewRunway turns scattered preparation into a three-stage flight path.",
    },
    {
        "id": "foundation",
        "caption": "01 · FOUNDATION · ₹799 ONCE.",
        "text": "First, Foundation. ₹799 once. Structured flight plans connect DSA patterns, system design, behavioural evidence, role intelligence, and remote-career decisions. Diagnostics and checkpoints turn disconnected study into a baseline you can test. Complete Foundation clearance—and the cockpit comes alive.",
    },
    {
        "id": "second-seat",
        "caption": "02 · THE SECOND SEAT · ₹2,499 AFTER CLEARANCE.",
        "text": "Meet the Second Seat—the primary product. For ₹2,499 after clearance, its live AI practice system responds to each answer. One question is examined from interviewer, system-designer, and communication perspectives. The next question changes because your last answer changed. Practice evidence, progress, specialist training systems, and included practice time stay connected, so you can see the gap, correct it, and run the loop again. You remain in command.",
    },
    {
        "id": "whatsapp",
        "caption": "ASYNCHRONOUS EXPERT GUIDANCE · WHATSAPP.",
        "text": "Between sessions, asynchronous expert guidance can continue through WhatsApp—so questions and next-step direction do not have to wait for a scheduled call. This is preparation guidance, not covert help during a restricted interview.",
    },
    {
        "id": "calibration",
        "caption": "03 · HUMAN CALIBRATION · ₹9,999.",
        "text": "When repeated evidence reveals a gap that needs human judgment, Human Calibration joins the final approach. For ₹9,999, a scheduled one-to-one session begins with your practice record, focuses on the specific pattern holding you back, and produces a clear correction plan—not a generic coaching script. Evidence first. Human time where it matters.",
    },
    {
        "id": "runway",
        "caption": "START FOUNDATION · ₹799.",
        "text": "Learn the terrain. Unlock live AI. Calibrate with a person. Start Foundation. Build the flight plan. Bring the Second Seat alive.",
    },
]


def request_json(url: str, api_key: str, payload: dict | None = None) -> dict:
    headers = {
        "Accept": "application/json",
        "X-Hume-Api-Key": api_key,
        "User-Agent": "InterviewRunway/1.0",
    }
    method = "GET"
    body = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        method = "POST"
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:400]
        raise RuntimeError(f"Hume request failed ({error.code}): {detail}") from error


def iter_dicts(value: object):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_dicts(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_dicts(child)


def verify_voice(api_key: str) -> None:
    query = urllib.parse.urlencode({"provider": "CUSTOM_VOICE"})
    result = request_json(f"https://api.hume.ai/v0/tts/voices?{query}", api_key)
    matched = any(
        item.get("id") == VOICE_ID
        and item.get("name") == VOICE_NAME
        and str(item.get("provider", "CUSTOM_VOICE")).upper() == "CUSTOM_VOICE"
        for item in iter_dicts(result)
    )
    if not matched:
        raise RuntimeError("The approved Pavitra2 custom voice was not found in the connected Hume account")


def run(command: list[str], *, capture: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, text=True, capture_output=capture)


def duration(path: Path) -> float:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture=True,
    )
    return float(result.stdout.strip())


def synthesize_scene(scene: dict, api_key: str, destination: Path) -> dict:
    payload = {
        "version": "2",
        "utterances": [
            {
                "text": scene["text"],
                "voice": {"id": VOICE_ID},
                "trailing_silence": 0.32,
            }
        ],
        "format": {"type": "wav"},
        "include_timestamp_types": ["word"],
        "num_generations": 1,
        "split_utterances": True,
        "strip_headers": True,
        "instant_mode": False,
    }
    result = request_json("https://api.hume.ai/v0/tts", api_key, payload)
    generation = (result.get("generations") or [{}])[0]
    encoded = generation.get("audio")
    if not encoded:
        raise RuntimeError(f"Hume returned no audio for scene {scene['id']}")
    destination.write_bytes(base64.b64decode(encoded))
    return {
        "request_id": result.get("request_id"),
        "generation_id": generation.get("generation_id"),
    }


def normalize(source: Path, destination: Path) -> None:
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-vn",
            "-af",
            "loudnorm=I=-16:LRA=7:TP=-1.5,aresample=48000",
            "-ac",
            "1",
            "-ar",
            "48000",
            "-c:a",
            "pcm_s16le",
            str(destination),
        ]
    )


def main() -> None:
    api_key = os.environ.get("HUME_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("HUME_API_KEY is required")
    if sum(len(scene["text"]) for scene in SCENES) > 3_500:
        raise RuntimeError("Spend guard rejected an unexpectedly large narration")

    verify_voice(api_key)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    cue_records = []

    with tempfile.TemporaryDirectory(prefix="interviewrunway-pavitra2-") as temporary:
        work = Path(temporary)
        normalized_paths = []
        elapsed = 0.0
        for index, scene in enumerate(SCENES, start=1):
            raw = work / f"{index:02d}-raw.wav"
            normalized = work / f"{index:02d}-normalized.wav"
            synthesize_scene(scene, api_key, raw)
            normalize(raw, normalized)
            seconds = duration(normalized)
            normalized_paths.append(normalized)
            cue_records.append(
                {
                    "id": scene["id"],
                    "start": round(elapsed, 3),
                    "end": round(elapsed + seconds, 3),
                    "duration": round(seconds, 3),
                    "caption": scene["caption"],
                    "text_sha256": hashlib.sha256(scene["text"].encode("utf-8")).hexdigest(),
                }
            )
            elapsed += seconds
            print(f"Generated scene {index}/6 · {scene['id']} · {seconds:.2f}s", flush=True)

        concat = work / "segments.ffconcat"
        concat.write_text(
            "ffconcat version 1.0\n"
            + "\n".join(f"file '{path.as_posix()}'" for path in normalized_paths)
            + "\n",
            encoding="utf-8",
        )
        joined = work / "joined.wav"
        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat),
                "-c:a",
                "pcm_s16le",
                str(joined),
            ]
        )
        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-i",
                str(joined),
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "160k",
                "-ar",
                "48000",
                "-ac",
                "1",
                str(OUTPUT_AUDIO),
            ]
        )

    final_duration = duration(OUTPUT_AUDIO)
    metadata = {
        "voice": {"name": VOICE_NAME, "id": VOICE_ID, "provider": "CUSTOM_VOICE", "version": "2"},
        "duration": round(final_duration, 3),
        "audio_sha256": hashlib.sha256(OUTPUT_AUDIO.read_bytes()).hexdigest(),
        "scenes": cue_records,
    }
    OUTPUT_CUES.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Created {OUTPUT_AUDIO.relative_to(ROOT)} · {final_duration:.2f}s", flush=True)


if __name__ == "__main__":
    main()
