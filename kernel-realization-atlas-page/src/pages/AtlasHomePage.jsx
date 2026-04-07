import { Link } from "react-router-dom";

const chips = [
  "실행 기반",
  "GPU 관찰",
  "계산 구조",
  "변환 가능성",
  "보존 조건",
  "실현 비교",
  "생성",
];

const flowSteps = [
  {
    title: "실행 기반",
    desc: "연산이 실제로 놓이는 실행 환경과 구현 조건을 먼저 봅니다. framework, runtime, backend, kernel execution, 그리고 hardware evidence는 이후의 모든 구조 해석이 실제 구현으로 내려가기 위해 기대고 있는 바닥입니다.",
  },
  {
    title: "공통 계산 구조",
    desc: "개별 operator 이름보다 먼저, 여러 연산에 반복적으로 나타나는 계산 형식을 식별합니다. reduction, streaming accumulation, mergeable summary 같은 구조는 이후 구현 선택을 조직하기 위한 상위 단위가 됩니다.",
  },
  {
    title: "변환 가능성",
    desc: "어떤 구조가 재배열, 분해, 결합, fusion, rematerialization, residency 최적화로 이어질 수 있는지를 정리합니다. 이 층은 무엇을 바꿀 수 있는지, 어떤 구현 방향이 열려 있는지를 설명합니다.",
  },
  {
    title: "보존 조건",
    desc: "구현이 달라져도 유지되어야 하는 의미, dependency, 수치적 일관성을 정리합니다. 이 층은 가능한 변화의 범위를 넓히는 것이 아니라, 끝까지 무너지면 안 되는 조건을 고정합니다.",
  },
  {
    title: "연산자 해석",
    desc: "각 operator를 독립된 이름으로 보지 않고, 어떤 computation structure, property, invariant의 조합으로 이루어지는지 다시 읽습니다. 연산자는 여기서 구조적 분류와 realization branch가 만나는 결절점이 됩니다.",
  },
  {
    title: "실현 비교",
    desc: "같은 구조적 해석이 실제 구현에서 어떤 realization들로 나타나는지를 비교합니다. variant와 metric은 단순 성능 기록이 아니라, 어떤 구현 선택이 어떤 제약과 trade-off를 갖는지 드러내는 근거가 됩니다.",
  },
  {
    title: "생성",
    desc: "계산 구조, 변환 가능성, 보존 조건, 실현 비교를 바탕으로 특정 상황에 맞는 realization 선택과 generation 규칙을 구성합니다. 이 단계에서 Atlas는 설명 체계를 넘어 compiler 혹은 kernel generator의 기준으로 확장됩니다.",
  },
];

const principles = [
  {
    title: "연산자 이름보다 실행 구조를 먼저 본다",
    desc: "이 프로젝트는 operator를 고정된 단위로 외우기보다, 그 아래에서 반복되는 계산 구조와 실행 조건을 먼저 읽는 방식으로 출발합니다.",
  },
  {
    title: "구조와 구현을 분리하되 끊어놓지 않는다",
    desc: "계산 구조, 변환 가능성, 보존 조건, realization은 서로 다른 층으로 다루지만, 최종적으로는 실제 구현 선택으로 다시 연결되어야 합니다.",
  },
  {
    title: "하드웨어 관찰은 출발점이다",
    desc: "GPU probing과 측정은 추상 이론의 부록이 아니라, 어떤 realization이 실제로 성립하고 유리한지를 판단하기 위한 출발점입니다.",
  },
  {
    title: "구조적 해석은 generation으로 이어져야 한다",
    desc: "구조를 분류하는 것만으로는 부족합니다. 어떤 구조가 어떤 실현 후보를 낳고, 어떤 조건에서 자동 선택 혹은 생성될 수 있는지까지 이어져야 합니다.",
  },
];

