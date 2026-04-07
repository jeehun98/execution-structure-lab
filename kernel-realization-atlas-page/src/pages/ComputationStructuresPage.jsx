import { Link } from "react-router-dom";

const structureGroups = [
  {
    title: "Reduction",
    desc: "여러 값을 하나의 결과나 더 작은 요약으로 모으는 계산 구조입니다. sum, max, mean, norm, 통계량 계산처럼 축약과 결합이 중심이 되는 계산을 이 범주에서 읽을 수 있습니다.",
  },
  {
    title: "Streaming Accumulation",
    desc: "전체 intermediate를 먼저 완성하지 않고, 부분 상태를 순차적으로 갱신하며 결과를 형성하는 계산 구조입니다. 입력 전체보다 갱신 규칙과 누적 상태의 의미가 중심이 됩니다.",
  },
  {
    title: "Mergeable Summary",
    desc: "부분 구간이나 부분 집합에서 얻은 요약 상태들을 다시 결합해 전체 결과를 구성할 수 있는 계산 구조입니다. 전체 계산을 부분 요약들의 조합으로 이해할 수 있을 때 이 구조가 드러납니다.",
  },
  {
    title: "Weighted Aggregation",
    desc: "값들의 단순 합이 아니라, 가중 관계를 반영해 결과를 형성하는 계산 구조입니다. 확률, 점수, 계수, 중요도처럼 각 항의 기여가 비대칭적일 때 이 범주가 중요해집니다.",
  },
];

const principleCards = [
  {
    title: "연산자보다 먼저 계산 형식을 본다",
    desc: "이 페이지는 개별 operator를 고유한 이름의 목록으로 다루기보다, 그 내부 계산이 어떤 형식으로 조직되는지를 먼저 읽습니다. 구조가 보이면 서로 다른 operator 사이의 공통 패턴도 드러납니다.",
  },
  {
    title: "구조는 변환 이전의 해석층이다",
    desc: "Computation structure는 무엇이 reorderable한지, fuseable한지, tileable한지를 직접 말하지 않습니다. 그보다 먼저 계산이 어떤 방식으로 구성되는지를 보여 주는 상위 해석층입니다.",
  },
  {
    title: "구조는 분류 언어를 제공한다",
    desc: "Atlas에서 computation structure는 operator를 더 일반적인 계산 범주로 다시 묶기 위한 언어입니다. 이름이 다른 연산자들을 하나의 구조적 어휘로 다시 읽게 해 줍니다.",
  },
];

const readingQuestions = [
  {
    title: "무엇이 누적되고 있는가",
    desc: "계산이 여러 값을 하나의 요약으로 모으는가, 아니면 상태를 유지하며 순차적으로 갱신하는가를 먼저 봅니다. 이 질문은 reduction과 accumulation 구조를 구분하는 출발점입니다.",
  },
  {
    title: "부분 결과가 독립적인 의미를 가지는가",
    desc: "부분 구간에서 만든 요약이 그 자체로 유효한 상태인지, 그리고 나중에 다시 합쳐질 수 있는지를 봅니다. 이 질문은 mergeable summary 구조를 읽는 핵심입니다.",
  },
  {
    title: "항들의 기여가 대칭적인가",
    desc: "각 값이 같은 방식으로 더해지는지, 아니면 점수·계수·확률처럼 서로 다른 비중으로 반영되는지를 봅니다. 이 차이가 weighted aggregation 구조를 드러냅니다.",
  },
  {
    title: "전체 결과보다 갱신 규칙이 더 중요한가",
    desc: "결과를 한 번에 닫힌 형식으로 계산하기보다, running state를 어떻게 갱신하는지가 계산의 본질인지 봅니다. 이런 경우 streaming accumulation 관점이 더 적절합니다.",
  },
];

