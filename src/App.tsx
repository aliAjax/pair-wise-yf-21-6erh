import "./styles.css";
import ArchiveSidebar from "./components/ArchiveSidebar";
import CarpetDetail from "./components/CarpetDetail";
import { useArchive } from "./state/useArchive";
import { STAGES } from "./types";

function App() {
  const archive = useArchive();
  const { selected } = archive;

  const pendingRepair = archive.carpets.filter(
    (c) => STAGES.indexOf(c.stage) < STAGES.indexOf("补线") && !c.threadId && c.stage !== "验收",
  ).length;
  const inRepair = archive.carpets.filter((c) => c.stage === "补线").length;
  const finished = archive.carpets.filter((c) => c.stage === "验收").length;
  const finishRate = archive.carpets.length
    ? Math.round((finished / archive.carpets.length) * 100)
    : 0;

  const metrics = [
    { label: "在档地毯", value: archive.carpets.length },
    { label: "待匹配色卡", value: pendingRepair },
    { label: "补线中", value: inRepair },
    { label: "完工率", value: `${finishRate}%` },
  ];

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">手工地毯修复工作室 · 定损补线工作台</p>
          <h1>地毯修复纹样档案</h1>
        </div>
        <p className="topbar-note">
          收毯建档 → 纹样定损 → 色卡匹配 → 工序流转，所有改动保存在本机浏览器，重开页面不丢失。
        </p>
      </header>

      <section className="metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <div className="layout">
        <ArchiveSidebar
          carpets={archive.carpets}
          selectedId={archive.selectedId}
          onSelect={archive.setSelectedId}
          onCreate={archive.addCarpet}
        />

        {selected ? (
          <CarpetDetail
            carpet={selected}
            onAddMark={(x, y, type, note) => archive.addMark(selected.id, x, y, type, note)}
            onRemoveMark={(markId) => archive.removeMark(selected.id, markId)}
            onMatchThread={(threadId, name) => archive.matchThread(selected.id, threadId, name)}
            onUnmatchThread={() => archive.unmatchThread(selected.id)}
            onAdvance={() => archive.advanceStage(selected.id)}
            onRevert={() => archive.revertStage(selected.id)}
          />
        ) : (
          <section className="panel empty-state">
            <div>
              <h2>从左侧选择一条地毯档案</h2>
              <p>
                可按产地（波斯 / 安纳托利亚 / 高加索 / 藏毯）筛选；新收的毯子点左上角「收毯录入」建档。
                选中后即可在纹样图上点出破损、匹配补线色卡，并推进 待检 → 清洗 → 补线 → 验收 工序。
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
