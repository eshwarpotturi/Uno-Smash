import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { nanoid } from 'nanoid';
import { Card, CardColor, CardValue, GameState, Player, GameRoom } from './src/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
});

const PORT = 3000;

// Game State Management
const rooms: Map<string, GameRoom> = new Map();

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];

const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  let id = 0;
  COLORS.forEach(color => {
    deck.push({ id: `${id++}`, color, value: '0' });
    for (let i = 0; i < 2; i++) {
      VALUES.slice(1).forEach(value => {
        deck.push({ id: `${id++}`, color, value });
      });
    }
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `${id++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `${id++}`, color: 'wild', value: 'wild4' });
  }
  return deck;
};

const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

const activeTimers = new Map<string, NodeJS.Timeout>();

const clearTurnTimer = (roomId: string) => {
  if (activeTimers.has(roomId)) {
    clearTimeout(activeTimers.get(roomId)!);
    activeTimers.delete(roomId);
  }
};

const resetTurnTimer = (roomId: string) => {
  clearTurnTimer(roomId);

  const room = rooms.get(roomId);
  if (!room || !room.gameState || room.status !== 'playing') return;

  const state = room.gameState;
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Safeguard: if they are a special player and haven't chosen cards yet, do not kick off timer
  if (currentPlayer.hand.length === 0 && (currentPlayer.name.toLowerCase().includes('eswar') || currentPlayer.name.toLowerCase().includes('anushka'))) {
    state.turnExpiresAt = undefined;
    return;
  }

  const turnDuration = 10000; // 10 seconds in milliseconds
  state.turnExpiresAt = Date.now() + turnDuration;

  const timer = setTimeout(() => {
    const currentRoom = rooms.get(roomId);
    if (!currentRoom || !currentRoom.gameState || currentRoom.status !== 'playing') return;

    const currentState = currentRoom.gameState;
    const activePlayer = currentState.players[currentState.currentPlayerIndex];

    currentState.logs.unshift(`${activePlayer.name} ran out of time! Auto-drawing card.`);

    // Force draw card behavior for the inactive player
    if (currentState.deck.length < (currentState.pendingDrawCount || 1)) {
      const topCard = currentState.discardPile.shift()!;
      currentState.deck = shuffle([...currentState.deck, ...currentState.discardPile]);
      currentState.discardPile = [topCard];
    }

    const drawCount = currentState.pendingDrawCount || 1;
    const drawnCards = currentState.deck.splice(0, drawCount);
    activePlayer.hand.push(...drawnCards);
    currentState.pendingDrawCount = 0;

    // Shift to next player
    currentState.currentPlayerIndex = (currentState.currentPlayerIndex + currentState.direction + currentState.players.length) % currentState.players.length;

    // Send update and recurse
    io.to(roomId).emit('game_update', currentRoom);
    resetTurnTimer(roomId);
  }, turnDuration);

  activeTimers.set(roomId, timer);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', ({ roomId, playerName, playerId }: { roomId: string; playerName: string; playerId: string }) => {
    let room = rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        status: 'lobby',
        gameState: null,
      };
      rooms.set(roomId, room);
    }

    // Check if player is already in the room (reconnecting)
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      existingPlayer.isOnline = true;
      socket.join(roomId);

      // Update name if changed
      if (playerName && playerName.trim()) {
        existingPlayer.name = playerName.trim();
      }

      // Sync socket ID and online status in active game state as well
      if (room.gameState) {
        const gsPlayer = room.gameState.players.find(p => p.id === playerId);
        if (gsPlayer) {
          gsPlayer.socketId = socket.id;
          gsPlayer.isOnline = true;
          if (playerName && playerName.trim()) {
            gsPlayer.name = playerName.trim();
          }
        }
      }

      console.log(`Player ${existingPlayer.name} reconnected with socket: ${socket.id}`);
      io.to(roomId).emit('room_update', room);
      // Explicitly emit game state updates if playing
      if (room.status === 'playing' || room.status === 'ended') {
        io.to(roomId).emit('game_update', room);
      }
      return;
    }

    if (room.status !== 'lobby') {
      socket.emit('error', 'Game already in progress');
      return;
    }

    const player: Player = {
      id: playerId || nanoid(),
      socketId: socket.id,
      name: playerName,
      hand: [],
      isReady: false,
      isOnline: true,
    };

    room.players.push(player);
    socket.join(roomId);
    io.to(roomId).emit('room_update', room);
  });

  socket.on('start_game', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room || room.players.length < 2) return;

    let deck = shuffle(generateDeck());
    
    // Deal cards
    room.players.forEach(player => {
      const isSpecial = player.name.toLowerCase().includes('eswar') || player.name.toLowerCase().includes('anushka');
      if (!isSpecial) {
        player.hand = deck.splice(0, 7);
      } else {
        player.hand = []; // Special players will choose later
      }
    });

    let firstCardIndex = deck.findIndex(c => c.color !== 'wild');
    const firstCard = deck.splice(firstCardIndex, 1)[0];

    room.status = 'playing';
    room.gameState = {
      deck,
      discardPile: [firstCard],
      players: room.players,
      currentPlayerIndex: 0,
      direction: 1,
      status: 'playing',
      winner: null,
      currentColor: firstCard.color,
      currentValue: firstCard.value,
      pendingDrawCount: 0,
      logs: [`Game started! First card is ${firstCard.color} ${firstCard.value}`],
    };

    io.to(roomId).emit('game_start', room);
    resetTurnTimer(roomId);
  });

  socket.on('play_card', ({ roomId, cardId, chosenColor }: { roomId: string; cardId: string; chosenColor?: CardColor }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.socketId !== socket.id) return;

    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = currentPlayer.hand[cardIndex];
    const isWild = card.color === 'wild';
    const colorMatch = card.color === state.currentColor;
    const valueMatch = card.value === state.currentValue;

    if (!isWild && !colorMatch && !valueMatch) return;

    // Execute play
    currentPlayer.hand.splice(cardIndex, 1);
    state.discardPile.unshift(card);
    state.currentColor = isWild ? (chosenColor || 'red') : card.color;
    state.currentValue = card.value;

    let skipCount = 1;
    if (card.value === 'reverse') {
      state.direction = state.direction === 1 ? -1 : 1;
      if (state.players.length === 2) skipCount = 2;
    } else if (card.value === 'skip') {
      skipCount = 2;
    } else if (card.value === 'draw2') {
      const victimIndex = (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length;
      const victim = state.players[victimIndex];
      const count = 2;
      if (state.deck.length < count) {
        const topCard = state.discardPile.shift()!;
        state.deck = shuffle([...state.deck, ...state.discardPile]);
        state.discardPile = [topCard];
      }
      const drawn = state.deck.splice(0, count);
      victim.hand.push(...drawn);
      state.logs.unshift(`${victim.name} automatically drew 2 cards and skipped turn`);
      skipCount = 2;
    } else if (card.value === 'wild4') {
      const victimIndex = (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length;
      const victim = state.players[victimIndex];
      const count = 4;
      if (state.deck.length < count) {
        const topCard = state.discardPile.shift()!;
        state.deck = shuffle([...state.deck, ...state.discardPile]);
        state.discardPile = [topCard];
      }
      const drawn = state.deck.splice(0, count);
      victim.hand.push(...drawn);
      state.logs.unshift(`${victim.name} automatically drew 4 cards and skipped turn`);
      skipCount = 2;
    }

    if (currentPlayer.hand.length === 0) {
      state.status = 'ended';
      state.winner = currentPlayer;
      room.status = 'ended';
      clearTurnTimer(roomId);
    } else {
      state.currentPlayerIndex = (state.currentPlayerIndex + (state.direction * skipCount) + state.players.length) % state.players.length;
      resetTurnTimer(roomId);
    }

    state.logs.unshift(`${currentPlayer.name} played ${card.color} ${card.value}`);
    io.to(roomId).emit('game_update', room);
  });

  socket.on('draw_card', ({ roomId, chosenCardId }: { roomId: string; chosenCardId?: string }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.socketId !== socket.id) return;

    if (state.deck.length < (state.pendingDrawCount || 1)) {
      const topCard = state.discardPile.shift()!;
      state.deck = shuffle([...state.deck, ...state.discardPile]);
      state.discardPile = [topCard];
    }

    const drawCount = state.pendingDrawCount || 1;
    let drawnCards: Card[] = [];

    if (chosenCardId) {
      const index = state.deck.findIndex(c => c.id === chosenCardId);
      if (index !== -1) {
        drawnCards = state.deck.splice(index, 1);
        if (drawCount > 1) drawnCards = [...drawnCards, ...state.deck.splice(0, drawCount - 1)];
      } else {
        drawnCards = state.deck.splice(0, drawCount);
      }
    } else {
      drawnCards = state.deck.splice(0, drawCount);
    }

    currentPlayer.hand.push(...drawnCards);
    state.pendingDrawCount = 0;
    state.currentPlayerIndex = (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length;
    state.logs.unshift(`${currentPlayer.name} drew ${drawCount} card(s)`);
    resetTurnTimer(roomId);
    
    io.to(roomId).emit('game_update', room);
  });

  socket.on('eswar_choose_hand', ({ roomId, cardIds }: { roomId: string; cardIds: string[] }) => {
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const player = state.players.find(p => p.socketId === socket.id);
    if (!player || (!player.name.toLowerCase().includes('eswar') && !player.name.toLowerCase().includes('anushka'))) return;

    const chosenCards: Card[] = [];
    cardIds.forEach(id => {
      const index = state.deck.findIndex(c => c.id === id);
      if (index !== -1) {
        chosenCards.push(state.deck.splice(index, 1)[0]);
      }
    });

    player.hand = chosenCards;
    state.logs.unshift(`${player.name} chose their hand!`);
    resetTurnTimer(roomId);
    io.to(roomId).emit('game_update', room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];

        if (room.status === 'lobby') {
          // If in lobby, wait 3 seconds before removing in case of a quick page refresh
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (!currentRoom) return;
            const p = currentRoom.players.find(x => x.id === player.id);
            // Verify they haven't reconnected already with a new socketId
            if (p && p.socketId === socket.id) {
              const idx = currentRoom.players.findIndex(x => x.id === player.id);
              if (idx !== -1) {
                currentRoom.players.splice(idx, 1);
                if (currentRoom.players.length === 0) {
                  rooms.delete(roomId);
                  clearTurnTimer(roomId);
                } else {
                  io.to(roomId).emit('room_update', currentRoom);
                }
              }
            }
          }, 3000);
        } else {
          // If in progress or ended, mark them as offline but do NOT remove them
          player.isOnline = false;
          if (room.gameState) {
            const gsPlayer = room.gameState.players.find(x => x.id === player.id);
            if (gsPlayer) {
              gsPlayer.isOnline = false;
            }
            room.gameState.logs.unshift(`${player.name} disconnected. Waiting for them to reconnect...`);
          }
          io.to(roomId).emit('room_update', room);
          io.to(roomId).emit('game_update', room);
        }
      }
    });
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
