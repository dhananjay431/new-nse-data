import { useEffect, useRef } from "react";

/**
 * Animated constellation network background.
 * Draws randomly-placed nodes connected by lines when close enough,
 * with a gentle floating animation — inspired by the SVG reference.
 */
export default function ConstellationBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let width, height;

    // Configuration
    const NODE_COUNT = 80;
    const LINE_DIST = 160;
    const NODE_RADIUS = 1.8;
    const BIG_NODE_RADIUS = 4;
    const BIG_NODE_COUNT = 12;
    const SPEED = 0.3;

    // Colors matching the reference SVG palette
    const BG_COLOR = "#0e2a47";
    const LINE_COLOR = "rgba(19, 46, 101, 0.6)";
    const BIG_LINE_COLOR = "rgba(100, 130, 210, 0.35)";
    const NODE_COLOR = "rgba(19, 46, 101, 0.9)";
    const BIG_NODE_COLOR_INNER = "rgba(255,255,255,0.9)";
    const BIG_NODE_COLOR_MID = "#1735b3";
    const BIG_NODE_COLOR_OUTER = "rgba(23,53,179,0)";

    const nodes = [];
    const bigNodes = [];

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function initNodes() {
      nodes.length = 0;
      bigNodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
        });
      }
      for (let i = 0; i < BIG_NODE_COUNT; i++) {
        bigNodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * SPEED * 0.6,
          vy: (Math.random() - 0.5) * SPEED * 0.6,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw lines between close small nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = LINE_COLOR;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw lines between close big nodes and between big-small nodes
      for (let i = 0; i < bigNodes.length; i++) {
        // Big-to-big lines
        for (let j = i + 1; j < bigNodes.length; j++) {
          const dx = bigNodes[i].x - bigNodes[j].x;
          const dy = bigNodes[i].y - bigNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST * 2.5) {
            ctx.beginPath();
            ctx.moveTo(bigNodes[i].x, bigNodes[i].y);
            ctx.lineTo(bigNodes[j].x, bigNodes[j].y);
            ctx.strokeStyle = BIG_LINE_COLOR;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
        // Big-to-small lines
        for (let j = 0; j < nodes.length; j++) {
          const dx = bigNodes[i].x - nodes[j].x;
          const dy = bigNodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINE_DIST * 1.5) {
            ctx.beginPath();
            ctx.moveTo(bigNodes[i].x, bigNodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = BIG_LINE_COLOR;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw small nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLOR;
        ctx.fill();
      }

      // Draw big nodes with radial gradient (pulsing)
      for (const node of bigNodes) {
        const pulseScale = 1 + 0.2 * Math.sin(node.pulse);
        const r = BIG_NODE_RADIUS * pulseScale * 3;

        const gradient = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          r,
        );
        gradient.addColorStop(0, BIG_NODE_COLOR_INNER);
        gradient.addColorStop(0.15, BIG_NODE_COLOR_MID);
        gradient.addColorStop(1, BIG_NODE_COLOR_OUTER);

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner solid dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, BIG_NODE_RADIUS * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = NODE_COLOR;
        ctx.fill();
      }
    }

    function update() {
      // Move small nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        // Clamp to bounds
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      }

      // Move big nodes
      for (const node of bigNodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.015;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      }
    }

    function animate() {
      update();
      draw();
      animationId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      resize();
    };

    resize();
    initNodes();
    animate();

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "#0e2a47" }}
    />
  );
}
