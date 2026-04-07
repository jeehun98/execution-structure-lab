export const NAV_ITEMS = [
  {
    key: "atlas",
    label: "아틀라스",
    href: "/atlas-new",
    panel: "atlas",
    shortDesc: "전체 구조와 읽는 흐름",
  },
  {
    key: "hardware",
    label: "하드웨어",
    href: "/hardware-evidence",
    panel: "hardware",
    shortDesc: "측정된 GPU 거동",
  },
  {
    key: "structures",
    label: "계산 구조",
    href: "/computation-structures",
    panel: "structures",
    shortDesc: "공통 계산 형식",
  },
  {
    key: "properties",
    label: "변환 가능성",
    href: "/properties-new",
    panel: "properties",
    shortDesc: "구조 위에서 가능한 재구성",
  },
  {
    key: "invariants",
    label: "보존 조건",
    href: "/invariants",
    panel: "invariants",
    shortDesc: "구조가 유지해야 하는 경계",
  },
  {
    key: "operators",
    label: "연산자 해석",
    href: "/operators-new",
    panel: "operators",
    shortDesc: "구조 조합과 실현 분기",
  },
  {
    key: "analysis",
    label: "실현 비교",
    href: "/analysis-new",
    panel: "analysis",
    shortDesc: "variant 비교와 metric 해석",
  },
  {
    key: "memory",
    label: "메모리 관점",
    href: "/memory-new",
    panel: "memory",
    shortDesc: "traffic, reuse, residency 관점",
  },
];

