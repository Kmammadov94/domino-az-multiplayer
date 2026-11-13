import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RANKED_MMR,
  MIN_RANKED_MMR,
  TEAHOUSE_TIERS,
  calculateEloUpdate,
  getRankTierForMmr
} from '../../data/teahouses';

describe('teahouses & ranked MMR', () => {
  it('has 4 tiers starting at 25 with exact 10% house cut payouts', () => {
    expect(TEAHOUSE_TIERS.map((t) => [t.buyIn, t.prizePot])).toEqual([
      [25, 45],
      [100, 180],
      [200, 360],
      [500, 900]
    ]);
    for (const tier of TEAHOUSE_TIERS) {
      expect(tier.prizePot).toBe(Math.round(tier.buyIn * 2 * 0.9));
    }
  });

  it('updates Elo MMR up on win, down on loss, and respects floor', () => {
    const winRes = calculateEloUpdate(DEFAULT_RANKED_MMR, DEFAULT_RANKED_MMR, true, 0);
    expect(winRes.nextMmr).toBe(1016);
    expect(winRes.delta).toBe(16);

    const lossRes = calculateEloUpdate(DEFAULT_RANKED_MMR, DEFAULT_RANKED_MMR, false, 20);
    expect(lossRes.nextMmr).toBe(988);
    expect(lossRes.delta).toBe(-12);

    const floorRes = calculateEloUpdate(105, 2000, false, 0);
    expect(floorRes.nextMmr).toBeGreaterThanOrEqual(MIN_RANKED_MMR);
  });

  it('maps MMR to Chess.com-style rank tiers', () => {
    expect(getRankTierForMmr(800).id).toBe('bronze');
    expect(getRankTierForMmr(1000).id).toBe('silver');
    expect(getRankTierForMmr(1250).id).toBe('gold');
    expect(getRankTierForMmr(1500).id).toBe('platinum');
    expect(getRankTierForMmr(1750).id).toBe('diamond');
    expect(getRankTierForMmr(2000).id).toBe('master');
    expect(getRankTierForMmr(2300).id).toBe('grandmaster');
  });
});
