# UI design

Final screens agreed by the team, exported from Google Stitch. Colours, fonts and component rules are in [DESIGN.md](DESIGN.md).

- `screens/`: images of all 31 screens, 500px wide. Use these as the reference.
- `html/`: Stitch's HTML for each screen. Open it in a browser to read exact sizes, colours and text. It is not app code; the app is React Native.
- `assets/`: the apple and Doctor images used by the HTML. The app will use a transparent Doctor PNG.

## Screens

| Area | Module | English | Urdu |
|---|---|---|---|
| Home (Child Mode / Parent Portal) | M-01 | `app_home_mode_selection` | (bilingual) |
| Parent PIN | M-01 | `parent_gate_pin_verification` | (bilingual) |
| Child Mode home | M-02, M-03 | `child_mode_voice_games_english` | `child_mode_voice_games_urdu` |
| Object naming game | M-03, M-04 | `object_naming_game` | `object_naming_game_urdu` |
| Game: hint, correct, summary | M-03 | `object_naming_game_hint`, `_correct`, `_summary` | n/a |
| Calming break | M-07 | `calming_break_start`, `_guided_breathing`, `_soothing_sounds`, `_ready_to_play` | `calming_break_start_urdu` |
| Add a child | M-01 | `add_a_child` | `add_a_child_urdu` |
| Consent | M-01 | `consent_and_permissions` | `consent_urdu` |
| Baseline check | M-01 | `baseline_screening` | `baseline_check_urdu` |
| Parent Portal home | M-09 | `parent_portal_home`, `parent_portal_home_alert` (stress alert, M-07) | `parent_portal_home_urdu` |
| Progress | M-09 | `progress` | `progress_urdu` |
| Goals | M-01 | `goals` | `goals_urdu` |
| Report | M-10 | `report` | `report_urdu` |
| Sync | M-08 | `sync` | `sync_urdu` |

## Notes

- The Doctor appears in the screen images on a light box. That is a Stitch limitation: the app uses a transparent PNG, with no box.
- Sample data (Ali, Sara, 18 words, 12 stars and so on) is placeholder data, not real users.
- The screen images were rendered from the HTML in Chrome, because Stitch's own image export was blank or incomplete for several screens.
