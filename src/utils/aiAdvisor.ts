import { BoardGrid, HandPieces, PieceType, Player } from '../types/shogi';
import { collectLegalMoves, getOpponent, isKingInCheck } from './shogiEngine';

export type AdvisorLanguage = 'ja' | 'en';

interface AdvisorResult {
  title: string;
  summary: string;
  bullets: string[];
  scoreLabel: string;
}

const PIECE_VALUES: Record<PieceType, number> = {
  king: 0,
  rook: 120,
  bishop: 105,
  gold: 72,
  silver: 63,
  knight: 42,
  lance: 34,
  pawn: 10,
};

const UNIT_NAMES_JA: Record<PieceType, string> = {
  king: '司令部',
  rook: '戦車',
  bishop: 'ロケット砲',
  gold: '近衛兵',
  silver: '特殊部隊',
  knight: 'ドローン',
  lance: '自走砲',
  pawn: '歩兵',
};

const UNIT_NAMES_EN: Record<PieceType, string> = {
  king: 'HQ',
  rook: 'Tank',
  bishop: 'Rocket Launcher',
  gold: 'Guard',
  silver: 'Special Forces',
  knight: 'Drone',
  lance: 'Artillery',
  pawn: 'Infantry',
};

function materialScore(board: BoardGrid, hands: HandPieces): number {
  let score = 0;
  board.forEach(row => {
    row.forEach(piece => {
      if (!piece || piece.type === 'king') return;
      const value = PIECE_VALUES[piece.type] + (piece.promoted ? 18 : 0);
      score += piece.player === 'black' ? value : -value;
    });
  });

  hands.black.forEach(piece => { score += PIECE_VALUES[piece] * 0.72; });
  hands.white.forEach(piece => { score -= PIECE_VALUES[piece] * 0.72; });
  return score;
}

function centerControl(board: BoardGrid): number {
  const centerCells = new Set(['3-3', '3-4', '3-5', '4-3', '4-4', '4-5', '5-3', '5-4', '5-5']);
  let score = 0;
  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece) return;
      if (centerCells.has(`${rowIndex}-${colIndex}`)) {
        score += piece.player === 'black' ? 1 : -1;
      }
    });
  });
  return score;
}

function advancedUnits(board: BoardGrid, player: Player): number {
  let count = 0;
  board.forEach((row, rowIndex) => {
    row.forEach(piece => {
      if (!piece || piece.player !== player || piece.type === 'king') return;
      if (player === 'black' && rowIndex <= 4) count += 1;
      if (player === 'white' && rowIndex >= 4) count += 1;
    });
  });
  return count;
}

function handSummary(hands: HandPieces, player: Player, language: AdvisorLanguage): string | null {
  if (hands[player].length === 0) return null;
  const names = language === 'ja' ? UNIT_NAMES_JA : UNIT_NAMES_EN;
  const counts = hands[player].reduce<Record<string, number>>((acc, piece) => {
    const name = names[piece];
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, count]) => `${name}x${count}`).join(' / ');
}

function classifyScore(score: number): string {
  if (score >= 130) return '1P ADVANTAGE';
  if (score >= 45) return '1P SLIGHT LEAD';
  if (score <= -130) return 'CPU ADVANTAGE';
  if (score <= -45) return 'CPU SLIGHT LEAD';
  return 'BALANCED';
}

function lastMoveText(lastMovePlayer: Player | null, language: AdvisorLanguage): string {
  if (language === 'en') {
    if (!lastMovePlayer) return 'Opening phase. Start by taking control of the center.';
    return lastMovePlayer === 'black'
      ? '1P just changed the frontline. Watch for possible counterattacks.'
      : 'CPU has advanced its formation. Look for a move that takes back initiative.';
  }

  if (!lastMovePlayer) return '開戦直後です。まず中央の主導権を取りにいきましょう。';
  return lastMovePlayer === 'black'
    ? '直前の1P行動により、前線の形が変化しました。反撃筋に注意。'
    : 'CPUが布陣を進めました。次の一手で主導権を取り返しましょう。';
}

