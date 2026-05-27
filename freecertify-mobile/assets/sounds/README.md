# Sound Assets

Place MP3 sound effect files here. Required files:

| Filename | Purpose | Suggested Source |
|---|---|---|
| `tap.mp3` | Button tap (subtle click) | freesound.org |
| `select.mp3` | Answer card selected (pop) | freesound.org |
| `correct.mp3` | Correct answer (ascending ding) | freesound.org |
| `wrong.mp3` | Wrong answer (low buzz) | freesound.org |
| `heart_lost.mp3` | Heart lost (crack/shatter) | freesound.org |
| `xp_earned.mp3` | XP earned (coin collect) | mixkit.co |
| `level_up.mp3` | Level up (short fanfare) | mixkit.co |
| `streak.mp3` | Streak milestone (flame whoosh) | zapsplat.com |
| `lesson_complete.mp3` | Lesson complete (chime) | mixkit.co |
| `exam_passed.mp3` | Exam passed (celebration jingle) | zapsplat.com |

## Free Sound Effect Resources
- https://freesound.org — large free library (CC license)
- https://mixkit.co/free-sound-effects/ — polished game sounds
- https://zapsplat.com — free with attribution

## Notes
- Keep all files under 100KB for fast loading
- Prefer MP3 format (best cross-platform compatibility)
- All sounds preloaded at app startup via `useGameFeedback` hook
