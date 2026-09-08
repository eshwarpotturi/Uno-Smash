import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from './components/Card';
import { CardColor, GameRoom } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, RotateCcw, Trophy, Search, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';

let socket: Socket;

let globalAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      globalAudioContext = new AudioContextClass();
    }
  }
  return globalAudioContext;
}

function unlockAudio() {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch((err) => console.log('Audio resume failed', err));
  }
}

// Tap and click listener to trigger proactive unlock on iOS/Android
if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'touchend', 'keydown'];
  const handleInteraction = () => {
    unlockAudio();
    events.forEach(e => window.removeEventListener(e, handleInteraction));
  };
  events.forEach(e => window.addEventListener(e, handleInteraction));
}

export default function App() {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('uno_player_name') || '');
  const [roomId, setRoomId] = useState(() => localStorage.getItem('uno_room_id') || '');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<{ cardId: string } | null>(null);
  const [showEswarPicker, setShowEswarPicker] = useState(false);
  const [selectedEswarCards, setSelectedEswarCards] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    socket = io({
      transports: ['websocket'],
    });

    socket.on('room_update', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('game_start', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('game_update', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('error', (msg: string) => {
      alert(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const gameState = room?.gameState;
  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const myPlayerId = localStorage.getItem('uno_player_id');
  const myPlayer = room?.players.find(p => p.id === myPlayerId || p.socketId === socket?.id);
  const isMyTurn = currentPlayer && myPlayer && currentPlayer.id === myPlayer.id;
  const isSpecial = myPlayer?.name.toLowerCase().includes('eswar') || myPlayer?.name.toLowerCase().includes('anushka');

  useEffect(() => {
    if (gameState?.status === 'playing' && isSpecial && myPlayer?.hand.length === 0) {
      setShowEswarPicker(true);
    }
  }, [gameState?.status, isSpecial, myPlayer?.hand.length]);

  useEffect(() => {
    if (gameState?.status === 'ended' && gameState.winner) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameState?.status, gameState?.winner]);

  useEffect(() => {
    if (isMyTurn && gameState?.status === 'playing') {
      try {
        const ctx = getSharedAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc1.start();
        osc1.stop(ctx.currentTime + 0.4);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.58);
        
        osc2.start();
        osc2.stop(ctx.currentTime + 0.58);
      } catch (e) {
        console.error('Audio play failed:', e);
      }
    }
  }, [isMyTurn, gameState?.status]);

  useEffect(() => {
    if (!gameState?.turnExpiresAt || gameState.status !== 'playing') {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const difference = gameState.turnExpiresAt! - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(difference / 1000));
      setTimeLeft(secondsLeft);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [gameState?.turnExpiresAt, gameState?.status]);

  const handleJoinRoom = () => {
    const trimmedName = playerName.trim();
    const trimmedRoomId = roomId.trim();
    if (!trimmedName || !trimmedRoomId) return;

    localStorage.setItem('uno_player_name', trimmedName);
    localStorage.setItem('uno_room_id', trimmedRoomId);

    let pid = localStorage.getItem('uno_player_id');
    if (!pid) {
      pid = 'p_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('uno_player_id', pid);
    }

    socket.emit('join_room', { roomId: trimmedRoomId, playerName: trimmedName, playerId: pid });
  };

  const handleStartGame = () => {
    if (!room || room.players.length < 2) return;
    socket.emit('start_game', room.id);
  };

  const handlePlayCard = (cardId: string) => {
    if (!isMyTurn || !gameState) return;
    const card = myPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    if (card.color === 'wild') {
      setShowColorPicker({ cardId });
    } else {
      socket.emit('play_card', { roomId: room!.id, cardId });
    }
  };

  const handleColorSelect = (color: CardColor) => {
    if (showColorPicker && room) {
      socket.emit('play_card', { roomId: room.id, cardId: showColorPicker.cardId, chosenColor: color });
      setShowColorPicker(null);
    }
  };

  const handleDrawCard = () => {
    if (!isMyTurn || !room) return;
    socket.emit('draw_card', { roomId: room.id });
  };

  const handleEswarCardSelect = (cardId: string) => {
    if (selectedEswarCards.includes(cardId)) {
      setSelectedEswarCards(prev => prev.filter(id => id !== cardId));
    } else if (selectedEswarCards.length < 7) {
      setSelectedEswarCards(prev => [...prev, cardId]);
    }
  };

  const confirmEswarHand = () => {
    if (selectedEswarCards.length === 7 && room) {
      socket.emit('eswar_choose_hand', { roomId: room.id, cardIds: selectedEswarCards });
      setShowEswarPicker(false);
      setSelectedEswarCards([]);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-2xl font-black italic">U</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">UNO MULTIPLAYER</h1>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={!playerName.trim() || !roomId.trim()}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
          >
            JOIN ROOM
          </button>
        </motion.div>
      </div>
    );
  }

  if (room.status === 'lobby') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black italic">LOBBY</h2>
            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
              <span className="text-xs font-mono text-zinc-400">{room.id}</span>
              <button onClick={copyRoomId} className="text-zinc-500 hover:text-white transition-colors">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Players ({room.players.length}/4)</label>
            {room.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                    <Users size={16} className="text-zinc-500" />
                  </div>
                  <span className="font-bold">{p.name} {(p.id === myPlayerId || p.socketId === socket.id) && "(You)"}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartGame}
            disabled={room.players.length < 2}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
          >
            <Play size={20} fill="currentColor" /> START GAME
          </button>
        </motion.div>
      </div>
    );
  }

  if (showEswarPicker && gameState) {
    const filteredDeck = gameState.deck.filter(c => 
      c.color.includes(searchQuery.toLowerCase()) || 
      c.value.includes(searchQuery.toLowerCase())
    );

    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col p-6">
        <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-yellow-500 italic">SPECIAL CHOICE</h2>
              <p className="text-zinc-400">Select 7 cards for your starting hand</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search cards..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <button
                onClick={confirmEswarHand}
                disabled={selectedEswarCards.length !== 7}
                className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-lg disabled:opacity-50"
              >
                CONFIRM HAND ({selectedEswarCards.length}/7)
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
            {filteredDeck.map(card => (
              <div key={card.id} className="relative">
                <Card 
                  card={card} 
                  onClick={() => handleEswarCardSelect(card.id)}
                  className={cn(
                    "transition-all",
                    selectedEswarCards.includes(card.id) && "ring-4 ring-yellow-500 scale-105"
                  )}
                />
                {selectedEswarCards.includes(card.id) && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                    {selectedEswarCards.indexOf(card.id) + 1}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-lg font-black italic">U</span>
          </div>
          <span className="font-black italic tracking-tighter">UNO</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", gameState.direction === 1 ? "bg-green-500" : "bg-blue-500")} />
            {gameState.direction === 1 ? "Clockwise" : "Counter-Clockwise"}
          </div>
          <div className="text-sm font-bold bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
            {gameState.deck.length} cards left
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </header>

      <main className="flex-1 relative flex flex-col">
        {/* Opponents */}
        <div className="flex justify-center gap-3 sm:gap-8 p-4 sm:p-8 overflow-x-auto w-full">
          {gameState.players.map((p) => {
            if (p.id === myPlayerId || p.socketId === socket.id) return null;
            const isCurrent = gameState.players[gameState.currentPlayerIndex].id === p.id;
            return (
              <div key={p.id} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "relative p-1 rounded-xl transition-all",
                  isCurrent ? "ring-2 ring-red-500 scale-110" : "opacity-70",
                  p.isOnline === false && "grayscale opacity-50"
                )}>
                  <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                    <Users size={32} className="text-zinc-500" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-zinc-950">
                    {p.hand.length}
                  </div>
                </div>
                <span className="text-xs font-bold truncate max-w-[80px] flex items-center gap-1">
                  {p.name}
                  {p.isOnline === false && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="Disconnected" />}
                </span>
                {p.isOnline === false && <span className="text-[9px] text-red-500 font-bold uppercase leading-none">Offline</span>}
                {isCurrent && timeLeft !== null && (
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border",
                    timeLeft <= 3 
                      ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" 
                      : "text-amber-500 border-amber-500/30 bg-amber-500/10"
                  )}>
                    {timeLeft}s
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Center Table */}
        <div className="flex-1 flex items-center justify-center gap-6 sm:gap-12 p-2">
          {/* Deck */}
          <div className="relative group cursor-pointer" onClick={handleDrawCard}>
            <Card card={{} as any} isBack className="rotate-3 translate-x-1 translate-y-1 opacity-50" />
            <Card card={{} as any} isBack className="absolute inset-0 -rotate-2 -translate-x-1 -translate-y-1 opacity-70" />
            <Card card={{} as any} isBack className="absolute inset-0" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
              <span className="font-bold text-xs">DRAW</span>
            </div>
            {gameState.pendingDrawCount > 0 && (
              <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-black px-3 py-1 rounded-full animate-bounce shadow-lg">
                +{gameState.pendingDrawCount}
              </div>
            )}
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {gameState.discardPile.slice(0, 3).reverse().map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0.8, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 1, rotate: (i * 5) - 5 }}
                  className={cn("absolute inset-0", i === (Math.min(gameState.discardPile.length, 3) - 1) ? "relative" : "pointer-events-none")}
                >
                  <Card card={card} disabled />
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current:</span>
              <div className={cn(
                "w-4 h-4 rounded-full border border-white/20 shadow-md",
                gameState.currentColor === 'red' && "bg-red-500 shadow-red-500/50",
                gameState.currentColor === 'blue' && "bg-blue-500 shadow-blue-500/50",
                gameState.currentColor === 'green' && "bg-emerald-500 shadow-emerald-500/50",
                gameState.currentColor === 'yellow' && "bg-amber-400 shadow-amber-400/50",
                gameState.currentColor === 'wild' && "bg-gradient-to-br from-red-500 via-blue-500 via-yellow-400 to-emerald-500"
              )} />
              <span className="text-sm font-black uppercase italic tracking-wide">{gameState.currentColor}</span>
            </div>
          </div>
        </div>

        {/* Current Player Hand */}
        <div className="p-8 bg-zinc-900/50 border-t border-zinc-900 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                  <Users size={20} className="text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none flex items-center gap-2">
                    {myPlayer?.name}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">{isMyTurn ? "Your turn to play" : `Waiting for ${currentPlayer?.name}...`}</p>
                  {timeLeft !== null && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        timeLeft <= 3 ? "bg-red-500 animate-pulse" : "bg-amber-500 animate-ping"
                      )} />
                      <span className={cn(
                        "text-xs font-mono font-black tracking-wide",
                        timeLeft <= 3 ? "text-red-500 animate-pulse font-extrabold" : "text-amber-500"
                      )}>
                        {timeLeft}s remaining
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {isSpecial && isMyTurn && (
                  <button 
                    onClick={() => setShowEswarPicker(true)}
                    className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500/20 transition-all"
                  >
                    Change Hand
                  </button>
                )}
                <button 
                  onClick={handleDrawCard}
                  disabled={!isMyTurn}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all border border-zinc-700"
                >
                  Draw Card
                </button>
              </div>
            </div>

            <div className="flex justify-start sm:justify-center max-sm:space-x-0 max-sm:gap-2.5 sm:-space-x-8 sm:hover:space-x-2 transition-all duration-300 pb-4 overflow-x-auto scrollbar-hide touch-pan-x w-full px-4">
              {myPlayer?.hand.map((card) => {
                const canPlay = isMyTurn && 
                               (!gameState.pendingDrawCount || gameState.pendingDrawCount === 0) &&
                               (card.color === 'wild' || 
                               card.color === gameState.currentColor || 
                               card.value === gameState.currentValue);
                return (
                  <Card
                    key={card.id}
                    card={card}
                    onClick={() => handlePlayCard(card.id)}
                    disabled={!canPlay}
                    className={cn(
                      !canPlay && "grayscale opacity-40",
                      "hover:z-10"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black text-center mb-8 italic">PICK A COLOR</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={cn(
                      "h-24 rounded-2xl transition-transform hover:scale-105 active:scale-95 shadow-lg",
                      color === 'red' && "bg-red-500 shadow-red-500/20",
                      color === 'blue' && "bg-blue-500 shadow-blue-500/20",
                      color === 'green' && "bg-green-500 shadow-green-500/20",
                      color === 'yellow' && "bg-yellow-500 shadow-yellow-500/20"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Modal */}
      <AnimatePresence>
        {gameState.status === 'ended' && gameState.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-zinc-900 border-4 border-yellow-500 p-12 rounded-[3rem] max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]"
            >
              <div className="w-24 h-24 bg-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-yellow-500/20">
                <Trophy size={48} className="text-black" />
              </div>
              <h2 className="text-5xl font-black italic mb-2 tracking-tighter">VICTORY!</h2>
              <p className="text-yellow-500 font-bold text-xl mb-8 uppercase tracking-widest">{gameState.winner.name}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} /> PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Logs */}
      <div className="fixed bottom-4 left-4 max-w-[200px] hidden lg:block opacity-50 hover:opacity-100 transition-opacity">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-[10px] font-mono space-y-1 max-h-40 overflow-y-auto">
          {gameState.logs.map((log, i) => (
            <div key={i} className="text-zinc-400 border-b border-zinc-800 pb-1 last:border-0">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
