from typing import Optional


EVENT_TYPES_VALID = {"drone_sighting", "explosion", "air_defense"}

SEVERITY_MAP: dict[str, str] = {
    "air_defense": "HIGH",
    "explosion": "HIGH",
    "drone_sighting": "MEDIUM",
}


def validate_event(event: dict) -> Optional[str]:
    event_type = event.get("event_type", "")
    if event_type not in EVENT_TYPES_VALID:
        return f"invalid event_type: {event_type}"

    confidence = event.get("confidence_score", 0)
    if not isinstance(confidence, (int, float)) or confidence < 0.6:
        return f"confidence_score too low: {confidence}"

    if not event.get("region"):
        return "missing region"

    if "bpla_id" not in event and "id" not in event:
        return "missing event identifier"

    return None


def get_severity(event_type: str) -> str:
    return SEVERITY_MAP.get(event_type, "LOW")


def passed(event: dict) -> bool:
    return validate_event(event) is None
