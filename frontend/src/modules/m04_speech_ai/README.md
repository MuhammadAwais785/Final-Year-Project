# M04 Speech AI: contract with the games

**Owner:** Abdullah (AI lead) · **Used by:** M03 games (Fasih) · **SRS:** FR-10 to FR-13, BR-20 to BR-23, TBD-01, TBD-03

The games call the recogniser through the interface below. Build a **mock** with exactly this shape first, so the games can be built now. The real on-device model then replaces the mock behind the same interface, and the games do not change.

## Interface

`m04_speech_ai/index.js` exports one object, `speechRecognizer`:

```js
speechRecognizer.recognize({ acceptedAnswers, language, listenMs })
  // → Promise<{ heard, confidence, score, status }>
speechRecognizer.cancel()
```

| Input | Type | Meaning |
| --- | --- | --- |
| `acceptedAnswers` | `string[]` | Correct words in the child's language, including synonyms, e.g. `['cat', 'kitty']` or `['بلی', 'بلّی']` |
| `language` | `'en' \| 'ur'` | The child's language. Load the matching model (BR-21). |
| `listenMs` | `number` | How long to listen before giving up (BR-21). Games use about 6000. |

| Output | Type | Meaning |
| --- | --- | --- |
| `heard` | `string \| null` | Best guess of the word said; `null` if no speech |
| `confidence` | `number` 0–1 | How sure the model is |
| `score` | `number` 0–100 | Pronunciation clarity (BR-23) |
| `status` | see below | The result the game acts on |

`cancel()` stops listening at once. A pending `recognize()` then resolves with `status: 'no_response'`.

## Status rule (apply in this order)

| Status | When | Game does |
| --- | --- | --- |
| `no_response` | Nothing said within `listenMs` | "Say it again" |
| `inconclusive` | `confidence` below the minimum (start with 0.6; final value is TBD-03) | Asks again; **never counted as wrong** (BR-22) |
| `recognized` | `heard` matches an accepted answer **and** `score` ≥ threshold (start with 60; TBD-03) | Praise and stars |
| `incorrect` | Clear speech, but a different word or `score` below the threshold | Gentle "try again", hint after 2 misses |

Compare words after normalising: lower case, trimmed, punctuation removed. For Urdu, also unify Arabic and Urdu letter forms (ي → ی, ك → ک, ه → ہ) and remove diacritics, so `سيب` and `سِیب` both match `سیب`.

## Rules

- **Privacy (BR-20, SEC-1):** audio is processed on the phone only. Never save, log or upload audio or transcripts of it. Return only the fields above.
- **Permission:** call `requestMicrophone()` from `src/utils/permissions.js` before the first listen. If it is not `'granted'`, return `no_response` and let the game show the message.
- **Offline:** recognition must work without internet (OE-5).
- Thresholds go in `src/utils/constants.js`, not hard-coded in the model code.

## The mock (first task)

The mock follows the same interface. It waits `listenMs`, then returns `recognized`, unless a test or the dev screen gallery calls `simulate()` first:

```js
mockRecognizer.simulate('correct' | 'wrong' | 'unclear' | 'silence');
// correct → recognized, wrong → incorrect, unclear → inconclusive, silence → no_response
```

Add unit tests for the status rule (SRS Appendix B.2: TD-07 to TD-11).

## Related AI contracts (M05–M07)

| Module | Owner | Interface | Rules |
| --- | --- | --- | --- |
| M05 Vision | Abdullah | `subscribeIndicators(callback)` returns `unsubscribe`; callback receives `{ stress, frustration, boredom, confidence, at }`, each 0–1 | Start only if the child's consent has `cameraAllowed: true` (`m01_onboarding/consentStore.js`, BR-24). Stop at once when it is turned off. Never store or upload frames (BR-25). |
| M06 Difficulty | Abdullah | `nextDifficulty(history)` → level | Up one step after 3 correct in a row, only between rounds (BR-14). Start at level 1 or the last played level. Levels are the numbers in `LEVELS`. |
| M07 Trigger | Abdullah | `shouldStartBreak(recentIndicators)` → `{ startBreak, stressedActivity }` | Only when stress stays above the threshold for a sustained time, not one spike (BR-27). |
| M07 Screens | Fasih | Calming break screens | Already designed in `docs/design/screens/calming_break_*`. |
