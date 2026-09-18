# Design notes: plants in the story

Not built. This is the shape agreed in conversation on 2026-09-18, written down so it
isn't living in a chat log. Decisions here are settled; the open questions at the bottom
are not.

## The idea

Plants stop being a picture of progress and become part of the run. Each one is unlocked
by the story, used *during* a run, and the story reacts to whether it was used.

The progression is a chain: chapter N's story sets up a problem, hints at the plant that
solves it, and chapter N+1 is built around having it. Later chapters want combinations.

## Settled

| Decision | Choice |
| --- | --- |
| What using a plant does | **Changes what happens in the fiction** — Ruby narrates the encounter differently |
| Scarcity | **One use per plant per run** |
| Chapter gating | **Hard gate** — the chapter needs its plant |
| Sunbud | Keeps a passive: more sun per run |

## How reactive fiction survives the single-track design

A chapter is one pre-stitched mp3. That is what keeps the story playing when the phone
locks and goes in a pocket, and it is not negotiable — see `CLAUDE.md`.

A choice that changes the narration seems to break it. It doesn't, if the branches live
**inside the same file**:

```
[ ...run... ][ A: used the plant ][ B: outran it ][ ...run... ]
                     ^ branch point: seek past whichever wasn't chosen
```

At the branch point the app assigns `currentTime` to skip the unused variant. That is
the same mechanism `skipInterval()` already uses — an already-playing, already-cached
element, no reload, and crucially no fresh `play()` call for iOS to refuse while
backgrounded.

What this costs:

- **The track is longer than the workout.** The invariant "track length == workout
  length" becomes "track length == workout + unused variants", and
  `TrackPlayback.time()` has to subtract what it skipped rather than returning
  `currentTime` directly.
- **The build script** needs to lay out variant blocks and record their in/out points in
  the timeline file, alongside the beat offsets it already resolves.
- **The choice has to close before the branch point.** The window opens at a walk break
  and auto-resolves to a default if untapped, so a run never blocks on a six-year-old
  who is busy running.

### Must be proven on a real phone first

Neither of these can be checked from a Linux container, and both are load-bearing:

1. **Seeking while backgrounded.** Does assigning `currentTime` on a locked, pocketed
   iPhone actually work, reliably, mid-chapter?
2. **The seam.** Is the jump audible? A hard cut between two takes of Ruby may need a
   beat of silence either side of every variant.

If (1) fails, the fallback is a **pre-run** choice — picked on the chapter card before
starting, loading one of two whole tracks. Safe, no seeking, and arguably better suited
to a six-year-old who can think about it at the front door rather than gasping at minute
nine. It loses the in-the-moment decision, which is the part worth fighting for first.

## The hard gate needs a solvable economy

A hard gate means the lawn is on the critical path: no Frostberry, no chapter 3. That is
the point — it makes sun matter and the garden essential. It also means being short of
sun is a dead end, which is unacceptable when the thing behind the gate is the story he
actually wants.

**So gate on the plant's first stage, not full maturity.** Stage 1 costs 3 sun; a chapter
pays 7. One chapter always affords the next gate, with change. Full maturity stays as the
optional upgrade that makes the power stronger.

This has to hold for every chapter as they're authored — it is a constraint on the
content, not something the code can enforce for you.

## Open

- **What each plant actually does in the fiction.** Frostberry slows them; Old Acorn
  blocks a path; Thumper clears one. Needs writing alongside the chapters, not before.
- **How the choice is offered on screen.** One card, two big icons, at a walk break —
  but whether the "don't use it" option is a visible button or just letting the timer run
  out changes how it feels.
- **Combinations.** Agreed as a direction for later chapters; no mechanism yet.
- **The Sunbud passive number.** +1 sun a run is a guess.

## Still true from before

Two things found on 2026-09-18 that this design should fix rather than inherit:

- **Replaying a finished chapter pays full sun, every time.** Three replays of chapter 1
  gives 21 sun, enough for half the lawn. More chapters is the real fix; a reduced replay
  payout and a card that admits it's a replay is the rest.
- **Grown plants currently do nothing.** That is the hole this whole design fills.
