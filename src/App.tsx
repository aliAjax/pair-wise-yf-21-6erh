import { useEffect, useMemo, useState } from "react";
import "./styles.css";

/* ---------------- 基础数据 ---------------- */

const STAGES = ["待检", "清洗", "补线", "验收"] as const;
const REWEAVE_STAGE = 2; // “补线”在工序中的位置
const ORIGINS = ["全部", "波斯", "安纳托利亚", "高加索", "藏毯"];

interface ColorCard {
  id: string;
  name: string;
  hex: string;
  note: string;
}

const COLOR_CARDS: ColorCard[] = [
  { id: "madder", name: "茜草红", hex: "#9c2b2e", note: "羊毛 · 植物染" },
  { id: "lac", name: "胭脂虫红", hex: "#a63d40", note: "丝 · 动物染" },
  { id: "indigo", name: "靛蓝", hex: "#1f3a5f", note: "羊毛 · 植物染" },
  { id: "saffron", name: "藏红花黄", hex: "#d9a441", note: "羊毛 · 植物染" },
  { id: "walnut", name: "核桃褐", hex: "#6b4a2f", note: "羊毛 · 植物染" },
  { id: "pine", name: "松烟绿", hex: "#3f5d50", note: "羊毛 · 矿物染" },
  { id: "ivory", name: "象牙白", hex: "#e8e0cf", note: "棉 · 原色" },
  { id: "teal", name: "松石青", hex: "#0f766e", note: "丝 · 植物染" },
];

interface Damage {
  id: string;
  x: number; // 0-100，纹样图横向百分比
  y: number; // 0-100，纹样图纵向百分比
}

interface StageLog {
  stage: number;
  time: string;
}

interface Carpet {
  id: string;
  code: string;
  origin: string;
  era: string;
  knotDensity: string;
  material: string;
  dyeType: string;
  summary: string;
  damages: Damage[];
  threadId: string | null;
  stage: number;
  log: StageLog[];
}

const INITIAL_CARPETS: Carpet[] = [
  {
    id: "car-092",
    code: "CAR-092",
    origin: "波斯",
    era: "约1960s",
    knotDensity: "38 结/厘米",
    material: "羊毛",
    dyeType: "植物染",
    summary: "边缘磨损，待补线",
    damages: [],
    threadId: null,
    stage: 0,
    log: [],
  },
  {
    id: "car-117",
    code: "CAR-117",
    origin: "安纳托利亚",
    era: "约1930s",
    knotDensity: "42 结/厘米",
    material: "羊毛",
    dyeType: "植物染",
    summary: "中心纹样缺口",
    damages: [],
    threadId: null,
    stage: 0,
    log: [],
  },
  {
    id: "car-138",
    code: "CAR-138",
    origin: "藏毯",
    era: "约1970s",
    knotDensity: "30 结/厘米",
    material: "牦牛毛",
    dyeType: "植物染",
    summary: "局部褪色，需匹配靛蓝色卡",
    damages: [{ id: "d-138-1", x: 62, y: 30 }],
    threadId: "indigo",
    stage: 1,
    log: [{ stage: 1, time: "2026-09-21 09:40:12" }],
  },
  {
    id: "car-121",
    code: "CAR-121",
    origin: "高加索",
    era: "约1950s",
    knotDensity: "36 结/厘米",
    material: "羊毛",
    dyeType: "植物染",
    summary: "几何纹边缘虫蛀",
    damages: [],
    threadId: null,
    stage: 0,
    log: [],
  },
  {
    id: "car-105",
    code: "CAR-105",
    origin: "波斯",
    era: "约1880s",
    knotDensity: "55 结/厘米",
    material: "丝毛混纺",
    dyeType: "植物染",
    summary: "中央奖章纹断裂，已配茜草红补线",
    damages: [
      { id: "d-105-1", x: 46, y: 44 },
      { id: "d-105-2", x: 55, y: 58 },
    ],
    threadId: "madder",
    stage: 2,
    log: [
      { stage: 1, time: "2026-09-20 10:24:41" },
      { stage: 2, time: "2026-09-23 15:02:08" },
    ],
  },
  {
    id: "car-144",
    code: "CAR-144",
    origin: "藏毯",
    era: "约1980s",
    knotDensity: "28 结/厘米",
    material: "羊毛",
    dyeType: "植物染",
    summary: "角部烫伤，待定损",
    damages: [],
    threadId: null,
    stage: 0,
    log: [],
  },
];

