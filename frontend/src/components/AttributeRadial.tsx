"use client";

/** Diagrama radial de atributos (pentagrama quando V5). Compartilhado entre edição e visualização. */
export function AttributeRadial({ names, values, pentagram }: {
  names: string[]; values: Record<string, number>; pentagram: boolean;
}) {
  const size = 230, c = size / 2, R = 86, max = 5, n = names.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [c + r * Math.cos(ang(i)), c + r * Math.sin(ang(i))];
  const rings = [1, 2, 3, 4, 5].map((lvl) => names.map((_, i) => pt(i, (lvl / max) * R).join(",")).join(" "));
  const valPoly = names.map((nm, i) => pt(i, ((values[nm] ?? 0) / max) * R).join(",")).join(" ");
  const starPts = pentagram ? [0, 2, 4, 1, 3].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; return [c + R * Math.cos(a), c + R * Math.sin(a)].join(",");
  }).join(" ") : "";
  return (
    <svg className="radial" width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="attr-radial" role="img" aria-label="diagrama de atributos">
      {rings.map((p, i) => <polygon key={i} points={p} className="radial-ring" />)}
      {names.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radial-axis" />; })}
      {pentagram && <polygon points={starPts} className="radial-star" />}
      <polygon points={valPoly} className="radial-val" />
      {names.map((nm, i) => { const [x, y] = pt(i, R + 14); return <text key={nm} x={x} y={y} className="radial-label" textAnchor="middle" dominantBaseline="middle">{abbr(nm)}</text>; })}
    </svg>
  );
}

function abbr(s: string): string { return s.slice(0, 3).toUpperCase(); }
