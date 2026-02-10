const LIMITS_KEY = 'tbs_tet2026_limits';

interface DailyLimits {
  date: string;
  plays: Record<string, number>;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLimits(): DailyLimits {
  const data = localStorage.getItem(LIMITS_KEY);
  if (data) {
    const parsed: DailyLimits = JSON.parse(data);
    if (parsed.date === getToday()) return parsed;
  }
  return { date: getToday(), plays: {} };
}

function saveLimits(limits: DailyLimits): void {
  localStorage.setItem(LIMITS_KEY, JSON.stringify(limits));
}

export function getPlaysToday(game: string): number {
  const limits = getLimits();
  return limits.plays[game] || 0;
}

export function recordPlay(game: string): void {
  const limits = getLimits();
  limits.plays[game] = (limits.plays[game] || 0) + 1;
  saveLimits(limits);
}

export function canPlay(game: string): boolean {
  return getPlaysToday(game) < getMaxPlays(game);
}

export function getMaxPlays(game: string): number {
  switch (game) {
    case 'boc-que': return 1;
    case 'xin-xam': return 1;
    case 'lac-li-xi': return 10;
    case 'bau-cua': return 15;
    case 'vong-quay': return 15;
    case 'tai-xiu': return 15;
    case 'bai-cao': return 15;
    case 'cung-ong-ba': return 10;
    case 'do-vui-tbs': return 5;
    case 'cao-ve-so': return 8;
    case 'logistics-china': return 5;
    case 'oan-tu-ti': return 15;
    case 'doan-so': return 10;
    case 'xoc-dia': return 15;
    default: return 10;
  }
}

export function getRemainingPlays(game: string): number {
  return Math.max(0, getMaxPlays(game) - getPlaysToday(game));
}
