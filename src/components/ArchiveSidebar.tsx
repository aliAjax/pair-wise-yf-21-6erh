import { useState } from "react";
import { ORIGINS } from "../data";
import { DAMAGE_COLORS, MOTIF_LABELS, STAGES, type Carpet, type Motif } from "../types";
import type { NewCarpetInput } from "../state/useArchive";

interface ArchiveSidebarProps {
  carpets: Carpet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (input: NewCarpetInput) => void;
}

const MOTIFS: Motif[] = ["medallion", "geometric", "floral", "striped"];

function StageDot({ stage }: { stage: string }) {
  return (
    <span className="stage-dot" title={`工序：${stage}`}>
      {STAGES.map((s) => (
        <i key={s} className={STAGES.indexOf(stage as (typeof STAGES)[number]) >= STAGES.indexOf(s) ? "on" : ""} />
      ))}
    </span>
  );
}

export default function ArchiveSidebar({ carpets, selectedId, onSelect, onCreate }: ArchiveSidebarProps) {
  const [origin, setOrigin] = useState<string>("全部");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCarpetInput>({
    origin: "波斯",
    era: "",
    density: "",
    material: "",
    dye: "",
    motif: "medallion",
    summary: "",
  });

  const filtered = origin === "全部" ? carpets : carpets.filter((c) => c.origin === origin);

  const submit = () => {
    onCreate(form);
    setForm({ origin: form.origin, era: "", density: "", material: "", dye: "", motif: "medallion", summary: "" });
    setOrigin("全部");
    setShowForm(false);
  };

  return (
    <aside className="sidebar panel">
      <div className="heading compact">
        <div>
          <p>档案库</p>
          <h2>按产地筛选</h2>
        </div>
        <button type="button" className="primary small" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "收起" : "收毯录入"}
        </button>
      </div>

      <div className="chips origin-chips">
        {ORIGINS.map((item) => (
          <button
            key={item}
            type="button"
            className={origin === item ? "active" : ""}
            onClick={() => setOrigin(item)}
          >
            {item}
            {item !== "全部" && <em>{carpets.filter((c) => c.origin === item).length}</em>}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="intake">
          <label>
            <span>地毯产地</span>
            <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })}>
              {ORIGINS.filter((o) => o !== "全部").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <div className="intake-row">
            <label>
              <span>年代</span>
              <input placeholder="如 约1960s" value={form.era} onChange={(e) => setForm({ ...form, era: e.target.value })} />
            </label>
            <label>
              <span>结密度</span>
              <input placeholder="如 40 结/平方英寸" value={form.density} onChange={(e) => setForm({ ...form, density: e.target.value })} />
            </label>
          </div>
          <div className="intake-row">
            <label>
              <span>材质</span>
              <input placeholder="如 羊毛" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
            </label>
            <label>
              <span>染色类型</span>
              <input placeholder="如 植物染" value={form.dye} onChange={(e) => setForm({ ...form, dye: e.target.value })} />
            </label>
          </div>
          <label>
            <span>纹样类型</span>
            <select value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value as Motif })}>
              {MOTIFS.map((m) => (
                <option key={m} value={m}>
                  {MOTIF_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>初检备注</span>
            <textarea
              rows={2}
              placeholder="收毯时观察到的破损情况"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </label>
          <button type="button" className="primary" onClick={submit}>
            建档并选中
          </button>
        </div>
      )}

      <ul className="archive-list">
        {filtered.map((c) => {
          const blocked = STAGES.indexOf(c.stage) < STAGES.indexOf("补线") && !c.threadId;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={c.id === selectedId ? "archive-item selected" : "archive-item"}
                onClick={() => onSelect(c.id)}
              >
                <div className="archive-item-head">
                  <b>{c.id}</b>
                  <span className={`stage-tag stage-${c.stage}`}>{c.stage}</span>
                </div>
                <p>
                  {c.origin} · {c.era} · {MOTIF_LABELS[c.motif]}
                </p>
                <div className="archive-item-foot">
                  <StageDot stage={c.stage} />
                  <span className="item-badges">
                    {c.marks.slice(0, 4).map((m) => (
                      <i key={m.id} style={{ background: DAMAGE_COLORS[m.type] }} title={m.type} />
                    ))}
                    {c.threadId ? <em className="thread-ok">已配色卡</em> : blocked ? <em className="thread-miss">缺色卡</em> : null}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="empty">该产地暂无档案，可用上方「收毯录入」建档。</li>}
      </ul>
    </aside>
  );
}
