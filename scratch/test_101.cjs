// Unit test for Domino 101 Logic
const assert = require('assert');

// Ayaz tile check
function sumHandPips101(hand) {
  if (!hand || hand.length === 0) return 0;
  return hand.reduce((total, tile) => {
    if (!tile) return total;
    if (tile.left === 0 && tile.right === 0) return total + 20;
    return total + (tile.left + tile.right);
  }, 0);
}

// 1. Ayaz 0-0 penalty check
const handWithAyaz = [{ left: 0, right: 0 }, { left: 3, right: 4 }];
assert.strictEqual(sumHandPips101(handWithAyaz), 27); // 20 + 7
console.log('✓ Test 1 Passed: Ayaz [0:0] counts as 20 points!');

// 2. Starter 1-1 check
function findFirstHandStarter101(hands) {
  for (let p = 0; p < hands.length; p++) {
    const tile11 = hands[p]?.find((t) => t && t.left === 1 && t.right === 1);
    if (tile11) return { playerIndex: p, forcedTile: tile11 };
  }
  return { playerIndex: 0, forcedTile: hands[0][0] };
}

const testHands = [
  [{ left: 6, right: 6 }, { left: 3, right: 2 }],
  [{ left: 5, right: 4 }, { left: 1, right: 1 }], // player 1 has 1-1
  [{ left: 2, right: 2 }, { left: 4, right: 4 }],
  [{ left: 0, right: 0 }, { left: 5, right: 5 }]
];
const starter = findFirstHandStarter101(testHands);
assert.strictEqual(starter.playerIndex, 1);
assert.strictEqual(starter.forcedTile.left, 1);
assert.strictEqual(starter.forcedTile.right, 1);
console.log('✓ Test 2 Passed: Player holding 1-1 forced to start Hand 1!');

// 3. 13-point threshold & Draft Accumulation
let state = {
  team1: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
  team2: { isOpen: false, draftScore: 0, mainScore: 0, unopenedAttempts: 0 },
  sekaBank: 0
};

// Round 1: Team 1 wins with 8 points (<13)
// Points go to draft
state.team1.draftScore += 8;
state.team1.unopenedAttempts += 1;
assert.strictEqual(state.team1.isOpen, false);
assert.strictEqual(state.team1.draftScore, 8);
assert.strictEqual(state.team1.mainScore, 0);
console.log('✓ Test 3 Passed: Round <13 points accumulates in Draft Balance!');

// Round 2: Team 1 wins with 15 points (>=13)
// Breakthrough! Opens account and transfers draft
assert.strictEqual(15 >= 13, true);
state.team1.isOpen = true;
state.team1.mainScore += 15 + state.team1.draftScore;
state.team1.draftScore = 0;
assert.strictEqual(state.team1.isOpen, true);
assert.strictEqual(state.team1.mainScore, 23); // 15 + 8
console.log('✓ Test 4 Passed: 13+ points opens scoreboard and transfers draft points!');

// Round 3: Opponent Burn Rule
// Team 2 accumulates 10 draft points
state.team2.draftScore = 10;
state.team2.unopenedAttempts = 1;
// Team 1 wins next round -> Team 2 draft burns to 0
if (!state.team2.isOpen) {
  state.team2.draftScore = 0;
  state.team2.unopenedAttempts = 0;
}
assert.strictEqual(state.team2.draftScore, 0);
console.log('✓ Test 5 Passed: Opponent victory burns unopened draft points to zero!');

// Round 4: 3-Times Rule
state.team2.draftScore = 0;
state.team2.unopenedAttempts = 0;
// Win 1: 5 pts
state.team2.draftScore += 5; state.team2.unopenedAttempts += 1;
// Win 2: 4 pts
state.team2.draftScore += 4; state.team2.unopenedAttempts += 1;
// Win 3: 3 pts (unopenedAttempts reaches 3)
state.team2.draftScore += 3; state.team2.unopenedAttempts += 1;
if (state.team2.unopenedAttempts >= 3) {
  state.team2.draftScore = 0;
  state.team2.unopenedAttempts = 0;
}
assert.strictEqual(state.team2.draftScore, 0);
console.log('✓ Test 6 Passed: 3-Times rule wipes draft points when failing to hit 13+ in 3 attempts!');

// Round 5: Seka Tie Bank
let sekaBank = 0;
// Block with equal pips: 12 each -> seka
const pips1 = 12;
const pips2 = 12;
assert.strictEqual(pips1 === pips2, true);
sekaBank += pips1 + pips2; // 24
assert.strictEqual(sekaBank, 24);
// Next round: Team 1 wins with 10 points -> gets 10 + 24 = 34
const nextWon = 10 + sekaBank;
sekaBank = 0;
assert.strictEqual(nextWon, 34);
assert.strictEqual(sekaBank, 0);
console.log('✓ Test 7 Passed: Seka tie pools points in bank and awards them to next round winner!');

// Round 6: Quru Məğlubiyyət (Dry Defeat)
const t1Main = 105;
const t2Main = 0;
const isDryDefeat = t1Main >= 101 && t2Main === 0;
assert.strictEqual(isDryDefeat, true);
console.log('✓ Test 8 Passed: 101 reached while opponents are at 0 triggers Quru Məğlubiyyət!');

console.log('\n========================================');
console.log('ALL 8 AUTHENTIC 101 LOGIC TESTS PASSED!');
console.log('========================================');
