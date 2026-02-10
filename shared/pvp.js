// ============ PvP Oẳn Tù Tì — Shared Logic ============
// Used by both server/index.js (local dev) and api/index.js (Vercel)

const pvpRooms = new Map();
const ROOM_TTL = 30 * 60 * 1000; // 30 minutes
const REVEAL_DURATION = 3500; // 3.5s before auto-advance

function cleanupRooms() {
  const now = Date.now();
  for (const [code, room] of pvpRooms) {
    if (now - room.createdAt > ROOM_TTL) pvpRooms.delete(code);
  }
}

function generateRoomCode() {
  let code;
  do {
    code = String(1000 + Math.floor(Math.random() * 9000));
  } while (pvpRooms.has(code));
  return code;
}

function getWinner(p1, p2) {
  if (p1 === p2) return 'draw';
  if (
    (p1 === 'keo' && p2 === 'bao') ||
    (p1 === 'bua' && p2 === 'keo') ||
    (p1 === 'bao' && p2 === 'bua')
  ) return 'p1';
  return 'p2';
}

function autoAdvanceIfNeeded(room) {
  if (room.status === 'reveal' && room.revealAt && Date.now() - room.revealAt >= REVEAL_DURATION) {
    room.round++;
    room.players[0].choice = null;
    room.players[1].choice = null;
    room.status = 'choosing';
    room.revealAt = null;
  }
}

function sanitizeRoom(room, playerId) {
  autoAdvanceIfNeeded(room);
  const myIndex = room.players.findIndex(p => p.id === playerId);

  return {
    code: room.code,
    status: room.status,
    round: room.round,
    scores: room.scores,
    players: room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      hasChosen: !!p.choice,
      choice: (room.status === 'reveal' || room.status === 'finished') ? p.choice : (i === myIndex ? p.choice : null),
    })),
    myIndex,
    lastResult: room.lastResult,
    winner: room.winner,
    createdAt: room.createdAt,
  };
}

function registerPvpRoutes(app, sanitizeString) {
  app.post('/api/pvp/create', (req, res) => {
    cleanupRooms();
    const playerId = sanitizeString(req.body.playerId, 50);
    const playerName = sanitizeString(req.body.playerName, 50);
    if (!playerId || !playerName) return res.status(400).json({ error: 'Thiếu thông tin' });

    const code = generateRoomCode();
    const room = {
      code,
      players: [{ id: playerId, name: playerName, choice: null }],
      scores: [0, 0],
      round: 1,
      status: 'waiting',
      lastResult: null,
      winner: null,
      revealAt: null,
      createdAt: Date.now(),
    };
    pvpRooms.set(code, room);
    res.json({ code, room: sanitizeRoom(room, playerId) });
  });

  app.post('/api/pvp/join', (req, res) => {
    const code = sanitizeString(req.body.code, 4);
    const playerId = sanitizeString(req.body.playerId, 50);
    const playerName = sanitizeString(req.body.playerName, 50);
    if (!code || !playerId || !playerName) return res.status(400).json({ error: 'Thiếu thông tin' });

    const room = pvpRooms.get(code);
    if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Phòng đã bắt đầu' });
    if (room.players.length >= 2) return res.status(400).json({ error: 'Phòng đã đầy' });
    if (room.players[0].id === playerId) return res.status(400).json({ error: 'Không thể tự chơi với chính mình' });

    room.players.push({ id: playerId, name: playerName, choice: null });
    room.status = 'choosing';
    res.json({ room: sanitizeRoom(room, playerId) });
  });

  app.post('/api/pvp/move', (req, res) => {
    const code = sanitizeString(req.body.code, 4);
    const playerId = sanitizeString(req.body.playerId, 50);
    const choice = sanitizeString(req.body.choice, 10);
    if (!code || !playerId || !choice) return res.status(400).json({ error: 'Thiếu thông tin' });
    if (!['keo', 'bua', 'bao'].includes(choice)) return res.status(400).json({ error: 'Lựa chọn không hợp lệ' });

    const room = pvpRooms.get(code);
    if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    autoAdvanceIfNeeded(room);
    if (room.status !== 'choosing') return res.status(400).json({ error: 'Chưa đến lượt chọn' });

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return res.status(403).json({ error: 'Bạn không trong phòng này' });
    if (room.players[playerIndex].choice) return res.status(400).json({ error: 'Bạn đã chọn rồi' });

    room.players[playerIndex].choice = choice;

    if (room.players[0].choice && room.players[1].choice) {
      const result = getWinner(room.players[0].choice, room.players[1].choice);
      if (result === 'p1') room.scores[0]++;
      else if (result === 'p2') room.scores[1]++;

      room.lastResult = {
        choices: [room.players[0].choice, room.players[1].choice],
        result,
        round: room.round,
      };

      if (room.scores[0] >= 3 || room.scores[1] >= 3) {
        room.status = 'finished';
        room.winner = room.scores[0] >= 3 ? 0 : 1;
      } else {
        room.status = 'reveal';
        room.revealAt = Date.now();
      }
    }

    res.json({ room: sanitizeRoom(room, playerId) });
  });

  app.get('/api/pvp/room/:code', (req, res) => {
    const { code } = req.params;
    const playerId = req.query.playerId;
    if (!playerId) return res.status(400).json({ error: 'Thiếu playerId' });

    const room = pvpRooms.get(code);
    if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return res.status(403).json({ error: 'Bạn không trong phòng này' });

    res.json({ room: sanitizeRoom(room, playerId) });
  });

  app.post('/api/pvp/leave', (req, res) => {
    const code = sanitizeString(req.body.code, 4);
    const playerId = sanitizeString(req.body.playerId, 50);
    const room = pvpRooms.get(code);
    if (room) {
      if (room.status !== 'finished' && room.players.length === 2) {
        const leaverIndex = room.players.findIndex(p => p.id === playerId);
        if (leaverIndex !== -1) {
          room.status = 'finished';
          room.winner = leaverIndex === 0 ? 1 : 0;
        }
      } else {
        pvpRooms.delete(code);
      }
    }
    res.json({ success: true });
  });
}

export { registerPvpRoutes, cleanupRooms };
