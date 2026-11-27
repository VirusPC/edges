/** ADR 0059's shared default for the constraints section. */
export const CONSTRAINT_SEED_PREAMBLE =
  "材料放在本层 `.edges/` 下各类型的目录里，以 `.edges/README` 的登记为准，只认已经初始化的类型。读写都走 `edges` skill，按类型用 `edges <模块>`，不要手改受管理的目录和索引。提问或动手之前，按当前任务的相关性，从该类型的根目录到相关子目录逐层查；本轮已经查过、输入也没变，就不再重复查。沉淀遵守该类型既有的创建与审批规则；识别出候选不等于获准落盘。";

/** Legacy official lines removed when encountered in the constraints section. */
export const PREVIOUS_OFFICIAL_CONSTRAINT_LINES = [
  "本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。",
  "本层硬约束直接写在这个区块里，不要链到记忆正文文件。",
  "本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。",
] as const;

export const constraintSeedMarker = (id: string): string => `<!-- edges-seed:${id} -->`;
