# Haničar GPT — Premium Redesign Plan ("Zlatna Ponoć")

> Status: implemented — Zlatna Ponoć redesign applied across all UI surfaces.
> Scope: visual/UX only. No chatbot logic, API calls, message state, or product features are touched.

---

## 1. Current State Analysis

### 1.1 What exists (code)

- **Stack:** Vite + React 19 + TypeScript, Tailwind v4 (no config file — tokens in `src/styles/styles.css` via `@theme`), framer-motion, lucide-react, Zustand + IndexedDB (`hanicar-chat-storage`), SSE streaming via `POST /api/chat`.
- **Design system:** "Haničar Codex" — illuminated-manuscript aesthetic. Two themes on CSS variables:
  - **DAY (default):** parchment `#ece0c4`, ink `#362b1c`, gold `#977c2f`, oxblood `#7c1c14`.
  - **NIGHT (`html.night`):** dark leather `#171009`, cream ink `#e8d9b6`, glowing gold `#caa63f` — *exists but underdeveloped and not the default*.
- **Fonts:** Cinzel (incipit/display caps), Cormorant Garamond, EB Garamond (body), Outfit (UI). Loaded in `index.html`.
- **Signature elements already present:** parchment grain overlay, wax-seal send button, gold rule dividers, illuminated drop caps, quill typing animation, candle flicker, satirical Croatian microcopy ("Molba", "Zapečati i pošalji", "Spali zapis", "Novi zapis").
- **Persona:** Sveti Haničar — Croatian pseudo-religious oracle, 6 "obredi" (rites): Sveti, Birokratski, Ponizni, Političar, Dalmatinac, Zbor Građana.

### 1.2 What the deployed app looks like (honey-gpt.vercel.app)

Verified with live desktop + mobile screenshots:

- Day/parchment theme is the entire experience; the dark theme is hidden behind a small toggle.
- **Chat bubbles are flat and near-invisible** — user and assistant messages are almost the same beige, blending into the background; hierarchy relies on tiny 9px labels.
- **Vast empty beige space** on desktop; conversation column feels unanchored, no cinematic atmosphere.
- **Mobile is cramped:** bubbles nearly touch edges, composer buttons crowd the input, no safe-area handling polish.
- **Loading state is minimal** (a single italic line), send/typing feedback is easy to miss.
- **Contrast is borderline** (axe `color-contrast` rule is disabled in e2e because of this).
- Persona seals (S/B/P/G/D/Z) look like badges, not controls; empty state chips have little visual weight.
- The identity is *good but timid* — the satire and the manuscript metaphor exist, but nothing feels theatrical, premium, or memorable.

### 1.3 Prior conversation constraints (from past Cursor chats)

- Multiple hardening rounds; the app is stable, heavily tested (~210 unit tests, 21 e2e) — **stability is sacred**.
- E2E and unit tests assert on **Croatian aria-labels and copy** ("Mir s tobom, sine", "Upiši molbu", "Zapečati i pošalji", "Novi zapis", "Spali zapis", "Bočna traka razgovora", "Dalmatinac obred", …) — these strings must not change.
- Theme persistence key `hanicar_codex_theme`; store persist key `hanicar-chat-storage` — must not change.
- Rejected in the past: auth, server DB, RAG, offline queue, admin dashboards — this plan adds none of them.
- Prior direction was "polish the codex, don't replace it" — this redesign honors that: it **promotes and perfects the existing NIGHT rite** rather than inventing a new design language.

---

## 2. Redesign Direction: "Zlatna Ponoć" (Golden Midnight)

**One sentence:** a candlelit Balkan chapel at midnight — deep warm darkness, honey-gold light, wax and incense — where a slightly absurd digital saint receives your molbe.

### 2.1 Design pillars

1. **Dark-first, candlelit.** Night becomes the default and the brand. Day/parchment survives as the secondary "Dnevni obred" toggle (nothing removed, tests keep passing).
2. **Honey & gold as light sources, not decoration.** Gold is used the way candlelight works: focal glows, edges, dividers, the halo — never large filled areas.
3. **Theatrical, not kitsch.** The absurdity comes from the copy and ritual metaphors (already excellent); the visuals stay elegant and restrained so the joke lands harder.
4. **Readability above all.** Body text is warm cream on deep brown-black at WCAG AA+; generous line-height; clear user/assistant distinction at a glance.
5. **Ceremony as microinteraction.** Sending = sealing a letter. Waiting = a candle burns. Answer = ink appears. Every interaction reinforces the ritual.

### 2.2 Color system (token changes only — same variable names)

All changes go into the existing CSS variables in `src/styles/styles.css`, so every component inherits them for free.

