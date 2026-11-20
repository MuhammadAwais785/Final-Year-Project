# Design system: Silent Screen Syndrome

Source: the team's Google Stitch project ("Bilingual Speech Therapy App"), cleaned to match the SRS.
Screens are in [screens/](screens/); see [README.md](README.md) for the screen list.

## Two modes

| | Child Mode | Parent Portal (also Home and PIN) |
|---|---|---|
| Feel | Warm, calm, playful | Clean, neutral, easy to scan |
| Background | Cream `#FFF8F0` | Light lavender-white `#FAF8FF`, white cards |
| Text | Large, minimal, one language | Standard, one language (EN/اردو toggle) |
| Touch targets | At least 72dp (80dp for main actions) | At least 48dp |

The colour difference tells the child and the parent which area they are in.

## Colours

| Token | Hex | Use |
|---|---|---|
| `childBackground` | `#FFF8F0` | Every child screen, full height |
| `sky` | `#A8DADC` | Child tile 1, calm accents |
| `peach` | `#FFD6A5` | Child tile 2, rewards, encouragement |
| `mint` | `#B9E4C9` | Child tile 3, success, Play again |
| `lavender` | `#CDB4DB` | Calming break accents only |
| `clay` | `#D97736` | Star icon, warm highlights |
| `parentBackground` | `#FAF8FF` | Parent, Home and PIN screens |
| `card` | `#FFFFFF` | Cards on any background |
| `field` | `#F3F2FF` | Text inputs and unselected chips |
| `surface` | `#EBEDFF` | Icon circles, language toggle |
| `primary` | `#186288` | Buttons, selected chips, links, progress dots |
| `primaryLight` | `#397BA3` | Secondary highlights |
| `text` | `#171B2B` | Main text (never pure black) |
| `textMuted` | `#40484E` | Secondary text, metadata |
| `border` | `#C0C7CF` | Dividers |
| `success` | `#006954` | Positive progress, "Synced" |
| `error` | `#BA1A1A` | Form errors |
| `errorLight` | `#FFDAD6` | Error banners (e.g. wrong PIN) |

## Typography

| Style | English (Plus Jakarta Sans) | Urdu (Noto Nastaliq Urdu) |
|---|---|---|
| Display | 32px / 800, line 40 | n/a |
| Headline large | 28px / 700, line 36 | 26px / 700, line 54 |
| Headline medium | 24px / 700, line 32 | 22px / 700, line 48 |
| Headline small | 20px / 600, line 28 | n/a |
| Body large | 18px / 500, line 28 | 18px / 500, line 40 |
| Body | 16px / 400, line 24 | 15px / 400, line 34 |
| Label large (chips, buttons) | 18px / 700, line 24 | n/a |
| Label | 14px / 600, line 20 | n/a |
| Small label | 12px / 600, line 16 | n/a |

Urdu rules:
- Line height 1.8 to 2.2 times the font size, or letters get clipped (top bar titles included).
- Mirror the layout right to left: back arrow on the right, chevrons pointing left.
- Western digits (0 to 9) everywhere.
- Charts keep their data order; only labels are translated.

## Shape, spacing, depth

- Radius: cards 32px, inputs and chips 16px, main buttons fully rounded (pill).
- Spacing scale: 4, 8, 16, 24, 36px. Screen margin 20px, gutter 16px.
- Shadows are soft and tinted `#2D3142`:
  - Card: `0 4px 16px` at 5%
  - Button / speech bubble: `0 6px 20px` at 8%
  - Modal: `0 16px 36px` at 14%

## Components

| Component | Rules |
|---|---|
| Child tile button | Pill, 72 to 88dp tall, icon + one short label, whole tile tappable |
| Speech bubble | White, 24px radius, tail points at the Doctor; tail flips in Urdu |
| Doctor | The same character on every child screen, transparent background, no box behind him |
| Star counter | One star icon + number (e.g. ★ 12) |
| Progress dots | Blue `primary`; filled = done |
| Listening indicator | Mic + waveform + "Listening…" only while the app is listening (UI-3) |
| Exit control | Only "Grown-ups: hold to exit" on child screens; no bottom navigation |
| PIN keypad | 4-digit PIN, 72dp round keys, numbers only (UC-23, BR-34) |
| Input field | `field` background, no border, 16px radius, 56dp tall; error = red "!" marker in the field and beside the message |
| Option chips | Equal width in one row, 56dp tall, 16px radius, `field` background; selected = `primary` with white text |
| Parent card | White, 32px radius, card shadow |

## Content rules (from the SRS)

- **Positive feedback only** on child screens (BR-12).
- **No medical or clinical claims:** no diagnosis wording. The mood map and report always show "not a diagnosis" (CON-6).
- **Privacy:**
  - Never show or imply that audio, recordings or camera images are uploaded (BR-20, BR-25).
  - No photos of children, and no camera badge on avatars.
- **Calming break screens:**
  - No Home button and no star counter.
  - Calm colours, no flashing or sudden contrast (BR-30).
