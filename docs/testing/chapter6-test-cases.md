# Chapter 6: Testing

## 6.1 Test approach

Testing of the modules M-01 (Onboarding), M-02 (Doctor avatar), M-03 (Games) and M-07 (calming break screens and the return after a break) combines automated and manual checks. The automated tests are unit and component tests written with Jest and react-test-renderer; they exercise the pure rule functions, the on-device stores and the screens, with storage, timers and the speech recogniser replaced by test doubles. Behaviour that unit tests cannot show, such as text clipping, animation and complete play-through of a game, was checked manually on an Android emulator (Pixel 7, API 37) through a developer screen gallery. The automated suite is run with `cd frontend && npx jest`.

In the tables below, each case names the requirement it supports (SRS identifiers as cited in the source code), the automated test file that provides the evidence and, where short, the test name. Because every listed automated test passes, the actual result is recorded as "As expected" and the status as "Pass". Cases that address a rule through several tests list the principal test only.

## 6.2 M-01 Onboarding

### 6.2.1 Parent PIN

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-PIN-01 | UC-22, BR-34 | A PIN is exactly four digits | None | Check candidate PINs for completeness | "1234"; "123", "12345", "12a4", "" | Only "1234" is accepted | As expected | Pass | `pinLock.test.js` (accepts exactly 4 digits only) |
| TC-M01-PIN-02 | UC-22, BR-34 | First visit creates a PIN, confirmed by entering it twice | No PIN stored | Open the PIN screen; enter a PIN; re-enter it | Two matching 4-digit entries | The PIN is saved and the screen unlocks | As expected | Pass | `PinScreen.test.js` (asks to create, then confirm, then saves the PIN and unlocks) |
| TC-M01-PIN-03 | UC-23, BR-34 | The correct PIN unlocks and clears the wrong-PIN count | A PIN exists; some wrong attempts recorded | Enter the stored PIN | Correct PIN | The screen unlocks and the failure count is reset | As expected | Pass | `PinScreen.test.js` (the correct PIN unlocks and clears the wrong-PIN count) |
| TC-M01-PIN-04 | UC-23, BR-34 | A wrong PIN reports the attempts left | A PIN exists | Enter a wrong PIN | Wrong 4-digit PIN | The attempts remaining are shown and the entered digits are cleared | As expected | Pass | `PinScreen.test.js` (a wrong PIN shows the attempts left) |
| TC-M01-PIN-05 | BR-34 | The fifth consecutive wrong PIN locks entry for the lock period (5 minutes) | Fresh lock state | Register five failures; check the lock one millisecond before and at the end of the period | 5 wrong PINs | Locked for the full period, unlocked exactly when it ends | As expected | Pass | `pinLock.test.js` (locks on the 5th wrong PIN in a row for the lock period) |
| TC-M01-PIN-06 | BR-34 | The keypad stays locked, even for the correct PIN, until the lock ends | Five wrong PINs entered | Enter the correct PIN while locked | Correct PIN | The keypad rejects input and does not unlock | As expected | Pass | `PinScreen.test.js` (5 wrong PINs lock the keypad, even for the right PIN, until the lock ends) |
| TC-M01-PIN-07 | BR-34 | The lock survives closing and reopening the app | Locked state saved | Reopen the screen | Persisted lock state | The screen is still locked | As expected | Pass | `PinScreen.test.js` (stays locked after the app is reopened) |
| TC-M01-PIN-08 | BR-34 | The PIN is stored only as a salted hash | None | Save a PIN and inspect storage; save the same PIN twice | "1234" | The plain PIN is absent from storage; each save has a different salt and hash | As expected | Pass | `pinStore.test.js` (never stores the PIN itself, only a salted hash) |

