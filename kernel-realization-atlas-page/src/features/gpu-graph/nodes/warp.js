export default {
  id: "warp",
  label: "Warp",
  layer: 0,

  connectsTo: [
    { id: "same_baseline", type: "probe" },
    { id: "mixed_probe", type: "next" },
  ],

  meta: {
    title: "Warp",
    desc: "GPU execution의 기본 단위",
  },
};