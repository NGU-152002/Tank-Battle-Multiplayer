import { useState } from "react";
import MultiplayerClient from "./components/MultiplayerClient";

function generateTerrain() {
  const terrain = [];
  for (let x = 0; x < 1200; x++) {
    const y = 500 + 30 * Math.sin(x * 0.01) + Math.random() * 5;
    terrain.push(y);
  }
  return terrain;
}

const weapons = ['Cannon', 'Missile', 'Napalm', 'Laser'];

// Weapon damage configuration
const weaponDamage = {
  'Cannon': 25,
  'Missile': 40,
  'Napalm': 35,
  'Laser': 50
};

function App() {
  return (


    <MultiplayerClient />
 

  );
}

export default App;