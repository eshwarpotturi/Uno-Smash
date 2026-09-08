export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  isReady: boolean;
  isOnline?: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  status: GameStatus;
  gameState: GameState | null;
}

export type GameStatus = 'lobby' | 'starting' | 'playing' | 'ended';

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: GameStatus;
  winner: Player | null;
  currentColor: CardColor | null;
  currentValue: CardValue | null;
  pendingDrawCount: number;
  logs: string[];
  turnExpiresAt?: number;
}
