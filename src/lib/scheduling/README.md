# Scheduling semantics

Projectile's MVP scheduler uses deterministic working-day semantics:

- Dates are stored as `YYYY-MM-DD` calendar dates.
- The working calendar is Monday through Friday.
- Weekends are skipped when choosing starts and calculating finishes.
- Durations are expressed in working days.
- A one-day task that starts on Monday finishes on Monday.
- A three-day task that starts on Monday finishes on Wednesday.
- Milestones have zero visual duration and use the same date for start and finish.
- Finish-to-Start dependencies schedule the successor on the next working day after the latest predecessor finish.
- Summary-task dates are derived from descendants and are not scheduled independently.
- Manual scheduling is stored for future use, but the MVP scheduler recalculates auto and manual tasks consistently to keep dependency propagation clear.
