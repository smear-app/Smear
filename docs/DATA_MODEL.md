Data model — Smear (MongoDB)
=================================

Design goals
------------
- Flexible: climbing data varies by style and gym; avoid rigid relational schema.
- Query-friendly: common access patterns are fetching a user’s climbs, leaderboards, and time-series of grade progression.

Collections
-----------
1. users
2. climbs
3. routes
4. gyms
5. achievements (badges, xp milestones)

Sample documents
----------------

users
-----
{
  _id: ObjectId,
  email: string,
  display_name: string,
  created_at: ISODate,
  preferred_grade_system: "vscale" | "yds" | "font",
  xp: number,
  level: number,
  meta: {height_cm?: number, weight_kg?: number}
}

climbs
------
{
  _id: ObjectId,
  user_id: ObjectId,
  route_id: ObjectId|null,
  gym_id: ObjectId|null,
  grade_raw: "V5" | "5.12a",
  grade_value: 55, // normalized numeric grade for sorting/analytics
  style: "boulder" | "toprope" | "lead",
  attempt_type: "onsight" | "flash" | "redpoint" | "attempt",
  attempts: 3,
  sent: true,
  hang_time_seconds?: number,
  date: ISODate,
  notes?: string,
  tags?: ["overhang","slab"]
}

routes
------
{
  _id: ObjectId,
  gym_id: ObjectId|null,
  name?: string,
  setter?: string,
  grade_raw: string,
  grade_value: number,
  color?: string,
  wall?: string,
  created_at: ISODate
}

gyms
----
{
  _id: ObjectId,
  name: string,
  address?: string,
  location: { type: "Point", coordinates: [lon, lat] },
  timezone: "America/Los_Angeles"
}

Indexes
-------
- climbs: {user_id:1, date:-1} — common user history
- climbs: {grade_value:1} — grade queries
- routes: {gym_id:1, grade_value:1}
- gyms: {location: "2dsphere"}

Normalization of grades
-----------------------
Store both the original grade string and a numeric grade_value. Implement a deterministic conversion function that maps grades to an integer scale (for example, V-scale and Font scale unified with offsets). Keep that conversion in backend code (not DB) but store the result for queries/aggregates.

Aggregation examples
--------------------
- Weekly XP: aggregate climbs by user and week to compute XP
- Best grade progression: $group by user and pick max grade_value by time bucket

Schema notes
------------
- Allow optional fields for style-specific metrics (hang_time, attempts). Keep climbs small and append-only.
- If writes become frequent, consider bucketing events into time-series collections.
Data model — Smear (MongoDB)
=================================

Design goals
------------
- Flexible: climbing data varies by style and gym; avoid rigid relational schema.
- Query-friendly: common access patterns are fetching a user’s climbs, leaderboards, and time-series of grade progression.

Collections
-----------
1. users
2. climbs
3. routes
4. gyms
5. achievements (badges, xp milestones)

Sample documents
----------------

users
-----
{
  _id: ObjectId,
  email: string,
  display_name: string,
  created_at: ISODate,
  preferred_grade_system: "vscale" | "yds" | "font",
  xp: number,
  level: number,
  meta: {height_cm?: number, weight_kg?: number}
}

climbs
------
{
  _id: ObjectId,
  user_id: ObjectId,
  route_id: ObjectId|null,
  gym_id: ObjectId|null,
  grade_raw: "V5" | "5.12a",
  grade_value: 55, // normalized numeric grade for sorting/analytics
  style: "boulder" | "toprope" | "lead",
  attempt_type: "onsight" | "flash" | "redpoint" | "attempt",
  attempts: 3,
  sent: true,
  hang_time_seconds?: number,
  date: ISODate,
  notes?: string,
  tags?: ["overhang","slab"]
}

routes
------
{
  _id: ObjectId,
  gym_id: ObjectId|null,
  name?: string,
  setter?: string,
  grade_raw: string,
  grade_value: number,
  color?: string,
  wall?: string,
  created_at: ISODate
}

gyms
----
{
  _id: ObjectId,
  name: string,
  address?: string,
  location: { type: "Point", coordinates: [lon, lat] },
  timezone: "America/Los_Angeles"
}

Indexes
-------
- climbs: {user_id:1, date:-1} — common user history
- climbs: {grade_value:1} — grade queries
- routes: {gym_id:1, grade_value:1}
- gyms: {location: "2dsphere"}

Normalization of grades
-----------------------
Store both the original grade string and a numeric grade_value. Implement a deterministic conversion function that maps grades to an integer scale (for example, V-scale and Font scale unified with offsets). Keep that conversion in backend code (not DB) but store the result for queries/aggregates.

Aggregation examples
--------------------
- Weekly XP: aggregate climbs by user and week to compute XP
- Best grade progression: $group by user and pick max grade_value by time bucket

Schema notes
------------
- Allow optional fields for style-specific metrics (hang_time, attempts). Keep climbs small and append-only.
- If writes become frequent, consider bucketing events into time-series collections.
