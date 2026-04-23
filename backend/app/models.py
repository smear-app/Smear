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


class AccessRequestCreate(BaseModel):
    email: str
    source: Optional[str] = "landing_page"


class AccessRequestResponse(BaseModel):
    email: str
    status: str


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
    canonical_tags: list[str] = []
    session_id: Optional[str] = None
    session_started_at: Optional[str] = None
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


# ── Sessions ─────────────────────────────────────────────────────────────────

class SessionObject(BaseModel):
    id: str
    user_id: str
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    visibility: str = "followers"
    is_published: bool = False
    total_climbs: Optional[int] = None
    sends: Optional[int] = None
    flashes: Optional[int] = None
    attempts: Optional[int] = None
    hardest_grade: Optional[str] = None
    hardest_grade_value: Optional[int] = None
    hardest_flash: Optional[str] = None
    hardest_flash_value: Optional[int] = None
    top_tags: list[str] = []
    cover_photo_url: Optional[str] = None
    created_at: Optional[str] = None


class SessionCardObject(BaseModel):
    """Session enriched with author profile + social counts — used in feed."""
    id: str
    user_id: str
    gym_id: Optional[str] = None
    gym_name: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    visibility: str
    total_climbs: Optional[int] = None
    sends: Optional[int] = None
    flashes: Optional[int] = None
    attempts: Optional[int] = None
    hardest_grade: Optional[str] = None
    hardest_grade_value: Optional[int] = None
    hardest_flash: Optional[str] = None
    hardest_flash_value: Optional[int] = None
    top_tags: list[str] = []
    cover_photo_url: Optional[str] = None
    created_at: Optional[str] = None
    # author
    author_display_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar_url: Optional[str] = None
    # social
    reaction_count: int = 0
    comment_count: int = 0
    viewer_has_reacted: bool = False


class SessionDetailObject(SessionCardObject):
    climbs: list[ClimbObject] = []


class EndSessionRequest(BaseModel):
    visibility: Optional[str] = None  # override profile default


# ── Social ────────────────────────────────────────────────────────────────────

class FollowObject(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    followed_at: str


class FollowsResponse(BaseModel):
    following: list[FollowObject] = []
    followers: list[FollowObject] = []


class UserSearchResult(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_following: bool = False


class CommentObject(BaseModel):
    id: str
    session_id: str
    user_id: str
    body: str
    created_at: str
    author_display_name: Optional[str] = None
    author_username: Optional[str] = None
    author_avatar_url: Optional[str] = None


class PostCommentRequest(BaseModel):
    body: str


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
