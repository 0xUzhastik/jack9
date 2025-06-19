// Confetti celebration effects
import confetti from 'canvas-confetti';

export const triggerJackpotConfetti = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Multiple confetti bursts
  const interval: NodeJS.Timeout = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Gold confetti from left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFFF00', '#FFA500', '#FF8C00']
    });

    // Pink confetti from right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FF1493', '#FF69B4', '#DC143C', '#FF6347']
    });

    // Center burst
    confetti({
      ...defaults,
      particleCount: particleCount * 2,
      origin: { x: 0.5, y: 0.3 },
      colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4']
    });
  }, 250);

  // Initial big burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4']
  });

  // Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#FFD700', '#FFFF00', '#FFA500']
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#FF1493', '#FF69B4', '#DC143C']
    });
  }, 500);

  // Final celebration burst
  setTimeout(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FF1493', '#00FFFF', '#FFFF00', '#FF69B4', '#32CD32']
    });
  }, 2000);
};