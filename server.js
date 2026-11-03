const express = require('express'), http = require('http'), path = require('path');
const { Server } = require('socket.io');
const app = express(), srv = http.createServer(app), io = new Server(srv);
const PW = process.env.HOST_PASSWORD || '';
const pub = f => path.join(__dirname, 'public', f);
app.use(express.static(pub('')));
app.get('/host', (q, r) => r.sendFile(pub('host.html')));
app.get('/display/:pin', (q, r) => r.sendFile(pub('display.html')));
app.get('/api/config', (q, r) => r.json({ needPassword: !!PW }));

const games = {};
const rnd = () => Math.random().toString(36).slice(2, 12);
const newPin = () => { let p; do p = String(100000 + Math.floor(Math.random() * 900000)); while (games[p]); return p; };
const ranked = g => [...g.players.values()].sort((a, b) => b.score - a.score)
  .map((p, i) => ({ id: p.id, name: p.name, score: p.score, rank: i + 1 }));

function view(g, role, pid) {
  const n = g.quiz.questions.length, q = g.quiz.questions[g.q];
  const v = { pin: g.pin, phase: g.phase, title: g.quiz.title, q: g.q, total: n, count: g.players.size };
  if (role !== 'player') v.players = [...g.players.values()].map(p => p.name);
  if (q && (g.phase === 'question' || g.phase === 'reveal')) {
    v.options = q.options.length; v.answered = g.answers.size;
    if (role !== 'player') { v.text = q.text; v.labels = q.options; }
    if (g.phase === 'question') {
      v.left = Math.max(0, g.end - Date.now());
      if (role === 'player') v.mine = g.answers.has(pid) ? g.answers.get(pid).c : null;
    } else {
      v.correct = q.correct;
      v.dist = q.options.map((_, i) => [...g.answers.values()].filter(a => a.c === i).length);
      v.top = ranked(g).slice(0, 5);
      if (role === 'player') { const p = g.players.get(pid); if (p) v.me = { ...p.last, score: p.score, rank: ranked(g).find(r => r.id === pid).rank }; }
    }
  }
  if (g.phase === 'final') {
    v.top = ranked(g).slice(0, 10);
    if (role === 'player') v.me = ranked(g).find(r => r.id === pid);
  }
  return v;
}
function push(g) {
  io.to(g.pin + ':h').emit('s', view(g, 'host'));
  io.to(g.pin + ':d').emit('s', view(g, 'display'));
  for (const p of g.players.values()) if (p.sid) io.to(p.sid).emit('s', view(g, 'player', p.id));
}
function startQ(g) {
  const q = g.quiz.questions[g.q];
  g.phase = 'question'; g.answers = new Map(); g.start = Date.now(); g.end = g.start + q.time * 1000;
  clearTimeout(g.t); g.t = setTimeout(() => reveal(g), q.time * 1000); push(g);
}
function reveal(g) {
  if (g.phase !== 'question') return;
  clearTimeout(g.t); g.phase = 'reveal';
  const q = g.quiz.questions[g.q];
  for (const p of g.players.values()) {
    const a = g.answers.get(p.id), ok = !!a && a.c === q.correct; let pts = 0;
    if (ok) {
      p.streak++;
      pts = Math.round(1000 * (1 - Math.min(1, a.ms / (q.time * 1000)) / 2)) * (q.double ? 2 : 1) + Math.min(p.streak - 1, 5) * 50;
    } else p.streak = 0;
    p.score += pts; p.last = { ok, pts, streak: p.streak, picked: a ? a.c : null };
  }
  push(g);
}
function next(g) {
  if (g.phase === 'lobby' || g.phase === 'reveal') {
    if (g.q + 1 < g.quiz.questions.length) { g.q++; startQ(g); } else { g.phase = 'final'; push(g); }
  } else if (g.phase === 'question') reveal(g);
}
const cleanQuiz = d => {
  const qs = (d && d.questions || []).slice(0, 100).map(q => {
    const n = Math.min(4, Math.max(2, (q.options || []).length));
    return { text: String(q.text || '').slice(0, 300), options: Array.from({ length: n }, (_, i) => String((q.options || [])[i] || '').slice(0, 100)),
      correct: Math.min(n - 1, Math.max(0, q.correct | 0)), time: Math.min(120, Math.max(5, q.time | 0 || 20)), double: !!q.double };
  });
  return qs.length ? { title: String(d.title || 'Untitled quiz').slice(0, 80), questions: qs } : null;
};

io.on('connection', s => {
  const G = () => games[s.data.pin];
  s.on('host:create', (d, ack) => {
    if (PW && d.pw !== PW) return ack({ err: 'Wrong host password' });
    const quiz = cleanQuiz(d.quiz); if (!quiz) return ack({ err: 'Add at least one question' });
    const g = { pin: newPin(), key: rnd(), quiz, players: new Map(), phase: 'lobby', q: -1, answers: new Map(), made: Date.now() };
    games[g.pin] = g; s.join(g.pin + ':h'); s.data = { pin: g.pin, role: 'h' }; ack({ pin: g.pin, key: g.key }); push(g);
  });
  s.on('host:resume', (d, ack) => {
    const g = games[d.pin]; if (!g || g.key !== d.key) return ack({ err: 1 });
    s.join(g.pin + ':h'); s.data = { pin: g.pin, role: 'h' }; ack({ ok: 1 }); s.emit('s', view(g, 'host'));
  });
  s.on('host:next', () => { const g = G(); if (g && s.data.role === 'h') next(g); });
  s.on('display:join', (pin, ack) => {
    const g = games[pin]; if (!g) return ack({ err: 1 });
    s.join(pin + ':d'); ack({ ok: 1 }); s.emit('s', view(g, 'display'));
  });
  s.on('player:join', (d, ack) => {
    const g = games[d.pin]; if (!g) return ack({ err: 'Game not found. Check the PIN.' });
    let p = d.id && g.players.get(d.id);
    if (!p) {
      const name = String(d.name || '').trim().slice(0, 16);
      if (g.phase !== 'lobby') return ack({ err: 'This game has already started.' });
      if (!name) return ack({ err: 'Enter a nickname.' });
      if ([...g.players.values()].some(x => x.name.toLowerCase() === name.toLowerCase())) return ack({ err: 'That nickname is taken.' });
      p = { id: rnd(), name, score: 0, streak: 0, last: null }; g.players.set(p.id, p);
    }
    p.sid = s.id; s.data = { pin: g.pin, role: 'p', id: p.id }; ack({ id: p.id, name: p.name }); push(g);
  });
  s.on('player:answer', c => {
    const g = G(); if (!g || s.data.role !== 'p' || g.phase !== 'question') return;
    const q = g.quiz.questions[g.q];
    if (g.answers.has(s.data.id) || !Number.isInteger(c) || c < 0 || c >= q.options.length) return;
    g.answers.set(s.data.id, { c, ms: Date.now() - g.start });
    if (g.answers.size >= [...g.players.values()].filter(p => p.sid).length) reveal(g); else push(g);
  });
  s.on('disconnect', () => {
    const g = G(); if (!g || s.data.role !== 'p') return;
    const p = g.players.get(s.data.id); if (p && p.sid === s.id) p.sid = null;
  });
});
setInterval(() => { for (const k in games) if (Date.now() - games[k].made > 8 * 36e5) delete games[k]; }, 6e5);
srv.listen(process.env.PORT || 3000, () => console.log('Buzzin running on :' + (process.env.PORT || 3000)));
