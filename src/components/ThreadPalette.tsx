import { THREAD_CARDS } from "../data";

interface ThreadPaletteProps {
  matchedId: string | null;
  locked: boolean;
  onMatch: (threadId: string, threadName: string) => void;
  onUnmatch: () => void;
}

export default function ThreadPalette({ matchedId, locked, onMatch, onUnmatch }: ThreadPaletteProps) {
  const matched = THREAD_CARDS.find((t) => t.id === matchedId) ?? null;

  return (
    <section className="panel subpanel">
      <div className="heading compact">
        <div>
          <p>材料色卡</p>
          <h2>匹配补线</h2>
        </div>
        {matched && (
          <span className="matched-chip" style={{ ["--chip" as string]: matched.hex }}>
            <i />
            {matched.id} · {matched.name}
          </span>
        )}
      </div>

      <div className="thread-grid">
        {THREAD_CARDS.map((thread) => {
          const isMatched = thread.id === matchedId;
          return (
            <button
              key={thread.id}
              type="button"
              className={isMatched ? "thread-card selected" : "thread-card"}
              onClick={() => onMatch(thread.id, `${thread.name}（${thread.id}，${thread.material}）`)}
              title={`${thread.name} · ${thread.material}`}
            >
              <i className="thread-swatch" style={{ background: thread.hex }} />
              <b>{thread.name}</b>
              <span>
                {thread.id} · {thread.material}
              </span>
            </button>
          );
        })}
      </div>

      {matched && (
        <p className="thread-note">
          已选定补线：<b>{matched.name}</b>（{matched.hex.toUpperCase()}，{matched.material}）。
          {locked ? (
            <span className="warn-inline">已进入补线工序，色卡锁定不可拆。</span>
          ) : (
            <button type="button" className="link-btn" onClick={onUnmatch}>
              取消匹配
            </button>
          )}
        </p>
      )}
      {!matched && <p className="thread-note warn-inline">尚未匹配色卡：该档案无法进入「补线」工序。</p>}
    </section>
  );
}