export function buildAiAdvice(
  board: BoardGrid,
  hands: HandPieces,
  currentPlayer: Player,
  checkPlayer: Player | null,
  lastMovePlayer: Player | null,
  language: AdvisorLanguage = 'ja',
): AdvisorResult {
  const score = materialScore(board, hands);
  const center = centerControl(board);
  const blackMoves = collectLegalMoves(board, hands, 'black').length;
  const whiteMoves = collectLegalMoves(board, hands, 'white').length;
  const blackAdvanced = advancedUnits(board, 'black');
  const whiteAdvanced = advancedUnits(board, 'white');
  const playerHands = handSummary(hands, 'black', language);
  const cpuHands = handSummary(hands, 'white', language);
  const bullets: string[] = [];

  if (language === 'en') {
    if (checkPlayer === 'black') {
      bullets.push('1P HQ is in check. Secure the king before attacking.');
    } else if (checkPlayer === 'white') {
      bullets.push('CPU HQ is in check. Keep pressure on and block its escape routes.');
    } else if (isKingInCheck(board, getOpponent(currentPlayer))) {
      bullets.push('The enemy HQ is under pressure. Continuing the attack is viable.');
    }

    if (center > 1) {
      bullets.push('1P controls the center. Open lines for the Tank and Rocket Launcher.');
    } else if (center < -1) {
      bullets.push('CPU is thick in the center. Push Infantry forward to rebuild the line.');
    } else {
      bullets.push('Center control is even. The first side to open a heavy-unit line gets initiative.');
    }

    if (score >= 45) {
      bullets.push('1P is ahead in material. Use captured units to surround, not rush.');
    } else if (score <= -45) {
      bullets.push('1P is behind in material. Avoid trades and target high-value units.');
    } else {
      bullets.push('Material is close. One capture or promotion can swing the battle.');
    }

    if (blackAdvanced < whiteAdvanced) {
      bullets.push('CPU has advanced farther. Focus your attack on one flank.');
    } else if (blackAdvanced > whiteAdvanced) {
      bullets.push('1P units are advancing. Avoid leaving isolated units behind.');
    }

    if (playerHands) bullets.push(`1P captured units: ${playerHands}. Drops can break the enemy camp.`);
    if (cpuHands) bullets.push(`CPU captured units: ${cpuHands}. Watch for sudden drops.`);

    const mobilityGap = blackMoves - whiteMoves;
    if (mobilityGap >= 10) {
      bullets.push('1P has more legal options. You can switch between attack and defense.');
    } else if (mobilityGap <= -10) {
      bullets.push('CPU has wider mobility. Protect your defensive core.');
    }
  } else {
    if (checkPlayer === 'black') {
      bullets.push('1P司令部が王手を受けています。まず安全確保を最優先。');
    } else if (checkPlayer === 'white') {
      bullets.push('CPU司令部に王手中です。逃げ道を塞ぐ追撃が有効。');
    } else if (isKingInCheck(board, getOpponent(currentPlayer))) {
      bullets.push('相手司令部に圧力がかかっています。攻めを継続できます。');
    }

    if (center > 1) {
      bullets.push('中央の支配は1P寄り。戦車・ロケット砲の射線を通す好機です。');
    } else if (center < -1) {
      bullets.push('CPUが中央に厚く展開。歩兵で前線を押し返す展開が必要です。');
    } else {
      bullets.push('中央支配は互角。先に大駒のラインを作った側が主導権を握ります。');
    }

    if (score >= 45) {
      bullets.push('駒得は1P側。無理攻めより、持ち駒を活かした包囲が安全です。');
    } else if (score <= -45) {
      bullets.push('駒損気味です。交換を急がず、相手の高価値ユニットを狙いましょう。');
    } else {
      bullets.push('戦力差は小さめ。次の捕獲・成りで一気に流れが変わります。');
    }

    if (blackAdvanced < whiteAdvanced) {
      bullets.push('前線到達はCPUが先行。1Pは左右どちらかに攻撃軸を絞ると良いです。');
    } else if (blackAdvanced > whiteAdvanced) {
      bullets.push('1Pの前線進出が進んでいます。孤立したユニットを作らないよう注意。');
    }

    if (playerHands) bullets.push(`1P持ち駒: ${playerHands}。打ち込みで敵陣を崩せます。`);
    if (cpuHands) bullets.push(`CPU持ち駒: ${cpuHands}。突然の打ち込みに警戒。`);

    const mobilityGap = blackMoves - whiteMoves;
    if (mobilityGap >= 10) {
      bullets.push('合法手の選択肢は1Pが多め。攻守の切り替えがしやすい局面です。');
    } else if (mobilityGap <= -10) {
      bullets.push('CPUの可動域が広い状態。守りの要を崩されないよう注意。');
    }
  }

  const title = checkPlayer ? 'ALERT: CHECK STATUS' : 'AI TACTIC ADVISOR';
  const summary = lastMoveText(lastMovePlayer, language);

  return {
    title,
    summary,
    bullets: bullets.slice(0, 4),
    scoreLabel: classifyScore(score),
  };
}
