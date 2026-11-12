import { TileData, Player } from '../types/domino';

export interface Team101State {
  isOpen: boolean; // Saya düşüb? (13+ xal toplayaraq)
  draftScore: number; // Qaralama hesab (13-dən az xallar burada toplanır)
  mainScore: number; // Əsas hesab (101-ə qədər yarış)
  unopenedAttempts: number; // 3 dəfə qaydası sayğacı
}

export type Round101EventType =
  | 'opened' // 13+ xal toplandı və saya düşdü!
  | 'draft_accumulated' // 13-dən az xal qaralamaya əlavə olundu
  | 'draft_burn_opponent' // Rəqib udduğu üçün açılmamış qaralama silindi
  | 'draft_burn_3times' // 3 dəfə 13-ü aşa bilmədiyi üçün qaralama silindi
  | 'seka_tie' // Bağlı oyunda xallar bərabər oldu, bank yarandı
  | 'seka_awarded' // Əvvəlki bank cari qalibə verildi
  | 'standard_points'; // Artıq saya düşüb, birbaşa əsas hesaba yazıldı

export interface Match101State {
  team1: Team101State;
  team2: Team101State;
  playerAccounts?: Record<number, Team101State>;
  sekaBank: number;
  lastRoundEvent?: Round101EventType;
  lastEventMessage?: string;
  isDryDefeat?: boolean;
}

// Minimum tiles that MUST stay in the boneyard:
// - In 365 mode: 1 tile remains
// - In 101 mode: 2 tiles remain, EXCEPT in 3-player mode where only 1 tile remains
// - 4-player mode has no boneyard (all 28 tiles dealt to players)
export const getMinBoneyardReserve = (variant: '365' | '101' = '365', mode: string = '4p_duo'): number => {
  if (mode === '4p_duo' || mode === '4p_solo') return 0;
  if (variant === '101') {
    return mode === '3p_solo' ? 1 : 2;
  }
  return 1;
};

export const createInitial101State = (): Match101State => ({
  team1: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
  team2: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
  playerAccounts: {
    0: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
    1: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
    2: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
    3: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 }
  },
  sekaBank: 0
});

// Sum remaining pips in hand for 101 mode:
// Blank-Blank [0:0] (Ayaz / Qoşa boş):
// - If it is the ONLY tile left in hand (tək qalıbsa): writes 10 penalty points (10 yazdırır)!
// - If it is NOT alone in hand (tək deyilsə): writes 0 points (tək deyilsə 0)!
export const sumHandPips101 = (hand: TileData[]): number => {
  if (!hand || !Array.isArray(hand) || hand.length === 0) return 0;
  if (hand.length === 1 && hand[0].left === 0 && hand[0].right === 0) {
    return 10; // Tək qaldıqda 10 xal yazdırır
  }
  return hand.reduce((total, tile) => {
    if (!tile) return total;
    return total + (tile.left + tile.right);
  }, 0);
};

// Check if a hand holds the Ayaz (0-0) tile alone (triggers the 10 penalty points)
export const hasAyazAloneInHand = (hand: TileData[]): boolean => {
  if (!hand || !Array.isArray(hand) || hand.length !== 1) return false;
  return hand[0].left === 0 && hand[0].right === 0;
};
export const hasAyazInHand = hasAyazAloneInHand;

// First hand starter in 101: Player holding [1:1] (1 qoşa) MUST start
export const findFirstHandStarter101 = (
  hands: TileData[][]
): { playerIndex: number; forcedTile: TileData } => {
  // 1. Search for [1:1]
  for (let p = 0; p < hands.length; p++) {
    const tile11 = hands[p]?.find((t) => t && t.left === 1 && t.right === 1);
    if (tile11) {
      return { playerIndex: p, forcedTile: tile11 };
    }
  }

  // 2. Fallback to lowest double
  for (let d = 2; d <= 6; d++) {
    for (let p = 0; p < hands.length; p++) {
      const doubleTile = hands[p]?.find((t) => t && t.left === d && t.right === d);
      if (doubleTile) {
        return { playerIndex: p, forcedTile: doubleTile };
      }
    }
  }

  // 3. Fallback to 0:0 or first available tile
  return { playerIndex: 0, forcedTile: hands[0]?.[0] || { id: '1-1', left: 1, right: 1 } };
};

export interface Round101CalculationResult {
  winnerTeam: 1 | 2 | null; // null if Seka tie
  winnerPlayerIndex: number;
  isBaglandi: boolean;
  isSeka: boolean;
  roundRawPoints: number;
  sekaBankBonus: number;
  team1Pips: number;
  team2Pips: number;
  playerPips?: Record<number, number>;
  ayazCaught: boolean;
  nextMatchState: Match101State;
  isMatchOver: boolean;
  isDryDefeat: boolean;
}

