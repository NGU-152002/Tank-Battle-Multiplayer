import { useRef,useEffect,useState } from "react";

export default function GameCanvas({ projectile, onProjectileEnd, tanks, terrain, onHit, onFire, onTankMove, selectedWeapon, weaponDamage, currentPlayer, gameState, playerIndex, damageTexts }) {
    const canvasRef = useRef();
    const [dragging, setDragging] = useState(false);
    const [previewPath, setPreviewPath] = useState([]);
    const [startPoint, setStartPoint] = useState(null);
    const [currentPower, setCurrentPower] = useState(0);
    const [currentAngle, setCurrentAngle] = useState(0);
    const [keys, setKeys] = useState({});
    const [showProjectile, setShowProjectile] = useState(false);
    const [projectilePos, setProjectilePos] = useState({ x: 0, y: 0 });
    const [projectileData, setProjectileData] = useState(null);

    // Get the current player's tank
    const currentPlayerTank = tanks.find(t => t.playerId === currentPlayer);
    
    // Check if this player can control the current player's tank
    const canControl = playerIndex === currentPlayer;

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 1200;
      canvas.height = 600;
      
      // Draw scene
      drawScene(ctx);
    }, [terrain, previewPath, currentPower, currentAngle, damageTexts, tanks, dragging, showProjectile, projectilePos]);

    // Handle projectile animation when projectile data changes
    useEffect(() => {
      console.log('Projectile useEffect triggered:', { projectile, showProjectile, playerIndex });
      if (projectile && !showProjectile) {
        console.log('Starting projectile animation:', projectile);
        setProjectileData(projectile);
        setProjectilePos({ x: projectile.x, y: projectile.y });
        setShowProjectile(true);
        animateProjectile(projectile);
      }
    }, [projectile]);

    // Handle when projectile is cleared (by server)
    useEffect(() => {
      if (!projectile && showProjectile) {
        console.log('Projectile cleared by server');
        setShowProjectile(false);
        setProjectileData(null);
      }
    }, [projectile, showProjectile]);

    // Debug tanks state
    useEffect(() => {
      console.log('Tanks updated:', tanks, 'playerIndex:', playerIndex);
    }, [tanks, playerIndex]);

    // Debug currentPlayer state
    useEffect(() => {
      console.log('Current player updated:', currentPlayer, 'playerIndex:', playerIndex);
    }, [currentPlayer, playerIndex]);

    const drawScene = (ctx) => {
      ctx.clearRect(0, 0, 1200, 600);
      drawTerrain(ctx);
      // Draw tanks on top of terrain
      tanks.forEach(t => drawTank(ctx, t));
      drawHealthBars(ctx);
      drawDamageTexts(ctx);
      drawPreview(ctx);
      if (dragging) drawPowerIndicator(ctx);
      drawControls(ctx);
      drawTurnIndicator(ctx);
      
      // Draw projectile if showing
      if (showProjectile) {
        drawProjectile(ctx);
      }
    };

    const drawTerrain = (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, 600);
      terrain.forEach((y, x) => ctx.lineTo(x, y));
      ctx.lineTo(1200, 600);
      ctx.closePath();
      ctx.fillStyle = '#654321';
      ctx.fill();
    };

    const drawTank = (ctx, { x, y, color, playerId }) => {
      // Get terrain height at tank position
      const terrainHeight = terrain[Math.floor(x)] || 600;
      const tankY = terrainHeight - 20; // Position tank on terrain surface
      
      ctx.fillStyle = color;
      ctx.fillRect(x, tankY - 20, 40, 20);
      ctx.fillRect(x + 15, tankY - 30, 10, 10);

      // Draw turn indicator for current player's tank
      if (playerId === currentPlayer && gameState === 'waiting') {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, tankY - 22, 44, 24);
      }
    };

    const drawHealthBars = (ctx) => {
      tanks.forEach(tank => {
        const health = tank.health || 100;
        const maxHealth = 100;
        const healthPercent = health / maxHealth;
        
        // Get terrain height at tank position
        const terrainHeight = terrain[Math.floor(tank.x)] || 600;
        const tankY = terrainHeight - 20; // Position tank on terrain surface
        
        // Health bar background
        const barWidth = 50;
        const barHeight = 6;
        const barX = tank.x - 5;
        const barY = tankY - 45;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar fill
        const fillWidth = (healthPercent * barWidth);
        ctx.fillStyle = healthPercent > 0.6 ? '#44ff44' : healthPercent > 0.3 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Health text
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(`${health}`, barX + barWidth/2 - 10, barY - 2);
      });
    };

    const drawDamageTexts = (ctx) => {
      damageTexts.forEach((text, index) => {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`-${text.damage}`, text.x, text.y);
      });
    };

    const drawControls = (ctx) => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '14px Arial';
      ctx.fillText('Controls: A/D - Move Tank, Drag to Aim & Shoot', 10, 20);
    };

    const drawTurnIndicator = (ctx) => {
      if (gameState === 'waiting' && currentPlayerTank) {
        if (canControl) {
          ctx.fillStyle = 'rgba(255,255,0,0.8)';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`Your Turn!`, 10, 40);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(`Opponent's Turn`, 10, 40);
        }
      } else if (gameState === 'firing') {
        ctx.fillStyle = 'rgba(255,255,0,0.8)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Projectile in flight...`, 10, 40);
      }
    };

    const getWeaponColor = (weapon) => {
      switch(weapon) {
        case 'Cannon': return 'rgba(255,0,0,0.8)'; // Red
        case 'Missile': return 'rgba(255,165,0,0.8)'; // Orange
        case 'Napalm': return 'rgba(255,0,255,0.8)'; // Magenta
        case 'Laser': return 'rgba(0,255,255,0.8)'; // Cyan
        default: return 'rgba(255,0,0,0.8)';
      }
    };

    const drawProjectile = (ctx) => {
      ctx.beginPath();
      ctx.arc(projectilePos.x, projectilePos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = getWeaponColor(selectedWeapon);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawPreview = (ctx) => {
      if (previewPath.length > 0) {
        // Draw trajectory line
        ctx.strokeStyle = 'rgba(255,255,0,0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        previewPath.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw trajectory dots
        ctx.fillStyle = 'rgba(255,255,0,0.6)';
        previewPath.forEach(([x, y], i) => {
          if (i % 5 === 0) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Draw projectile at the end of preview
        if (previewPath.length > 0) {
          const [endX, endY] = previewPath[previewPath.length - 1];
          ctx.fillStyle = getWeaponColor(selectedWeapon);
          ctx.beginPath();
          ctx.arc(endX, endY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    };

    const drawPowerIndicator = (ctx) => {
      if (!currentPlayerTank) return;
      
      // Get terrain height at tank position
      const terrainHeight = terrain[Math.floor(currentPlayerTank.x)] || 600;
      const tankY = terrainHeight - 20; // Position tank on terrain surface
      
      // Draw power bar
      const barWidth = 100;
      const barHeight = 10;
      const barX = currentPlayerTank.x - 20;
      const barY = tankY - 50;
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      const powerPercent = (currentPower / 100) * barWidth;
      ctx.fillStyle = currentPower > 80 ? '#ff4444' : currentPower > 50 ? '#ffaa00' : '#44ff44';
      ctx.fillRect(barX, barY, powerPercent, barHeight);
      
      // Draw power text
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`${Math.round(currentPower)}%`, barX + barWidth + 5, barY + 8);
      
      // Draw angle indicator
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentPlayerTank.x + 20, tankY - 25);
      const endX = currentPlayerTank.x + 20 + Math.cos(currentAngle) * 30;
      const endY = tankY - 25 - Math.sin(currentAngle) * 30;
      ctx.lineTo(endX, endY);
      ctx.stroke();
    };

    const handleMouseDown = (e) => {
      // Only allow interaction for current player and when game is in waiting state
      if (!currentPlayerTank || gameState !== 'waiting' || !canControl) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPoint({ x, y });
      setDragging(true);
      setCurrentPower(0);
      setCurrentAngle(0);
    };

    const handleMouseMove = (e) => {
      if (!dragging || !currentPlayerTank || gameState !== 'waiting' || !canControl) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const dx = current.x - startPoint.x;
      const dy = current.y - startPoint.y;

      const angle = Math.atan2(-dy, dx);
      const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 3, 100);
      
      setCurrentAngle(angle);
      setCurrentPower(power);

      // Simulate projectile for preview (showing full trajectory)
      const points = [];
      // Get terrain height at tank position for correct starting position
      const terrainHeight = terrain[Math.floor(currentPlayerTank.x)] || 600;
      const tankY = terrainHeight - 20; // Position tank on terrain surface
      
      let x0 = currentPlayerTank.x + 20;
      let y0 = tankY - 25;
      let vx = power * Math.cos(angle);
      let vy = power * Math.sin(angle);
      
      // Calculate trajectory points with same physics as server
      for (let i = 0; i < 100; i++) {
        x0 += vx;
        y0 += vy;
        vy += 0.2; // gravity (same as server)
        points.push([x0, y0]);
        
        // Stop if hitting terrain or going off screen
        if (x0 < 0 || x0 > 1200 || y0 > 600 || y0 >= terrain[Math.floor(x0)]) {
          break;
        }
      }

      setPreviewPath(points);
    };

    const handleMouseUp = () => {
      if (!dragging || !currentPlayerTank || currentPower < 10 || gameState !== 'waiting' || !canControl) {
        setDragging(false);
        setPreviewPath([]);
        setCurrentPower(0);
        setCurrentAngle(0);
        return;
      }
      
      const vx = currentPower * Math.cos(currentAngle);
      const vy = currentPower * Math.sin(currentAngle);

      // Get terrain height at tank position for correct firing position
      const terrainHeight = terrain[Math.floor(currentPlayerTank.x)] || 600;
      const tankY = terrainHeight - 20; // Position tank on terrain surface
      
      const projectile = {
        x: currentPlayerTank.x + 20,
        y: tankY - 25,
        vx,
        vy,
      };
      
      onFire(projectile);

      setDragging(false);
      setPreviewPath([]);
      setCurrentPower(0);
      setCurrentAngle(0);
    };

    const handleMouseLeave = () => {
      if (dragging) {
        setDragging(false);
        setPreviewPath([]);
        setCurrentPower(0);
        setCurrentAngle(0);
      }
    };

    // Keyboard controls for tank movement
    useEffect(() => {
      const handleKeyDown = (e) => {
        setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
      };

      const handleKeyUp = (e) => {
        setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    // Tank movement logic
    useEffect(() => {
      if (!currentPlayerTank || gameState !== 'waiting' || !canControl) return;

      const moveSpeed = 2;
      let newX = currentPlayerTank.x;

      if (keys.a) {
        newX = Math.max(20, currentPlayerTank.x - moveSpeed);
      }
      if (keys.d) {
        newX = Math.min(1160, currentPlayerTank.x + moveSpeed);
      }

      // Check if new position is valid (not inside terrain)
      if (newX !== currentPlayerTank.x) {
        const terrainHeight = terrain[Math.floor(newX)] || 600;
        const tankBottom = terrainHeight - 20; // Tank bottom should be on terrain
        
        // Only allow movement if tank won't be inside terrain
        if (tankBottom >= 0) {
          // Update tank position in parent component
          onTankMove && onTankMove(currentPlayerTank, newX);
        }
      }
    }, [keys, currentPlayerTank, terrain, gameState]);

    const animateProjectile = (projectile) => {
      console.log('animateProjectile called with:', projectile);
      let { x, y, vx, vy } = projectile;
      const interval = setInterval(() => {
        // Update projectile position
        x += vx;
        y += vy;
        vy += 0.2;
        
        setProjectilePos({ x, y });
        
        // Check for tank collisions - but don't clear projectile immediately
        // Let the server handle the hit detection and timing
        for (let i = 0; i < tanks.length; i++) {
          const tank = tanks[i];
          const terrainHeight = terrain[Math.floor(tank.x)] || 600;
          const tankY = terrainHeight - 20;
          
          if (
            x >= tank.x &&
            x <= tank.x + 40 &&
            y >= tankY - 20 &&
            y <= tankY
          ) {
            console.log('Projectile hit tank:', i);
            // Don't clear projectile immediately - let server handle it
            clearInterval(interval);
            return;
          }
        }
        
        // Stop animation if projectile goes off screen or hits terrain
        if (x < 0 || x > 1200 || y > 600 || y >= terrain[Math.floor(x)]) {
          console.log('Projectile went off screen or hit terrain');
          clearInterval(interval);
          setShowProjectile(false);
          setProjectileData(null);
          return;
        }
      }, 50);
      
      // Stop animation after 2 seconds regardless
      setTimeout(() => {
        clearInterval(interval);
        setShowProjectile(false);
        setProjectileData(null);
      }, 2000); // Match server delay
    };

    return (
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', cursor: (gameState === 'waiting' && canControl) ? 'crosshair' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    );
  }
  
  