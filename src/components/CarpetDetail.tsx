import { useState } from "react";
import { DAMAGE_COLORS, MOTIF_LABELS, type Carpet, type DamageType } from "../types";
import PatternBoard from "./PatternBoard";
import ThreadPalette from "./ThreadPalette";
import Workflow from "./Workflow";

interface CarpetDetailProps {
  carpet: Carpet;
  onAddMark: (x: number, y: number, type: DamageType, note: string) => void;
  onRemoveMark: (markId: string) => void;
  onMatchThread: (threadId: string, threadName: string) => void;
  onUnmatchThread: () => void;
  onAdvance: () => void;
  onRevert: () => void;
}

function formatTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CarpetDetail({
  carpet,
  onAddMark,
  onRemoveMark,
  onMatchThread,
  onUnmatchThread,
  onAdvance,
  onRevert,
}: CarpetDetailProps) {
  const [damageType, setDamageType] = useState<DamageType>("磨损");
  const stageIndex = ["待检", "清洗", "补线", "验收"].indexOf(carpet.stage);
  const threadLocked = stageIndex >= 2;

  return (
    <section className="detail">
      <header className="panel detail-head">
        <div>
          <p className="eyebrow">
            {carpet.origin} · {MOTIF_LABELS[carpet.motif]}
          </p>
          <h2>
            {carpet.id}
            <span className={`stage-tag stage-${carpet.stage}`}>{carpet.stage}</span>
          </h2>
          <p className="summary">{carpet.summary}</p>
        </div>
        <dl className="meta-grid">
          <div>
            <dt>年代</dt>
            <dd>{carpet.era}</dd>
          </div>
          <div>
            <dt>结密度</dt>
            <dd>{carpet.density}</dd>
          </div>
          <div>
            <dt>材质</dt>
            <dd>{carpet.material}</dd>
          </div>
          <div>
            <dt>染色类型</dt>
            <dd>{carpet.dye}</dd>
          </div>
        </dl>
      </header>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel subpanel">
            <div className="heading compact">
              <div>
                <p>纹样局部标记图</p>
                <h2>破损位置定损</h2>
              </div>
              <span className="mark-count">已标记 {carpet.marks.length} 处</span>
            </div>
            <PatternBoard
              motif={carpet.motif}
              marks={carpet.marks}
              activeType={damageType}
              onTypeChange={setDamageType}
              onAddMark={(x, y, type, note) => onAddMark(x, y, type, note)}
              onRemoveMark={onRemoveMark}
            />
            <ul className="mark-list">
              {carpet.marks.map((mark, index) => (
                <li key={mark.id}>
                  <span className="mark-index" style={{ ["--pin" as string]: DAMAGE_COLORS[mark.type] }}>
                    {index + 1}
                  </span>
                  <div>
                    <b>
                      {mark.type}
                      <em>
                        ({mark.x.toFixed(1)}, {mark.y.toFixed(1)})
                      </em>
                    </b>
                    <p>{mark.note || "未填写备注"}</p>
                  </div>
                  <button type="button" className="link-btn danger" onClick={() => onRemoveMark(mark.id)}>
                    移除
                  </button>
                </li>
              ))}
              {carpet.marks.length === 0 && <li className="empty">还没有定损点，在上方纹样图上点击添加。</li>}
            </ul>
          </section>

          <ThreadPalette
            matchedId={carpet.threadId}
            locked={threadLocked}
            onMatch={onMatchThread}
            onUnmatch={onUnmatchThread}
          />
        </div>

        <div className="detail-side">
          <Workflow stage={carpet.stage} hasThread={carpet.threadId !== null} onAdvance={onAdvance} onRevert={onRevert} />

          <section className="panel subpanel">
            <div className="heading compact">
              <div>
                <p>修复前后记录</p>
                <h2>工序日志</h2>
              </div>
            </div>
            <ol className="log-list">
              {[...carpet.log].reverse().map((entry) => (
                <li key={entry.id}>
                  <time>{formatTime(entry.at)}</time>
                  <p>{entry.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
