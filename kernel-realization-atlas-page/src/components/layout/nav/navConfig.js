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
    key: "semantics",
    label: "의미와 규칙",
    href: "/properties-new",
    panel: "semantics",
    shortDesc: "변환 가능성과 보존 조건",
  },
  {
    key: "structures",
    label: "계산 구조",
    href: "/computation-structures",
    panel: "structures",
    shortDesc: "공통 계산 패턴",
  },
  {
    key: "operators",
    label: "연산자",
    href: "/operators-new",
    panel: "operators",
    shortDesc: "구현 방식과 실행 경로",
  },
  {
    key: "analysis",
    label: "실험 분석",
    href: "/analysis-new",
    panel: "analysis",
    shortDesc: "variant 비교와 metric 해석",
  },
  {
    key: "memory",
    label: "메모리",
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
            label: "최적화 규칙",
            href: "/properties-new",
            desc: "변환을 가능하게 하는 연산의 성질",
          },
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "변환 과정에서 반드시 유지되어야 하는 조건",
          },
          {
            label: "공통 계산 구조",
            href: "/computation-structures",
            desc: "여러 연산자에 반복적으로 나타나는 계산 패턴",
          },
        ],
      },
    ],
    featured: {
      title: "아틀라스 홈",
      desc: "실행에서 최적화, 보존, 하드웨어 관찰, 계산 구조, 구현, 생성까지 전체 흐름으로 읽습니다.",
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
            label: "최적화 규칙",
            href: "/properties-new",
            desc: "하드웨어 근거에서 변환 가능성으로 이동",
          },
          {
            label: "실험 분석",
            href: "/analysis-new",
            desc: "측정된 근거가 실제 구현 선택에 어떻게 이어지는지 확인",
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

  semantics: {
    title: "의미와 규칙",
    sections: [
      {
        title: "최적화 규칙",
        links: [
          {
            label: "최적화 규칙",
            href: "/properties-new",
            desc: "연산이 어떤 변환 가능성을 가지는지 정리",
          },
          {
            label: "재배열 가능성",
            href: "/properties-new#reordering-properties",
            desc: "연산 순서가 바뀔 수 있는 경우",
          },
          {
            label: "스트리밍 가능성",
            href: "/properties-new#streaming-properties",
            desc: "전체 materialization 없이 처리할 수 있는 경우",
          },
          {
            label: "융합과 on-chip 유지",
            href: "/properties-new#fusion-properties",
            desc: "중간 메모리 이동을 줄일 수 있는 경우",
          },
        ],
      },
      {
        title: "보존 조건",
        links: [
          {
            label: "보존 조건",
            href: "/invariants",
            desc: "의미적, 구조적, 수치적 경계를 정리",
          },
          {
            label: "의미 보존",
            href: "/invariants#semantic-invariants",
            desc: "변환 이후에도 바뀌면 안 되는 의미",
          },
          {
            label: "수치 안정 경계",
            href: "/invariants#numerical-invariants",
            desc: "numeric drift와 안정성의 허용 범위",
          },
        ],
      },
    ],
    featured: {
      title: "의미와 규칙",
      desc: "무엇이 가능해지는지와 어디까지 허용되는지를 함께 봅니다.",
      href: "/properties-new",
    },
  },

  structures: {
    title: "공통 계산 구조",
    sections: [
      {
        title: "구조 읽기",
        links: [
          {
            label: "공통 계산 구조",
            href: "/computation-structures",
            desc: "연산자 이름보다 먼저 반복적으로 등장하는 계산 패턴을 읽습니다.",
          },
          {
            label: "Reduction",
            href: "/computation-structures#reduction",
            desc: "누적, 축약, 결합 구조를 중심으로 읽기",
          },
          {
            label: "Streaming Accumulation",
            href: "/computation-structures#streaming-accumulation",
            desc: "전체 결과를 만들지 않고 진행 상태를 누적하는 구조",
          },
          {
            label: "Mergeable Summary",
            href: "/computation-structures#mergeable-summary",
            desc: "부분 결과를 합쳐 전체 의미를 유지하는 요약 구조",
          },
          {
            label: "Weighted Aggregation",
            href: "/computation-structures#weighted-aggregation",
            desc: "가중 결합과 정규화가 함께 들어가는 구조",
          },
        ],
      },
      {
        title: "다음으로 연결",
        links: [
          {
            label: "연산자 구현",
            href: "/operators-new",
            desc: "공통 구조가 개별 operator에서 어떻게 나타나는지 보기",
          },
          {
            label: "메모리 관점",
            href: "/memory-new",
            desc: "계산 구조를 traffic, reuse, residency로 다시 읽기",
          },
        ],
      },
    ],
    featured: {
      title: "공통 계산 구조",
      desc: "개별 연산자보다 먼저, 반복적으로 나타나는 계산의 형태를 읽습니다.",
      href: "/computation-structures",
    },
  },

  operators: {
    title: "연산자 구현",
    sections: [
      {
        title: "연산자 계열",
        links: [
          {
            label: "연산자 구현",
            href: "/operators-new",
            desc: "고정된 커널이 아니라 여러 구현 경로를 가진 대상으로 탐색",
          },
          {
            label: "Dense Compute",
            href: "/operators-new#dense-compute-operators",
            desc: "tiling과 residency 구조가 강한 GEMM 계열",
          },
          {
            label: "Reduction 중심 연산자",
            href: "/operators-new#reduction-centric-operators",
            desc: "reduction topology와 accumulation 거동이 중요한 연산자",
          },
          {
            label: "Attention 계열",
            href: "/operators-new#attention-like-operators",
            desc: "streaming과 weighted reduction 중심의 구현 구조",
          },
        ],
      },
      {
        title: "다음으로 연결",
        links: [
          {
            label: "실험 분석",
            href: "/analysis-new",
            desc: "구현 variant가 실제로 어떻게 달라지는지 비교",
          },
          {
            label: "메모리 관점",
            href: "/memory-new",
            desc: "연산자를 memory movement와 reuse 관점에서 다시 읽기",
          },
        ],
      },
    ],
    featured: {
      title: "연산자 구현",
      desc: "각 연산자를 성질, 보존 조건, 실행 경로를 가진 구조로 해석합니다.",
      href: "/operators-new",
    },
  },

  analysis: {
    title: "실험 분석",
    sections: [
      {
        title: "탐색",
        links: [
          {
            label: "실험 분석",
            href: "/analysis-new",
            desc: "구현 variant와 측정 결과를 비교하는 페이지",
          },
          {
            label: "Variant 비교",
            href: "/analysis-new#variant-comparison",
            desc: "서로 다른 구현 경로의 차이를 읽기",
          },
          {
            label: "Metric 해석",
            href: "/analysis-new#metric-interpretation",
            desc: "측정된 숫자가 실제로 무엇을 의미하는지 이해",
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
      title: "실험 분석",
      desc: "성질과 연산자 해석을 실제 구현 비교와 측정 결과로 연결합니다.",
      href: "/analysis-new",
    },
  },

  memory: {
    title: "메모리 관점",
    sections: [
      {
        title: "메모리로 읽기",
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
      desc: "하드웨어, 의미, 연산자, 실험을 memory movement와 reuse 기준으로 다시 읽습니다.",
      href: "/memory-new",
    },
  },
};