/* ---------------- 本地持久化 ---------------- */

const STORAGE_KEY = "carpet-workshop-v1";

interface Persisted {
  carpets: Carpet[];
  selectedId: string;
  filter: string;
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (!Array.isArray(data.carpets)) return null;
    return data;
  } catch {
    return null;
  }
}

/* ---------------- 纹样图（按档案编号生成） ---------------- */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RUG_PALETTES = [
  { border: "#5f1f16", ground: "#efe6d4", field: "#7c2d12", motif: "#d9a441", accent: "#0f766e" },
  { border: "#1f3a5f", ground: "#e9e2d0", field: "#274b73", motif: "#c8b28a", accent: "#9c2b2e" },
  { border: "#31473c", ground: "#f0e9da", field: "#3f5d50", motif: "#d9a441", accent: "#a63d40" },
  { border: "#6b4a2f", ground: "#ece2cc", field: "#8a5a2b", motif: "#1f3a5f", accent: "#e8e0cf" },
];

interface RugPatternProps {
  seed: string;
  damages: Damage[];
  onAddDamage: (x: number, y: number) => void;
  onRemoveDamage: (id: string) => void;
}

function RugPattern({ seed, damages, onAddDamage, onRemoveDamage }: RugPatternProps) {
  const { palette, motifs, ticks } = useMemo(() => {
    const rand = mulberry32(hashSeed(seed));
    const palette = RUG_PALETTES[Math.floor(rand() * RUG_PALETTES.length)];

    // 主区域散点纹样（避开中央奖章纹）
    const motifs: { x: number; y: number; s: number; color: string }[] = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        const x = 76 + col * 62 + (rand() - 0.5) * 10;
        const y = 96 + row * 55 + (rand() - 0.5) * 10;
        if (Math.abs(x - 200) < 78 && Math.abs(y - 260) < 96) continue;
        motifs.push({
          x,
          y,
          s: 8 + rand() * 5,
          color: rand() > 0.45 ? palette.motif : palette.accent,
        });
      }
    }

    // 边框上的装饰小菱格
    const ticks: { x: number; y: number; color: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const x = 34 + i * 30;
      ticks.push({ x, y: 13, color: i % 2 ? palette.motif : palette.ground });
      ticks.push({ x, y: 507, color: i % 2 ? palette.ground : palette.motif });
    }
    return { palette, motifs, ticks };
  }, [seed]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onAddDamage(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100
    );
  };

  return (
    <svg viewBox="0 0 400 520" className="rug-map" onClick={handleClick} role="img" aria-label="纹样标记图">
      {/* 外框与底 */}
      <rect x="4" y="4" width="392" height="512" rx="8" fill={palette.border} />
      {ticks.map((t, i) => (
        <polygon key={i} points={`${t.x},${t.y - 6} ${t.x + 6},${t.y} ${t.x},${t.y + 6} ${t.x - 6},${t.y}`} fill={t.color} opacity="0.9" />
      ))}
      <rect x="22" y="22" width="356" height="476" fill={palette.ground} />
      <rect x="30" y="30" width="340" height="460" fill="none" stroke={palette.motif} strokeWidth="2" opacity="0.7" />
      <rect x="38" y="38" width="324" height="444" fill={palette.field} />

      {/* 四角三角纹 */}
      <polygon points="38,38 104,38 38,104" fill={palette.accent} opacity="0.55" />
      <polygon points="362,38 296,38 362,104" fill={palette.accent} opacity="0.55" />
      <polygon points="38,482 104,482 38,416" fill={palette.accent} opacity="0.55" />
      <polygon points="362,482 296,482 362,416" fill={palette.accent} opacity="0.55" />

      {/* 散点菱格 */}
      {motifs.map((m, i) => (
        <g key={i}>
          <polygon points={`${m.x},${m.y - m.s} ${m.x + m.s},${m.y} ${m.x},${m.y + m.s} ${m.x - m.s},${m.y}`} fill={m.color} opacity="0.9" />
          <circle cx={m.x} cy={m.y} r={m.s / 3.2} fill={palette.ground} />
        </g>
      ))}

      {/* 中央奖章纹 */}
      <polygon points="200,148 302,260 200,372 98,260" fill={palette.accent} opacity="0.85" />
      <polygon points="200,184 270,260 200,336 130,260" fill={palette.ground} />
      <polygon points="200,214 240,260 200,306 160,260" fill={palette.motif} />
      <circle cx="200" cy="260" r="11" fill={palette.border} />

      {/* 破损标记 */}
      {damages.map((d, i) => {
        const cx = (d.x / 100) * 400;
        const cy = (d.y / 100) * 520;
        return (
          <g
            key={d.id}
            className="damage-marker"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveDamage(d.id);
            }}
          >
            <circle cx={cx} cy={cy} r="13" fill="#b91c1c" fillOpacity="0.94" stroke="#ffffff" strokeWidth="2.5" />
            <path
              d={`M ${cx - 5} ${cy - 5} L ${cx + 5} ${cy + 5} M ${cx + 5} ${cy - 5} L ${cx - 5} ${cy + 5}`}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <text x={cx} y={cy - 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">
              {i + 1}
            </text>
            <title>破损点 {i + 1}，点击移除</title>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- 主应用 ---------------- */

function App() {
  const [persisted] = useState(loadPersisted);
  const [carpets, setCarpets] = useState<Carpet[]>(persisted?.carpets ?? INITIAL_CARPETS);
  const [selectedId, setSelectedId] = useState<string>(persisted?.selectedId ?? INITIAL_CARPETS[0].id);
  const [filter, setFilter] = useState<string>(persisted?.filter ?? "全部");

  // 任何改动都写回本机，刷新/重开后原样恢复
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ carpets, selectedId, filter }));
    } catch {
      /* 存储不可用时静默跳过 */
    }
  }, [carpets, selectedId, filter]);

  const visible = filter === "全部" ? carpets : carpets.filter((c) => c.origin === filter);
  const current = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;
  const currentThread = current ? COLOR_CARDS.find((t) => t.id === current.threadId) ?? null : null;

  const updateCarpet = (id: string, patch: (c: Carpet) => Carpet) =>
    setCarpets((prev) => prev.map((c) => (c.id === id ? patch(c) : c)));

  const addDamage = (x: number, y: number) => {
    if (!current) return;
    const damage: Damage = {
      id: `d-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
    updateCarpet(current.id, (c) => ({ ...c, damages: [...c.damages, damage] }));
  };

  const removeDamage = (damageId: string) => {
    if (!current) return;
    updateCarpet(current.id, (c) => ({ ...c, damages: c.damages.filter((d) => d.id !== damageId) }));
  };

  const toggleThread = (threadId: string) => {
    if (!current) return;
    updateCarpet(current.id, (c) => ({ ...c, threadId: c.threadId === threadId ? null : threadId }));
  };

  const goStage = (dir: 1 | -1) => {
    if (!current) return;
    const next = current.stage + dir;
    if (next < 0 || next >= STAGES.length) return;
    if (next === REWEAVE_STAGE && !current.threadId) return; // 未匹配色卡不能进入补线
    const time = new Date().toLocaleString("zh-CN", { hour12: false });
    updateCarpet(current.id, (c) => ({ ...c, stage: next, log: [...c.log, { stage: next, time }] }));
  };

  const nextStage = current ? current.stage + 1 : 0;
  const blockedByThread = !!current && nextStage === REWEAVE_STAGE && !current.threadId;

  const doneCount = carpets.filter((c) => c.stage === STAGES.length - 1).length;
  const metrics = [
    { label: "待修复", value: String(carpets.length - doneCount) },
    { label: "纹样档案", value: String(carpets.length) },
    { label: "色卡数量", value: String(COLOR_CARDS.length) },
    { label: "完工率", value: `${Math.round((doneCount / carpets.length) * 100)}%` },
  ];

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62009 · 手工地毯修复工作台</p>
        <h1>地毯修复纹样档案</h1>
        <span>
          按产地筛选档案并选中地毯后，在纹样图上点击即可标出破损位置；从材料色卡匹配补线，工序依次走过待检、清洗、补线、验收——未匹配色卡的档案不能进入补线。所有标记与进度自动保存在本机，关掉页面再打开也不会丢。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <aside className="panel">
          <h2>档案筛选</h2>
          <div className="chips">
            {ORIGINS.map((origin) => (
              <button
                key={origin}
                className={filter === origin ? "active" : ""}
                onClick={() => setFilter(origin)}
              >
                {origin}
              </button>
            ))}
          </div>

          <div className="archive-list">
            {visible.map((c) => (
              <button
                key={c.id}
                className={`archive-item ${current?.id === c.id ? "active" : ""}`}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="row">
                  <span className="code">{c.code}</span>
                  <span className={`stage-badge stage-${c.stage}`}>{STAGES[c.stage]}</span>
                </span>
                <span className="meta">
                  {c.origin} · {c.era} · {c.material}
                </span>
                <span className="meta">
                  破损 {c.damages.length} 处
                  {c.threadId
                    ? ` · 补线 ${COLOR_CARDS.find((t) => t.id === c.threadId)?.name ?? ""}`
                    : " · 未配色卡"}
                </span>
              </button>
            ))}
            {visible.length === 0 && <p className="hint">该产地暂无档案。</p>}
          </div>
        </aside>

        {current && (
          <section className="panel workbench">
            <div className="heading">
              <div>
                <p>{current.code} · {current.origin}</p>
                <h2>修复工作台</h2>
              </div>
              <span className={`stage-badge stage-${current.stage}`}>当前工序：{STAGES[current.stage]}</span>
            </div>

            <div className="info-grid">
              <div className="cell"><small>地毯产地</small><b>{current.origin}</b></div>
              <div className="cell"><small>年代</small><b>{current.era}</b></div>
              <div className="cell"><small>结密度</small><b>{current.knotDensity}</b></div>
              <div className="cell"><small>材质</small><b>{current.material}</b></div>
              <div className="cell"><small>染色类型</small><b>{current.dyeType}</b></div>
              <div className="cell"><small>破损区域概况</small><b>{current.summary}</b></div>
            </div>

            <div className="workbench-grid">
              <div>
                <h3>纹样标记图</h3>
                <RugPattern
                  seed={current.code}
                  damages={current.damages}
                  onAddDamage={addDamage}
                  onRemoveDamage={removeDamage}
                />
                <p className="hint">在纹样图上点击即可标记破损位置；点击红色标记可移除。</p>
                <div className="damage-list">
                  {current.damages.map((d, i) => (
                    <div className="damage-item" key={d.id}>
                      <span>
                        破损点 {i + 1} · 横向 {d.x.toFixed(0)}% / 纵向 {d.y.toFixed(0)}%
                      </span>
                      <button onClick={() => removeDamage(d.id)}>移除</button>
                    </div>
                  ))}
                  {current.damages.length === 0 && <p className="hint">尚未标记破损位置。</p>}
                </div>
              </div>

              <div className="side">
                <section>
                  <h3>材料色卡 · 匹配补线</h3>
                  <div className="swatches">
                    {COLOR_CARDS.map((card) => (
                      <button
                        key={card.id}
                        className={`swatch ${current.threadId === card.id ? "selected" : ""}`}
                        onClick={() => toggleThread(card.id)}
                      >
                        <span className="chip" style={{ background: card.hex }} />
                        <span className="name">{card.name}</span>
                        <span className="note">{card.note}</span>
                      </button>
                    ))}
                  </div>
                  {currentThread ? (
                    <p className="hint">
                      <span className="thread-chip">
                        <span className="dot" style={{ background: currentThread.hex }} />
                        已匹配补线：{currentThread.name} {currentThread.hex}
                      </span>
                      （再次点击色卡可取消）
                    </p>
                  ) : (
                    <p className="hint warning">尚未匹配补线色卡，该档案不能进入补线工序。</p>
                  )}
                </section>

                <section>
                  <h3>修复工序</h3>
                  <ol className="steps">
                    {STAGES.map((name, i) => {
                      const state = i < current.stage ? "done" : i === current.stage ? "current" : "todo";
                      return (
                        <li key={name} className={`step ${state}`}>
                          <span className="dot">{i < current.stage ? "✓" : i + 1}</span>
                          <span className="name">{name}</span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="stage-actions">
                    <button onClick={() => goStage(-1)} disabled={current.stage === 0}>
                      上一步
                    </button>
                    <button
                      className="primary"
                      onClick={() => goStage(1)}
                      disabled={current.stage === STAGES.length - 1 || blockedByThread}
                    >
                      {current.stage === STAGES.length - 1 ? "已验收完工" : `进入${STAGES[nextStage]}`}
                    </button>
                  </div>
                  {blockedByThread && (
                    <p className="hint warning">⚠ 未匹配材料色卡，不能进入补线工序。</p>
                  )}
                  {current.log.length > 0 && (
                    <ul className="log-list">
                      {[...current.log].reverse().map((entry, i) => (
                        <li key={i}>
                          <b>{STAGES[entry.stage]}</b>
                          <span>{entry.time}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