const operatorExamples = [
  {
    title: "LayerNorm / RMSNorm",
    desc: "통계량을 먼저 요약하고, 그 요약을 다시 각 원소에 적용하는 계산으로 읽을 수 있습니다. reduction과 summary application이 함께 나타나는 대표적 예시입니다.",
  },
  {
    title: "Attention",
    desc: "입력들 사이의 관계 계산과 가중 집계를 포함하는 구조로 볼 수 있습니다. pairwise relation과 weighted aggregation이 함께 등장하는 복합 구조의 사례입니다.",
  },
  {
    title: "GEMM",
    desc: "대응되는 값들의 결합과 축 방향 누적이 결합된 계산으로 볼 수 있습니다. pairwise combination과 reduction이 결합된 기본 구조의 대표 예시입니다.",
  },
  {
    title: "Online Statistics / Running Summary",
    desc: "전체 입력을 모두 보관하지 않고도 부분 상태를 갱신하며 결과를 형성하는 계산으로 읽을 수 있습니다. streaming accumulation의 전형적인 사례입니다.",
  },
];

const layerCards = [
  {
    title: "Computation Structures",
    desc: "계산이 어떤 형식으로 조직되는지를 분류합니다.",
  },
  {
    title: "Properties",
    desc: "그 계산이 어떤 재구성과 변환을 허용하는지를 읽습니다.",
  },
  {
    title: "Invariants",
    desc: "변환 이후에도 무엇이 유지되어야 하는지를 제한합니다.",
  },
  {
    title: "Operators / Realization",
    desc: "이 구조와 조건들이 실제 구현 경로에서 어떻게 나타나는지를 봅니다.",
  },
];

const nextLinks = [
  {
    title: "최적화 의미 체계",
    href: "/properties-new",
  },
  {
    title: "보존 조건",
    href: "/invariants",
  },
  {
    title: "연산자 실현 구조",
    href: "/operators-new",
  },
];

export default function ComputationStructuresPage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Computation Structures
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          연산자를 다시 읽기 위한
          <br className="hidden lg:block" />
          상위 계산 구조의 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 개별 operator의 이름이나 구현 방식보다, 여러 연산에
          반복적으로 나타나는 공통 계산 형식을 정리합니다. Atlas에서
          computation structure는 특정 hardware path를 직접 설명하는 층이
          아니라, 주어진 operator를 더 일반적인 계산 범주로 분류하고 해석하기
          위한 상위 개념의 계층입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 계산 구조</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Computation structures는 연산자 이름보다, 계산이 내부적으로 어떤
            형식으로 조직되는지를 기준으로 정의됩니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {structureGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{group.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {group.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">이 층을 어떻게 읽어야 하는가</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            Computation structure는 변환 목록을 주는 페이지가 아니라, 계산의
            내부 형식을 읽는 페이지입니다. 이 층이 먼저 서야 이후 property,
            invariant, realization의 구분도 흔들리지 않습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {principleCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">구조를 읽기 위한 질문들</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            이 페이지의 중심은 허용 여부가 아니라 형식 파악입니다. 계산을
            만났을 때 먼저 아래 질문들에 답할 수 있어야 구조적 분류가 가능합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {readingQuestions.map((item) => (
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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">대표 예시</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            하나의 operator는 여러 구조의 조합으로 읽힐 수 있고, 서로 다른
            operator들도 같은 구조적 범주를 공유할 수 있습니다. 이 페이지의
            목적은 바로 그 공통 계산 형식을 드러내는 것입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {operatorExamples.map((item) => (
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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Atlas 안에서의 위치</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Computation structure는 전체 계층의 출발점입니다. 먼저 계산 형식을
            읽고, 그다음에 변환 가능성, 보존 조건, 실제 실현 경로를 이어서
            해석하는 흐름이 Atlas의 기본 순서입니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {layerCards.map((item) => (
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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">이 층의 원리</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Atlas에서 computation structure는 무엇을 바꿀 수 있는지를 말하지
            않습니다. 그보다 먼저, 계산이 어떤 형식으로 조직되는지를 드러냅니다.
            Property가 why possible을 말한다면, computation structure는 what kind
            of computation인지를 말하는 층입니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조를 먼저 읽은 뒤, property에서 어떤 변환이 가능한지 보고,
            invariant에서 무엇이 유지되어야 하는지 확인한 다음, operator
            realization에서 그것이 어떻게 구체화되는지를 이어서 읽을 수 있습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {nextLinks.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-medium text-neutral-300 transition hover:border-lime-400/40 hover:bg-white/10 hover:text-white"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}