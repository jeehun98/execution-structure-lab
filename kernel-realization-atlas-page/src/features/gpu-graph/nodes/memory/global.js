const global = {
  id: "global_memory",
  label: "Global Memory",
  title: "Global Memory",
  kind: "memory",
  status: "concept",

  layer: "execution-unit",
  order: 3,

  description:
    "GPU device memory에 해당하는 큰 주소 공간입니다. 접근 latency가 높기 때문에 coalescing, locality, address dependency, cache behavior가 성능 해석의 핵심 단서가 됩니다.",

  connectsTo: [],

  meta: {
    title: "Global Memory",
    desc:
      "GPU device memory입니다. global load/store latency, address dependency, memory coalescing, cache behavior를 해석할 때 중요한 대상입니다.",
  },
};

export default global;