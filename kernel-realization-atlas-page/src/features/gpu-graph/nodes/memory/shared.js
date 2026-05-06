export default {
  id: "shared",
  label: "Shared Memory",
  kind: "memory",

  parent: "execution",
  layer: 3,

  connectsTo: [],

  meta: {
    title: "Shared Memory",
    desc:
      "on-chip memory로 빠르지만 bank conflict에 따라 성능이 크게 달라집니다.",
  },
};