export const process101Round = (
  currentState: Match101State,
  players: Player[],
  lastTilePlacedPlayerIndex: number,
  isBaglandi: boolean
): Round101CalculationResult => {
  const nextState: Match101State = {
    team1: { ...currentState.team1 },
    team2: { ...currentState.team2 },
    playerAccounts: currentState.playerAccounts
      ? { ...currentState.playerAccounts }
      : {
          0: { ...currentState.team1 },
          1: { ...currentState.team2 },
          2: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
          3: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 }
        },
    sekaBank: currentState.sekaBank
  };

  // ----------------------------------------------------
  // SPECIAL DEDICATED 3-PLAYER 101 MODE LOGIC
  // ----------------------------------------------------
  if (players.length === 3) {
    const playerPips: Record<number, number> = {};
    let minPips = 9999;
    let minPlayers: number[] = [];
    let ayazCaught = false;

    players.forEach((p) => {
      const pips = sumHandPips101(p.hand);
      playerPips[p.id] = pips;
      if (hasAyazInHand(p.hand)) {
        ayazCaught = true;
      }
      if (pips < minPips) {
        minPips = pips;
        minPlayers = [p.id];
      } else if (pips === minPips) {
        minPlayers.push(p.id);
      }
    });

    let winnerIdx = lastTilePlacedPlayerIndex;
    let isSeka = false;
    let capturedPoints: number;

    if (isBaglandi) {
      if (minPlayers.length > 1) {
        // Seka tie between 2 or 3 players
        isSeka = true;
        const totalPips = Object.values(playerPips).reduce((a, b) => a + b, 0);
        nextState.sekaBank += totalPips;
        nextState.lastRoundEvent = 'seka_tie';
        nextState.lastEventMessage = `🤝 Seka! Oyunçular arasında ən az xal bərabər oldu. ${totalPips} xal Seka Bankına yığıldı!`;
        return {
          winnerTeam: null,
          winnerPlayerIndex: lastTilePlacedPlayerIndex,
          isBaglandi: true,
          isSeka: true,
          roundRawPoints: 0,
          sekaBankBonus: 0,
          team1Pips: playerPips[0] || 0,
          team2Pips: playerPips[1] || 0,
          playerPips,
          ayazCaught,
          nextMatchState: nextState,
          isMatchOver: false,
          isDryDefeat: false
        };
      } else {
        winnerIdx = minPlayers[0];
        capturedPoints = Object.entries(playerPips)
          .filter(([id]) => Number(id) !== winnerIdx)
          .reduce((sum, [, p]) => sum + p, 0);
      }
    } else {
      winnerIdx = lastTilePlacedPlayerIndex;
      capturedPoints = Object.entries(playerPips)
        .filter(([id]) => Number(id) !== winnerIdx)
        .reduce((sum, [, p]) => sum + p, 0);
    }

    const accounts = nextState.playerAccounts!;
    const sekaBonus = nextState.sekaBank;
    nextState.sekaBank = 0;

    // 1. Opponent Burn rule for losers who have not opened
    players.forEach((p) => {
      if (p.id !== winnerIdx) {
        const acc = accounts[p.id];
        if (acc && !acc.isOpen && acc.draftScore > 0) {
          acc.draftScore = 0;
          acc.unopenedAttempts = 0;
        }
      }
    });

    // 2. Winner scoring
    const winnerAcc = accounts[winnerIdx] || { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 };
    const winnerName = players.find((p) => p.id === winnerIdx)?.name || `Oyunçu ${winnerIdx + 1}`;

    if (winnerAcc.isOpen) {
      winnerAcc.mainScore += capturedPoints + sekaBonus;
      nextState.lastRoundEvent = sekaBonus > 0 ? 'seka_awarded' : 'standard_points';
      nextState.lastEventMessage =
        sekaBonus > 0
          ? `🏆 ${winnerName} qalib gəldi: +${capturedPoints} xal və Seka Bankından +${sekaBonus} xal!`
          : `✅ ${winnerName} əsas hesaba +${capturedPoints} xal yazdırdı!`;
    } else {
      if (capturedPoints >= 13) {
        winnerAcc.isOpen = true;
        const transferred = winnerAcc.draftScore;
        winnerAcc.mainScore += capturedPoints + transferred + sekaBonus;
        winnerAcc.draftScore = 0;
        winnerAcc.unopenedAttempts = 0;
        nextState.lastRoundEvent = 'opened';
        nextState.lastEventMessage = `🎉 ${winnerName} SAYA DÜŞDÜ! ${capturedPoints} xal toplandı və qaralamadakı ${transferred} xal əsas hesaba köçürüldü!`;
      } else {
        winnerAcc.draftScore += capturedPoints + sekaBonus;
        winnerAcc.unopenedAttempts += 1;
        if (winnerAcc.unopenedAttempts >= 3) {
          winnerAcc.draftScore = 0;
          winnerAcc.unopenedAttempts = 0;
          nextState.lastRoundEvent = 'draft_burn_3times';
          nextState.lastEventMessage = `⚠️ 3 Dəfə Qaydası: ${winnerName} 3 cəhddə 13 xalı aşa bilmədiyi üçün qaralama sıfırlandı!`;
        } else {
          nextState.lastRoundEvent = 'draft_accumulated';
          nextState.lastEventMessage = `📝 ${winnerName} 13 xalı aşa bilmədi. +${capturedPoints} xal qaralamaya yazıldı (${winnerAcc.unopenedAttempts}/3 cəhd).`;
        }
      }
    }

    accounts[winnerIdx] = winnerAcc;
    nextState.playerAccounts = accounts;
    nextState.team1 = accounts[0];
    nextState.team2 = accounts[1];

    const isMatchOver = winnerAcc.mainScore >= 101;
    let isDryDefeat = false;
    if (isMatchOver) {
      const anyDry = Object.entries(accounts).some(([id, acc]) => Number(id) !== winnerIdx && acc.mainScore === 0);
      if (anyDry) {
        isDryDefeat = true;
        nextState.isDryDefeat = true;
        nextState.lastEventMessage = `🫖 QURU MƏĞLUBİYYƏT! Bəzi oyunçular saya belə düşə bilmədi (0 xal)! Çaylar uduzandandır!`;
      }
    }

    return {
      winnerTeam: (winnerIdx === 0 ? 1 : 2) as 1 | 2,
      winnerPlayerIndex: winnerIdx,
      isBaglandi,
      isSeka: false,
      roundRawPoints: capturedPoints,
      sekaBankBonus: sekaBonus,
      team1Pips: playerPips[0] || 0,
      team2Pips: playerPips[1] || 0,
      playerPips,
      ayazCaught,
      nextMatchState: nextState,
      isMatchOver,
      isDryDefeat
    };
  }

  // Calculate pips for both teams (with Ayaz = 20 points)
  let team1Pips = 0;
  let team2Pips = 0;
  let ayazCaught = false;

  players.forEach((p) => {
    const pips = sumHandPips101(p.hand);
    if (hasAyazInHand(p.hand)) {
      ayazCaught = true;
    }
    const pTeam = p.team || (p.id % 2 === 0 ? 1 : 2);
    if (pTeam === 1) {
      team1Pips += pips;
    } else {
      team2Pips += pips;
    }
  });

  let winningTeam: 1 | 2 | null;
  let winnerPlayerIndex: number;
  let isSeka = false;
  let roundRawPoints: number;

  if (isBaglandi) {
    if (team1Pips < team2Pips) {
      winningTeam = 1;
      roundRawPoints = team2Pips;
      // Winner is the team 1 player with smallest remaining hand
      const t1Players = players.filter((p) => (p.team || (p.id % 2 === 0 ? 1 : 2)) === 1);
      const best = t1Players.reduce((prev, curr) =>
        sumHandPips101(curr.hand) < sumHandPips101(prev.hand) ? curr : prev
      );
      winnerPlayerIndex = best.id;
    } else if (team2Pips < team1Pips) {
      winningTeam = 2;
      roundRawPoints = team1Pips;
      const t2Players = players.filter((p) => (p.team || (p.id % 2 === 0 ? 1 : 2)) === 2);
      const best = t2Players.reduce((prev, curr) =>
        sumHandPips101(curr.hand) < sumHandPips101(prev.hand) ? curr : prev
      );
      winnerPlayerIndex = best.id;
    } else {
      // Perfect tie in a blocked game: SEKA!
      isSeka = true;
      const pooledPoints = team1Pips + team2Pips;
      nextState.sekaBank += pooledPoints;
      nextState.lastRoundEvent = 'seka_tie';
      nextState.lastEventMessage = `🤝 Seka! Hər iki komandanın əlində eyni (${team1Pips}) xal qaldı. ${pooledPoints} xal Seka Bankına əlavə olundu!`;
      return {
        winnerTeam: null,
        winnerPlayerIndex: lastTilePlacedPlayerIndex,
        isBaglandi: true,
        isSeka: true,
        roundRawPoints: 0,
        sekaBankBonus: 0,
        team1Pips,
        team2Pips,
        ayazCaught,
        nextMatchState: nextState,
        isMatchOver: false,
        isDryDefeat: false
      };
    }
  } else {
    // Normal out (one player emptied their hand)
    const winningPlayer = players[lastTilePlacedPlayerIndex] || players[0];
    winningTeam = (winningPlayer.team || (winningPlayer.id % 2 === 0 ? 1 : 2)) as 1 | 2;
    winnerPlayerIndex = lastTilePlacedPlayerIndex;
    // Points captured are the opposing team's entire remaining pips
    roundRawPoints = winningTeam === 1 ? team2Pips : team1Pips;
  }

  const losingTeam = winningTeam === 1 ? 2 : 1;
  const winnerTeamKey = winningTeam === 1 ? 'team1' : 'team2';
  const loserTeamKey = losingTeam === 1 ? 'team1' : 'team2';

  const sekaBankBonus = nextState.sekaBank;
  nextState.sekaBank = 0; // Claimed by winner

  // 1. Opponent Burn (Silinmə) Rule:
  // If the loser team was NOT open and had draft points, their draft points burn to zero!
  if (!nextState[loserTeamKey].isOpen && nextState[loserTeamKey].draftScore > 0) {
    nextState[loserTeamKey].draftScore = 0;
    nextState[loserTeamKey].unopenedAttempts = 0;
    nextState.lastRoundEvent = 'draft_burn_opponent';
    nextState.lastEventMessage = `🔥 Rəqib qalib gəldiyi üçün ${losingTeam}-ci komandanın açılmamış qaralama xalları yandı!`;
  }

  // 2. Score processing for winning team:
  const winTeamState = nextState[winnerTeamKey];

  if (winTeamState.isOpen) {
    // Already opened: All points go straight to Main Score!
    winTeamState.mainScore += roundRawPoints + sekaBankBonus;
    nextState.lastRoundEvent = sekaBankBonus > 0 ? 'seka_awarded' : 'standard_points';
    nextState.lastEventMessage =
      sekaBankBonus > 0
        ? `🏆 ${winningTeam}-ci komanda qalib gəldi: +${roundRawPoints} xal və Seka Bankından +${sekaBankBonus} xal!`
        : `✅ ${winningTeam}-ci komanda əsas hesaba +${roundRawPoints} xal yazdırdı!`;
  } else {
    // Not open yet! 13-Point Threshold (Saya Düşmək) applies!
    if (roundRawPoints >= 13) {
      // Successful Opening (Saya Düşdü!)
      winTeamState.isOpen = true;
      const transferredDraft = winTeamState.draftScore;
      winTeamState.mainScore += roundRawPoints + transferredDraft + sekaBankBonus;
      winTeamState.draftScore = 0;
      winTeamState.unopenedAttempts = 0;
      nextState.lastRoundEvent = 'opened';
      nextState.lastEventMessage = `🎉 ${winningTeam}-ci komanda SAYA DÜŞDÜ! ${roundRawPoints} xal toplandı və qaralamadakı ${transferredDraft} xal əsas hesaba köçürüldü!`;
    } else {
      // Under 13: Points go to Draft Balance
      winTeamState.draftScore += roundRawPoints + sekaBankBonus;
      winTeamState.unopenedAttempts += 1;

      // 3-Times Rule Check:
      if (winTeamState.unopenedAttempts >= 3) {
        winTeamState.draftScore = 0;
        winTeamState.unopenedAttempts = 0;
        nextState.lastRoundEvent = 'draft_burn_3times';
        nextState.lastEventMessage = `⚠️ 3 Dəfə Qaydası: ${winningTeam}-ci komanda 3 cəhddə 13 xalı aşa bilmədiyi üçün qaralama sıfırlandı!`;
      } else {
        nextState.lastRoundEvent = 'draft_accumulated';
        nextState.lastEventMessage = `📝 ${winningTeam}-ci komanda 13 xalı aşa bilmədi. +${roundRawPoints} xal qaralamaya yazıldı (${winTeamState.unopenedAttempts}/3 cəhd).`;
      }
    }
  }

  // Check Match Victory (101 points target)
  const isMatchOver = winTeamState.mainScore >= 101;
  let isDryDefeat = false;

  if (isMatchOver) {
    const loserMain = nextState[loserTeamKey].mainScore;
    if (loserMain === 0) {
      isDryDefeat = true;
      nextState.isDryDefeat = true;
      nextState.lastEventMessage = `🫖 QURU MƏĞLUBİYYƏT! ${losingTeam}-ci komanda saya belə düşə bilmədi (0 xal)! Çayxana qaydasına görə çaylar uduzandandır!`;
    }
  }

  return {
    winnerTeam: winningTeam,
    winnerPlayerIndex,
    isBaglandi,
    isSeka: false,
    roundRawPoints,
    sekaBankBonus,
    team1Pips,
    team2Pips,
    ayazCaught,
    nextMatchState: nextState,
    isMatchOver,
    isDryDefeat
  };
};
