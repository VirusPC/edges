/** Official scope material types and their constraint-specific guidance. */
export const MATERIAL_TYPES = [
  {
    id: "memory",
    directory: "memory",
    constraint: "只改文案时不查。用户要求记住、纠正你、给出约定，或结论已经验证时才沉淀。个人偏好和密钥只进 `user`；不检索就会做错事的规则，直接写进硬约束区块。",
  },
  {
    id: "notes",
    directory: "notes",
    constraint: "话题可能已经有笔记时先查；同一主题的就更新原笔记，不新开。识别出候选可以提议一次，用户同意了才写。",
  },
  {
    id: "skills",
    directory: "skills",
    constraint: "动手前先查本层的 managed 技能，有就照着做；`referenced` 只当索引，不改它的正文。同一串步骤做到第二遍时可以提议沉淀，用户同意了才写；沉淀的是流程，结论放进记忆。",
  },
  {
    id: "tasks",
    directory: "tasks",
    constraint: "提到待办、进度、下一步，或者要新开任务时先查；同一个意图已经有卡就沿用。可以写成文字提议开卡，背景和目标要有对话依据。",
  },
  {
    id: "routines",
    directory: "routines",
    constraint: "提到定时、周期或例行工作，或者要新建、改动例程时先查；同一职责已经有了就更新。识别出候选可以提议一次，用户同意了才写。",
  },
  {
    id: "projects",
    directory: "projects",
    constraint: "给任务、笔记选主题前先查；有合适的就归进去，没有就不硬归。识别出该新建或该调整归类的候选，可以提议一次，用户同意了才写。",
  },
] as const;

export type MaterialTypeId = (typeof MATERIAL_TYPES)[number]["id"];
