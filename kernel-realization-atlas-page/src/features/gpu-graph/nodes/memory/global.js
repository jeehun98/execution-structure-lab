export default {
  id: "global",
  label: "Global Memory",
  kind: "memory",

  parent: "execution",
  layer: 3,

  connectsTo: [],

  meta: {
    title: "Global Memory",
    desc:
      "off-chip memory로 latency가 크며, warp switching으로 hiding됩니다.",
  },
};