### 6.2.2 Add a child

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-CHD-01 | FR-1 | A valid English profile is accepted | None | Validate the profile | Ali, 4, English | Accepted | As expected | Pass | `validateChildProfile.test.js` (TD-01) |
| TC-M01-CHD-02 | FR-1, BR-1 | Boundary ages 3 and 7 are accepted | None | Validate profiles at the age limits | Age 3; age 7 | Both accepted | As expected | Pass | `validateChildProfile.test.js` (accepts boundary ages 3 and 7) |
| TC-M01-CHD-03 | FR-1, BR-1 | Ages outside 3 to 7, and fractional ages, are rejected | None | Validate profiles outside the range | Age 2; age 8; age 4.5 | Rejected with an error on the age field only | As expected | Pass | `validateChildProfile.test.js` (TD-03, TD-04, fractional ages) |
| TC-M01-CHD-04 | FR-1 | A blank name or missing language is rejected | None | Validate the profile | Name "   "; language not chosen | Rejected with an error on that field only | As expected | Pass | `validateChildProfile.test.js` (TD-05, TD-06) |
| TC-M01-CHD-05 | FR-1 | The name is trimmed and all invalid fields are reported together | None | Validate a padded name; validate an empty profile | "  Zara "; empty name, age 9, no language | Name stored as "Zara"; errors reported for name, age and language | As expected | Pass | `validateChildProfile.test.js` (trims the name and reports all invalid fields together) |
| TC-M01-CHD-07 | FR-1 | The child's name is limited to 30 characters; surrounding spaces do not count | None | Validate names at and over the limit, in English and Urdu | 30 letters; 31 letters; 31 Urdu letters; 30 letters with spaces around | 30 accepted; 31 rejected with a length error on the name field (English and Urdu message); padded 30-letter name accepted | As expected | Pass | `validateChildProfile.test.js` (name length limit; spaces around a name) |
| TC-M01-CHD-06 | FR-1 | A saved profile becomes the active child | Valid form | Press Save | Valid profile | The profile is stored, set as the active child, and the saved callback is called | As expected | Pass | `ChildProfileScreen.test.js` (saves the profile, makes it the active child and calls onSaved) |

### 6.2.3 Consent

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-CON-01 | FR-10, FR-16, BR-24 | Defaults: microphone on, camera off | Active child | Open the Consent screen | None | Microphone switch on, camera switch off | As expected | Pass | `ConsentScreen.test.js` (microphone starts on and camera starts off) |
| TC-M01-CON-02 | FR-10, BR-24 | A versioned consent record is saved for the active child | Microphone permission granted | Press Save | Defaults | A record is stored for the child and the flow continues | As expected | Pass | `ConsentScreen.test.js` (saves a versioned consent record for the active child and continues) |
| TC-M01-CON-03 | FR-16 | Turning the camera on requests camera permission | Camera off | Switch the camera on; save | Permission granted | Permission is requested and the choice is saved | As expected | Pass | `ConsentScreen.test.js` (turning the camera on asks for camera permission and saves it) |
| TC-M01-CON-04 | FR-10, BR-24 | Consent cannot be saved with the microphone off | None | Switch the microphone off; press Save | Microphone off | A message says the microphone is required; nothing is saved | As expected | Pass | `ConsentScreen.test.js` (will not save with the microphone off) |
| TC-M01-CON-05 | FR-10 | A blocked microphone offers the phone Settings | Permission blocked | Press Save | Blocked | A button to open the phone Settings is offered | As expected | Pass | `ConsentScreen.test.js` (a blocked microphone offers a button to open the phone Settings) |
| TC-M01-CON-06 | FR-16 | A denied camera switches mood monitoring off | Camera on, permission denied | Press Save | Denied | The camera is switched off and the parent is asked to save again | As expected | Pass | `ConsentScreen.test.js` (a denied camera switches mood monitoring off and asks to save again) |

