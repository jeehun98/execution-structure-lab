const sharedMemoryBankConflict = {
  id: "shared-memory-bank-conflict",
  category: "On-Chip Structure",
  label: "Shared Memory Bank Conflict",
  summary:
    "shared memory 접근 주소식을 조절해 broadcast와 bank conflict를 구분하고, padding이나 transpose가 실제 비용에 어떤 차이를 만드는지 보는 실험입니다.",
  question:
    "shared memory가 빠르다고 해도, 접근 패턴이 나쁘면 실제로 얼마나 충돌 비용이 발생하는가?",
  whyItMatters:
    "tile staging, local accumulation, transpose buffering 같은 realization은 shared memory를 강하게 사용합니다. 그런데 bank mapping을 무시하면 기대한 이득이 크게 줄어들 수 있으므로, on-chip reuse가 언제 실제 이득이 되는지 확인해야 합니다.",

  method: [
    "warp 단위에서 shared memory 주소식을 의도적으로 바꿉니다.",
    "conflict-free, broadcast-like, conflict-heavy 패턴을 나누어 비교합니다.",
    "padding 유무 또는 stride 변형에 따른 응답 차이를 측정합니다.",
    "동일 계산량 아래에서 shared access pattern의 비용만 비교하려고 합니다.",
  ],

  kernelShape: {
    block: "warp-aligned threads, often 32-thread sensitive layout",
    memory: "shared memory tile or linear buffer",
    variedParameter: "shared stride / padding / transpose layout",
    comparisonModes: ["conflict-free", "broadcast", "conflict-heavy"],
    timing: "same work, different shared access pattern",
    validation: "checksum / parity",
  },

  codeSnippet: `__shared__ float smem[32][33];

int lane = threadIdx.x & 31;
float x = smem[lane][fixed_col];      // one pattern
float y = smem[fixed_row][lane];      // another pattern
float z = smem[lane][lane_stride];    // conflict-sensitive pattern`,

  observe: [
    "padding 전후 avg time 변화",
    "broadcast와 true bank conflict의 차이",
    "stride-sensitive shared access response",
    "warp 내 주소 분포가 cost에 주는 영향",
  ],

  outputs: [
    "pattern별 avg_ms 비교",
    "padding on/off 비교",
    "conflict-free vs heavy-conflict ratio",
    "실험 조건 설명",
  ],

  resultHighlights: [
    "같은 shared memory 사용이라도 주소 배치에 따라 성능 차이가 크게 날 수 있습니다.",
    "broadcast는 conflict와 다르게 처리되므로 예상보다 덜 나쁠 수 있습니다.",
    "padding 또는 transpose layout 조정만으로도 응답이 유의미하게 개선될 수 있습니다.",
  ],

  interpretation: [
    "shared memory 사용 자체가 목적이 아니라, bank-friendly layout으로 쓰는 것이 핵심입니다.",
    "tile staging realization은 local reuse 이득뿐 아니라 access topology까지 함께 설계되어야 합니다.",
    "이 결과는 padded tile, transposed staging, half2-friendly layout 같은 구현 선택의 실질적 근거가 됩니다.",
  ],

  caveats: [
    "bank 구조는 세대별 세부 동작 차이가 있을 수 있습니다.",
    "compiler optimization이나 registerization이 일부 패턴을 약화시킬 수 있습니다.",
    "실험은 bank conflict 경향을 보여주지만, 모든 kernel의 전체 cost를 설명하진 않습니다.",
  ],

  nextLinks: [
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
    { label: "변환 성질 보기", href: "/properties-new" },
  ],
};

export default sharedMemoryBankConflict;