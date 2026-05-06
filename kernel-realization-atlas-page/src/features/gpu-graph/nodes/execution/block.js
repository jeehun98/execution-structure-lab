export default {
  id: "block",
  label: "Block",
  kind: "hardware-unit",

  layer: 0,

  connectsTo: [
    {
      id: "warp",
      type: "hierarchy",
      label: "contains",
    },
  ],

  meta: {
    title: "Thread Block",
    desc: "GPU에서 scheduling되는 기본 단위로, 여러 warp를 포함합니다.",
  },
};