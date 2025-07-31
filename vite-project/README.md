# Tank Battle Multiplayer Game

A real-time multiplayer tank battle game built with React, Vite, and WebSocket.

## Features

- 🎮 Real-time multiplayer gameplay
- 🎯 Turn-based tank battles
- 🚀 Multiple weapon types (Cannon, Missile, Napalm, Laser)
- 🏔️ Dynamic terrain generation
- 💥 Server-side physics and collision detection
- 🎨 Modern UI with health bars and turn indicators

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the game (both frontend and backend):**
   ```bash
   npm start
   ```

3. **Open the game:**
   - Go to `http://localhost:5173` in your browser
   - Create a new game or join an existing one
   - Share the game code with a friend to play together

## Game Controls

- **A/D keys:** Move your tank left/right
- **Mouse drag:** Aim and set power for shooting
- **Weapon buttons:** Select different weapons with varying damage

## How to Play

1. **Create or Join a Game:**
   - Click "Create New Game" to start a new match
   - Share the game code with your friend
   - Your friend clicks "Join Existing Game" and enters the code

2. **Take Turns:**
   - Move your tank with A/D keys
   - Select a weapon from the bottom buttons
   - Drag your mouse to aim and set power
   - Release to fire!

3. **Win Conditions:**
   - Reduce your opponent's health to 0
   - Use different weapons for strategic advantage

## Technical Details

- **Frontend:** React + Vite
- **Backend:** Node.js + WebSocket
- **Physics:** Server-side projectile simulation
- **Real-time:** WebSocket communication

## Troubleshooting

- Make sure both frontend (port 5173) and backend (port 3001) are running
- Check browser console for any connection errors
- Ensure your firewall allows connections on these ports
