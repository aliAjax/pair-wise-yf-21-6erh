import { STAGES, type Stage } from "../types";

interface WorkflowProps {
  stage: Stage;
  hasThread: boolean;
  onAdvance: () => void;
  onRevert: () => void;
}

export default function Workflow({ stage, hasThread, onAdvance, onRevert }: WorkflowProps) {
  const currentIndex = STAGES.indexOf(stage);
  const next = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;
  const blockedToRepair = next === "补线" && !hasThread;
  const finished = stage === "验收";

  return (
    <section className="panel subpanel">
      <div className="heading compact">
        <div>
          <p>修复工序</p>
          <h2>工序进度</h2>
        </div>
      </div>

      <ol className="stepper">
        {STAGES.map((s, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li key={s} className={`step ${state}`}>
              <span className="step-node">{index < currentIndex ? "✓" : index + 1}</span>
              <span className="step-label">{s}</span>
              {index < STAGES.length - 1 && <span className="step-line" />}
            </li>
          );
        })}
      </ol>

      <div className="workflow-actions">
        <button type="button" className="primary" onClick={onAdvance} disabled={finished || blockedToRepair}>
          {finished ? "已验收完工" : `推进到「${next}」`}
        </button>
        <button type="button" onClick={onRevert} disabled={currentIndex === 0}>
          退回上一工序
        </button>
      </div>

      {blockedToRepair && (
        <p className="gate-warn">⛔ 未匹配材料色卡，不能进入补线。请先在下方色卡点选一根补线。</p>
      )}
      {!blockedToRepair && !finished && (
        <p className="gate-hint">工序按 待检 → 清洗 → 补线 → 验收 顺序推进，不可跳步。</p>
      )}
      {finished && <p className="gate-ok">✅ 该档案已通过验收完工。</p>}
    </section>
  );
}
