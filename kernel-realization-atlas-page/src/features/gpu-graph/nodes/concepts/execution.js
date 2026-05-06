export default {
  id: "execution",
  label: "Execution",
  kind: "execution-stage",

  parent: "warp",
  layer: 2,

  connectsTo: [
    {
      id: "shared",
      type: "memory",
      label: "shared access",
    },
    {
      id: "global",
      type: "memory",
      label: "global access",
    },
  ],

  meta: {
    title: "Execution",
    desc:
      "ALU 및 memory instruction이 실제로 issue되는 단계입니다.",
  },
};