New `html.night` (becomes default) values — cinematic honey/gold:

```css
/* Surfaces — deep warm black, like a chapel at night */
--parchment:   #0f0a05;   /* base backdrop */
--parchment-2: #191108;   /* cards / assistant bubbles */
--parchment-3: #241a0e;   /* elevated / hover */
--vellum:      #1d1409;   /* composer / user bubble base */

/* Ink — warm candlelit cream */
--ink:        #ecdfc0;
--ink-strong: #f8f0da;
--ink-soft:   #b39d75;

/* Honey & gold — the light of the scene */
--gold:        #d9a441;   /* honey gold */
--gold-bright: #f0c063;   /* candle highlight */

/* Wax & rubrics — richer, less orange */
--oxblood: #a63a26;
--rubric:  #e08050;
```

Plus new atmosphere layers (additive, no markup churn):

- Body background: layered radial gradients — a warm honey glow bleeding from the top ("candle above the altar") + a deep vignette at the edges for cinema.
- `.parchment-grain` stays (film grain in dark mode reads as texture, opacity ~0.04, `overlay`).
- A new `.candle-glow` utility: soft radial `--gold` at 8–12% for focal areas (empty-state heading, portrait, active seal).

Day theme gets a light contrast pass only (darker ink, slightly deeper parchment) so axe contrast improves there too.

### 2.3 Typography

