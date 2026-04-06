import { Link } from "react-router-dom";

const structureGroups = [
  {
    title: "Reduction",
    desc: "여러 값을 하나의 결과나 더 작은 요약으로 모으는 계산 구조입니다. sum, max, mean, norm, 통계량 계산처럼 축약과 결합의 형태가 중심이 되는 연산들을 이 관점에서 해석할 수 있습니다.",
  },
  {
    title: "Streaming Accumulation",
    desc: "전체 intermediate를 한 번에 전제하지 않고, 부분 상태를 순차적으로 갱신하며 결과를 형성하는 계산 구조입니다. 입력 전체보다 갱신 규칙과 누적 상태의 의미가 중심이 되는 연산을 분류할 때 유용합니다.",
  },
  {
    title: "Mergeable Summary",
    desc: "부분 구간이나 부분 집합에서 얻은 요약 상태들을 다시 결합해 전체 결과를 구성할 수 있는 계산 구조입니다. 전체 계산을 부분 요약들의 조합으로 이해할 수 있는 경우를 다룹니다.",
  },
  {
    title: "Weighted Aggregation",
    desc: "값들의 단순 합이 아니라, 가중 관계를 반영해 결과를 형성하는 계산 구조입니다. 확률, 점수, 계수, 중요도처럼 값 사이의 비대칭적 기여가 핵심이 되는 연산을 이 범주에서 볼 수 있습니다.",
  },
];

const ruleCards = [
  {
    title: "연산자를 상위 개념으로 다시 본다",
    desc: "개별 operator를 고유한 수식으로만 보지 않고, 더 일반적인 계산 구조의 사례로 다시 해석합니다. 이를 통해 이름이 다른 연산자들 사이의 공통 형식을 드러낼 수 있습니다.",
  },
  {
    title: "구조와 성질을 분리한다",
    desc: "이 계층은 무엇이 reorderable한지, 어떤 구현이 빠른지보다 먼저, 계산이 어떤 형식으로 조직되는지를 다룹니다. 변환 가능성이나 보존 조건은 이후 property와 invariant 계층에서 다루어집니다.",
  },
  {
    title: "분류를 위한 언어를 제공한다",
    desc: "AI compiler / generator가 주어진 operator 집합을 만났을 때, 이를 더 일반적인 계산 범주로 categorize할 수 있어야 합니다. Computation structure는 그 분류를 위한 상위 언어 역할을 합니다.",
  },
];

const examples = [
  {
    title: "LayerNorm / RMSNorm",
    desc: "통계량을 요약한 뒤 이를 다시 각 원소에 적용하는 구조로 볼 수 있습니다. reduction, mergeable summary, broadcasted application의 조합으로 해석할 수 있습니다.",
  },
  {
    title: "Attention",
    desc: "입력들 사이의 관계 계산과 가중 집계를 포함하는 구조로 볼 수 있습니다. pairwise combination, weighted aggregation, streaming accumulation의 조합으로 읽을 수 있습니다.",
  },
  {
    title: "GEMM",
    desc: "대응되는 값들의 결합과 축 방향 누적이 결합된 구조로 볼 수 있습니다. pairwise combination과 reduction의 조합으로 해석할 수 있습니다.",
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
          연산자를 다시 묶는 상위 계산 구조의 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 개별 operator의 이름이나 구현 방식보다, 여러 연산에
          반복적으로 나타나는 공통 계산 구조를 정리합니다. Atlas에서
          computation structure는 특정 hardware나 realization을 직접 설명하는
          항목이 아니라, 주어진 operator를 더 일반적인 계산 범주로 분류하고
          해석하기 위한 상위 개념의 계층입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 계산 구조</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Computation structures는 연산자 자체보다, 그 내부 계산이 어떤 형식으로
            조직되는지를 기준으로 정의됩니다.
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
          <h2 className="text-xl font-semibold text-white">
            왜 구조 단위로 보아야 하는가
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            서로 다른 이름의 operator들도 더 깊은 수준에서는 같은 계산 구조를
            공유할 수 있습니다. 연산을 개별 수식의 목록으로만 두지 않고, reduction,
            streaming accumulation, mergeable summary 같은 상위 구조로 다시 읽으면
            operator 사이의 공통성과 차이를 더 명확하게 정리할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {ruleCards.map((card) => (
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
          <h2 className="text-xl font-semibold text-white">대표 예시</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            computation structure는 특정 연산자 하나에만 묶이지 않습니다. 하나의
            operator는 여러 구조의 조합으로 해석될 수 있고, 서로 다른 operator들도
            같은 구조적 범주를 공유할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {examples.map((item) => (
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
          <h2 className="text-xl font-semibold text-white">이 층의 역할</h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-400">
            Atlas에서 Computation Structures는 operator를 직접 구현하는 층이
            아니라, operator를 더 상위의 계산 개념으로 분류하는 중간 해석층입니다.
            이 계층은 연산이 어떤 구조를 가지는지를 먼저 드러내고, 그 이후에
            property는 무엇이 허용되는지, invariant는 무엇이 유지되어야 하는지,
            realization은 그것이 어떻게 구체화되는지를 다루도록 연결합니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조는 이후 최적화 의미 체계, 보존 조건, 연산자 realization
            계층으로 이어집니다.
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