'use client';

import { useState } from 'react';

const ProposalSite = () => {
  const [simPosition, setSimPosition] = useState({ x: 0, y: 0 });
  const [simClicks, setSimClicks] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [fireworks, setFireworks] = useState([]);

  const handleSimHover = () => {
    if (simClicks < 5) {
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 100;
      
      const randomX = Math.random() * maxX + 50;
      const randomY = Math.random() * maxY + 50;
      
      setSimPosition({ x: randomX, y: randomY });
      setSimClicks(prev => prev + 1);
    }
  };

  const createFirework = (x, y, id) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff6bcb', '#6bddff'];
    const particles = 30;
    const newParticles = [];
    
    for (let i = 0; i < particles; i++) {
      const angle = (Math.PI * 2 * i) / particles;
      const velocity = 100 + Math.random() * 100;
      const xVel = Math.cos(angle) * velocity;
      const yVel = Math.sin(angle) * velocity;
      
      newParticles.push({
        id: `${id}-${i}`,
        x,
        y,
        xVel,
        yVel,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    return newParticles;
  };

  const handleNaoClick = () => {
    setShowCelebration(true);
    
    let count = 0;
    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const newFireworks = createFirework(x, y, Date.now() + count);
      
      setFireworks(prev => [...prev, ...newFireworks]);
      count++;
      
      if (count >= 15) {
        clearInterval(interval);
      }
    }, 200);
    
    setTimeout(() => {
      setFireworks([]);
    }, 3000);
  };

  const simStyle = simClicks > 0 && simClicks < 5 ? {
    position: 'fixed',
    left: `${simPosition.x}px`,
    top: `${simPosition.y}px`,
    transition: 'none'
  } : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center overflow-hidden">
      <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-md text-center relative z-10">
        <h1 className="text-5xl text-purple-600 font-bold mb-8 animate-pulse">
          Quer casar comigo? 💍
        </h1>
        
        <div className="text-8xl my-8 animate-bounce">
          ❤️
        </div>
        
        <div className="flex gap-6 justify-center mt-10 relative">
          <button
            onClick={handleNaoClick}
            className="px-10 py-4 text-xl bg-teal-400 text-white rounded-full font-bold hover:bg-teal-500 hover:scale-110 transition-all shadow-lg"
          >
            Não
          </button>
          
          <button
            onMouseEnter={handleSimHover}
            style={simStyle}
            className="px-10 py-4 text-xl bg-red-400 text-white rounded-full font-bold hover:bg-red-500 hover:scale-110 transition-all shadow-lg"
          >
            Sim
          </button>
        </div>
      </div>
      
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl text-black font-bold text-center drop-shadow-2xl animate-pulse">
            VAMOS CASAR! 🎉💕
          </div>
        </div>
      )}
      
      {fireworks.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            backgroundColor: particle.color,
            animation: `explode 1s ease-out forwards`,
            '--x': `${particle.xVel}px`,
            '--y': `${particle.yVel}px`,
          }}
        />
      ))}
      
      <style>{`
        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ProposalSite;