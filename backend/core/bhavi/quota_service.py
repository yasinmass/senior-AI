"""
Bhavi AI — Voice Quota Service (v2.0)
======================================
Manages the 24-hour rolling voice quota per patient.

Design:
- The 24-hour window starts from first_use_at (NOT midnight).
- Free tier: 3 minutes/day. Plus tier: 20 minutes/day.
- Soft warning shown once at >= 80% of daily limit.
- Upgrade message shown once per quota period when exhausted.
- After reset_at passes, a new quota record is created on next use.
"""

import logging
from datetime import timedelta
from typing import Dict

from django.utils import timezone

from .config import BhaviConfig

logger = logging.getLogger("bhavi.quota")


def get_daily_limit(tier: str) -> float:
    """Return the daily voice limit in minutes for the given tier."""
    if tier == "plus":
        return BhaviConfig.VOICE_LIMIT_PLUS
    return BhaviConfig.VOICE_LIMIT_FREE


def get_quota_state(patient_id: int, tier: str) -> Dict:
    """
    Get the current quota state for a patient.

    Returns a dict with:
        voice_quota_used   (float) — minutes used in current 24-hr window
        voice_quota_limit  (float) — daily limit in minutes
        voice_exhausted    (bool)  — True if limit reached
        quota_resets_in    (float) — hours until reset (0 if already reset)
        upgrade_msg_shown  (bool)  — True if upgrade message was shown this period
        should_warn        (bool)  — True if at 80%+ but not yet exhausted
    """
    # Import here to avoid circular imports at module load
    from core.models import VoiceQuota

    limit = get_daily_limit(tier)
    now = timezone.now()
    today = now.date()

    # Find the active quota record — either today's or the most recent
    # that hasn't reset yet (24-hr window from first use, not midnight).
    quota = None

    try:
        # First check today's record
        quota = VoiceQuota.objects.filter(patient_id=patient_id, quota_date=today).first()

        if quota is None:
            # Check if there's a recent record whose 24-hr window is still active
            recent = VoiceQuota.objects.filter(
                patient_id=patient_id
            ).order_by('-quota_date').first()

            if recent and recent.reset_at and recent.reset_at > now:
                # Still within the 24-hr window of a previous day's record
                quota = recent
    except Exception as e:
        logger.error("[BHAVI QUOTA] DB error fetching quota: %s", e)

    if quota is None:
        # No active quota — fresh start
        return {
            "voice_quota_used": 0.0,
            "voice_quota_limit": limit,
            "voice_exhausted": False,
            "quota_resets_in": 24.0,
            "upgrade_msg_shown": False,
            "should_warn": False,
        }

    minutes_used = quota.minutes_used

    # Check if the quota has reset (24-hr window expired)
    if quota.reset_at and now >= quota.reset_at:
        # Window has passed — treat as fresh quota
        return {
            "voice_quota_used": 0.0,
            "voice_quota_limit": limit,
            "voice_exhausted": False,
            "quota_resets_in": 24.0,
            "upgrade_msg_shown": False,
            "should_warn": False,
        }

    exhausted = minutes_used >= limit
    used_pct = minutes_used / limit if limit > 0 else 0.0
    should_warn = (used_pct >= BhaviConfig.VOICE_WARN_PCT) and not exhausted

    # Compute hours until reset
    if quota.reset_at:
        delta = quota.reset_at - now
        resets_in = max(0.0, delta.total_seconds() / 3600)
    else:
        resets_in = 24.0

    return {
        "voice_quota_used": round(minutes_used, 2),
        "voice_quota_limit": limit,
        "voice_exhausted": exhausted,
        "quota_resets_in": round(resets_in, 1),
        "upgrade_msg_shown": quota.upgrade_msg_shown,
        "should_warn": should_warn,
    }


def record_voice_usage(patient_id: int, duration_minutes: float, tier: str = "free"):
    """
    Record voice usage for a patient.
    Creates a new VoiceQuota record on first use of the day.
    Sets first_use_at and reset_at (= first_use_at + 24hrs) on creation.

    Args:
        patient_id: Patient DB ID.
        duration_minutes: Duration of this voice turn in minutes.
        tier: Patient's tier ('free' or 'plus').
    """
    from core.models import VoiceQuota

    if duration_minutes <= 0:
        return

    now = timezone.now()
    today = now.date()
    limit = get_daily_limit(tier)

    try:
        quota, created = VoiceQuota.objects.get_or_create(
            patient_id=patient_id,
            quota_date=today,
            defaults={
                "first_use_at": now,
                "reset_at": now + timedelta(hours=24),
                "minutes_used": 0.0,
                "upgrade_msg_shown": False,
            }
        )

        # Check if this record's 24-hr window has expired (edge case: get_or_create
        # found today's record but reset_at has passed)
        if quota.reset_at and now >= quota.reset_at:
            # Start a fresh window
            quota.first_use_at = now
            quota.reset_at = now + timedelta(hours=24)
            quota.minutes_used = 0.0
            quota.upgrade_msg_shown = False

        # Accumulate usage (cap at limit + small buffer)
        quota.minutes_used = min(quota.minutes_used + duration_minutes, limit + 1.0)
        quota.save(update_fields=['minutes_used', 'first_use_at', 'reset_at', 'upgrade_msg_shown'])

        logger.info(
            "[BHAVI QUOTA] Patient %d: %.2f min used (limit: %.1f min, tier: %s)",
            patient_id, quota.minutes_used, limit, tier
        )

    except Exception as e:
        logger.error("[BHAVI QUOTA] Failed to record voice usage: %s", e)


def mark_upgrade_msg_shown(patient_id: int):
    """
    Mark that the upgrade message was shown to this patient for the current quota period.
    Ensures the message is never shown twice in the same quota window.
    """
    from core.models import VoiceQuota

    now = timezone.now()
    today = now.date()

    try:
        quota = VoiceQuota.objects.filter(patient_id=patient_id, quota_date=today).first()
        if not quota:
            # Look for an active window from a previous day
            quota = VoiceQuota.objects.filter(
                patient_id=patient_id
            ).order_by('-quota_date').first()

        if quota and not quota.upgrade_msg_shown:
            quota.upgrade_msg_shown = True
            quota.save(update_fields=['upgrade_msg_shown'])
            logger.info("[BHAVI QUOTA] Upgrade message marked shown for patient %d", patient_id)

    except Exception as e:
        logger.error("[BHAVI QUOTA] Failed to mark upgrade msg shown: %s", e)


def get_quota_display(quota_state: Dict, lang: str = "en") -> Dict:
    """
    Build a user-facing quota display dict for the frontend.
    Returns labels and percentages suitable for the UI quota bar.
    """
    used = quota_state["voice_quota_used"]
    limit = quota_state["voice_quota_limit"]
    pct = min(100, round((used / limit) * 100)) if limit > 0 else 0
    resets_in = quota_state["quota_resets_in"]

    # Format reset time as human-friendly string
    if resets_in >= 1:
        reset_label = f"{resets_in:.0f}h"
    else:
        reset_label = f"{int(resets_in * 60)}m"

    return {
        "used_minutes": used,
        "limit_minutes": limit,
        "used_pct": pct,
        "exhausted": quota_state["voice_exhausted"],
        "should_warn": quota_state["should_warn"],
        "reset_label": reset_label,
        "upgrade_msg_shown": quota_state["upgrade_msg_shown"],
    }
