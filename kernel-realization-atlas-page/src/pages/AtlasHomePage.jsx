import { Link } from "react-router-dom";

const chips = [
  "Execution",
  "Optimization",
  "Preservation",
  "Hardware Evidence",
  "Computation Structure",
  "Implementation",
  "Generation",
];

const flowSteps = [
  {
    title: "실행 기반",
    desc: "연산을 실제로 실행 가능한 형태로 만들고, framework · runtime · backend · kernel execution의 기본 경로를 구성합니다.",
  },
  {
    title: "하드웨어 관찰",
    desc: "실제 GPU가 어떤 반응을 보이는지 측정하고, memory access, scheduling, bottleneck의 단서를 확보합니다.",
  },
  {
    title: "공통 계산 구조",
    desc: "reduction, streaming accumulation, mergeable summary처럼 여러 연산자에 반복적으로 나타나는 계산 구조를 추출합니다.",
  },
  {
    title: "보존 조건",
    desc: "어떤 변환이 허용되는지 판단하기 위해, 연산 의미와 실행 과정에서 반드시 유지되어야 하는 조건을 정리합니다.",
  },
  {
    title: "최적화",
    desc: "보존 조건을 만족하는 범위 안에서, 연산을 더 빠르고 더 안정적으로 바꿀 수 있는 변환 가능성을 다룹니다.",
  },
  {
    title: "구현과 실험",
    desc: "각 operator의 구현 방식과 realization path를 비교하고, variant와 metric 분석을 통해 실제 차이를 검증합니다.",
  },
  {
    title: "생성",
    desc: "규칙, 보존 조건, 하드웨어 정보, 구현 선택지를 조합해 특정 상황에 맞는 compiler와 kernel synthesis 경로를 구성합니다.",
  },
];

const principles = [
  {
    title: "측정에서 시작",
    desc: "이 Atlas는 추상 규칙만으로 시작하지 않습니다. 실제 GPU의 측정된 반응을 중요한 근거로 둡니다.",
  },
  {
    title: "의미와 실행을 분리하지 않음",
    desc: "연산의 의미, 허용되는 변환, 실제 구현, 하드웨어에서의 결과를 하나의 연속 구조로 다룹니다.",
  },
  {
    title: "연산자보다 계산 구조를 먼저 봄",
    desc: "개별 operator 이름보다, reduction이나 streaming accumulation처럼 반복적으로 나타나는 구조를 먼저 파악합니다.",
  },
  {
    title: "분석은 다음 선택의 근거",
    desc: "analysis는 결과 정리에 그치지 않고, 다음 realization과 synthesis 방향을 고르는 근거가 됩니다.",
  },
];

const primaryCards = [
  {
    title: "하드웨어 관찰",
    desc: "GPU probing과 측정 데이터를 통해 실제 실행 거동, 메모리 접근 특성, 병목의 단서를 확인합니다.",
    href: "/hardware-evidence",
  },
  {
    title: "공통 계산 구조",
    desc: "여러 연산자에 반복적으로 나타나는 reduction, streaming accumulation, mergeable summary 구조를 정리합니다.",
    href: "/computation-structures",
  },
  {
    title: "변환 규칙",
    desc: "연산이 어떤 방식으로 재배열, 분해, 융합, 타일링될 수 있는지 그 근거가 되는 구조적 성질을 정리합니다.",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    desc: "변환 이후에도 유지되어야 하는 의미, 수치적 일관성, 허용 가능한 오차 범위를 설명합니다.",
    href: "/invariants",
  },
  {
    title: "연산자 실현 경로",
    desc: "각 operator가 실제로 어떤 구현 방식과 실행 경로를 가질 수 있는지 구조적으로 정리합니다.",
    href: "/operators-new",
  },
  {
    title: "구현 비교 실험",
    desc: "variant 비교, metric 해석, signature 분석을 통해 구현 차이와 실제 성능 결과를 검증합니다.",
    href: "/analysis-new",
  },
  {
    title: "메모리 중심 해석",
    desc: "HBM traffic, on-chip residency, 재계산 가능성을 기준으로 Atlas 전체를 다시 해석합니다.",
    href: "/memory-new",
  },
];

export default function AtlasHomePage() {
  return (
    <div className="space-y-16">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Kernel Realization Atlas
        </p>

        <h1 className="mt-4 max-w-6xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          실행에서 최적화, 그리고 생성까지
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-neutral-400">
          이 Atlas는 AI 연산을 실행하는 구조에서 출발해, 더 나은 실행을 위한
          최적화 규칙과 보존 조건을 정리하고, 하드웨어 관찰과 공통 계산 구조,
          구현 비교 실험을 거쳐 특화된 compiler 생성 관점까지 하나의 흐름으로
          연결합니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-sm text-neutral-300">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">왜 이 Atlas인가</h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-neutral-400">
            의미적으로 가능한 변환이 실제 하드웨어에서 항상 좋은 실행이 되는 것은
            아닙니다. 반대로 하드웨어에서 빠른 방식이 항상 의미적으로 안전한 것도
            아닙니다. 그래서 이 Atlas는 실행, 최적화, 보존, 하드웨어 관찰,
            계산 구조, 구현 실험, 생성 구조를 분리하면서도 하나의 연결된 층으로
            다룹니다.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">프로젝트의 흐름</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 프로젝트는 기능 나열이 아니라, 관심의 중심이 어떻게 이동해 왔는지를
            따라 읽는 것이 더 자연스럽습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-lime-400/80">
                Step {index + 1}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 관점</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 Atlas를 관통하는 해석 원칙들입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 카테고리</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            아래 카테고리에서 각 층위를 직접 탐색할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {primaryCards.map((card) => (
            <Link
              key={card.title}
              to={card.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-lime-400/40 hover:bg-white/10"
            >
              <div className="text-lg font-semibold text-white">{card.title}</div>
              <div className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">추천 탐색 순서</h2>
          <p className="max-w-4xl text-sm leading-7 text-neutral-400">
            처음 읽는다면 먼저 하드웨어 관찰에서 실제 GPU의 반응을 보고,
            최적화 규칙과 보존 조건을 거쳐 공통 계산 구조를 확인한 뒤,
            연산자 구현과 구현 비교 실험으로 내려가는 흐름이 가장 자연스럽습니다.
            이후 메모리 관점에서 전체를 다시 읽고, 마지막에 생성 관점으로
            프로젝트의 방향을 정리하면 전체 구조가 더 선명해집니다.
          </p>
        </div>
      </section>
    </div>
  );
}