### 6.2.4 Baseline check

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-BAS-01 | FR-2, BR-5 | A new check starts at task 1, attempt 1 | None | Start a baseline | None | Incomplete, first task, attempt 1, checklist version recorded | As expected | Pass | `baseline.test.js` (starts incomplete on the first task, attempt 1) |
| TC-M01-BAS-02 | FR-2, BR-5 | After the maximum attempts a task is inconclusive | Baseline in progress | Press "Try again" until the limit | MAX_ATTEMPTS tries | Task recorded as inconclusive; next task starts | As expected | Pass | `baseline.test.js` (after MAX_ATTEMPTS attempts the task is inconclusive) |
| TC-M01-BAS-03 | FR-2 | A task can be skipped, and skipped tasks do not affect the score | Baseline in progress | Skip tasks; complete the check | Mixed said and skipped | Skipped tasks recorded; score ignores them; score is null if all skipped | As expected | Pass | `baseline.test.js` ("Skip" records a skipped task; score is null when every task was skipped) |
| TC-M01-BAS-04 | BR-6 | A new check is blocked within 30 days of the last one | A completed baseline exists | Check eligibility at day 0, 29 and 30 | Last completed at time T | Allowed with no previous check; blocked at 29 days; allowed at 30 days | As expected | Pass | `baseline.test.js` (re-assessment rule: allowed with no previous baseline, blocked within 30 days, allowed after) |
| TC-M01-BAS-05 | BR-6 | The screen shows the block message and does not start a check | Completed baseline within 30 days | Open the Baseline screen | Recent completion | The block message is shown | As expected | Pass | `BaselineScreen.test.js` (blocks a new check within 30 days of the last one) |
| TC-M01-BAS-06 | FR-2 | An unfinished check is saved after every tap and resumes at the same task | Baseline in progress | Tap; choose "Save and continue later"; reopen | One recorded task | The same task and attempt are shown on reopening | As expected | Pass | `BaselineScreen.test.js` (saves after every tap; "Save and continue later" saves and exits; reopening resumes) |
| TC-M01-BAS-07 | FR-2 | Finishing returns a completed, scored baseline | Final task reached | Complete the last task | All tasks answered | The completion callback receives a completed baseline with a score | As expected | Pass | `BaselineScreen.test.js` (finishing calls onComplete with a scored, completed baseline) |

### 6.2.5 Goals

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-GOL-01 | FR-3 | Three valid suggested goals are produced, one of each type | Baseline available | Generate suggestions | Baseline result | Weekly words, daily minutes and skill goals, all valid | As expected | Pass | `goals.test.js` (gives 3 valid goals of the three types) |
| TC-M01-GOL-02 | FR-3, BR-7 | At most five goals are accepted | None | Validate five goals, then six | 5 goals; 6 goals | Five valid; six rejected with "too many" | As expected | Pass | `goals.test.js` (rejects more than 5 goals) |
| TC-M01-GOL-03 | FR-3 | Targets must lie in range and be whole numbers | None | Validate targets at and beyond the limits | Words 0, 51, 2.5, null; minutes 4 | Out-of-range, fractional and missing targets rejected; limits accepted | As expected | Pass | `goals.test.js` (rejects out-of-range or non-integer targets) |
| TC-M01-GOL-04 | FR-3, BR-7 | Only missing goals can be added, and none at the maximum | Goal list present | Request addable goals | Partial, empty and full lists | Only the missing types are offered; none at five goals | As expected | Pass | `goals.test.js` (addableGoals offers only what is missing and nothing at the maximum) |
| TC-M01-GOL-05 | FR-3 | The screen is prefilled from suggestions, or from saved goals when they exist | Baseline; optionally saved goals | Open the Goals screen | Baseline; saved goals | Suggestions shown first time; saved goals shown thereafter | As expected | Pass | `GoalsScreen.test.js` (prefills from the baseline suggestions; loads saved goals instead of suggestions) |
| TC-M01-GOL-06 | FR-3, BR-7 | Goals can be added and removed within the maximum | Goals screen open | Add and remove goals | Up to five goals | Add is unavailable at the maximum | As expected | Pass | `GoalsScreen.test.js` (adds and removes goals, respecting the maximum) |
| TC-M01-GOL-07 | FR-3 | A valid save calls the callback once, even on a double tap, and a failed save can be retried | Valid goals | Tap Save twice; repeat with a failing store | Valid goals | One save and one callback; on failure a message and a retry | As expected | Pass | `GoalsScreen.test.js` (saves valid edits and calls onSaved once on a double tap; a failed save shows a message) |

### 6.2.6 Home and Child Mode entry

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-HOM-01 | UI-1 | Home offers Child Mode and the Parent Portal | English | Open Home; press each entry | None | Start opens Child Mode; Open opens the Parent Portal | As expected | Pass | `HomeScreen.test.js` (Start opens Child Mode and Open opens the Parent Portal) |
| TC-M01-HOM-02 | UI-1 | Child Mode is disabled with a hint until a child profile exists | No child profile | Open Home | No child | Child Mode disabled and a hint shown | As expected | Pass | `HomeScreen.test.js` (Child Mode is disabled with a hint until a child profile exists) |
| TC-M01-HOM-03 | UC-22 | Child Mode can be left only by holding the exit button for the full time (1.5 s) | Child Mode open | Hold for the full time; tap briefly; release early | Full hold; quick tap; early release | Exit only after the full hold | As expected | Pass | `ChildHomeScreen.test.js` (HoldToExitButton: exits only after holding for the full time; a quick tap or letting go early does not exit) |

