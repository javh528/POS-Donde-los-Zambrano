import React, { useEffect, useRef } from 'react';

/**
 * StarryBackground - Renders a seamless dark cosmic canvas
 * with twinkling stars that dynamically adapt to any screen resolution and DPR.
 */
export const StarryBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    // Use ResizeObserver for instant responsiveness when toggling device emulation in DevTools
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    window.addEventListener('resize', resizeCanvas);

    // Dynamic Star Generation
    const w = window.innerWidth;
    const h = window.innerHeight;
    const starCount = Math.min(100, Math.floor((w * h) / 12000));
    
    const stars = Array.from({ length: Math.max(40, starCount) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.004 + 0.001,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
    }));

    const render = () => {
      const curW = window.innerWidth;
      const curH = window.innerHeight;

      ctx.clearRect(0, 0, curW, curH);

      // Render subtle stars
      stars.forEach((star) => {
        star.alpha += Math.sin(Date.now() * star.speed) * 0.002;
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0) star.x = curW;
        if (star.x > curW) star.x = 0;
        if (star.y < 0) star.y = curH;
        if (star.y > curH) star.y = 0;

        const currentAlpha = Math.max(0.08, Math.min(0.5, star.alpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 235, 255, ${currentAlpha})`;
        ctx.shadowBlur = star.size > 1.2 ? 3 : 0;
        ctx.shadowColor = 'rgba(235, 175, 60, 0.25)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    />
  );
};
