import type { Reward } from '../types';

export const REWARDS: Reward[] = [
  {
    id: 'tien-5k',
    name: '5,000đ',
    description: 'Thưởng tiền mặt 5,000đ',
    coinCost: 50,
    image: '🧧',
    tier: 'bronze',
  },
  {
    id: 'tien-10k',
    name: '10,000đ',
    description: 'Thưởng tiền mặt 10,000đ',
    coinCost: 100,
    image: '🧧',
    tier: 'bronze',
  },
  {
    id: 'tien-20k',
    name: '20,000đ',
    description: 'Thưởng tiền mặt 20,000đ',
    coinCost: 200,
    image: '💵',
    tier: 'silver',
  },
  {
    id: 'tien-50k',
    name: '50,000đ',
    description: 'Thưởng tiền mặt 50,000đ',
    coinCost: 400,
    image: '💵',
    tier: 'silver',
  },
  {
    id: 'tien-100k',
    name: '100,000đ',
    description: 'Thưởng tiền mặt 100,000đ',
    coinCost: 700,
    image: '💰',
    tier: 'gold',
  },
  {
    id: 'tien-200k',
    name: '200,000đ',
    description: 'Thưởng tiền mặt 200,000đ',
    coinCost: 1200,
    image: '💰',
    tier: 'gold',
  },
  {
    id: 'tien-500k',
    name: '500,000đ',
    description: 'Thưởng tiền mặt 500,000đ',
    coinCost: 2500,
    image: '💎',
    tier: 'diamond',
  },
];

export function getTierColor(tier: Reward['tier']): string {
  switch (tier) {
    case 'bronze': return '#cd7f32';
    case 'silver': return '#c0c0c0';
    case 'gold': return '#ffd700';
    case 'diamond': return '#b9f2ff';
  }
}
