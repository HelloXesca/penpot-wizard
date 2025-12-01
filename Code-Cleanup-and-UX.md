# Code Cleanup and UX

## To-dos

- [ ] [Audit override-confirmation pattern across tools](#audit-override-confirmation-pattern-across-tools)
- [ ] [Standardize override intent parsing (read-first & infer override)](#standardize-override-intent-parsing-read-first--infer-override)
- [ ] [Add typed prompt payloads and tests for effects](#add-typed-prompt-payloads-and-tests-for-effects)
- [ ] Add universal mixed-selection prompt helper (assets)
  - Create reusable detectors + a readThenAct wrapper in `src/assets` that detects mixed selection states and prompts the user for clarity before mutating shapes (e.g., shadow/fill/stroke/lock). Keep logic in `assets` so the plugin remains mutation-only. Add tests and UI message templates.
- [ ] Qucikfix: Update Tool names and IDs to properly use Kabob and camelCase respectively
- [ ] Create a branch with just the Director Agent for merge into main
- [ ] Add the new types and union entries (small, straight-forward).
- [ ] Update plugin handlers (applyShadow, applyStroke etc.) to use typed payloads.
  - [ ] Update tests to expect typed payloads (no runtime changes).
- [ ] Optionally enable an ESLint rule to discourage any in plugin code (gradual, with fixer PRs).

- [ ] [Ensure all tools that require selection info follow the read-first / act-later pattern](#Follow-the-read-first-/-act-later-pattern)
- [ ] Remove or refactor remaining `any` usages in `mainHandlers.ts` — there are pre-existing any warnings.

- [ ] Add a test suite that validates undo coverage for every effect; I can add a small harness that checks undoStack/redoStack behavior automatically.

  - [ ] Run tests and CI.

- [ ] Toggle Lock tool functionality improvements

  - [ ] Add a small UI notification function that collects skippedLockedNames and shows an explicit UI dialog (instead of only appending to response.message). The wrapper currently appends the message, but a UI toast or modal would be nicer.
  - [ ] Prompt UI and UX flows for mixed selection (confirm choices and "unlock and retry" convenience).
  - [ ]Add an admin/assistant helper that can automatically unlock shapes (with user permission) and re-run the last move — good to combine with the move wrapper.
  - [ ]Clean up any usages (strict typing) and run autofix for lint suggestions.

- [ ] [Add universal mixed-selection prompt helper](#Add-universal-mixed-selection-prompt-helper)

  - [ ] Start implementing the detectors for shadow/fill/stroke/lock first (I recommend shadow and lock first because they commonly cause user confusion).
  - [ ] Add unit tests for detectors and the wrapper readThenAct.
  - [ ] Add UI-level example prompts (text strings) for each detector so it's easy for designers to revie

- [ ] Update all applicable tools to use `promptHelpers.ts` for confirmations, blocked shapes, and other UX messages
  - Wire the new helper into each `set-selection-*` handler so they early-return a blocker prompt whenever locked/read-only/unsupported shapes are detected, then wait for user confirmation before mutating.
  - Extend the detection helpers to surface error-derived reasons when the plugin catches Penpot failures during mutation attempts.

---

## Audit override-confirmation pattern across tools

Why:

- Ensure a uniform user experience across tools that might replace/override existing effects (shadow, stroke, fill, blur, gradients).
- Follows the read-first / act-later safety pattern to avoid Penpot selection crashes.

What to check:

1. Each effect tool should use `getSelectionForAction()` when mutating shapes.
2. If any selected shapes already have the effect, the tool should return a dedicated "prompt" payload (typed) instead of applying changes immediately:
   - Example: `ApplyShadowPromptResponsePayload { shapesWithExistingShadows, requestedShadow }`
3. Agents/UI should call `GET_SELECTION_INFO` to read selection details first before requesting mutation endpoints.
4. Tools (UI/agents) should map natural language into `overrideExisting=true` where human intent indicates replacement (e.g., "replace" or "overwrite"), rather than the user needing to explicitly set a flag.
5. Unit tests must cover both the prompt and the override flows.

Return format guidance:

- Prompt response payloads must be strongly typed and added to union types (`PluginResponsePayload`). Do not use `any` or `as any` if possible.
- Keep `success: false` for prompt returns (to avoid accidental mutations), with a human-friendly `message` that explains what will happen next.

Usage guidance for agents/UI:

- Read selection info first via `GET_SELECTION_INFO`.
- If plugin returned a prompt, show options to user: "Override" or "Keep" and pass `overrideExisting` on subsequent request.
- For natural language input: if the user says "Replace the drop shadow on this shape", treat it as override: `overrideExisting=true`.

---

(We'll add more suggestions and a checklist for each tool — testing steps, suggested types, and migration notes — in this document as we audit other tools.)

## Standardize override intent parsing (read-first & infer override)

Why:

- Provide a single, tested helper that maps natural language ("replace", "overwrite") to overrideExisting semantics.
- Keeps the read-first/act-later pattern by calling GET_SELECTION_INFO first.

What to implement:

1. A small wrapper in `src/assets` (not plugin) called `readThenAct` or `inferOverrideFromText`.
2. Unit tests verifying inference of `overrideExisting` with typical phrases.
3. Apply the wrapper to `functionTools` only — not plugin — to keep selection safety.

Notes and implementation guidance:

- The helper should live in `src/assets/overrideUtils.ts` (or similar) so it can be reused by `functionTools` and other UI/director agents without touching plugin code.
- Keep the helper focused: read first, infer override, then call plugin endpoint. Don't perform any mutation in the helper itself.
- The helper should expose two small functions:
  - `inferOverrideFromText(text?: string): boolean` — returns whether a user intends to replace/override.
  - `readThenAct<T>(actionQuery: ClientQueryType, payload: T & { overrideExisting?: boolean }, userText?: string, autoConfirm?: boolean): Promise<PluginResponseMessage>` — reads selection first, infers override, calls plugin and optionally confirms.

Example signature and intent (for discussion):

```ts
export function inferOverrideFromText(text?: string): boolean;

export async function readThenAct<T extends { overrideExisting?: boolean }>(
  actionQuery: ClientQueryType,
  payload: T,
  userText?: string,
  autoConfirm = false
): Promise<PluginResponseMessage> {
  // steps:
  // 1. GET_SELECTION_INFO
  // 2. payload.overrideExisting = payload.overrideExisting ?? inferOverrideFromText(userText)
  // 3. sendMessageToPlugin(actionQuery, payload)
  // 4. if resp needs confirm (plugin shows prompt) and autoConfirm, re-run with overrideExisting=true
}
```

Security/UX notes:

- Prefer explicit user confirmations in UI before proceeding with automatic override. `autoConfirm` can be used in controlled contexts (e.g., the user explicitly said "Replace it" or a developer-mode operation). Otherwise show a confirm modal when plugin returns the typed prompt.

---

## Add typed prompt payloads and tests for effects

Why:

- Ensure plugin prompt payloads are part of the `PluginResponsePayload` union and are strongly typed.
- Avoid `any` in tests and payloads when possible.

What to implement:

1. Add `ApplyStrokePromptResponsePayload` and `ApplyFillPromptResponsePayload` (if necessary).
2. Update `applyStrokeTool`/`applyFillTool` to use the typed prompt payload and return early when `overrideExisting=false`.
3. Add unit tests for both prompt and override flows.

Implementation checklist & examples:

- Add `ApplyStrokePromptResponsePayload` and `ApplyFillPromptResponsePayload` small interfaces to both `src/types/types.ts` and `src/types/pluginTypes.ts`, then add them to the `PluginResponsePayload` union.

Example:

```ts
export interface ApplyStrokePromptResponsePayload {
  shapesWithExistingStrokes: Array<{ id: string; name?: string }>;
  requestedStroke: {
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity?: number;
    strokeStyle?: string;
  };
}
```

- `applyStrokeTool()` should follow the same pattern as `applyShadowTool()`:

  1.  Get selection using `getSelectionForAction()`.
  2.  If shapes already have `strokes` and `overrideExisting !== true`: return the `ApplyStrokePromptResponsePayload` with `success: false` and a helpful message.
  3.  Otherwise, apply the stroke and return `ApplyStrokeResponsePayload` with `undoInfo`.

- Tests to add (Vitest):
  - Prompt case — penpot selection contains shapes with strokes, `overrideExisting=false` → response success=false and prompt payload with shape ids.
  - Override case — `overrideExisting=true` → stroke applied and response.success true; asserts `undoInfo` and applied strokes.

Migration considerations:

- Keep existing UI unchanged but update function tools to call `GET_SELECTION_INFO` before `APPLY_STROKE` or `APPLY_FILL`. The UI can then display a confirmation dialog when the server returns the typed prompt.
- Avoid changing plugin code that reads the selection — only adjust typed payloads and prompt returns.

Testing matrix (per tool):

- Happy path: no existing styling, apply effect -> success and undoInfo in payload
- Prompt path: existing style, `overrideExisting=false` -> prompt payload and success false
- Override path: `overrideExisting=true` -> apply effect -> success

---

If you'd like, I can implement these typed prompt payloads and tests for `applyStrokeTool` and `applyFillTool` next. They will mirror the `applyShadowTool` implementation and unit tests we already added.

## converting `any` to concrete types

Benefits: converting any to concrete types improves compile-time safety, developer ergonomics (autocompletion), testability and prevents regressions. It won’t require changes to your shared selection system; that stays as-is.
Action: convert any in payloads and tests to narrow types (e.g., ShadowParams, GroupResponse types), add/extend Payload types in src/types, update usage in mainHandlers and tests — incremental and non-disruptive.
Why convert any (concise)

Prevents accidental property misspells and structural mismatches in payloads (TypeScript catches these).
Makes interfaces explicit for UI/agent consumers — they can rely on typed payloads like shapesWithExistingShadows or requestedShadow.
Easier to refactor later — types show intent.
Linter & CI can enforce strictness rather than letting bugs slip into runtime.

## Follow the read-first / act-later pattern

### Summary of the pattern you asked for

- Always check selection with the action-only helper (getSelectionForAction()).
- Detect whether the shapes already have the effect the tool will apply (shadow, stroke, shadow, etc.).
- If any selected shapes already have the effect and the user did not include overrideExisting (or overrideExisting === false):
- Return a typed plugin response that:
  - Sets success: false (so UI doesn't treat it as a mutation).
  - Has a human message describing the prompt.
  - Includes a typed payload such as { shapesWithExistingShadows, requestedShadow } that the UI can use to display the confirmation UI.
  - Do not mutate any shapes.
- If overrideExisting is true, proceed with mutation, push undo info, and return the usual success response with a typed payload that includes undoInfo and the shapes changed.
- UI/agent (assets) — use GET_SELECTION_INFO (readSelectionInfo) to collect a safe, serializable snapshot for display/confirmation (no mutation).
- Plugin actions — use getSelectionForAction (action-only helper) and hasValidSelection when mutating shapes. Always wrap mutations in try/catch and push undo info.

### Why this is safe for the shared-selection system

The pattern primarily affects each tool's behavior and payload types; it does not touch the read-only vs action-only separation or the actionSelection.ts helpers.
All selection access still uses getSelectionForAction() for mutations and readSelectionInfo() for read-only UI requests, so the selection safety pattern remains intact.

## Rotation Edge cases to check for:

- Rotation origin: For groups or nested shapes, rotating the container vs. rotating children may produce different effects. We may need an anchor option.
- Board / Frame behavior: rotating boards may affect view/metadata — I used the same rotate fallback, but validate real Penpot behavior.
- Path geometry: rotating a path object should be fine, but complex shapes with transforms require testing.
- Selection of mixed types (e.g., boards + shapes) — the tool handles both because it tries method+fallback.

---

## Add universal mixed-selection prompt helper

feasible and useful if you scope when to prompt. Doing it globally without constraints risks noisy UX. Make the prompt conditional and keep logic in the UI/agent layer so the plugin remains simple and deterministic.

Suggested pattern (minimal, safe)

Always read first via GET_SELECTION_INFO.
Each tool defines a “conflict detector” — a small pure function that checks the selection snapshot for ambiguous/mixed cases that need a decision (e.g., shapes with existing effect vs. shapes without it).
The UI wrapper calls the detector. If it returns mixed:true it prompts the user with a concise choice (examples below).
Prompt returns an explicit decision that the wrapper converts to the action payload (overrideExisting, applyTo, anchor, etc.).
Record the user choice in the wrapper for the current action so you don’t re-prompt unnecessarily on retry; optionally add a “Remember my choice” toggle.
Where to add code

assets/ — keep this logic in an assets-level helper (not in plugin). Example: src/assets/mixedSelectionUtils.ts and integrate into readThenAct.
Small helper outline — core idea

Read-then-ask wrapper pattern (integration)

Extend readThenAct to:
call GET_SELECTION_INFO
call detectMixedSelection(...) for the passed action
if mixed:
prompt user with short choices (action-specific)
map the user choice to payload overrides (e.g., overrideExisting=true)
call plugin action with final payload
Example integration (simplified)

Prompt wording (best practices)

Be specific and actionable: e.g., "3 of your 5 selected shapes already have a shadow. Do you want to replace those shadows (override) or only add a new shadow to shapes that don't have one?"
Offer “Show instructions to unlock” or “Unlock and retry” for lock issues.
Avoid jargon: “override” is okay if you show consequences; “replace existing shadow” is clearer.
When prompts are harmful

Prompt for very small changes or trivial decisions (e.g., move by 1px) — not needed.
Prompt on low-impact choices — you’ll create friction.
To reduce friction add:
A “remember my answer for this tool during this session” checkbox
A guard: only prompt if mixed selection is >= 2 categories or affects > 0 shapes
Testing plan

Unit tests for each detector function (APPLY_FILL, APPLY_SHADOW, MOVE, LOCK toggle, etc.)
Integration tests for readThenActWithMixedPrompt to ensure:
Mixed selection leads to prompt and correct mapping to payloads.
Cancel results in no patch being sent.
Remember-choice avoids re-prompt.
UX acceptance: ensure messages are helpful for non-technical users.
Summary

Yes: implement universal mixed-selection detection + UI prompt in assets.
Keep it conditional (only when it truly matters).
Keep plugin immutable: plugin still uses getSelectionForAction() and returns typed prompt responses when necessary.
Add tests for detectors and wrapper.
If you want I can:

Implement detectMixedSelection detectors for shadow/fill/stroke/lock/move and wire them into readThenAct.
Add an interactive prompt helper and tests.
Which detectors should I implement first?
