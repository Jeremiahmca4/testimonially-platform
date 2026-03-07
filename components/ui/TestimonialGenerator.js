'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncateToSentences(text, maxChars = 450) {
  if (text.length <= maxChars) return text;
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let result = '';
  for (const s of sentences) {
    if ((result + s).length > maxChars) break;
    result += s;
  }
  return result.trim() ? result.trim() + '…' : text.slice(0, maxChars).trim() + '…';
}

function wrapTextLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawLogo(ctx, logoImg, x, y, size) {
  if (!logoImg) return;
  // Draw circular clipped logo
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logoImg, x, y, size, size);
  ctx.restore();
}

function drawStars(ctx, rating, x, y, size, color) {
  ctx.font = `bold ${size}px serif`;
  ctx.fillStyle = color;
  ctx.fillText([1,2,3,4,5].map(i => i <= rating ? '★' : '☆').join(''), x, y);
}

function drawFooter(ctx, SIZE, PAD, name, biz, source, logoImg, textColor, subColor, badgeBg, badgeText, watermarkColor) {
  const divY = SIZE - 170;
  // Name
  ctx.font = `bold 24px sans-serif`;
  ctx.fillStyle = textColor;
  ctx.fillText(name, PAD, divY + 48);
  // Biz
  ctx.font = '17px sans-serif';
  ctx.fillStyle = subColor;
  ctx.fillText(biz, PAD, divY + 74);
  // Source badge
  ctx.fillStyle = badgeBg;
  drawRoundRect(ctx, SIZE - PAD - 168, divY + 28, 168, 36, 18);
  ctx.fill();
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = badgeText;
  ctx.fillText(`G  ${source} Review`, SIZE - PAD - 150, divY + 52);
  // Logo if provided
  if (logoImg) {
    drawLogo(ctx, logoImg, PAD, SIZE - 68, 44);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = watermarkColor;
    ctx.fillText('revora.io', PAD + 52, SIZE - 38);
  } else {
    ctx.font = '13px sans-serif';
    ctx.fillStyle = watermarkColor;
    ctx.fillText('revora.io', PAD, SIZE - 32);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'obsidian', label: 'Obsidian', preview: ['#141210','#1e1a17'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,0,SIZE,SIZE);
      bg.addColorStop(0,'#141210'); bg.addColorStop(1,'#1e1a17');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      const glow = ctx.createRadialGradient(SIZE*.85,SIZE*.15,0,SIZE*.85,SIZE*.15,380);
      glow.addColorStop(0,'rgba(245,158,11,0.12)'); glow.addColorStop(1,'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0,0,SIZE,SIZE);
      drawStars(ctx, d.rating, PAD, PAD+40, 32, '#f59e0b');
      ctx.font = 'bold 150px Georgia,serif'; ctx.fillStyle = 'rgba(245,158,11,0.15)';
      ctx.fillText('\u201C', PAD-8, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#ffffff';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+195+i*48));
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#ffffff','rgba(255,255,255,0.45)','rgba(255,255,255,0.08)','rgba(255,255,255,0.6)','rgba(255,255,255,0.2)');
    }
  },
  {
    id: 'white', label: 'Clean White', preview: ['#ffffff','#f8f7f5'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,SIZE,SIZE);
      ctx.fillStyle = '#b8922a'; ctx.fillRect(PAD, 50, 52, 5);
      drawStars(ctx, d.rating, PAD, PAD+74, 30, '#f59e0b');
      ctx.font = 'bold 110px Georgia,serif'; ctx.fillStyle = 'rgba(184,146,42,0.1)';
      ctx.fillText('\u201C', PAD-6, PAD+170);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#111111';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+210+i*48));
      ctx.strokeStyle='#e5e5e5'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#111111','#9ca3af','#f3f4f6','#6b7280','rgba(0,0,0,0.18)');
    }
  },
  {
    id: 'ember', label: 'Ember', preview: ['#7c2d12','#b45309'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,SIZE,SIZE,0);
      bg.addColorStop(0,'#7c2d12'); bg.addColorStop(1,'#b45309');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      drawStars(ctx, d.rating, PAD, PAD+40, 30, '#fde68a');
      ctx.font = 'bold 150px Georgia,serif'; ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillText('\u201C', PAD-8, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#fff7ed';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+195+i*48));
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#ffffff','rgba(255,255,255,0.55)','rgba(0,0,0,0.2)','rgba(255,255,255,0.7)','rgba(255,255,255,0.25)');
    }
  },
  {
    id: 'slate', label: 'Slate', preview: ['#1e293b','#334155'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,0,SIZE,SIZE);
      bg.addColorStop(0,'#1e293b'); bg.addColorStop(1,'#334155');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      ctx.fillStyle = '#14b8a6'; ctx.fillRect(PAD, 50, 56, 4);
      drawStars(ctx, d.rating, PAD, PAD+74, 30, '#f59e0b');
      ctx.font = 'bold 140px Georgia,serif'; ctx.fillStyle = 'rgba(20,184,166,0.15)';
      ctx.fillText('\u201C', PAD-8, PAD+160);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#f1f5f9';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+200+i*48));
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#f1f5f9','rgba(241,245,249,0.45)','rgba(20,184,166,0.15)','#5eead4','rgba(255,255,255,0.2)');
    }
  },
  {
    id: 'bold', label: 'Bold Type', preview: ['#f9fafb','#f3f4f6'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#f9fafb'; ctx.fillRect(0,0,SIZE,SIZE);
      ctx.fillStyle = '#111827'; ctx.fillRect(0,0,10,SIZE);
      ctx.font = 'bold 260px Georgia,serif'; ctx.fillStyle = '#111827';
      ctx.textAlign = 'right';
      ctx.fillText('\u201D', SIZE-24, 230);
      ctx.textAlign = 'left';
      drawStars(ctx, d.rating, PAD+10, 92, 28, '#f59e0b');
      ctx.font = 'bold 34px Georgia,serif'; ctx.fillStyle = '#111827';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2-10);
      lines.forEach((l,i) => ctx.fillText(l, PAD+10, 165+i*50));
      ctx.strokeStyle='#111827'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(PAD+10,SIZE-170); ctx.lineTo(PAD+80,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD+10,d.name,d.biz,d.source,logo,'#111827','#6b7280','#e5e7eb','#374151','rgba(0,0,0,0.2)');
    }
  },
  {
    id: 'forest', label: 'Forest', preview: ['#14532d','#166534'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,0,SIZE,SIZE);
      bg.addColorStop(0,'#14532d'); bg.addColorStop(1,'#166534');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      drawStars(ctx, d.rating, PAD, PAD+40, 30, '#bbf7d0');
      ctx.font = 'bold 150px Georgia,serif'; ctx.fillStyle = 'rgba(134,239,172,0.12)';
      ctx.fillText('\u201C', PAD-8, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#f0fdf4';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+195+i*48));
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#f0fdf4','rgba(240,253,244,0.5)','rgba(0,0,0,0.2)','#86efac','rgba(255,255,255,0.22)');
    }
  },
  {
    id: 'luxury', label: 'Luxury', preview: ['#1a1400','#2d2200'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#1a1400'; ctx.fillRect(0,0,SIZE,SIZE);
      // Gold border frame
      ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, SIZE-48, SIZE-48);
      ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(32, 32, SIZE-64, SIZE-64);
      // Corner ornaments
      const corners = [[48,48],[SIZE-48,48],[48,SIZE-48],[SIZE-48,SIZE-48]];
      corners.forEach(([cx,cy]) => {
        ctx.fillStyle = '#c9a84c';
        ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
      });
      drawStars(ctx, d.rating, PAD+8, PAD+52, 28, '#c9a84c');
      ctx.font = 'italic bold 120px Georgia,serif'; ctx.fillStyle = 'rgba(201,168,76,0.12)';
      ctx.fillText('\u201C', PAD, PAD+148);
      ctx.font = 'italic 30px Georgia,serif'; ctx.fillStyle = '#f5e6c8';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2-16);
      lines.forEach((l,i) => ctx.fillText(l, PAD+8, PAD+188+i*46));
      ctx.strokeStyle='rgba(201,168,76,0.3)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD+8,SIZE-172); ctx.lineTo(SIZE-PAD-8,SIZE-172); ctx.stroke();
      drawFooter(ctx,SIZE,PAD+8,d.name,d.biz,d.source,logo,'#f5e6c8','rgba(245,230,200,0.5)','rgba(201,168,76,0.15)','#c9a84c','rgba(201,168,76,0.4)');
    }
  },
  {
    id: 'rose', label: 'Rose', preview: ['#881337','#be185d'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,0,SIZE,SIZE);
      bg.addColorStop(0,'#881337'); bg.addColorStop(1,'#be185d');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      const glow = ctx.createRadialGradient(SIZE*.1,SIZE*.9,0,SIZE*.1,SIZE*.9,500);
      glow.addColorStop(0,'rgba(251,207,232,0.12)'); glow.addColorStop(1,'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0,0,SIZE,SIZE);
      drawStars(ctx, d.rating, PAD, PAD+40, 30, '#fda4af');
      ctx.font = 'bold 150px Georgia,serif'; ctx.fillStyle = 'rgba(253,164,175,0.15)';
      ctx.fillText('\u201C', PAD-8, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#fff1f2';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+195+i*48));
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#fff1f2','rgba(255,241,242,0.5)','rgba(0,0,0,0.2)','#fda4af','rgba(255,255,255,0.22)');
    }
  },
  {
    id: 'navy', label: 'Navy Pro', preview: ['#0f172a','#1e3a5f'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,SIZE,SIZE);
      // Side accent
      const accent = ctx.createLinearGradient(0,0,0,SIZE);
      accent.addColorStop(0,'#3b82f6'); accent.addColorStop(1,'#1d4ed8');
      ctx.fillStyle = accent; ctx.fillRect(0, 0, 8, SIZE);
      drawStars(ctx, d.rating, PAD+8, PAD+44, 30, '#f59e0b');
      ctx.font = 'bold 140px Georgia,serif'; ctx.fillStyle = 'rgba(59,130,246,0.12)';
      ctx.fillText('\u201C', PAD, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#e2e8f0';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2-8);
      lines.forEach((l,i) => ctx.fillText(l, PAD+8, PAD+195+i*48));
      ctx.strokeStyle='rgba(59,130,246,0.2)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD+8,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD+8,d.name,d.biz,d.source,logo,'#e2e8f0','rgba(226,232,240,0.45)','rgba(59,130,246,0.15)','#93c5fd','rgba(255,255,255,0.2)');
    }
  },
  {
    id: 'purple', label: 'Midnight Purple', preview: ['#1e1b4b','#4c1d95'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      const bg = ctx.createLinearGradient(0,0,SIZE,SIZE);
      bg.addColorStop(0,'#1e1b4b'); bg.addColorStop(1,'#4c1d95');
      ctx.fillStyle = bg; ctx.fillRect(0,0,SIZE,SIZE);
      const glow = ctx.createRadialGradient(SIZE*.8,SIZE*.2,0,SIZE*.8,SIZE*.2,420);
      glow.addColorStop(0,'rgba(167,139,250,0.15)'); glow.addColorStop(1,'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0,0,SIZE,SIZE);
      drawStars(ctx, d.rating, PAD, PAD+40, 30, '#c4b5fd');
      ctx.font = 'bold 150px Georgia,serif'; ctx.fillStyle = 'rgba(167,139,250,0.15)';
      ctx.fillText('\u201C', PAD-8, PAD+155);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#ede9fe';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+195+i*48));
      ctx.strokeStyle='rgba(167,139,250,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#ede9fe','rgba(237,233,254,0.5)','rgba(167,139,250,0.15)','#c4b5fd','rgba(255,255,255,0.2)');
    }
  },
  {
    id: 'newspaper', label: 'Newspaper', preview: ['#fafaf9','#e7e5e4'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#fafaf9'; ctx.fillRect(0,0,SIZE,SIZE);
      // Top thick bar
      ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 0, SIZE, 14);
      // Second thin bar
      ctx.fillStyle = '#1c1917'; ctx.fillRect(0, 22, SIZE, 3);
      drawStars(ctx, d.rating, PAD, PAD+58, 26, '#b45309');
      // Big ALL CAPS label
      ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#78716c';
      ctx.fillText('CUSTOMER REVIEW', PAD, PAD+38);
      ctx.font = 'bold 34px Georgia,serif'; ctx.fillStyle = '#1c1917';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+108+i*50));
      ctx.strokeStyle='#1c1917'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-172); ctx.lineTo(SIZE-PAD,SIZE-172); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#1c1917','#78716c','#e7e5e4','#57534e','rgba(0,0,0,0.2)');
    }
  },
  {
    id: 'neon', label: 'Neon Dark', preview: ['#020617','#0f172a'],
    render(ctx, SIZE, d, logo) {
      const PAD = 60;
      ctx.fillStyle = '#020617'; ctx.fillRect(0,0,SIZE,SIZE);
      // Neon glow blobs
      const g1 = ctx.createRadialGradient(120,120,0,120,120,300);
      g1.addColorStop(0,'rgba(34,211,238,0.08)'); g1.addColorStop(1,'transparent');
      ctx.fillStyle = g1; ctx.fillRect(0,0,SIZE,SIZE);
      const g2 = ctx.createRadialGradient(SIZE-100,SIZE-100,0,SIZE-100,SIZE-100,300);
      g2.addColorStop(0,'rgba(168,85,247,0.08)'); g2.addColorStop(1,'transparent');
      ctx.fillStyle = g2; ctx.fillRect(0,0,SIZE,SIZE);
      // Neon accent line
      const lineGrad = ctx.createLinearGradient(PAD,0,SIZE-PAD,0);
      lineGrad.addColorStop(0,'#22d3ee'); lineGrad.addColorStop(1,'#a855f7');
      ctx.strokeStyle = lineGrad; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(PAD, 56); ctx.lineTo(SIZE-PAD, 56); ctx.stroke();
      drawStars(ctx, d.rating, PAD, PAD+44, 28, '#22d3ee');
      ctx.font = 'bold 130px Georgia,serif'; ctx.fillStyle = 'rgba(34,211,238,0.08)';
      ctx.fillText('\u201C', PAD-8, PAD+148);
      ctx.font = 'bold 32px Georgia,serif'; ctx.fillStyle = '#e2e8f0';
      const lines = wrapTextLines(ctx, d.text, SIZE-PAD*2);
      lines.forEach((l,i) => ctx.fillText(l, PAD, PAD+188+i*48));
      ctx.strokeStyle='rgba(34,211,238,0.15)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(PAD,SIZE-170); ctx.lineTo(SIZE-PAD,SIZE-170); ctx.stroke();
      drawFooter(ctx,SIZE,PAD,d.name,d.biz,d.source,logo,'#e2e8f0','rgba(226,232,240,0.45)','rgba(34,211,238,0.1)','#67e8f9','rgba(255,255,255,0.18)');
    }
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TestimonialGenerator({ testimonial, restaurant, onClose }) {
  const canvasRef   = useRef(null);
  const logoInputRef = useRef(null);
  const [template,  setTemplate]  = useState('obsidian');
  const [editText,  setEditText]  = useState(() => truncateToSentences(testimonial.review_text, 450));
  const [logoImg,   setLogoImg]   = useState(null);
  const [logoName,  setLogoName]  = useState('');

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const SIZE = 800;
    canvas.width = SIZE; canvas.height = SIZE;
    const tmpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
    tmpl.render(ctx, SIZE, {
      text:   editText,
      name:   testimonial.reviewer_name || 'Anonymous',
      biz:    restaurant?.name || '',
      rating: testimonial.rating || 5,
      source: testimonial.source === 'yelp' ? 'Yelp' : testimonial.source === 'facebook' ? 'Facebook' : 'Google',
    }, logoImg);
  }, [template, editText, testimonial, restaurant, logoImg]);

  useEffect(() => { render(); }, [render]);

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => setLogoImg(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    const link   = document.createElement('a');
    link.download = `${(testimonial.reviewer_name || 'testimonial').replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}>
      <div className="min-h-full flex items-start justify-center p-6 py-10">
        <div className="card p-7 w-full" style={{ maxWidth: '940px' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Generate Graphic</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-muted)' }}>800 × 800 px · PNG · Social ready</p>
            </div>
            <button onClick={onClose} className="btn-ghost px-2 py-1.5 text-xl leading-none ml-4 flex-shrink-0">✕</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">

            {/* Canvas */}
            <div>
              <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid var(--border)' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <button onClick={handleDownload} className="btn-primary w-full py-3 text-base">↓ Download PNG</button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-5">

              {/* Template grid */}
              <div>
                <p className="field-label mb-2">Template — {TEMPLATES.find(t=>t.id===template)?.label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className="rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-150"
                      style={{
                        border: `2px solid ${template === t.id ? 'var(--ember)' : 'var(--border)'}`,
                        background: template === t.id ? 'var(--ember-soft)' : 'white',
                      }}>
                      <div className="w-full h-7 rounded-md" style={{
                        background: `linear-gradient(135deg, ${t.preview[0]}, ${t.preview[1]})`,
                        border: '1px solid rgba(0,0,0,0.08)',
                      }} />
                      <span className="text-xs font-medium leading-tight text-center" style={{
                        color: template === t.id ? 'var(--ember)' : 'var(--ink-muted)',
                        fontSize: '10px',
                      }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <p className="field-label mb-1.5">Business logo</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => logoInputRef.current?.click()}
                    className="btn-secondary text-sm px-4 py-2 flex-shrink-0">
                    {logoImg ? '↺ Change logo' : '↑ Upload logo'}
                  </button>
                  {logoImg ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
                        <img src={logoInputRef.current?.files?.[0] ? URL.createObjectURL(logoInputRef.current.files[0]) : ''} 
                          alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>{logoName}</span>
                      <button onClick={() => { setLogoImg(null); setLogoName(''); }}
                        className="text-xs flex-shrink-0" style={{ color: '#ef4444' }}>✕</button>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Appears bottom-left of graphic</p>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>

              {/* Text editor */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="field-label">Review text</p>
                  <span className="text-xs" style={{ color: editText.length > 450 ? '#ef4444' : 'var(--ink-muted)' }}>
                    {editText.length} / 450
                  </span>
                </div>
                <textarea className="field-input resize-none" rows={6}
                  value={editText} onChange={e => setEditText(e.target.value)}
                  style={{ fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.6' }}
                  placeholder="Trim the review to the best 2–3 sentences…" />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditText(truncateToSentences(testimonial.review_text, 450))}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-alt)', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>
                    ↺ Reset
                  </button>
                  <button onClick={() => setEditText(truncateToSentences(editText, 220))}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-alt)', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>
                    ✂ Trim shorter
                  </button>
                </div>
              </div>

              <button onClick={onClose} className="btn-secondary py-2.5">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
