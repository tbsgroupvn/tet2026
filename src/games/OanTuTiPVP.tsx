import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player } from '../types';
import { addCoins } from '../utils/storage';
import { playWin, playLose, playClick } from '../utils/sounds';
import GameRules from '../components/GameRules';
import CultureTipCard from '../components/CultureTipCard';

const RULES = [
  'Tạo phòng hoặc nhập mã phòng để chơi với đồng nghiệp.',
  'Cả 2 người cùng chọn Kéo ✌️, Búa ✊ hoặc Bao ✋.',
  'Khi cả 2 đã chọn, kết quả sẽ hiện ra.',
  'Best of 5 — ai thắng 3 hiệp trước thì thắng ván!',
  'Thắng ván: +25 xu. Thua: -5 xu. Sweep 3-0: +35 xu!',
];

interface Props {
  player: Player;
  onUpdate: (player: Player) => void;
  onBack: () => void;
}

type Choice = 'keo' | 'bua' | 'bao';

const CHOICES: { id: Choice; emoji: string; name: string }[] = [
  { id: 'keo', emoji: '✌️', name: 'Kéo' },
  { id: 'bua', emoji: '✊', name: 'Búa' },
  { id: 'bao', emoji: '✋', name: 'Bao' },
];

interface RoomPlayer {
  id: string;
  name: string;
  hasChosen: boolean;
  choice: Choice | null;
}

interface RoomState {
  code: string;
  status: 'waiting' | 'choosing' | 'reveal' | 'finished';
  round: number;
  scores: [number, number];
  players: RoomPlayer[];
  myIndex: number;
  lastResult: {
    choices: [Choice, Choice];
    result: 'p1' | 'p2' | 'draw';
    round: number;
  } | null;
  winner: number | null;
}

const API_BASE = '/api/pvp';

async function apiCall(path: string, options?: RequestInit) {
  const token = localStorage.getItem('tbs_access_token') || '';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi kết nối');
  return data;
}

