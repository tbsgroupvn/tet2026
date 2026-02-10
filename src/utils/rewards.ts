import type { Reward } from '../types';

export const REWARDS: Reward[] = [
  {
    id: 'voucher-50',
    name: 'Voucher 50K',
    description: 'Voucher mua sắm trị giá 50,000đ',
    coinCost: 100,
    image: '🎫',
    tier: 'bronze',
  },
  {
    id: 'voucher-100',
    name: 'Voucher 100K',
    description: 'Voucher mua sắm trị giá 100,000đ',
    coinCost: 200,
    image: '🎟️',
    tier: 'bronze',
  },
  {
    id: 'tra-sua',
    name: 'Trà Sữa',
    description: 'Phiếu trà sữa cho cả team',
    coinCost: 300,
    image: '🧋',
    tier: 'silver',
  },
  {
    id: 'voucher-500',
    name: 'Voucher 500K',
    description: 'Voucher mua sắm trị giá 500,000đ',
    coinCost: 500,
    image: '💳',
    tier: 'silver',
  },
  {
    id: 'ngay-phep',
    name: 'Ngày Phép Bonus',
    description: 'Thêm 1 ngày phép thưởng',
    coinCost: 800,
    image: '🏖️',
    tier: 'gold',
  },
  {
    id: 'voucher-1m',
    name: 'Voucher 1 Triệu',
    description: 'Voucher mua sắm trị giá 1,000,000đ',
    coinCost: 1000,
    image: '💰',
    tier: 'gold',
  },
  {
    id: 'airpods',
    name: 'AirPods',
    description: 'Tai nghe AirPods chính hãng',
    coinCost: 2000,
    image: '🎧',
    tier: 'diamond',
  },
  {
    id: 'ipad',
    name: 'iPad Mini',
    description: 'iPad Mini mới nhất',
    coinCost: 5000,
    image: '📱',
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
