Roadmap & Gamification rules — Smear
===================================

Prioritized roadmap (MVP -> Next)
---------------------------------
MVP (Weeks 1–4)
- User auth (register/login)
- Log a climb with required fields (user, grade_raw, style, attempts, date, sent)
- User profile and recent climb history
- Basic progress graphs (grade over time)
- Basic XP / level system and a couple of simple badges

Next (Weeks 5–12)
- Route & gym management (create/claim gyms)
- Social features: follow friends, share climbs
- Challenges and scheduled goals
- Leaderboards and monthly competitions

Long-term
- Machine learning suggestions (which climbs to try next)
- Integration with gym APIs / RFID / auto-import

Gamification primitives
----------------------
- XP: award points for logging climbs; larger rewards for harder grades and for first sends
- Level: derived from cumulative XP using a configurable curve
- Badges: unlock by event (e.g., "First V5", "7-day logging streak")

Sample scoring function (pseudo)

  base_xp = lookup_xp_for_grade(grade_value)
  attempt_bonus = max(0, 5 - attempts)  # bonus for fewer attempts
  style_multiplier = (boulder:1.2, lead:1.0, toprope:0.8)
  is_first_of_day_bonus = 10 if not logged_today(user) else 0
  total_xp = int((base_xp + attempt_bonus + is_first_of_day_bonus) * style_multiplier)

Badge ideas
-----------
- First Climb
- Climb Streak (7/14/30 day)
- Grade milestones (First V5, First 5.12)
- Consistency (log 10 climbs in a month)

Privacy & anti-abuse
--------------------
- Allow users to make climbs private.
- Rate-limit logging endpoints to prevent spam.

Analytics & A/B
--------------
- Track retention metrics: daily active users, average climbs per week.
- Try A/B experiments for XP curves and notification frequency.
Roadmap & Gamification rules — Smear
===================================

Prioritized roadmap (MVP -> Next)
---------------------------------
MVP (Weeks 1–4)
- User auth (register/login)
- Log a climb with required fields (user, grade_raw, style, attempts, date, sent)
- User profile and recent climb history
- Basic progress graphs (grade over time)
- Basic XP / level system and a couple of simple badges

Next (Weeks 5–12)
- Route & gym management (create/claim gyms)
- Social features: follow friends, share climbs
- Challenges and scheduled goals
- Leaderboards and monthly competitions

Long-term
- Machine learning suggestions (which climbs to try next)
- Integration with gym APIs / RFID / auto-import

Gamification primitives
----------------------
- XP: award points for logging climbs; larger rewards for harder grades and for first sends
- Level: derived from cumulative XP using a configurable curve
- Badges: unlock by event (e.g., "First V5", "7-day logging streak")

Sample scoring function (pseudo)

  base_xp = lookup_xp_for_grade(grade_value)
  attempt_bonus = max(0, 5 - attempts)  # bonus for fewer attempts
  style_multiplier = (boulder:1.2, lead:1.0, toprope:0.8)
  is_first_of_day_bonus = 10 if not logged_today(user) else 0
  total_xp = int((base_xp + attempt_bonus + is_first_of_day_bonus) * style_multiplier)

Badge ideas
-----------
- First Climb
- Climb Streak (7/14/30 day)
- Grade milestones (First V5, First 5.12)
- Consistency (log 10 climbs in a month)

Privacy & anti-abuse
--------------------
- Allow users to make climbs private.
- Rate-limit logging endpoints to prevent spam.

Analytics & A/B
--------------
- Track retention metrics: daily active users, average climbs per week.
- Try A/B experiments for XP curves and notification frequency.
