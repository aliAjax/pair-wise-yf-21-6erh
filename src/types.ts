export type Stage = "待检" | "清洗" | "补线" | "验收";

export type DamageType = "磨损" | "缺口" | "断纬" | "褪色";

export type Motif = "medallion" | "geometric" | "floral" | "striped";

export interface DamageMark {
  id: string;
  /** 纹样图上的横向百分比 0-100 */
  x: number;
  /** 纹样图上的纵向百分比 0-100 */
  y: number;
  type: DamageType;
  note: string;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  at: number;
  text: string;
}

export interface Carpet {
  id: string;
  origin: string;
  era: string;
  density: string;
  material: string;
  dye: string;
  motif: Motif;
  summary: string;
  stage: Stage;
  marks: DamageMark[];
  /** 已匹配的材料色卡 id，未匹配为 null */
  threadId: string | null;
  log: LogEntry[];
}

export interface ThreadCard {
  id: string;
  name: string;
  hex: string;
  material: string;
}

export const STAGES: Stage[] = ["待检", "清洗", "补线", "验收"];

export const DAMAGE_TYPES: DamageType[] = ["磨损", "缺口", "断纬", "褪色"];

export const DAMAGE_COLORS: Record<DamageType, string> = {
  磨损: "#b45309",
  缺口: "#b91c1c",
  断纬: "#1d4ed8",
  褪色: "#7c3aed",
};

export const MOTIF_LABELS: Record<Motif, string> = {
  medallion: "中心奖章纹",
  geometric: "几何菱格纹",
  floral: "花卉卷草纹",
  striped: "条纹织带纹",
};