## 6.3 Language setting and Urdu parent screens (M-01)

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M01-LNG-01 | UI-8, BR-3 | The language defaults to English | No saved choice | Read the language | None | English | As expected | Pass | `LanguageContext.test.js` (defaults to English) |
| TC-M01-LNG-02 | UI-8 | A language choice is saved and restored at the next launch | None | Choose Urdu; restart | Urdu | Urdu is restored | As expected | Pass | `LanguageContext.test.js` (setLanguage changes the language and saves it; a saved choice is restored) |
| TC-M01-LNG-03 | UI-8 | The toggle marks the current language and switches the shared setting | Toggle shown | Press the other option | EN / اردو | The current option is marked; pressing switches the language; each option meets the parent touch size | As expected | Pass | `LanguageToggle.test.js` |
| TC-M01-URD-01 | UI-8, BR-3 | Home in Urdu shows Urdu only | Language Urdu | Open Home | None | Urdu text only, in Urdu text elements, toggle on Urdu | As expected | Pass | `urduParentScreens.test.js` (Home in Urdu: shows Urdu only) |
| TC-M01-URD-02 | UI-8, BR-3 | PIN screen in Urdu | Language Urdu | Open the PIN screen; enter a wrong PIN | Wrong PIN | Urdu title and labels, Western digits; wrong-PIN message in Urdu with attempts left | As expected | Pass | `urduParentScreens.test.js` (PIN in Urdu) |
| TC-M01-URD-03 | UI-8, BR-6 | Baseline in Urdu, with the 30-day block and dates in Urdu | Language Urdu | Open Baseline; open it again within 30 days | Recent baseline | Urdu progress and buttons; block sentence with an Urdu date (day month year) | As expected | Pass | `urduParentScreens.test.js`; `urduParentEdgeCases.test.js` (baseline blocked within 30 days shows the Urdu sentence) |
| TC-M01-URD-04 | UI-8, BR-3 | One language per parent screen | Each parent screen | Render each in English and in Urdu | All parent screens | English renders no Urdu; Urdu renders no English words | As expected | Pass | `singleLanguage.test.js` (one language per screen: parent screens) |

## 6.4 M-02 Doctor avatar

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M02-AVT-01 | FR-4 | The Doctor is shown at the requested height, keeps his shape and has an accessible label | None | Render the avatar | Height value | Width follows the real image aspect ratio; accessibility label present | As expected | Pass | `doctor.test.js` (shows the Doctor at the requested height, keeping his shape) |
| TC-M02-AVT-02 | FR-4 | The Doctor is still when idle and bounces while speaking | None | Render with speaking off, then on | speaking = false / true | No motion; bounce animation while speaking | As expected | Pass | `doctor.test.js` (stays still when not speaking; bounces while speaking) |
| TC-M02-AVT-03 | FR-4 | Motion stops when the phone asks to reduce motion | Reduce-motion setting on | Render with speaking on | speaking = true | No movement | As expected | Pass | `doctor.test.js` (does not move when the phone asks to reduce motion) |
| TC-M02-AVT-04 | UI-7, UI-8 | The speech bubble tail and font follow the language | None | Render in English and in Urdu | en / ur | English font, tail at the bottom; side tail points left in English and right in Urdu | As expected | Pass | `doctor.test.js` (SpeechBubble: shows the line in the English font...; side tail points left in English and right in Urdu) |

## 6.5 M-03 Games

