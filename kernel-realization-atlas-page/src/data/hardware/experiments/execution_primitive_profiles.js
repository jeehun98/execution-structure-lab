const executionPrimitiveProfiles = {
  id: "execution-primitive-profiles",
  label: "Execution Primitive Profiles",
  category: "Primitive Evidence",
  summary:
    "reduction, streaming, tile staging 등의 primitive가 어떤 realization 특성과 구현 비용 구조를 갖는지 정리합니다.",
  question:
    "어떤 primitive가 어떤 kernel family로 연결되는가? 구조 차이가 intermediate, locality, synchronization, traffic에 어떤 차이를 만드는가?",
  whyItMatters:
    "Atlas의 목적은 hardware facts를 모으는 데서 끝나지 않습니다. primitive 단위 evidence는 structure와 realization을 직접 연결하는 중간 다리 역할을 합니다.",
  observe: [
    "primitive별 realization family",
    "traffic and reuse differences",
    "synchronization sensitivity",
    "structure-to-kernel mapping",
  ],
  outputs: [
    "primitive profile notes",
    "candidate realization branches",
    "comparison axes",
  ],
  nextLinks: [
    { label: "연산자 실현 구조 보기", href: "/operators-new" },
    { label: "공통 계산 구조 보기", href: "/computation-structures" },
  ],
};

export default executionPrimitiveProfiles;