const primaryCards = [
  {
    title: "하드웨어 관찰",
    desc: "GPU가 실제로 어떻게 반응하는지를 측정과 probing으로 읽고, realization 선택에 필요한 실행 단서와 물리적 제약을 확보합니다.",
    href: "/hardware-evidence",
  },
  {
    title: "공통 계산 구조",
    desc: "operator 아래에서 반복되는 계산 형식을 먼저 식별하고, 이후 구현 선택의 상위 단위로 삼습니다.",
    href: "/computation-structures",
  },
  {
    title: "변환 가능성",
    desc: "구조 위에서 어떤 재배열, 분해, 결합, streaming, fusion이 가능한지를 정리합니다.",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    desc: "구현이 달라져도 유지되어야 하는 의미, dependency, 수치 경계를 정리합니다.",
    href: "/invariants",
  },
  {
    title: "연산자 해석",
    desc: "각 operator를 structure, property, invariant, realization branch의 결절점으로 다시 읽습니다.",
    href: "/operators-new",
  },
  {
    title: "실현 비교 실험",
    desc: "variant 비교와 측정을 통해 어떤 realization이 실제로 더 적합한지 평가합니다.",
    href: "/analysis-new",
  },
  {
    title: "메모리 관점",
    desc: "앞선 층들을 intermediate, reuse, residency, traffic 관점으로 다시 절단해 구현 관점에서 재해석합니다.",
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
          연산을 구조로 다시 읽고
          <br className="hidden lg:block" />
          실제 구현 선택과 생성으로 연결하는 Atlas
        </h1>

        <p className="mt-6 max-w-4xl text-lg leading-8 text-neutral-400">
          이 Atlas는 AI 연산을 개별 operator 목록으로 정리하는 데서 멈추지
          않습니다. 먼저 여러 연산에 반복적으로 나타나는 공통 계산 구조를
          식별하고, 그 위에서 가능한 변환과 반드시 유지되어야 하는 보존 조건을
          분리해 봅니다. 그리고 이 구조적 해석을 실제 하드웨어 관찰,
          realization 비교, 구현 변형 조직으로 연결해, 최종적으로 compiler
          혹은 kernel generation의 기준으로 확장합니다.
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
            같은 수학적 연산이라도, 어떤 계산 구조로 읽느냐에 따라 가능한 변환,
            유지해야 하는 조건, 선택 가능한 realization은 달라집니다. 이
            프로젝트는 연산을 하나의 이름으로 고정해 설명하지 않고, 실행 기반,
            구조, 변환, 보존, 실현의 층으로 다시 나누어 해석합니다. 그 목적은
            단순한 분류가 아니라, 실제 구현 방식을 더 정확하게 조직하고 새로운
            realization을 설계하기 위한 기준을 만드는 데 있습니다.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">프로젝트의 층</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            이 프로젝트는 기능 목록보다, 연산을 어떤 층으로 다시 나누고 실제
            구현으로 어떻게 연결하는지를 따라 읽는 편이 더 자연스럽습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {flowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-lime-400/80">
                Layer {index + 1}
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
            아래 카테고리에서 구조 해석, 보존 조건, realization 비교, generation
            방향까지 직접 따라갈 수 있습니다.
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
            구조 중심으로 읽는다면 공통 계산 구조에서 출발해 변환 가능성과 보존
            조건을 먼저 본 뒤, 연산자 해석과 실현 비교로 내려가는 흐름이
            자연스럽습니다. 반대로 구현 중심으로 읽는다면 하드웨어 관찰과 실현
            비교에서 시작해, 어떤 구조가 실제 realization 선택으로 이어지는지를
            거꾸로 따라가는 방식도 가능합니다. 마지막에 메모리 관점과 generation
            방향까지 함께 보면, 이 Atlas가 단순한 설명 체계가 아니라 구현 선택을
            조직하는 프레임이라는 점이 더 분명해집니다.
          </p>
        </div>
      </section>
    </div>
  );
}