### 6.5.1 Round engine

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M03-RND-01 | BR-15 | Prompts are unique and none repeats until all are used | Enough ids | Pick prompts | Id set larger than the count | The requested count of unique ids | As expected | Pass | `round.test.js` (returns the requested count of unique ids...; does not repeat until every id is used) |
| TC-M03-RND-02 | BR-11 | A first-try success earns 2 stars and moves on | New round | Apply a recognized result | recognized | 2 stars, next prompt | As expected | Pass | `round.test.js` (first-try success gives 2 stars and moves on) |
| TC-M03-RND-03 | BR-11, BR-13 | A success after a hint earns 1 star | Hint shown | Apply two misses then a success | 2 misses, recognized | 1 star | As expected | Pass | `round.test.js` (success after a hint was shown gives 1 star) |
| TC-M03-RND-04 | BR-12, BR-13 | A hint appears only after two consecutive misses, rising 0, 1, 2, 3 | New round | Apply consecutive misses | 5 misses | Hint level rises to a maximum of 3 | As expected | Pass | `round.test.js` (hint only after 2 consecutive fails...; hint level goes 0, 1, 2, 3) |
| TC-M03-RND-05 | BR-22 | An unclear answer is not a failure and never advances the hint | New round | Apply inconclusive | inconclusive | Feedback "unclear"; no failure counted; hint level unchanged | As expected | Pass | `round.test.js` (inconclusive answers: gives unclear and is not a failure; never moves toward a hint) |
| TC-M03-RND-06 | UC-5 | After five unsuccessful attempts the game moves on with 0 stars | Prompt active | Apply five misses | 5 misses | Prompt skipped, 0 stars | As expected | Pass | `round.test.js` (moves on after 5 failed attempts with 0 stars) |
| TC-M03-RND-07 | UC-5 | Every attempt is logged with the hint level in effect | Round in progress | Apply several attempts | Mixed results | One log entry per attempt; previous state not mutated | As expected | Pass | `round.test.js` (attempt log) |
| TC-M03-RND-08 | FR-11 | A stale listen is ignored and cannot count as a miss | Listen pending | Start a second listen; cancel a listen | Overlapping calls | The first returns null; only the new result counts | As expected | Pass | `playPrompt.test.js` (a second listen makes the first return null, not a miss; cancelListening drops the stale result) |

### 6.5.2 Game content

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M03-CNT-01 | UC-11, BR-10 | Object content holds 10 to 16 items with unique ids, both languages, accepted words and a clue | None | Inspect the content | Object items | Counts and fields complete for every item | As expected | Pass | `objectNamingContent.test.js` (ids are unique...; has 10 to 16 items; each item has both languages) |
| TC-M03-CNT-02 | UC-11, BR-3 | Urdu text uses Urdu letters (heh goal), not Arabic forms | None | Inspect Urdu text | Object items | No Arabic heh; Urdu first letter preserved in the first-sound hint | As expected | Pass | `objectNamingContent.test.js` (Urdu uses heh goal; first-sound hint keeps a precomposed Urdu first letter) |
| TC-M03-CNT-03 | UC-12, BR-12 | The colour clue never gives away the answer | None | Read each level-1 clue | Colour items | The clue does not contain the colour word | As expected | Pass | `colourContent.test.js` (the clue (hint level 1) never says the answer itself) |

### 6.5.3 Object naming and colour matching screens

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M03-OBJ-01 | UC-11, BR-11 | A right answer shows praise and stars, and Next moves on | Listening | Recognise the word; press Next | Recognised | Praise and stars shown; next word follows | As expected | Pass | `ObjectNamingScreen.test.js` (a right answer shows praise and stars, then Next word moves on) |
| TC-M03-OBJ-02 | UC-11, UI-7 | A wrong answer gets a gentle retry and a microphone button | Listening | Return an incorrect result | Incorrect | Gentle retry message and a mic button; no listening loop while the child is silent | As expected | Pass | `ObjectNamingScreen.test.js` (a wrong answer gets a gentle retry and a mic button; after a miss it waits for a tap) |
| TC-M03-OBJ-03 | BR-12, FR-4 | The Doctor gives a hint after two misses, rising from clue to first sound to "say it with me" | Two misses | Miss repeatedly | 2 to 4 misses | Hint appears after the second miss and climbs through the three levels | As expected | Pass | `ObjectNamingScreen.test.js` (a hint appears from the Doctor after 2 misses; hint level climbs) |
| TC-M03-OBJ-04 | BR-22 | An unclear answer never says "wrong", never brings a hint and never costs stars | Listening | Return an unclear result | Inconclusive | Neutral message; no hint; stars unchanged | As expected | Pass | `ObjectNamingScreen.test.js` (an unclear answer never says wrong; unclear answers never bring a hint) |
| TC-M03-OBJ-05 | UC-5 | After the maximum attempts the game moves on kindly with no stars | Five misses | Miss five times | 5 misses | Kind message; next word; 0 stars | As expected | Pass | `ObjectNamingScreen.test.js` (moves on kindly after the maximum attempts, with no stars) |
| TC-M03-OBJ-06 | UI-4 | The summary shows the correct stars and offers Play again and Done | Round finished | Finish with two right answers; with one hinted answer; with none | 2 right; 1 hinted; none | 4 stars; 1 star; "tried" wording rather than "0 of N"; Play again restarts with each word once; Done calls onDone | As expected | Pass | `ObjectNamingScreen.test.js` (summary (UI-4)); Play again restarts a fresh round |
| TC-M03-OBJ-07 | BR-3 | Object naming in Urdu | Child language Urdu | Open the game | Urdu | Urdu text, each script in its own text element, right to left | As expected | Pass | `ObjectNamingScreen.test.js` (Urdu (BR-3)) |
| TC-M03-COL-01 | UC-12, BR-12 | Two misses bring the colour clue as a hint | Listening | Miss twice | 2 misses | The colour clue is shown | As expected | Pass | `ColourMatchingScreen.test.js` (two misses bring the colour clue as a hint) |
| TC-M03-COL-02 | UC-12 | The summary uses colour wording in English and Urdu, never object wording | Round finished | Finish with some and with no colours named | None | Colour wording in both languages | As expected | Pass | `ColourMatchingScreen.test.js` (summary says how many colours were named; when nothing was named...; Urdu summary uses colour wording) |

