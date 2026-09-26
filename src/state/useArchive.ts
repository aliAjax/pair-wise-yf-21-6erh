import { useCallback, useEffect, useMemo, useState } from "react";
import { SEED_CARPETS } from "../data";
import { STAGES, type Carpet, type DamageMark, type DamageType, type Motif } from "../types";

const STORAGE_KEY = "hxyfront-62009-archive-v1";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function isCarpet(value: unknown): value is Carpet {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.origin === "string" &&
    Array.isArray(c.marks) &&
    Array.isArray(c.log) &&
    typeof c.stage === "string"
  );
}

function loadCarpets(): Carpet[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CARPETS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isCarpet)) return SEED_CARPETS;
    // 新版本内置档案若尚未入库，则补进来
    const storedIds = new Set(parsed.map((c) => c.id));
    return [...parsed, ...SEED_CARPETS.filter((c) => !storedIds.has(c.id))];
  } catch {
    return SEED_CARPETS;
  }
}

export interface NewCarpetInput {
  origin: string;
  era: string;
  density: string;
  material: string;
  dye: string;
  motif: Motif;
  summary: string;
}

export function useArchive() {
  const [carpets, setCarpets] = useState<Carpet[]>(loadCarpets);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carpets));
    } catch {
      // 存储空间不可用时静默降级，本次会话内仍可使用
    }
  }, [carpets]);

  const selected = useMemo(
    () => carpets.find((c) => c.id === selectedId) ?? null,
    [carpets, selectedId],
  );

  const patchCarpet = useCallback((id: string, updater: (c: Carpet) => Carpet) => {
    setCarpets((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const addCarpet = useCallback(
    (input: NewCarpetInput): string => {
      const taken = new Set(carpets.map((c) => c.id));
      let serial = 200 + Math.floor(Math.random() * 700);
      let id = `CAR-${serial}`;
      while (taken.has(id)) {
        serial += 1;
        id = `CAR-${serial}`;
      }
      const carpet: Carpet = {
        id,
        origin: input.origin,
        era: input.era || "年代待考",
        density: input.density || "待测量",
        material: input.material || "待鉴定",
        dye: input.dye || "待鉴定",
        motif: input.motif,
        summary: input.summary || "收毯初检，暂无备注。",
        stage: "待检",
        marks: [],
        threadId: null,
        log: [{ id: uid("log"), at: Date.now(), text: "收毯建档，进入待检。" }],
      };
      setCarpets((prev) => [...prev, carpet]);
      setSelectedId(id);
      return id;
    },
    [carpets],
  );

  const addMark = useCallback(
    (carpetId: string, x: number, y: number, type: DamageType, note: string) => {
      const mark: DamageMark = { id: uid("mk"), x, y, type, note, createdAt: Date.now() };
      patchCarpet(carpetId, (c) => ({ ...c, marks: [...c.marks, mark] }));
    },
    [patchCarpet],
  );

  const removeMark = useCallback(
    (carpetId: string, markId: string) => {
      patchCarpet(carpetId, (c) => ({ ...c, marks: c.marks.filter((m) => m.id !== markId) }));
    },
    [patchCarpet],
  );

  const matchThread = useCallback(
    (carpetId: string, threadId: string, threadName: string) => {
      patchCarpet(carpetId, (c) => ({
        ...c,
        threadId,
        log: [...c.log, { id: uid("log"), at: Date.now(), text: `从材料色卡匹配补线：${threadName}。` }],
      }));
    },
    [patchCarpet],
  );

  const unmatchThread = useCallback(
    (carpetId: string) => {
      patchCarpet(carpetId, (c) => {
        if (!c.threadId) return c;
        // 已进入补线及以后不允许拆走色卡，防止档案失去合规状态
        if (STAGES.indexOf(c.stage) >= STAGES.indexOf("补线")) return c;
        return {
          ...c,
          threadId: null,
          log: [...c.log, { id: uid("log"), at: Date.now(), text: "取消补线色卡匹配。" }],
        };
      });
    },
    [patchCarpet],
  );

  const advanceStage = useCallback(
    (carpetId: string) => {
      patchCarpet(carpetId, (c) => {
        const index = STAGES.indexOf(c.stage);
        if (index < 0 || index >= STAGES.length - 1) return c;
        const next = STAGES[index + 1];
        // 规则：没有匹配色卡的档案不能进入补线
        if (next === "补线" && !c.threadId) return c;
        return {
          ...c,
          stage: next,
          log: [...c.log, { id: uid("log"), at: Date.now(), text: `工序推进：${c.stage} → ${next}。` }],
        };
      });
    },
    [patchCarpet],
  );

  const revertStage = useCallback(
    (carpetId: string) => {
      patchCarpet(carpetId, (c) => {
        const index = STAGES.indexOf(c.stage);
        if (index <= 0) return c;
        const prevStage = STAGES[index - 1];
        return {
          ...c,
          stage: prevStage,
          log: [...c.log, { id: uid("log"), at: Date.now(), text: `工序退回：${c.stage} → ${prevStage}。` }],
        };
      });
    },
    [patchCarpet],
  );

  return {
    carpets,
    selected,
    selectedId,
    setSelectedId,
    addCarpet,
    addMark,
    removeMark,
    matchThread,
    unmatchThread,
    advanceStage,
    revertStage,
  };
}
