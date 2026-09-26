import { useRef, useState } from "react";
import { DAMAGE_COLORS, DAMAGE_TYPES, type DamageMark, type DamageType, type Motif } from "../types";

interface PatternBoardProps {
  motif: Motif;
  marks: DamageMark[];
  activeType: DamageType;
  onTypeChange: (type: DamageType) => void;
  onAddMark: (x: number, y: number, type: DamageType, note: string) => void;
  onRemoveMark: (markId: string) => void;
}

function MotifSvg({ motif }: { motif: Motif }) {
  if (motif === "medallion") {
    return (
      <g>
        <rect x="0" y="0" width="400" height="300" fill="#7c2d12" />
        <rect x="14" y="14" width="372" height="272" fill="none" stroke="#e7d7b8" strokeWidth="5" />
        <rect x="26" y="26" width="348" height="248" fill="none" stroke="#ca8a04" strokeWidth="2" strokeDasharray="8 6" />
        <ellipse cx="200" cy="150" rx="92" ry="70" fill="#0f766e" />
        <ellipse cx="200" cy="150" rx="62" ry="46" fill="none" stroke="#efe7d2" strokeWidth="3" />
        <ellipse cx="200" cy="150" rx="30" ry="22" fill="#b45309" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="200"
            cy="92"
            rx="10"
            ry="22"
            fill="#ca8a04"
            transform={`rotate(${deg} 200 150)`}
          />
        ))}
        {[70, 200, 330].map((x) => (
          <g key={x}>
            <circle cx={x} cy={70} r="13" fill="#0f766e" />
            <circle cx={x} cy={230} r="13" fill="#0f766e" />
            <path d={`M${x - 10} 70 q10 -14 20 0 q-10 14 -20 0`} fill="#efe7d2" opacity="0.8" />
            <path d={`M${x - 10} 230 q10 14 20 0 q-10 -14 -20 0`} fill="#efe7d2" opacity="0.8" />
          </g>
        ))}
      </g>
    );
  }

  if (motif === "geometric") {
    const cells: { x: number; y: number }[] = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        cells.push({ x: 56 + col * 58 + (row % 2 ? 29 : 0), y: 62 + row * 60 });
      }
    }
    return (
      <g>
        <rect x="0" y="0" width="400" height="300" fill="#1e3a8a" />
        <rect x="12" y="12" width="376" height="276" fill="none" stroke="#efe7d2" strokeWidth="6" />
        {cells.map((cell, i) => (
          <g key={i}>
            <polygon
              points={`${cell.x},${cell.y - 20} ${cell.x + 18},${cell.y} ${cell.x},${cell.y + 20} ${cell.x - 18},${cell.y}`}
              fill={i % 3 === 0 ? "#b45309" : i % 3 === 1 ? "#ca8a04" : "#0f766e"}
              stroke="#efe7d2"
              strokeWidth="1.5"
            />
            <polygon
              points={`${cell.x},${cell.y - 7} ${cell.x + 6},${cell.y} ${cell.x},${cell.y + 7} ${cell.x - 6},${cell.y}`}
              fill="#efe7d2"
            />
          </g>
        ))}
      </g>
    );
  }

  if (motif === "floral") {
    return (
      <g>
        <rect x="0" y="0" width="400" height="300" fill="#0f4c5c" />
        <rect x="12" y="12" width="376" height="276" fill="none" stroke="#ca8a04" strokeWidth="5" />
        <path d="M30 240 q80 -70 170 -20 t170 -30" fill="none" stroke="#4d8b7d" strokeWidth="5" />
        <path d="M30 90 q90 60 180 10 t160 40" fill="none" stroke="#4d8b7d" strokeWidth="5" />
        {[
          [90, 110],
          [200, 80],
          [310, 120],
          [140, 200],
          [270, 190],
          [200, 150],
        ].map(([cx, cy], i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx={cx}
                cy={cy - 12}
                rx="7"
                ry="13"
                fill={i % 2 ? "#9f1239" : "#ca8a04"}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            ))}
            <circle cx={cx} cy={cy} r="6" fill="#efe7d2" />
          </g>
        ))}
      </g>
    );
  }

  // striped
  return (
    <g>
      <rect x="0" y="0" width="400" height="300" fill="#efe7d2" />
      {[
        [0, 26, "#7c2d12"],
        [26, 14, "#ca8a04"],
        [40, 52, "#1e3a8a"],
        [92, 12, "#b45309"],
        [104, 84, "#0f766e"],
        [188, 14, "#ca8a04"],
        [202, 56, "#7c2d12"],
        [258, 16, "#1e3a8a"],
        [274, 26, "#b45309"],
      ].map(([y, h, fill], i) => (
        <rect key={i} x="18" y={y as number} width="364" height={h as number} fill={fill as string} />
      ))}
      {[60, 140, 225].map((y) =>
        [90, 200, 310].map((x) => (
          <polygon
            key={`${x}-${y}`}
            points={`${x},${y - 9} ${x + 8},${y} ${x},${y + 9} ${x - 8},${y}`}
            fill="#efe7d2"
            opacity="0.9"
          />
        )),
      )}
    </g>
  );
}

export default function PatternBoard({
  motif,
  marks,
  activeType,
  onTypeChange,
  onAddMark,
  onRemoveMark,
}: PatternBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<{ x: number; y: number; note: string } | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
    setPending({ x: Math.min(98, Math.max(2, x)), y: Math.min(97, Math.max(3, y)), note: "" });
  };

  const confirmMark = () => {
    if (!pending) return;
    onAddMark(pending.x, pending.y, activeType, pending.note.trim());
    setPending(null);
  };

  return (
    <div className="pattern">
      <div className="damage-types">
        {DAMAGE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={activeType === type ? "damage-type active" : "damage-type"}
            onClick={() => onTypeChange(type)}
          >
            <i style={{ background: DAMAGE_COLORS[type] }} />
            {type}
          </button>
        ))}
      </div>
      <div
        className="pattern-board"
        ref={boardRef}
        onClick={handleClick}
        role="img"
        aria-label="纹样标记图，点击空白处添加破损点"
      >
        <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="motif-svg">
          <MotifSvg motif={motif} />
        </svg>

        {marks.map((mark, index) => (
          <button
            type="button"
            key={mark.id}
            className="mark-pin"
            style={{ left: `${mark.x}%`, top: `${mark.y}%`, ["--pin" as string]: DAMAGE_COLORS[mark.type] }}
            title={`${mark.type}${mark.note ? ` · ${mark.note}` : ""}（点击移除）`}
            onClick={(event) => {
              event.stopPropagation();
              onRemoveMark(mark.id);
            }}
          >
            {index + 1}
          </button>
        ))}

        {pending && (
          <div
            className={`pending-pop${pending.y < 28 ? " below" : ""}`}
            style={{ left: `${Math.min(80, Math.max(20, pending.x))}%`, top: `${pending.y}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <p>
              标记{activeType} · {pending.x.toFixed(1)}, {pending.y.toFixed(1)}
            </p>
            <input
              autoFocus
              placeholder="破损备注（可选），如：绒头缺失约2cm"
              value={pending.note}
              onChange={(e) => setPending((p) => (p ? { ...p, note: e.target.value } : p))}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmMark();
                if (e.key === "Escape") setPending(null);
              }}
            />
            <div className="pending-actions">
              <button type="button" className="primary small" onClick={confirmMark}>
                落点
              </button>
              <button type="button" className="small" onClick={() => setPending(null)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="board-hint">在纹样图空白处点击即可标出破损位置；点已有的编号标记可移除。</p>
    </div>
  );
}