### 6.5.4 Rewards and daily milestone

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M03-RWD-01 | FR-8 | Today's count resets on a new day; the total stays | Stars earned on day 1 | Read rewards on day 2; add stars | Two dates | Today 0 and total kept; new stars counted for the new day | As expected | Pass | `rewardStore.test.js` (today resets on a new day but the total stays) |
| TC-M03-RWD-02 | FR-8 | The daily milestone (10 stars) is reported exactly once per day and earned again on a new day | None | Cross the milestone; add more; repeat on the next day | 9 then 2 stars; next day | Reported once on crossing; not again that day; reported again on the new day | As expected | Pass | `rewardStore.test.js` (the milestone is reported exactly once) |
| TC-M03-RWD-03 | FR-6 | Invalid star amounts are ignored | Stars stored | Add invalid amounts | -2, NaN, 1.5, 0, "3", undefined, Infinity | Totals unchanged | As expected | Pass | `rewardStore.test.js` (ignores bad input) |
| TC-M03-RWD-04 | BR-19 | Each child's stars are kept separately, with no sibling comparison | Two children | Add stars for each | Child a, child b | Totals independent | As expected | Pass | `rewardStore.test.js` (children are kept separate) |
| TC-M03-RWD-05 | BR-28 | Stars can never be removed | None | Inspect the store interface | None | No operation that subtracts or clears stars | As expected | Pass | `rewardStore.test.js` (stars can never be removed) |
| TC-M03-RWD-06 | FR-6, FR-8 | The round's stars are saved once for this child when the round ends | Round finished | Finish a round; tap Done twice | Child id | Stars added once | As expected | Pass | `ObjectNamingScreen.test.js` (saves the round stars once for this child; a double tap on Done does not add stars again) |
| TC-M03-RWD-07 | FR-8 | The daily badge shows when the milestone is reached and is hidden on Play again | Milestone crossed | Finish the round; press Play again | None | Badge shown, then hidden; a late milestone does not show on the next round | As expected | Pass | `ObjectNamingScreen.test.js` (shows the daily badge...; a late milestone from the last round does not show) |

### 6.5.5 Saving round results

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M03-SES-01 | UC-5 | A finished round is saved once with its activity, stars and attempts | Round played | Finish the round | One round | One session with attempts | As expected | Pass | `SpeechGameSessions.test.js` (a finished round is saved once...) |
| TC-M03-SES-02 | UC-5 | Exiting mid-round saves a partial session | Round in progress with attempts | Hold exit | One attempt made | A session flagged partial | As expected | Pass | `SpeechGameSessions.test.js` (exit mid-round saves a partial session) |
| TC-M03-SES-03 | UC-5 | Exiting with no attempts, or after finishing, saves nothing extra | None | Exit immediately; exit after the summary | None | No empty session; no duplicate | As expected | Pass | `SpeechGameSessions.test.js` (exit with no attempts saves nothing; exit after finishing does not save twice) |
| TC-M03-SES-04 | BR-20 | Only agreed attempt fields are stored; no audio and no heard text | None | Save a session with attempts | Attempt log | Stored attempts contain only the agreed fields | As expected | Pass | `sessionStore.test.js` (stores attempts with only the agreed fields and no heard text) |
| TC-M03-SES-05 | UC-5 | Sessions are kept per child, newest first, with the partial flag | Two children | Save and read sessions | Several sessions | Separate per child; newest first; partial flag kept | As expected | Pass | `sessionStore.test.js` (sessions are per child; newest first; partial flag is kept) |
| TC-M03-SES-06 | UC-5 | Unsynced sessions are never dropped by the per-child cap (200) | Cap exceeded | Save beyond the cap | Old synced and unsynced sessions | The oldest synced sessions and their attempts are dropped; unsynced ones are always kept | As expected | Pass | `sessionStore.test.js` (cap drops the oldest synced sessions...; cap never drops an unsynced session; when every session is unsynced, nothing is dropped) |

