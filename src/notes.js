// What Fadil actually did, captured as it happens.
//
// The library posts are evergreen and safe, but they are not *news* — they can't say
// "I walked three shops in Deira and one said come back Tuesday", because nothing in
// this repo knows that happened. This module is the missing input: anything typed or
// spoken to the Telegram bot that isn't a /command gets banked here, and the weekly
// digest writes from these notes instead of from the library.
//
// Voice notes are transcribed with Groq Whisper, which is on the same free key the
// engine already uses, so a note costs fifteen seconds of talking and no typing.
import { CONFIG } from "./config.js";

const MAX_NOTES = 400; // keep the state file small; older notes are dropped

export function addNote(state, text, source = "text") {
  const clean = String(text || "").trim();
  if (!clean) return null;
  if (!Array.isArray(state.notes)) state.notes = [];
  const note = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    at: new Date().toISOString(),
    text: clean.slice(0, 2000),
    source, // "text" | "voice"
    usedIn: null, // post id, once a digest has drawn on it
  };
  state.notes.unshift(note);
  if (state.notes.length > MAX_NOTES) state.notes.length = MAX_NOTES;
  return note;
}

// Notes from the last `days` that no digest has used yet. Newest first.
export function unusedNotes(state, days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return (state.notes || []).filter(
    (n) => !n.usedIn && new Date(n.at).getTime() >= cutoff
  );
}

export function markNotesUsed(state, notes, postId) {
  const ids = new Set(notes.map((n) => n.id));
  for (const n of state.notes || []) {
    if (ids.has(n.id)) n.usedIn = postId;
  }
}

// Telegram hands us a file_id; getFile turns that into a path we can download.
async function downloadVoice(fileId) {
  const base = `https://api.telegram.org/bot${CONFIG.telegram.token}`;
  const meta = await fetch(`${base}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!meta.ok) throw new Error(`getFile ${meta.status}`);
  const { result } = await meta.json();
  if (!result?.file_path) throw new Error("no file_path");
  const bin = await fetch(
    `https://api.telegram.org/file/bot${CONFIG.telegram.token}/${result.file_path}`
  );
  if (!bin.ok) throw new Error(`download ${bin.status}`);
  return Buffer.from(await bin.arrayBuffer());
}

// Is this transcript usable here at all?
//
// NO language hint is sent on purpose. English scores 100% unhinted, so there is nothing
// to win, and a wrong hint actively harms - it tells the transcriber to spell an English
// speaker's words in another alphabet. See the measurements in the platform work.
//
// But Groq CANNOT transcribe Malayalam - 15%, hint or no hint - and Groq is the only
// provider on this key. The failure is not a garbled word here and there: the words come
// back correct in the WRONG SCRIPT. Confidence will not catch it, because a completely
// wrong transcript scores as high as a right one. The alphabet is the only tell.
//
// These notes exist solely to write English LinkedIn posts, so a non-Latin transcript is
// unusable by definition. Refuse it. Banking it would put a sentence Fadil never said
// into the material the digest writes from, which is the one thing this engine must not do.
export function usableTranscript(text) {
  const letters = [...String(text || "")].filter((ch) => /\p{L}/u.test(ch));
  if (!letters.length) return false; // no letters at all - nothing was said
  const latin = letters.filter((ch) => /\p{Script=Latin}/u.test(ch)).length;
  return latin / letters.length >= 0.8; // a stray loanword is fine; a whole script is not
}

// Groq Whisper. Returns null rather than throwing: a failed transcription should cost
// the note, not the whole run.
export async function transcribeVoice(fileId) {
  if (!CONFIG.groq.key) {
    console.warn("[notes] voice note received but no GROQ_API_KEY — cannot transcribe");
    return null;
  }
  try {
    const audio = await downloadVoice(fileId);
    const form = new FormData();
    form.append("file", new Blob([audio], { type: "audio/ogg" }), "note.ogg");
    form.append("model", process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo");
    form.append("response_format", "text");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${CONFIG.groq.key}` },
      body: form,
    });
    if (!r.ok) {
      console.warn("[notes] whisper failed", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    return (await r.text()).trim() || null;
  } catch (e) {
    console.warn("[notes] voice transcription error:", e.message);
    return null;
  }
}

export function notesSummary(state, days = 7) {
  const notes = unusedNotes(state, days);
  if (!notes.length) return `No unused notes in the last ${days} days.`;
  const lines = notes
    .slice(0, 15)
    .map((n) => `• <i>${n.at.slice(5, 10)}</i> ${n.text.slice(0, 120)}`);
  return [`<b>${notes.length} note(s)</b> banked, last ${days} days:`, ...lines].join("\n");
}
