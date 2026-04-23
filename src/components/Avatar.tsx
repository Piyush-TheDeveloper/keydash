"use client";
const PAIRS = [["#e74c3c","#c0392b"],["#e67e22","#d35400"],["#2ecc71","#27ae60"],["#3498db","#2980b9"],["#a855f7","#7c3aed"],["#1abc9c","#16a085"],["#f39c12","#d68910"],["#22d3ee","#0891b2"],["#f472b6","#db2777"],["#c77dff","#9333ea"]];

export default function Avatar({ seed, size = 26, border }: { seed: number; size?: number; border?: string }) {
  const c = PAIRS[Math.abs(seed) % PAIRS.length];
  const h = size / 2, q = size / 4, p = Math.abs(seed * 7) % 5;
  let inner = "";
  if (p === 0) inner = `<circle cx="${h}" cy="${h}" r="${q}" fill="${c[0]}"/><circle cx="${q}" cy="${q}" r="${q * .6}" fill="${c[0]}" opacity=".5"/>`;
  if (p === 1) inner = `<rect x="0" y="0" width="${h}" height="${size}" fill="${c[0]}"/><circle cx="${h}" cy="${h}" r="${q * .7}" fill="${c[1]}"/>`;
  if (p === 2) inner = `<polygon points="${h},${q} ${size - q},${size - q} ${q},${size - q}" fill="${c[0]}"/>`;
  if (p === 3) inner = `<rect x="${q * .4}" y="${q * .4}" width="${h}" height="${h}" fill="${c[0]}" rx="4"/><rect x="${q * 1.4}" y="${q * 1.4}" width="${h}" height="${h}" fill="${c[0]}" opacity=".4" rx="4"/>`;
  if (p === 4) inner = `<circle cx="${q}" cy="${h}" r="${q * .8}" fill="${c[0]}"/><circle cx="${h + q}" cy="${h}" r="${q * .8}" fill="${c[0]}" opacity=".6"/>`;
  return <div style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `2px solid ${border || "rgba(255,255,255,0.08)"}` }} dangerouslySetInnerHTML={{ __html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${c[1]}" rx="2"/>${inner}</svg>` }} />;
}
