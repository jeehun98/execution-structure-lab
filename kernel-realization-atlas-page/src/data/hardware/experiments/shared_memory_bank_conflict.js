const sharedMemoryBankConflict = {
  id: "shared-memory-bank-conflict",
  label: "Shared Memory Bank Conflict",
  category: "On-chip Behavior",
  summary:
    "indexing pattern에 따라 bank conflict가 어떻게 발생하고, 그 비용이 성능에 어떻게 반영되는지 비교합니다.",
  question:
    "shared memory access는 어떤 indexing에서 충돌하는가? padding이나 layout 변경이 실제로 어떤 차이를 만드는가?",
  whyItMatters:
    "tile staging이나 on-chip accumulation은 shared memory를 자주 사용합니다. 여기서 conflict가 생기면 추상적으로 좋아 보이는 realization도 실제로는 무너질 수 있습니다.",
  observe: [
    "index pattern별 runtime 차이",
    "padding 적용 전후 비교",
    "bank conflict 유발 조건",
    "on-chip realization의 민감도",
  ],
  outputs: [
    "pattern comparison",
    "padding effect summary",
    "conflict-sensitive layout notes",
  ],
  nextLinks: [
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "실현 비교 실험 보기", href: "/analysis-new" },
  ],
};

export default sharedMemoryBankConflict;