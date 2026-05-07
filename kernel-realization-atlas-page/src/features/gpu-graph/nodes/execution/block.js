const block = {
  id: "block",
  label: "Block",
  title: "Thread Block",
  kind: "hardware-unit",
  status: "concept",

  layer: "execution-context",
  order: 1,

  description:
    "GPU kernel launch에서 thread들이 묶이는 실행 단위입니다. 하나의 block은 여러 warp를 포함하며, block 내부 warp들은 shared memory와 thread block scope의 동기화 자원을 공유할 수 있습니다.",

  connectsTo: [
    {
      id: "warp",
      type: "contains",
      label: "contains",
    },
  ],

  meta: {
    title: "Thread Block",
    desc:
      "GPU에서 thread들이 묶이는 실행 단위입니다. 하나의 block은 여러 warp를 포함하며, block 내부에서는 shared memory와 block-level synchronization을 사용할 수 있습니다.",
  },
};

export default block;