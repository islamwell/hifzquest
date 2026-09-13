# HifzQuest community UI preview

Responsive improvements based on `islamwell/hifzquest` commit `6a3fea5` (v1.0.9).

## Run locally

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173 in a browser. No build step is required. Fonts and Qari audio need internet access. The app saves progress and preferences in that browser's storage.

## Ten priority changes

1. Responsive Home, Together, Revision, Teachers and More navigation on mobile and desktop.
2. Practice-focused home layout with revision and teacher entry points.
3. Community session preferences saved locally, with clear live-service availability messaging.
4. Teacher screens that prioritize free learning and distinguish optional paid lessons from available services.
5. Empty sample scores and weekly activity for new users, preserving other existing saved progress.
6. A dated seven-day activity chart with count-based scaling and calendar rollover. Legacy undated chart entries are excluded.
7. Keyboard navigation, visible focus, named controls, modal focus containment and return, plus safe toast text rendering.
8. Mobile layout and canvas improvements, profile access, saved appearance, fixed canvas deep links and reciter markup.
9. Recall mode that hides the target passage and resets transient recording/quiz state on reload.
10. Honest microphone-denial and unsupported-recognition states; empty recognition results do not save a score.

`community.css` and `community.js` contain the new UI layer. `app.js` retains the original learning engine with targeted repairs. `index.css` remains the base style sheet.

## Important boundaries

This is a working frontend preview, not a launched marketplace. There is no authentication, remote participant matching/calling, teacher verification service, payment processing or cloud progress sync. Community preferences are only saved locally. The new primary teacher screen displays no invented profiles or availability.

The underlying learning engine still contains 13 sample ayahs, one per surah entry. Transcript comparisons do not assess Tajweed or establish complete surah memorization. Legacy demo booking/chat/classroom functions and modals remain in the source but are not exposed through the new primary teacher flow. Remove or replace them during backend integration; do not deploy this as a completed service.

Accounts, secure remote sessions, complete reviewed Quran content, teacher operations and payments remain future work.

## Validation

Headless installed Chrome was used for:

- All nine screens at 320, 390, 768, 1024 and 1440px: no detected horizontal document overflow or page exceptions.
- Fresh state, dated activity rollover and existing profile/XP preservation.
- Community preference persistence and teacher filter feedback.
- Canvas direct-link initialization.
- Profile dialog accessibility state and keyboard focus return.
- Practice activity increments and toast text handling.
- Recall text hiding/reveal and denied-microphone behavior without fake recording/progress.

Desktop light/dark, mobile home, mobile Together and desktop Teachers were also visually inspected. This is not physical-device testing, a full accessibility audit, audio-quality validation or backend/security certification.

The repeatable smoke test expects the app running at port 4173:

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/smoke.cjs
```

Alternatively, run with installed Google Chrome using `BROWSER_CHANNEL=chrome node tests/smoke.cjs`.