## 6.6 M-07 Calming break and return after a break

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-M07-BRK-01 | FR-20 | The break steps from start through breathing and sounds to ready, then calls onDone | Break opened | Advance each step | None | Steps in order; onDone called | As expected | Pass | `CalmingBreakScreen.test.js` (steps from start through breathing, sounds and ready to onDone) |
| TC-M07-BRK-02 | FR-20, BR-30 | Breathing alternates in and out at a slow 4 s rhythm | Breathing step | Advance time | 4 s phases | The circle grows then shrinks, using the native driver | As expected | Pass | `CalmingBreakScreen.test.js` (breathing switches between in and out over time) |
| TC-M07-BRK-03 | FR-20 | Breathing ends after a fixed number of cycles (3) | Breathing step | Advance time through all cycles | 3 cycles | onDone called exactly at the end of the last breath | As expected | Pass | `CalmingBreakScreen.test.js` (breathing ends after a fixed number of cycles) |
| TC-M07-BRK-04 | BR-28 | No break step shows stars or a Home button | Each step | Render each step | start, breathing, sounds, ready | No star counter and no Home button; a hold to exit is present | As expected | Pass | `CalmingBreakScreen.test.js` (step has no star counter, no Home button and a hold to exit) |
| TC-M07-BRK-05 | BR-28 | The break never reads or writes stars, progress or sessions | None | Inspect the break module's dependencies | None | No reward, progress or session store is used | As expected | Pass | `CalmingBreakScreen.test.js` (the break never reads or writes stars, progress or sessions) |
| TC-M07-BRK-06 | BR-3 | The break in Urdu is right to left with each script in its own text element | Child language Urdu | Render the break | Urdu | Right-to-left layout; Nastaliq font on buttons | As expected | Pass | `CalmingBreakScreen.test.js` (Urdu is right to left...; ActionButton language); `singleLanguage.test.js` (Calming break) |
| TC-M07-AFT-01 | BR-28 | The activity after a break is not the one that caused the stress | Several activities available | Pick an activity | Stressed activity | The stressed activity is skipped | As expected | Pass | `afterBreak.test.js` (skips the stressed activity) |
| TC-M07-AFT-02 | BR-28 | The easiest available activity is chosen, with ties kept in list order | Activities with levels | Pick | Mixed levels | Lowest level; list order on ties; unavailable ones ignored; unlevelled ones last | As expected | Pass | `afterBreak.test.js` (chooses the lowest level; keeps list order on ties; ignores unavailable activities; puts an activity with no level after every levelled one) |
| TC-M07-AFT-03 | BR-28 | The easy round is a short level-1 round of three distinct prompts | Object naming or colours | Build an easy round | object_naming; colour_matching | Level-1 items only; round size 3; three distinct prompts; null for unknown activities | As expected | Pass | `afterBreak.test.js` (easyRoundFor) |

## 6.7 Cross-cutting display rules (shared components and theme)

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test |
|---|---|---|---|---|---|---|---|---|---|
| TC-X-UIL-01 | UI-8, BR-3 | Child screens follow the child's language, one language per screen | Child language set | Render child home, break and object naming | en / ur | Only the child's language is shown | As expected | Pass | `singleLanguage.test.js` (one language per screen: child screens follow the child language) |
| TC-X-UIL-02 | UI-8 | Urdu text is padded and may wrap, with no line limit or fixed height | Urdu text | Inspect button and speech-bubble styles | Urdu | Padding present, wrapping allowed, no line limit; English unchanged | As expected | Pass | `urduLayout.test.js` (Urdu text fits on a real device); `theme.test.js` |
| TC-X-UIL-03 | UI-8 | Urdu line height is at least 1.8 times the font size | None | Read the typography | Urdu sizes | Ratio at least 1.8 | As expected | Pass | `theme.test.js` (Urdu line height is at least 1.8x the font size) |
| TC-X-UIL-04 | UI-8 | Option chips wrap two per row, keep the touch size and stay right to left in Urdu | Goal skill chips | Render in wrap mode | en / ur | Two per row, full touch target, RTL in Urdu; one chip per skill | As expected | Pass | `urduLayout.test.js` (OptionPicker wrap mode; Goal skill chips) |

