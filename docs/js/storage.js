// Player save state. One localStorage object, no server, nothing leaves the phone.

// Do not rename this. It carries the old theme's name because it is the key a
// real save already lives under on a real phone — renaming it silently wipes
// that progress. The field names below are the same deal: they're deliberately
// theme-neutral internals, and what a pack *calls* them comes from its
// `vocabulary` block instead.
const MAIN_KEY = 'riverbend.save.v1';

// Which profile is active, and the dev flag, live outside the save — so
// switching profiles can't strand you in one with dev switched off, and so a
// reset can't take the switch away with it.
const APP_KEY = 'riverbend.app.v1';

/** The real player's profile keeps the original key, untouched. */
const keyFor = (profile) => (profile === 'main' ? MAIN_KEY : `riverbend.save.${profile}.v1`);

function appDefaults() {
  return { profile: 'main', dev: false };
}

export function appPrefs() {
  try {
    const raw = localStorage.getItem(APP_KEY);
    if (raw) return { ...appDefaults(), ...JSON.parse(raw) };
    // First load on a build that has profiles: inherit the dev flag from the
    // existing save, so it doesn't have to be switched on a second time.
    const legacy = JSON.parse(localStorage.getItem(MAIN_KEY) || '{}');
    return { ...appDefaults(), dev: Boolean(legacy?.settings?.dev) };
  } catch (err) {
    console.warn('App prefs unreadable, using defaults.', err);
    return appDefaults();
  }
}

export function setAppPrefs(patch) {
  const next = { ...appPrefs(), ...patch };
  try {
    localStorage.setItem(APP_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('Could not write app prefs.', err);
  }
  return next;
}

export const activeProfile = () => appPrefs().profile;

/** True when running in a throwaway profile rather than the real player's. */
export const isTestProfile = () => activeProfile() !== 'main';

function defaults() {
  return {
    version: 1,
    // Supplies are the only currency, and they are only ever spent on the base.
    supplies: 0,
    // structures: { waterTower: 2 }  -> stage index reached
    structures: {},
    // gear is story-granted, never bought: ['headlamp', 'backpack']
    gear: [],
    // progress: { sunnyside: { completed: ['ch01'] } }
    progress: {},
    // one entry per finished run, newest last
    history: [],
    settings: { dev: false, speed: 1 }
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(keyFor(activeProfile()));
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    // Shallow-merge onto defaults so a save written by an older build still boots.
    return { ...defaults(), ...parsed, settings: { ...defaults().settings, ...(parsed.settings || {}) } };
  } catch (err) {
    console.warn('Save file unreadable, starting fresh.', err);
    return defaults();
  }
}

export function save(state) {
  try {
    localStorage.setItem(keyFor(activeProfile()), JSON.stringify(state));
  } catch (err) {
    // Private browsing, full storage, etc. The run itself still works.
    console.warn('Could not write save file.', err);
  }
  return state;
}

export function update(fn) {
  const state = load();
  fn(state);
  return save(state);
}

/** Wipes the ACTIVE profile only — never the one you aren't looking at. */
export function reset() {
  try {
    localStorage.removeItem(keyFor(activeProfile()));
  } catch (err) {
    console.warn('Could not clear save file.', err);
  }
  return defaults();
}

export function completedChapters(state, packId) {
  return state.progress?.[packId]?.completed ?? [];
}

/** First chapter in the pack that hasn't been finished yet, or the last one if all are done. */
export function nextChapter(state, pack) {
  const done = completedChapters(state, pack.id);
  return pack.chapters.find((ch) => !done.includes(ch.id)) ?? pack.chapters[pack.chapters.length - 1];
}

/**
 * Credits whatever was collected. A run ended early still keeps its supplies —
 * a six-year-old who needs to stop shouldn't lose the things he found — but the
 * chapter only counts as finished when `complete` is true.
 */
export function recordRun(packId, chapterId, { supplies, gear, seconds, complete }) {
  return update((state) => {
    const progress = (state.progress[packId] ??= { completed: [] });
    if (complete && !progress.completed.includes(chapterId)) progress.completed.push(chapterId);

    state.supplies += supplies;
    for (const item of gear) if (!state.gear.includes(item)) state.gear.push(item);
    state.history.push({ packId, chapterId, supplies, gear, seconds, complete, at: Date.now() });
  });
}