export default function OanTuTiPVP({ player, onUpdate, onBack }: Props) {
  const [phase, setPhase] = useState<'menu' | 'waiting' | 'playing' | 'finished'>('menu');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomCodeRef = useRef<string>('');

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback((code: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    roomCodeRef.current = code;
    pollingRef.current = setInterval(async () => {
      try {
        const data = await apiCall(`/room/${code}?playerId=${player.id}`);
        setRoom(data.room);

        // Update phase based on room status
        if (data.room.status === 'waiting') setPhase('waiting');
        else if (data.room.status === 'finished') {
          setPhase('finished');
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else {
          setPhase('playing');
        }
      } catch {
        // Room might have been deleted
      }
    }, 1500);
  }, [player.id]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/create', {
        method: 'POST',
        body: JSON.stringify({ playerId: player.id, playerName: player.name }),
      });
      setRoom(data.room);
      setPhase('waiting');
      startPolling(data.code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi tạo phòng');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode || joinCode.length !== 4) {
      setError('Mã phòng phải có 4 chữ số');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode, playerId: player.id, playerName: player.name }),
      });
      setRoom(data.room);
      setPhase('playing');
      startPolling(joinCode);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi vào phòng');
    }
    setLoading(false);
  };

  const handleChoice = async (choice: Choice) => {
    if (!room || room.status !== 'choosing') return;
    const me = room.players[room.myIndex];
    if (me.hasChosen) return;

    playClick();
    try {
      const data = await apiCall('/move', {
        method: 'POST',
        body: JSON.stringify({ code: room.code, playerId: player.id, choice }),
      });
      setRoom(data.room);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi gửi lựa chọn');
    }
  };

  const handleLeave = async () => {
    if (room) {
      try {
        await apiCall('/leave', {
          method: 'POST',
          body: JSON.stringify({ code: room.code, playerId: player.id }),
        });
      } catch { /* ignore */ }
    }
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setRoom(null);
    setPhase('menu');
    setRewarded(false);
  };

  // Process rewards when match finishes
  useEffect(() => {
    if (phase === 'finished' && room && !rewarded) {
      setRewarded(true);
      const iWon = room.winner === room.myIndex;
      const myScore = room.scores[room.myIndex];
      const opScore = room.scores[room.myIndex === 0 ? 1 : 0];
      const sweep = iWon && opScore === 0;

      if (iWon) {
        playWin();
        const coins = sweep ? 35 : 25;
        const updated = addCoins(player, coins, 'Oẳn Tù Tì PvP', `Thắng ${myScore}-${opScore}${sweep ? ' (Sweep!)' : ''} → +${coins} xu`);
        onUpdate(updated);
      } else {
        playLose();
        const updated = addCoins(player, -5, 'Oẳn Tù Tì PvP', `Thua ${myScore}-${opScore} → -5 xu`);
        onUpdate(updated);
      }
    }
  }, [phase, room, rewarded, player, onUpdate]);

  const choiceEmoji = (c: Choice | null) => CHOICES.find(x => x.id === c)?.emoji || '❓';
  const choiceName = (c: Choice | null) => CHOICES.find(x => x.id === c)?.name || '?';

  const opponent = room ? room.players[room.myIndex === 0 ? 1 : 0] : null;
  const me = room ? room.players[room.myIndex] : null;

  return (
    <div className="game-page oan-tu-ti-pvp">
      <button className="back-btn" onClick={phase === 'menu' ? onBack : handleLeave}>
        ← {phase === 'menu' ? 'Quay Lại' : 'Rời Phòng'}
      </button>
      <div className="game-content">
        <h2>✊ Oẳn Tù Tì — 2 Người</h2>
        <p className="game-instruction">Đấu trực tiếp với đồng nghiệp trên 2 máy!</p>
        <GameRules rules={RULES} />

        {error && <div className="pvp-error">{error}</div>}

        {/* MENU: Create or Join */}
        {phase === 'menu' && (
          <div className="pvp-menu">
            <div className="pvp-menu-section">
              <h3>Tạo Phòng Mới</h3>
              <p>Tạo phòng và chia sẻ mã cho đồng nghiệp</p>
              <button className="pvp-btn create" onClick={handleCreate} disabled={loading}>
                {loading ? '⏳ Đang tạo...' : '🏠 Tạo Phòng'}
              </button>
            </div>
            <div className="pvp-divider">hoặc</div>
            <div className="pvp-menu-section">
              <h3>Vào Phòng</h3>
              <p>Nhập mã 4 số từ đồng nghiệp</p>
              <div className="pvp-join-input">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Mã phòng"
                  className="pvp-code-input"
                />
                <button className="pvp-btn join" onClick={handleJoin} disabled={loading || joinCode.length !== 4}>
                  {loading ? '⏳...' : '🚪 Vào'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WAITING: Room created, waiting for opponent */}
        {phase === 'waiting' && room && (
          <div className="pvp-waiting">
            <div className="pvp-room-code">
              <span className="pvp-room-label">Mã Phòng:</span>
              <span className="pvp-room-number">{room.code}</span>
            </div>
            <p className="pvp-waiting-text">Chia sẻ mã phòng cho đồng nghiệp để bắt đầu!</p>
            <div className="pvp-waiting-anim">
              <span className="pvp-waiting-dot">.</span>
              <span className="pvp-waiting-dot">.</span>
              <span className="pvp-waiting-dot">.</span>
            </div>
            <p className="pvp-waiting-hint">Đang chờ đối thủ vào phòng...</p>
          </div>
        )}

        {/* PLAYING: Game in progress */}
        {(phase === 'playing' || phase === 'finished') && room && me && opponent && (
          <div className="pvp-game">
            {/* Scoreboard */}
            <div className="ott-scoreboard">
              <span className="ott-score you">{me.name}: {room.scores[room.myIndex]}</span>
              <span className="ott-vs">VS</span>
              <span className="ott-score cpu">{opponent.name}: {room.scores[room.myIndex === 0 ? 1 : 0]}</span>
            </div>

            <div className="pvp-round-info">Hiệp {room.round} / Best of 5</div>

            {/* Show last round result */}
            {room.lastResult && (room.status === 'reveal' || room.status === 'finished') && (
              <div className="ott-last-play">
                <div className="ott-play-hands">
                  <div className="ott-hand">
                    <span className="ott-hand-emoji">{choiceEmoji(room.lastResult.choices[room.myIndex])}</span>
                    <span className="ott-hand-label">Bạn ({choiceName(room.lastResult.choices[room.myIndex])})</span>
                  </div>
                  <span className="ott-play-vs">⚡</span>
                  <div className="ott-hand">
                    <span className="ott-hand-emoji">{choiceEmoji(room.lastResult.choices[room.myIndex === 0 ? 1 : 0])}</span>
                    <span className="ott-hand-label">{opponent.name} ({choiceName(room.lastResult.choices[room.myIndex === 0 ? 1 : 0])})</span>
                  </div>
                </div>
                <span className={`ott-play-result ${
                  room.lastResult.result === 'draw' ? 'draw' :
                  (room.lastResult.result === 'p1' && room.myIndex === 0) || (room.lastResult.result === 'p2' && room.myIndex === 1) ? 'win' : 'lose'
                }`}>
                  {room.lastResult.result === 'draw' ? 'Hòa!' :
                   (room.lastResult.result === 'p1' && room.myIndex === 0) || (room.lastResult.result === 'p2' && room.myIndex === 1) ? 'Thắng!' : 'Thua!'}
                </span>
              </div>
            )}

            {/* Choosing phase */}
            {room.status === 'choosing' && (
              <>
                {me.hasChosen ? (
                  <div className="pvp-status-box">
                    <p>Bạn đã chọn <strong>{choiceEmoji(me.choice)}</strong>. Đang chờ {opponent.name}...</p>
                    <div className="pvp-waiting-anim">
                      <span className="pvp-waiting-dot">.</span>
                      <span className="pvp-waiting-dot">.</span>
                      <span className="pvp-waiting-dot">.</span>
                    </div>
                  </div>
                ) : (
                  <div className="ott-choices">
                    {CHOICES.map(c => (
                      <button
                        key={c.id}
                        className="ott-choice-btn"
                        onClick={() => handleChoice(c.id)}
                      >
                        <span className="ott-choice-emoji">{c.emoji}</span>
                        <span className="ott-choice-name">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {opponent.hasChosen && !me.hasChosen && (
                  <div className="pvp-opponent-ready">{opponent.name} đã chọn! Lượt bạn!</div>
                )}
              </>
            )}

            {/* Reveal phase */}
            {room.status === 'reveal' && (
              <div className="pvp-status-box">
                <p>Chuẩn bị hiệp tiếp theo...</p>
              </div>
            )}

            {/* Match finished */}
            {room.status === 'finished' && room.winner !== null && (
              <>
                <div className={`ott-match-result ${room.winner === room.myIndex ? 'win' : 'lose'}`}>
                  <span className="ott-match-icon">{room.winner === room.myIndex ? '🎉' : '😅'}</span>
                  <span>
                    {room.winner === room.myIndex
                      ? `Thắng ván ${room.scores[room.myIndex]}-${room.scores[room.myIndex === 0 ? 1 : 0]}! ${room.scores[room.myIndex === 0 ? 1 : 0] === 0 ? '🔥 Sweep!' : ''}`
                      : `Thua ván ${room.scores[room.myIndex]}-${room.scores[room.myIndex === 0 ? 1 : 0]}`}
                  </span>
                </div>
                <CultureTipCard />
                <button className="bq-again-btn" onClick={handleLeave}>
                  🏠 Về Menu
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
