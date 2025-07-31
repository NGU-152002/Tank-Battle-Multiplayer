import React, { useEffect, useRef, useState } from 'react';

function App() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [context, setContext] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const canvas:any = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    // Create WebSocket connection
    const ws = new WebSocket('ws://192.168.226.239:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (msg) => {
      try {
        const { x, y, type } = JSON.parse(msg.data);
        if (!ctx) return;
        if (type === 'start') {
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []); // Remove context dependency

  const sendDrawData = (x: number, y: number, type: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ x, y, type }));
      console.log('Sent draw data:', { x, y, type });
    } else {
      console.warn('WebSocket not connected');
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    if (context) {
      context.beginPath();
      context.moveTo(x, y);
    }
    sendDrawData(x, y, 'start');
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const { offsetX: x, offsetY: y } = e.nativeEvent;
    if (context) {
      context.lineTo(x, y);
      context.stroke();
    }
    sendDrawData(x, y, 'draw');
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    if (context) {
      context.closePath();
    }
  };

  return (
    <div>
      <div style={{ padding: '10px', backgroundColor: '#f0f0f0' }}>
        Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ 
          border: '1px solid black', 
          display: 'block',
          cursor: 'crosshair',
          backgroundColor:'white'
        }}
      />
    </div>
  );
}

export default App;
