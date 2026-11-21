# Return after a break (BR-28)

1. The trigger (`shouldStartBreak`, owned by the M-07 trigger logic) decides a break is needed and records which activity was stressful.
2. Navigation shows `CalmingBreakScreen`. It calls `onDone` when the child taps "Let's play".
3. In `onDone`, call `pickActivityAfterBreak({ stressedActivity, activities })`. `activities` is `[{ id, available, level }]`.
4. It returns the activity id, or null if nothing is available (then go back to the child home). If the stressful activity is the only one available, it returns that one; the short easy round keeps it gentle.
5. Call `easyRoundFor(id)` from `m03_games/easyRound.js` (kept in m03 so the break module never imports game code). It returns `{ itemIds, roundSize }`, or null if that activity is not built yet.
6. Open `ObjectNamingScreen` with those props plus the child's current stars as `startStars`, and the usual `recognizer`, `onDone` and `onExit`.
7. The break never removes stars or progress; these functions do not read or write them.
