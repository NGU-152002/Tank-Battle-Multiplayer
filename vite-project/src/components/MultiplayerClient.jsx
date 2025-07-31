import { useState, useEffect, useRef } from 'react';
import GameCanvas from './GameCanvas';
import WeaponSelector from './WeaponSelector';

const WEBSOCKET_URL = 'ws://localhost:3001'; // your ws url

export default function MultiplayerClient() {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState(null);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [damageTexts, setDamageTexts] = useState([]);

  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket(WEBSOCKET_URL);
    
    websocket.onopen = () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message from server:', data.type, 'for player:', playerIndex, 'data:', data);
        handleServerMessage(data);
      } catch (error) {
        console.error('Error parsing server message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from server');
      setConnected(false);
      setGameData(null);
      setGameId(null);
      setPlayerId(null);
      setPlayerIndex(null);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Trying to reconnect...');
    };

    setWs(websocket);
  };

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'game_created':
        setGameId(data.gameId);
        setPlayerId(data.playerId);
        setPlayerIndex(data.playerIndex);
        setGameData(data.gameData);
        setWaitingForPlayer(true);
        setShowJoinForm(false);
        break;

      case 'game_joined':
        setGameId(data.gameId);
        setPlayerId(data.playerId);
        setPlayerIndex(data.playerIndex);
        setGameData(data.gameData);
        setWaitingForPlayer(false);
        setShowJoinForm(false);
        break;

      case 'player_joined':
        setWaitingForPlayer(false);
        break;

      case 'player_disconnected':
        setError('Other player disconnected');
        setGameData(null);
        setGameId(null);
        setPlayerId(null);
        setPlayerIndex(null);
        break;

      case 'tank_moved':
        if (gameData) {
          setGameData(prev => ({
            ...prev,
            tanks: prev.tanks.map((tank, index) => 
              index === data.playerIndex ? { ...tank, x: data.newX } : tank
            )
          }));
        }
        break;

      case 'projectile_fired':
        console.log('Projectile fired received by player:', playerIndex, 'projectile:', data.projectile);
        setGameData(prev => {
          console.log('Updating game data for projectile_fired, prev state:', prev);
          return {
            ...prev,
            projectile: data.projectile,
            gameState: 'firing'
          };
        });
        break;
      case 'tank_hit':
        console.log('Tank hit received by player:', playerIndex, 'tankIndex:', data.tankIndex, 'newHealth:', data.newHealth, 'currentPlayer:', data.currentPlayer);
        setGameData(prev => {
          console.log('Updating game data for tank_hit, prev state:', prev);
          return {
            ...prev,
            tanks: prev.tanks.map((tank, index) =>
              index === data.tankIndex ? { ...tank, health: data.newHealth } : tank
            ),
            gameState: data.gameState,
            currentPlayer: data.currentPlayer,
            projectile: null
          };
        });
        break;
      case 'projectile_ended':
        console.log('Projectile ended received by player:', playerIndex, 'currentPlayer:', data.currentPlayer);
        setGameData(prev => {
          console.log('Updating game data for projectile_ended, prev state:', prev);
          return {
            ...prev,
            projectile: null,
            gameState: 'waiting',
            currentPlayer: data.currentPlayer
          };
        });
        break;

      case 'weapon_changed':
        if (gameData) {
          setGameData(prev => ({
            ...prev,
            weaponIndex: data.weaponIndex
          }));
        }
        break;

      case 'game_reset':
        setGameData(data.gameData);
        setDamageTexts([]); // Clear damage texts on reset
        break;

      case 'error':
        setError(data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const createGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'create_game'
      }));
    }
  };

  const joinGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN && gameCode.trim()) {
      ws.send(JSON.stringify({
        type: 'join_game',
        gameId: gameCode.trim()
      }));
    }
  };

  const handleTankMove = (tank, newX) => {
    if (ws && ws.readyState === WebSocket.OPEN && gameId) {
      ws.send(JSON.stringify({
        type: 'move_tank',
        gameId: gameId,
        tank: tank,
        newX: newX
      }));
    }
  };

  const handleFire = (projectile) => {
    if (ws && ws.readyState === WebSocket.OPEN && gameId) {
      ws.send(JSON.stringify({
        type: 'fire_projectile',
        gameId: gameId,
        projectile: projectile
      }));
    }
  };

  const handleProjectileEnd = () => {
    // This is now handled by the server
    // No need to send anything
  };

  const handleHit = (targetTank, damage) => {
    // This is now handled by the server
    // No need to send anything
  };

  const handleWeaponChange = (weaponIndex) => {
    if (ws && ws.readyState === WebSocket.OPEN && gameId) {
      ws.send(JSON.stringify({
        type: 'change_weapon',
        gameId: gameId,
        weaponIndex: weaponIndex
      }));
    }
  };

  const handleResetGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN && gameId) {
      ws.send(JSON.stringify({
        type: 'reset_game',
        gameId: gameId
      }));
    }
  };

  const getWinner = () => {
    if (!gameData) return null;
    const deadTank = gameData.tanks.find(tank => tank.health <= 0);
    if (deadTank) {
      return gameData.tanks.find(tank => tank.playerId !== deadTank.playerId);
    }
    return null;
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connecting to server...</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#00809D]">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-8">Tank Battle Multiplayer</h1>
          
          {!showJoinForm ? (
            <div className="space-y-4">
              <button
                onClick={createGame}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create New Game
              </button>
              
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Join Existing Game
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Game Code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={joinGame}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Join Game
                </button>
                
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (waitingForPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for opponent...</h2>
          <p className="text-gray-600 mb-4">Share this game code with your friend:</p>
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <code className="text-lg font-mono">{gameId}</code>
          </div>
          <p className="text-sm text-gray-500">They can join using the "Join Existing Game" option</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 w-full h-full ">
      <div className="w-full h-full flex-col justify-center items-center">
        {/* Game Status Header */}
        <div className="mb-4 text-center">
          {gameData.gameState === 'gameOver' ? (
            <div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Game Over! {getWinner()?.color === 'blue' ? 'Blue' : 'Red'} Player Wins!
              </h2>
              <button 
                onClick={handleResetGame}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-2">
                {gameData.currentPlayer === 0 ? 'Blue' : 'Red'} Player's Turn
                {playerIndex === gameData.currentPlayer ? ' (Your Turn!)' : ''}
              </h2>
              <p className="text-sm text-gray-600">
                {gameData.gameState === 'waiting' ? 'Move your tank and aim to shoot!' : 
                 gameData.gameState === 'aiming' ? 'Aiming...' : 
                 gameData.gameState === 'firing' ? 'Projectile in flight...' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Game Code: {gameId} | You are: {playerIndex === 0 ? 'Blue' : 'Red'} Player
              </p>
            </div>
          )}
        </div>

        <GameCanvas
          terrain={gameData.terrain}
          tanks={gameData.tanks}
          projectile={gameData.projectile}
          onProjectileEnd={handleProjectileEnd}
          onHit={handleHit}
          onFire={handleFire}
          onTankMove={handleTankMove}
          selectedWeapon={gameData.weapons[gameData.weaponIndex]}
          weaponDamage={gameData.weaponDamage}
          currentPlayer={gameData.currentPlayer}
          gameState={gameData.gameState}
          playerIndex={playerIndex}
          damageTexts={damageTexts}
        />
        
        <div className="mt-4">
          <WeaponSelector 
            weapons={gameData.weapons} 
            selected={gameData.weaponIndex} 
            onSelect={handleWeaponChange}
            disabled={playerIndex !== gameData.currentPlayer || gameData.gameState !== 'waiting'}
          />
        </div>
      </div>
    </div>
  );
} 