export const MENU_PANELS = {
  atlas: {
    title: "Kernel Realization Atlas",
    sections: [
      {
        title: "시작하기",
        links: [
          {
            label: "아틀라스 홈",
            href: "/atlas-new",
            desc: "프로젝트 전체 구조와 읽는 흐름을 한 번에 보는 메인 진입점",
          },
        ],
      },
      {
        title: "핵심 축",
        links: [
          {
            label: "하드웨어 관찰",
            href: "/hardware-evidence",
            desc: "측정된 GPU 거동과 실행 근거",
          },
          {
            label: "공통 계산 구조",
            href: "/computation-structures",
            desc: "여러 연산자에 반복적으로 나타나는 계산 형식",
          },
          {
            label: "변환 가능성",
            href: "/properties-new",
            desc: "구조 위에서 어떤 재배열, 분해, 결합, streaming이 가능해지는지 정리",
          },
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "구조가 변환 속에서도 유지해야 하는 의미·구조·수치 경계",
          },
        ],
      },
    ],
    featured: {
      title: "아틀라스 홈",
      desc: "실행 기반에서 구조, 변환 가능성, 보존 조건, 연산자 해석, 실현 비교까지 전체 흐름으로 읽습니다.",
      href: "/atlas-new",
    },
  },

  hardware: {
    title: "하드웨어 관찰",
    sections: [
      {
        title: "관찰 층위",
        links: [
          {
            label: "하드웨어 관찰",
            href: "/hardware-evidence",
            desc: "측정된 GPU 거동과 실행 근거를 보는 페이지",
          },
          {
            label: "하드웨어 특성화",
            href: "/hardware-evidence#characterization",
            desc: "메모리 계층, 접근 패턴, 스케줄링 특성을 정리",
          },
          {
            label: "실행 primitive 실험",
            href: "/hardware-evidence#primitives",
            desc: "reduction, streaming, rematerialization, tile staging 실험",
          },
        ],
      },
      {
        title: "다음으로 연결",
        links: [
          {
            label: "공통 계산 구조",
            href: "/computation-structures",
            desc: "하드웨어 근거 위에서 반복 계산 형식으로 이동",
          },
          {
            label: "실현 비교",
            href: "/analysis-new",
            desc: "측정된 근거가 실제 구현 선택과 variant 차이로 어떻게 이어지는지 확인",
          },
        ],
      },
    ],
    featured: {
      title: "하드웨어 관찰",
      desc: "추상 가정보다 실제 GPU의 반응과 측정 결과에서 출발합니다.",
      href: "/hardware-evidence",
    },
  },

  structures: {
    title: "공통 계산 구조",
    sections: [
      {
        title: "구조로 분류하기",
        links: [
          {
            label: "공통 계산 구조",
            href: "/computation-structures",
            desc: "개별 연산자보다 먼저, 반복적으로 나타나는 상위 계산 구조로 operator를 분류합니다.",
          },
          {
            label: "Reduction",
            href: "/computation-structures#reduction",
            desc: "여러 값을 하나의 결과나 요약으로 축약하는 계산 구조",
          },
          {
            label: "Streaming Accumulation",
            href: "/computation-structures#streaming-accumulation",
            desc: "부분 상태를 순차적으로 갱신하며 결과를 형성하는 계산 구조",
          },
          {
            label: "Mergeable Summary",
            href: "/computation-structures#mergeable-summary",
            desc: "부분 요약들을 결합해 전체 결과를 구성할 수 있는 구조",
          },
          {
            label: "Weighted Aggregation",
            href: "/computation-structures#weighted-aggregation",
            desc: "값들의 가중된 기여를 반영해 결과를 형성하는 계산 구조",
          },
        ],
      },
      {
        title: "다음 계층으로 연결",
        links: [
          {
            label: "변환 가능성",
            href: "/properties-new",
            desc: "공통 계산 구조 위에서 어떤 재구성이 가능한지 봅니다.",
          },
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "구조가 변환 속에서도 유지되어야 하는 경계를 봅니다.",
          },
        ],
      },
    ],
    featured: {
      title: "공통 계산 구조",
      desc: "주어진 operator들을 더 상위의 계산 형식으로 분류하고 해석합니다.",
      href: "/computation-structures",
    },
  },

  properties: {
    title: "변환 가능성",
    sections: [
      {
        title: "가능한 재구성",
        links: [
          {
            label: "변환 가능성",
            href: "/properties-new",
            desc: "구조 위에서 어떤 재배열, 분해, 결합, streaming, fusion이 가능해지는지 정리",
          },
          {
            label: "재배열 가능성",
            href: "/properties-new#reordering-properties",
            desc: "구조가 내부 계산 순서나 결합 방식을 다시 배치할 수 있는 경우",
          },
          {
            label: "스트리밍 가능성",
            href: "/properties-new#streaming-properties",
            desc: "전체 materialization 없이 진행할 수 있는 구조적 조건",
          },
          {
            label: "융합과 on-chip 유지",
            href: "/properties-new#fusion-properties",
            desc: "중간 이동을 줄이며 더 긴 realization path를 구성할 수 있는 경우",
          },
        ],
      },
      {
        title: "다음 계층으로 연결",
        links: [
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "가능한 변환이 어디까지 허용되는지 확인",
          },
          {
            label: "연산자 해석",
            href: "/operators-new",
            desc: "변환 가능성이 실제 operator와 realization branch에서 어떻게 묶이는지 보기",
          },
        ],
      },
    ],
    featured: {
      title: "변환 가능성",
      desc: "계산 구조 위에서 무엇을 바꿀 수 있는지를 정리합니다.",
      href: "/properties-new",
    },
  },

  invariants: {
    title: "보존 조건",
    sections: [
      {
        title: "구조의 경계",
        links: [
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "계산 구조가 변환 속에서도 유지해야 하는 경계를 정리",
          },
          {
            label: "의미 경계",
            href: "/invariants#meaning-boundaries",
            desc: "summary의 의미, 축, 범위, aggregation 대상이 유지되어야 하는 조건",
          },
          {
            label: "의존성 경계",
            href: "/invariants#dependency-boundaries",
            desc: "fusion, tiling, streaming 이후에도 깨지면 안 되는 구조적 관계",
          },
          {
            label: "수치 경계",
            href: "/invariants#numerical-boundaries",
            desc: "accumulation, rescaling, normalization의 허용 범위와 안정성",
          },
        ],
      },
      {
        title: "구조별 보기",
        links: [
          {
            label: "Reduction Invariants",
            href: "/invariants#reduction-invariants",
            desc: "축약 구조가 유지해야 하는 결합 규칙과 summary consistency",
          },
          {
            label: "Streaming Invariants",
            href: "/invariants#streaming-invariants",
            desc: "partial state와 global merge가 같은 규칙을 따르는지 확인",
          },
          {
            label: "Mergeable Summary Invariants",
            href: "/invariants#mergeable-summary-invariants",
            desc: "부분 요약과 전체 요약이 같은 해석 안에서 결합 가능한지 확인",
          },
        ],
      },
    ],
    featured: {
      title: "보존 조건",
      desc: "가능한 변환이 실제로 어디까지 허용되는지를 구조 기준으로 정리합니다.",
      href: "/invariants",
    },
  },

  operators: {
    title: "연산자 해석",
    sections: [
      {
        title: "해석의 축",
        links: [
          {
            label: "연산자 해석",
            href: "/operators-new",
            desc: "operator를 고정된 API 이름이 아니라 구조 조합과 realization path의 결절점으로 읽는 페이지",
          },
          {
            label: "Structure Composition",
            href: "/operators-new#structure-composition",
            desc: "하나의 operator 안에 어떤 computation structure들이 함께 결합되어 있는지 읽기",
          },
          {
            label: "Property Profile",
            href: "/operators-new#property-profile",
            desc: "구조 조합 위에서 어떤 변환 가능성이 강하게 나타나는지 읽기",
          },
          {
            label: "Invariant Boundaries",
            href: "/operators-new#invariant-boundaries",
            desc: "가능한 변환이 실제로 어디까지 허용되는지를 가르는 의미·구조·수치 경계",
          },
          {
            label: "Realization Branches",
            href: "/operators-new#realization-branches",
            desc: "같은 operator가 어떤 구현 분기와 실행 경로로 갈라지는지 읽기",
          },
        ],
      },
      {
        title: "사례로 보는 매핑",
        links: [
          {
            label: "Dense Compute Chains",
            href: "/operators-new#dense-compute-chains",
            desc: "dense local accumulation, tiling, residency, epilogue fusion이 결합된 사례",
          },
          {
            label: "Reduction / Statistics Families",
            href: "/operators-new#reduction-statistics-families",
            desc: "summary formation과 accumulation order가 realization을 크게 바꾸는 사례",
          },
          {
            label: "Normalization Families",
            href: "/operators-new#normalization-families",
            desc: "reduction, rescaling, elementwise transform이 함께 작동하는 사례",
          },
          {
            label: "Attention / Weighted Aggregation Families",
            href: "/operators-new#attention-weighted-aggregation-families",
            desc: "streaming accumulation과 weighted aggregation이 realization 분기를 만드는 사례",
          },
        ],
      },
    ],
    featured: {
      title: "연산자 해석",
      desc: "앞선 structure, property, invariant 층이 실제 operator와 realization branch 안에서 어떻게 묶이는지 보여 줍니다.",
      href: "/operators-new",
    },
  },

  analysis: {
    title: "실현 비교",
    sections: [
      {
        title: "비교 탐색",
        links: [
          {
            label: "실현 비교",
            href: "/analysis-new",
            desc: "구현 variant와 측정 결과를 비교하는 페이지",
          },
          {
            label: "Variant 비교",
            href: "/analysis-new#variant-comparison",
            desc: "서로 다른 realization branch가 실제 구현에서 어떻게 갈라지는지 읽기",
          },
          {
            label: "Metric 해석",
            href: "/analysis-new#metric-interpretation",
            desc: "측정된 숫자가 실제 realization 차이와 무엇을 의미하는지 이해",
          },
        ],
      },
      {
        title: "결과 읽기",
        links: [
          {
            label: "실행 시그니처",
            href: "/analysis-new#execution-signature",
            desc: "trace와 profile 수준의 실행 근거",
          },
          {
            label: "융합 사례",
            href: "/analysis-new#fusion-case-studies",
            desc: "복합 realization path가 형성되는 사례 읽기",
          },
          {
            label: "검증과 한계",
            href: "/analysis-new#validation-and-limits",
            desc: "정확성, 안정성, 경계 조건 점검",
          },
        ],
      },
    ],
    featured: {
      title: "실현 비교",
      desc: "구조 해석과 연산자 매핑이 실제 구현 비교와 측정 결과에서 어떻게 드러나는지 연결합니다.",
      href: "/analysis-new",
    },
  },

  memory: {
    title: "메모리 관점",
    sections: [
      {
        title: "메모리로 다시 읽기",
        links: [
          {
            label: "메모리 관점",
            href: "/memory-new",
            desc: "Atlas 전체를 가로지르는 memory-centric 해석",
          },
          {
            label: "Streaming",
            href: "/memory-new#streaming",
            desc: "전체 materialization 없이 진행 상태를 유지하는 방식",
          },
          {
            label: "Rematerialization",
            href: "/memory-new#rematerialization",
            desc: "재계산으로 저장과 traffic을 줄이는 방식",
          },
        ],
      },
      {
        title: "재사용과 traffic",
        links: [
          {
            label: "Residency",
            href: "/memory-new#residency",
            desc: "데이터를 on-chip에 유지하며 재사용",
          },
          {
            label: "Fusion",
            href: "/memory-new#fusion",
            desc: "중간 읽기/쓰기를 줄이는 결합 방식",
          },
          {
            label: "Traffic Elimination",
            href: "/memory-new#traffic-elimination",
            desc: "불필요한 메모리 이동 제거",
          },
        ],
      },
    ],
    featured: {
      title: "메모리 관점",
      desc: "하드웨어, 구조, 연산자, 실현 비교를 memory movement와 reuse 기준으로 다시 읽습니다.",
      href: "/memory-new",
    },
  },
};