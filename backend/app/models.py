from typing import Optional
from pydantic import BaseModel


# ── Me ──────────────────────────────────────────────────────────────────────

class MeResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_admin: bool = False
    bookmarked_gym_ids: list[str] = []
    recent_gym_ids: list[str] = []
    created_at: Optional[str] = None


class PatchMeRequest(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class PatchPasswordRequest(BaseModel):
    old_password: str
    new_password: str


class PatchGymPrefsRequest(BaseModel):
    bookmarked_gym_ids: list[str]
    recent_gym_ids: list[str]


# ── Climbs ───────────────────────────────────────────────────────────────────

class ClimbObject(BaseModel):
    id: str
    user_id: str
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None
    gym_grade: str
    gym_grade_value: int
    personal_grade: Optional[str] = None
    personal_grade_value: Optional[int] = None
    send_type: str
    tags: list[str] = []
    photo_url: Optional[str] = None
    hold_color: Optional[str] = None
    notes: Optional[str] = None
    canonical_climb_id: Optional[str] = None
    session_id: Optional[str] = None
    created_at: str


class PostClimbRequest(BaseModel):
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None
    gym_grade: str
    gym_grade_value: int
    personal_grade: Optional[str] = None
    personal_grade_value: Optional[int] = None
    send_type: str
    tags: list[str] = []
    photo_url: Optional[str] = None
    hold_color: Optional[str] = None
    notes: Optional[str] = None
    canonical_climb_id: Optional[str] = None
    confidence_score: Optional[float] = None
    override_signal: bool = False


class PatchClimbRequest(BaseModel):
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None
    gym_grade: Optional[str] = None
    gym_grade_value: Optional[int] = None
    personal_grade: Optional[str] = None
    personal_grade_value: Optional[int] = None
    send_type: Optional[str] = None
    tags: Optional[list[str]] = None
    photo_url: Optional[str] = None
    hold_color: Optional[str] = None
    notes: Optional[str] = None


class PatchClimbPhotoRequest(BaseModel):
    photo_url: str


class PaginatedClimbsResponse(BaseModel):
    climbs: list[ClimbObject]
    total_count: int


class LoggedGymOption(BaseModel):
    id: str
    name: str


class LoggedGradeOption(BaseModel):
    grade: str
    value: int


class ClimbsMetaResponse(BaseModel):
    gyms: list[LoggedGymOption]
    grades: list[LoggedGradeOption]


# ── Gyms ─────────────────────────────────────────────────────────────────────

class GymObject(BaseModel):
    id: str
    name: str
    city: str
    state: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class GymsAllResponse(BaseModel):
    gyms: list[GymObject]
    cached_at: str


# ── Canonical Climbs ──────────────────────────────────────────────────────────

class CanonicalClimbObject(BaseModel):
    id: str
    gym_id: Optional[str] = None
    gym_grade_value: int
    hold_color: Optional[str] = None
    canonical_tags: list[str] = []
    photo_url: Optional[str] = None
    log_count: int = 0
    send_count: int = 0
    flash_count: int = 0
    takedown_votes: int = 0
    is_active: bool = True
    status: str = "pending"
    confidence_score: Optional[float] = None
    last_logged_at: Optional[str] = None
    expires_at: Optional[str] = None
    seeded_by: Optional[str] = None
    created_at: str


class PostCanonicalRequest(BaseModel):
    gym_id: str
    gym_grade_value: int
    hold_color: str
    seeded_by: str
    photo_url: Optional[str] = None


class PatchCanonicalPhotoRequest(BaseModel):
    photo_url: str


# ── Admin / Duplicate Flags ───────────────────────────────────────────────────

class CanonicalSummary(BaseModel):
    id: str
    gym_id: str
    gym_grade_value: int
    hold_color: Optional[str] = None
    canonical_tags: list[str] = []
    photo_url: Optional[str] = None
    log_count: int = 0


class DuplicateFlagObject(BaseModel):
    id: str
    similarity_score: float
    status: str
    created_at: str
    canonical_a: CanonicalSummary
    canonical_b: CanonicalSummary
