export default {
  id: "warp",
  label: "Warp",
  layer: 0,

  connectsTo: [
    {
      id: "same_baseline",
      type: "baseline",
    },
  ],

  meta: {
    title: "Warp",
    desc: "GPU execution의 기본 단위",
  },
};