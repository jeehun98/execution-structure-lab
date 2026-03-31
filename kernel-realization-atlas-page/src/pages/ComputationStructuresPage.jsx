import { Link } from "react-router-dom";

const structureGroups = [
  {
    title: "Reduction Structure",
    desc: "여러 값을 하나의 요약값으로 모으는 계산 구조입니다. sum, max, norm, statistics처럼 결합 규칙과 accumulation 방식이 중요한 연산들을 다룹니다.",
  },
  {
    title: "Streaming Structure",
    desc: "전체 intermediate를 물질화하지 않고 부분 결과를 순차적으로 갱신하는 계산 구조입니다. online update, blockwise accumulation, rescaling 기반 계산과 연결됩니다.",
  },
  {
    title: "Mergeable Summary",
    desc: "부분 구간에서 계산한 결과를 다시 결합해 전체 결과를 만들 수 있는 구조입니다. 병렬 reduction, tiled aggregation, distributed accumulation의 기반이 됩니다.",
  },
];

const ruleCards = [
  {
    title: "구조가 중요한 이유",
    desc: "연산자를 개별 수식으로만 보는 대신, 반복적으로 등장하는 계산 패턴으로 보면 어떤 realization이 가능한지 더 직접적으로 드러납니다.",
  },
  {
    title: "변환과의 연결",
    desc: "tiling, fusion, streaming, rematerialization 같은 변환은 계산 구조가 무엇인지에 따라 허용 범위와 효율이 달라집니다.",
  },
  {
    title: "연산자 해석의 기반",
    desc: "각 operator는 독립된 존재이기보다 특정 computation structure의 사례로 해석될 수 있으며, 이 관점이 realization path를 더 명확하게 만듭니다.",
  },
];

const examples = [
  {
    title: "LayerNorm / RMSNorm",
    desc: "통계량 계산과 normalization이 결합된 reduction 구조로 볼 수 있으며, online reducible summary 관점에서 재구성할 수 있습니다.",
  },
  {
    title: "Attention",
    desc: "score materialization 없이 streaming weighted reduction으로 바꿔 해석할 수 있으며, FlashAttention류 realization의 기반이 됩니다.",
  },
  {
    title: "GEMM Epilogue",
    desc: "local accumulation 이후 bias, activation, scaling을 결합하는 tile-compatible compute 구조로 볼 수 있습니다.",
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
          반복적으로 등장하는 계산 구조의 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 개별 operator를 넘어, 여러 연산에서 공통적으로 반복되는
          계산 구조를 정리합니다. Atlas에서 computation structure는 단순한
          알고리즘 분류가 아니라, 어떤 realization과 optimization이 가능한지를
          드러내는 해석 단위입니다.
        </p>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">핵심 계산 구조</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Computation structures는 reduction, streaming, mergeable summary의
            관점에서 이해할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
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
            왜 구조 단위로 봐야 하는가
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-neutral-400">
            어떤 연산이 본질적으로 reduction인지, streaming accumulation인지,
            mergeable summary를 가지는지에 따라 가능한 realization은 크게
            달라집니다. 동일한 수학적 결과를 내더라도, 계산 구조의 해석에 따라
            materialization 여부, memory traffic, on-chip residency 전략이
            달라집니다.
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
            computation structure는 특정 연산자에만 묶이지 않습니다. 서로 다른
            operator들도 같은 구조적 성격을 공유할 수 있고, 그 공통성이 최적화
            전략의 출발점이 됩니다.
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
            Atlas에서 Computation Structures는 property와 invariant, 그리고
            operator realization을 연결하는 중간 해석층입니다. 연산의 수학적
            형태만이 아니라, 실제 구현에서 반복적으로 등장하는 계산 방식 자체를
            드러냄으로써 더 직접적인 optimization reasoning을 가능하게 합니다.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">다음 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            계산 구조는 최적화 의미 체계, 보존 조건, 연산자 realization으로
            이어집니다.
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