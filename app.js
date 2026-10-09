'use strict';
const STORAGE_KEY = 'short-notes.v1';
const $ = (id) => document.getElementById(id);
let notes = [];
let editingId = null;
let storageHealthy = true;
const status = (message) => { $('status').textContent = message; };

function validNote(note) {
  return note && typeof note.id === 'string' && typeof note.title === 'string'
    && typeof note.body === 'string' && typeof note.updatedAt === 'number'
    && Number.isFinite(note.updatedAt) && !Number.isNaN(new Date(note.updatedAt).getTime());
}
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== null) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validNote)) throw new Error('Invalid notes');
    notes = parsed;
  }
} catch {
  storageHealthy = false;
  status('Saved notes could not be loaded. Changes will stay in memory only; existing storage will not be overwritten.');
}

function persist() {
  if (!storageHealthy) {
    status('Updated in this tab only. Browser storage is unavailable; keep this tab open.');
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    status('Updated in this tab only. Could not save to browser storage; keep this tab open.');
    return false;
  }
}
function resetEditor() {
  editingId = null;
  $('note-form').reset();
  $('editor-heading').textContent = 'New note';
  $('save').textContent = 'Save note ↗';
  $('cancel').hidden = true;
  $('characters').textContent = '0 / 5000';
}
function editNote(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;
  editingId = id;
  $('title').value = note.title;
  $('body').value = note.body;
  $('editor-heading').textContent = 'Edit note';
  $('save').textContent = 'Save changes ↗';
  $('cancel').hidden = false;
  $('characters').textContent = note.body.length + ' / 5000';
  $('title').focus();
}
function deleteNote(id) {
  if (!window.confirm('Delete this note? This cannot be undone.')) return;
  notes = notes.filter((note) => note.id !== id);
  if (editingId === id) resetEditor();
  const saved = persist();
  render();
  $('search').focus();
  if (saved) status('Note deleted.');
}
function render() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const visible = notes.filter((note) => (note.title + ' ' + note.body).toLocaleLowerCase().includes(query));
  const sort = $('sort').value;
  visible.sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) : sort === 'oldest' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt);
  $('notes').replaceChildren();
  $('count').textContent = String(notes.length);
  $('empty').hidden = visible.length !== 0;
  $('empty').querySelector('h3').textContent = query ? 'No matching notes.' : 'Your next idea belongs here.';
  $('empty').querySelector('p').textContent = query ? 'Try another word or clear your search.' : 'Write your first note using the form.';
  for (const note of visible) {
    const card = document.createElement('article');
    card.className = 'note';
    const heading = document.createElement('h3');
    heading.textContent = note.title;
    const body = document.createElement('p');
    body.textContent = note.body;
    const time = document.createElement('time');
    time.dateTime = new Date(note.updatedAt).toISOString();
    time.textContent = 'Updated ' + new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const actions = document.createElement('div');
    actions.className = 'actions';
    for (const [label, action] of [['Edit', editNote], ['Delete', deleteNote]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.setAttribute('aria-label', label + ' note: ' + note.title);
      button.addEventListener('click', () => action(note.id));
      actions.append(button);
    }
    card.append(heading, body, time, actions);
    $('notes').append(card);
  }
}
$('note-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = $('title').value.trim();
  const body = $('body').value.trim();
  if (!title || !body) {
    status('Please enter a title and note text.');
    (!title ? $('title') : $('body')).focus();
    return;
  }
  const now = Date.now();
  if (editingId) {
    notes = notes.map((note) => note.id === editingId ? { ...note, title, body, updatedAt: now } : note);
  } else {
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : now.toString(36) + Math.random().toString(36).slice(2);
    notes.unshift({ id, title, body, updatedAt: now });
  }
  const saved = persist();
  resetEditor();
  render();
  $('title').focus();
  if (saved) status('Note saved on this device.');
});
$('cancel').addEventListener('click', () => { resetEditor(); $('title').focus(); });
$('body').addEventListener('input', () => { $('characters').textContent = $('body').value.length + ' / 5000'; });
$('search').addEventListener('input', render);
$('sort').addEventListener('change', render);
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY || event.key === null) status('Notes changed in another tab. Reload before editing to avoid overwriting those changes.');
});
render();