## 6.8 Manual emulator checks

The manual checks were run on an Android emulator (Pixel 7, API 37) through the developer screen gallery on 2026-11-25. They were verified by screenshots.

| TC ID | Requirement | Description | Pre-conditions | Test steps | Test data | Expected result | Actual result | Status | Automated test | Date | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-MAN-01 | UI-1, UI-8, BR-3 | Urdu text on Home is fully visible | Emulator, gallery, Urdu | Open the Home screen in Urdu | Home card title "بچوں کا موڈ" | The whole title is visible and no word is cut off | Whole title visible | Pass | Manual | 2026-11-25 | Verified by screenshot |
| TC-MAN-02 | FR-20, UI-8, BR-3 | Urdu text on the calming break is fully visible | Emulator, gallery, Urdu | Open the calming break in Urdu | Line ending "…کرتے ہیں" | The last word is visible and not clipped | Last word visible | Pass | Manual | 2026-11-25 | Verified by screenshot |
| TC-MAN-03 | FR-3, UI-8 | Goal skill chips show whole words in a two by two grid | Emulator, gallery | Open the Goals screen | Four skill chips | Whole words, two chips per row | Whole words in a 2 by 2 grid | Pass | Manual | 2026-11-25 | Verified by screenshot |
| TC-MAN-04 | FR-20, BR-30 | The breathing circle animates slowly | Emulator, gallery | Open the breathing step and watch | None | The circle grows and shrinks slowly | Slow, smooth animation | Pass | Manual | 2026-11-25 | Verified on the emulator |
| TC-MAN-05 | UC-11 | Object naming plays from start to summary | Emulator, gallery | Play a full round | Mock recogniser | The round completes and the summary is shown | Played end to end | Pass | Manual | 2026-11-25 | Verified by screenshots |
| TC-MAN-06 | UC-12 | Colour matching plays from start to summary | Emulator, gallery | Play a full round | Mock recogniser | The round completes and the summary is shown | Played end to end | Pass | Manual | 2026-11-25 | Verified by screenshots |

## 6.9 Not yet tested / pending

| Area | Depends on | Reason | Planned check |
|---|---|---|---|
| Navigation wiring between screens | Awais | Screens are opened through the gallery and test callbacks; the real navigator is not yet connected | Run the full flow from Home to Child Mode on the connected app |
| Real speech recognition | Abdullah | The games use a mock recogniser with the agreed contract; no real audio model is connected | Repeat the game cases with the real model, including unclear and silent answers |
| Sync of saved sessions | Awais | Sessions are stored on the phone with an unsynced flag; the upload and the marking as synced are not connected | Verify upload, marking as synced and that unsynced sessions survive failures |
| Doctor voice (text to speech) | Team decision | The Doctor is silent; a voice approach has not been decided | Add cases once a voice approach is chosen |
| iOS device check (POR-1) | Device availability | All manual checks used an Android emulator | Repeat the manual cases on an iOS device |

## 6.10 Summary

| Module or group | Automated cases | Manual cases | Total |
|---|---|---|---|
| M-01 Onboarding (PIN, child, consent, baseline, goals, home, language, Urdu screens) | 45 | 2 | 47 |
| M-02 Doctor avatar | 4 | 0 | 4 |
| M-03 Games | 33 | 2 | 35 |
| M-07 Calming break and return after a break | 9 | 2 | 11 |
| Cross-cutting display rules | 4 | 0 | 4 |
| **Total** | **95** | **6** | **101** |

The 101 cases above are drawn from the full automated suite, which contains 458 tests in 37 suites (`cd frontend && npx jest`: Tests: 458 passed, 458 total; Test Suites: 37 passed, 37 total). All 458 automated tests pass, and all six manual checks passed on 2026-11-25. Each listed case is backed by one or more of these tests; the remaining tests check further boundaries of the same behaviour and are not listed individually.