Fonts stay (they're perfect for the character); the *scale and rhythm* change:

- Body: EB Garamond 17px → **17.5px desktop / 16.5px mobile**, line-height 1.7 in messages.
- Empty-state heading: Cinzel, larger (clamp 2.6rem–4rem), letter-spaced, with a soft gold text-glow in night mode.
- Rubrics stay small-caps Outfit but bump to 10–11px with more breathing room (currently 9px — too small).
- Drop cap: gold-bright with candle glow in night mode (currently oxblood) — the illuminated letter becomes literally illuminated.
- Timestamps/labels: one step larger, higher contrast.

### 2.4 Component-by-component redesign

#### Empty state — `src/components/Invocation.tsx`
The first impression must feel like entering the chapel:
- Add the Saint portrait (existing `SaintPortrait`, larger, halo'd with the candle-flicker animation) above the heading — currently the empty state has no character presence at all.
- Heading "Mir s tobom, sine" with gold glow + staggered reveal (letters/words fade in like candle catching).
- "Prvi moralni stroj" rubric stays; add the gold rule below with its existing pulse.
- Suggestion chips ("molbe") become **votive cards**: dark elevated surface, 1px gold/25 border, honey glow on hover, the ❧ ornament in gold-bright; staggered entrance (already using framer-motion — tune it).
- Keep the exact heading text, chip texts, and shortcut hints (tests depend on them).

#### Chat bubbles — `src/components/ChatMessage.tsx`
The core fix — messages must be scannable and beautiful:
- **User ("Molba"):** right-aligned honey glass — `--vellum` base with a subtle amber gradient, 1px `--gold`/30 border, soft outer shadow. Reads as "your letter on the desk".
- **Assistant ("Haničar"):** left-aligned manuscript card — `--parchment-2`, a **2px gold left rule** (repurposing the existing `.folio-leaf` idea), stronger elevation shadow, glowing drop cap on first paragraph.
- Clear silhouette difference (width, alignment, border treatment) so role is legible without reading labels.
- Hover action row (copy/TTS/edit/regenerate): same buttons and aria-labels, restyled as a subtle gold-on-dark pill; always visible on touch (already the case — keep).
- Markdown prose: retune `prose-*` colors for dark (links gold-bright underlined, blockquotes with gold bar, code in honey on dark), Shiki dark theme already fits.

#### Composer — `src/components/ChatComposer.tsx` + `TextInput.tsx` + `SendButton.tsx`
- The form becomes a **floating dark-glass altar tray**: elevated `--vellum` card, inner top highlight, 1px gold/20 border; on focus, a soft honey ring glow (`focus-within` gold/50 + outer glow shadow).
- Footer gradient becomes a dark fade with a hairline gold shimmer divider (the `shimmer` keyframe exists but is unused — wire it here, slow and subtle).
- Wax-seal send button: keep the radial oxblood seal but add an embossed cross/„H" impression feel via inner shadows, gold rim on hover, satisfying press (scale 0.92 + brief glow) — the signature button of the app.
- Utility buttons (attach/mic/TTS): consistent 40×40 hit areas, gold active states.
- "Spusti pero" abort pill: dark glass with gold border, unchanged text/aria.
- Error banner: keep `role="alert"`, restyle as dark card with rubric-red left bar (readable on dark).

#### Typing indicator — `src/components/TypingIndicator.tsx`
- Keep the brilliant random status lines ("moli krunicu za točan odgovor…").
- Upgrade visuals: portrait + a small **candle-flame flicker** or three gold ember dots pulsing in sequence + the quill wiggle; italic text gets a slow shimmer sweep so waiting feels alive.

#### Sidebar — `Sidebar.tsx`, `SidebarHeader.tsx`, `PersonaSeals.tsx`, `ChatList*.tsx`
- The sidebar becomes the **chapel spine**: near-black `--parchment` with a 1px gold hairline edge, portrait glowing with the existing candle animation (stronger halo in dark).
- Persona seals: render as actual small wax seals (radial gradient like the send button) — active seal glows gold with a ring; inactive seals are embossed dark. Labels stay (test: "Dalmatinac obred").
- "NOVI ZAPIS" button: oxblood wax bar with gold hover rim (keep text + `Feather`).
- Chat list: rows get hover honey tint, active row gets gold left rule; group headers (Danas/Jučer/Starije) as rubrics.
- Model select: styled dark with gold focus (native `<select>` stays for a11y/tests).

#### Mobile header + mobile UX — `src/App.tsx`
- Mobile top bar: dark glass with blur, gold hairline bottom border; portrait + "Haničar" wordmark in Cinzel.
- Spacing pass: messages `px-4` → comfortable gutters, bubbles max-w 88%, `space-y` tuned; composer with `env(safe-area-inset-bottom)` padding.
- Touch targets ≥ 44px everywhere in the composer and message actions.
- Scroll-to-bottom wax seal: slightly larger, gold ring, safe-area aware.

#### Modals, toasts, dialogs — `SearchModal`, `KeyboardShortcutsModal`, `ConfirmDialog`, `Toast`
- `.codex-modal` / `.codex-toast` get dark-glass treatment: deep surface, gold hairline, heavier drop shadow, backdrop blur + darker overlay.
- ConfirmDialog "Spali zapis" gets a subtle ember-red glow on the destructive button (fits the burning metaphor).

#### Scrollbars, selection, focus
- Scrollbar thumb: honey gold at low alpha (already close — tune).
- `::selection`: honey gold at ~35% with dark text.
- Focus-visible ring: `--gold-bright` (already global — verify contrast on new surfaces).

### 2.5 Microinteractions (all framer-motion / CSS, all respecting `prefers-reduced-motion`)

| Moment | Interaction |
|---|---|
| Message arrives | existing `ink-in` (blur + rise) kept, plus a one-time faint gold edge-glow that fades |
| Send | seal press: scale down, brief bright flash of the wax, message flies up |
| Waiting | candle/ember pulse + shimmer on status text |
| Chip hover | lift 2px + honey glow + ❧ turns gold-bright |
| Seal (rite) change | active ring animates around the new seal |
| Theme toggle | 0.5s crossfade already exists — keep |
| Empty state | staggered ceremonial entrance (rubric → heading → rule → chips) |

Nothing new on the dependency side — framer-motion and CSS keyframes already in the project cover all of this.

### 2.6 Meta / PWA touches

- `index.html` `theme-color`: `#0f0a05` (with `media` variants for light/dark).
- PWA manifest `theme_color`/`background_color` aligned to the dark palette.
- No favicon/logo asset changes (out of scope; existing portrait stays the brand).

---

## 3. Hard Guardrails — what this redesign will NOT touch

- **No changes** to `src/store/`, `src/hooks/` (except possibly the one-line default in `useAppTheme`), `src/lib/`, `api/`, `server/`, `shared/` logic.
- All **aria-labels, roles, headings, and Croatian copy stay byte-identical** (test contract: "Mir s tobom, sine", "Upiši molbu", "Zapečati i pošalji", "Novi zapis", "Spali zapis", "Pretraži arhivu", "Bočna traka razgovora", "Zbor Građana", offline texts, etc.).
- Welcome detection (`displayMessages.length <= 1` → `Invocation`), SSE streaming, `stripThinking()`, abort, retry, share view, export/import: untouched.
- Persistence keys `hanicar-chat-storage` and `hanicar_codex_theme`: untouched.
- CSS variable *names* stay the same (only values + new additive utilities) so `ErrorBoundary` inline styles and legacy `zinc-*`/`crimson-*` remaps keep working.
- No new features, pages, or dependencies.

**One deliberate behavior change:** default theme flips from `day` to `night` in `useAppTheme` (`stored === 'day' ? 'day' : 'night'`). Users who already chose a theme keep it (localStorage wins). The `SidebarHeader` unit test asserting the "Uključi noćnu temu" toggle label and any e2e that implicitly assumes day-default will be updated in the same phase — test updates, not behavior breaks.

---

## 4. Implementation Plan (phased, each phase shippable)

### Phase 1 — Foundation: tokens & atmosphere (`src/styles/styles.css`, `useAppTheme.ts`, `index.html`)
1. Rework `html.night` palette to the Zlatna Ponoć values; contrast-pass the day palette.
2. New body background gradients (honey glow + vignette) per theme; tune `.parchment-grain` for dark.
3. Add `.candle-glow`, wire the unused `shimmer` keyframe into a `.shimmer-gold` utility.
4. Flip default theme to night; update `theme-color` metas + PWA manifest colors.
5. Update the 1–2 tests tied to the day-default assumption.

### Phase 2 — Chat surface (`ChatMessage.tsx`, `chat/MessageContent.tsx`, `chat/CodeBlock.tsx`)
1. Rebuild bubble styling: honey-glass user bubble, manuscript assistant card with gold left rule.
2. Retune prose/markdown colors, drop cap glow, code block chrome for dark.
3. Restyle hover action row; bump label/timestamp sizes.
4. Message-arrival gold edge-glow microinteraction.

### Phase 3 — Composer & waiting states (`ChatComposer.tsx`, `TextInput.tsx`, `SendButton.tsx`, `TypingIndicator.tsx`)
1. Dark-glass composer card with honey focus glow; shimmer hairline divider; safe-area padding.
2. Wax-seal send button upgrade (emboss, gold hover rim, press flash).
3. 44px touch targets for attach/mic/TTS; restyled abort pill and error banner.
4. Typing indicator: ember/candle pulse + text shimmer, keep random messages.

### Phase 4 — Empty state (`Invocation.tsx`)
1. Add halo'd `SaintPortrait` with candle glow above the heading.
2. Heading glow + ceremonial staggered entrance.
3. Votive-card suggestion chips with honey hover.

### Phase 5 — Sidebar & mobile chrome (`Sidebar.tsx`, `sidebar/*`, `App.tsx` mobile header)
1. Dark chapel-spine sidebar, portrait halo, gold hairline edge.
2. Wax-seal persona buttons with glowing active ring.
3. Chat list hover/active states, restyled model select, NOVI ZAPIS button.
4. Mobile header dark glass + blur; spacing/touch pass across mobile layout; scroll-to-bottom seal polish.

### Phase 6 — Overlays & final polish (`SearchModal`, `KeyboardShortcutsModal`, `ConfirmDialog`, `Toast`, scrollbars)
1. Dark-glass modals/toasts with gold hairlines and backdrop blur.
2. Ember-red destructive button in ConfirmDialog.
3. Scrollbar/selection/focus-ring pass on the new surfaces.
4. Reduced-motion audit of every new animation.

### Phase 7 — Verification
1. `npm run verify` (typecheck, lint, format, unit tests + coverage).
2. Playwright e2e: `chat.smoke`, `chat.mobile` (390×844), `chat.a11y` (axe), `chat.preview` — all must pass.
3. Attempt to **re-enable the axe `color-contrast` rule** now that contrast is designed-in; keep disabled only if specific ornamental elements fail.
4. Manual pass: desktop + mobile screenshots of empty, loading, conversation, sidebar, modals in both themes; compare against this plan.

Estimated effort concentrates in `styles.css` (Phase 1) and `ChatMessage`/`ChatComposer` (Phases 2–3); everything else inherits most of its look from the token changes.

---

## 5. File Touch List

| File | Phase | Nature of change |
|---|---|---|
| `src/styles/styles.css` | 1 | token values, gradients, new utilities |
| `src/hooks/useAppTheme.ts` | 1 | default `'day'` → `'night'` (one line) |
| `index.html`, `vite.config.ts` (PWA manifest) | 1 | theme-color values |
| `src/components/ChatMessage.tsx` | 2 | className styling only |
| `src/components/chat/MessageContent.tsx`, `chat/CodeBlock.tsx` | 2 | prose/code styling |
| `src/components/ChatComposer.tsx`, `chat/ChatComposer/TextInput.tsx`, `SendButton.tsx` | 3 | styling + touch targets |
| `src/components/TypingIndicator.tsx` | 3 | visual upgrade, same texts |
| `src/components/Invocation.tsx` | 4 | layout/styling, same copy |
| `src/components/Sidebar.tsx`, `sidebar/*` | 5 | styling |
| `src/App.tsx` | 5 | mobile header/spacing classNames only |
| `SearchModal`, `KeyboardShortcutsModal`, `ConfirmDialog`, `Toast` | 6 | styling |
| affected unit/e2e tests | 1, 7 | only where day-default was assumed |

No other files are modified.
