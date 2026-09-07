import lineData from '@/public/data/constellation-lines.json';
export default function OrionDiagram() {
  const orion = lineData.features.find((c) => c.id === 'Ori')!;
  const project = (p: number[]) => [180 - (p[0] - 83.8) * 5.2, 96 - p[1] * 4.5];
  const dots = new Map<string, number[]>();
  orion.geometry.coordinates.flat().forEach((p) => dots.set(p.join(','), p));
  return (
    <svg
      className="orion-diagram"
      viewBox="0 0 360 205"
      role="img"
      aria-label="Orion constellation diagram using catalog star directions"
    >
      <defs>
        <filter id="star-glow">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      {orion.geometry.coordinates.map((line, i) => (
        <polyline
          key={i}
          points={line.map((p) => project(p).join(',')).join(' ')}
          fill="none"
          stroke="#7eaabe"
          strokeWidth=".8"
          opacity=".6"
        />
      ))}
      {[...dots.values()].map((p, i) => {
        const [x, y] = project(p);
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="#bce0f1"
              opacity=".55"
              filter="url(#star-glow)"
            />
            <circle cx={x} cy={y} r="1.4" fill="#d4e7ef" />
          </g>
        );
      })}
      <text x="245" y="164" fill="#78929f" fontSize="9" letterSpacing="2">
        ORION
      </text>
    </svg>
  );
}
