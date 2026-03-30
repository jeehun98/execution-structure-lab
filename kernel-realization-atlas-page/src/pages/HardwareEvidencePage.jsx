import { Link } from "react-router-dom";

const evidenceSections = [
  {
    title: "Hardware Characterization",
    desc: "GPU의 실제 하드웨어 거동을 측정하고, 메모리 계층·접근 패턴·스케줄링 특성을 관찰합니다.",
    items: [
      "Stride sweep / coalescing",
      "Cache line / locality",
      "Shared memory bank conflict",
      "Occupancy / latency hiding",
      "Throughput ceilings",
    ],
  },
  {
    title: "Execution Primitive Lab",
    desc: "연산 primitive 단위에서 realization 가능성과 비용 구조를 관찰합니다.",
    items: [
      "Reduction topology",
      "Streaming update",
      "Tile staging",
      "Rematerialization",
      "Primitive-to-kernel-family mapping",
    ],
  },
];

const experimentCards = [
  {
    title: "Global Stride Sweep",
    desc: "stride 변화에 따라 메모리 접근 비용과 coalescing 양상을 측정합니다.",
    href: "/analysis-new",
  },
  {
    title: "Fixed-Work Stride Sweep",
    desc: "총 작업량을 고정한 상태에서 stride 변화만 분리해 hardware response를 확인합니다.",
    href: "/analysis-new",
  },
  {
    title: "Shared Memory Bank Conflict",
    desc: "shared memory 인덱싱 패턴에 따른 bank conflict와 성능 저하를 비교합니다.",
    href: "/analysis-new",
  },
  {
    title: "Execution Primitive Profiles",
    desc: "reduction, streaming, tile staging 등의 primitive별 realization 특성을 정리합니다.",
    href: "/operators-new",
  },
];

const chips = [
  "Measured Behavior",
  "GPU Probing",
  "Memory Access",
  "Scheduling",
  "Execution Primitives",
];

export default function HardwareEvidencePage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Hardware Evidence
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          측정된 하드웨어 거동과 실행 primitive의 증거 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 GPU가 실제로 어떻게 반응하는지를 측정 기반으로 정리합니다.
          단순한 이론 설명이 아니라, probing kernel과 실험 결과를 통해 memory,
          scheduling, execution primitive의 실재를 관찰하는 층입니다.
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

      <section className="grid gap-6 lg:grid-cols-2">
        {evidenceSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              {section.desc}
            </p>

            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Representative Experiments</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
            대표 probing 실험을 통해 hardware response와 execution pattern을
            읽어낼 수 있습니다. 이후 analysis와 operator realization 페이지로
            이어지도록 연결합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {experimentCards.map((card) => (
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

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">Why this layer matters</h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            의미적으로 허용되는 변환이 언제나 좋은 실행으로 이어지지는 않습니다.
            실제 GPU의 memory hierarchy, bank mapping, transaction behavior,
            issue pattern은 realization quality를 크게 바꿉니다. 그래서 Atlas는
            의미 계층 위에 hardware evidence를 별도 층으로 둡니다.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Next paths</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              to="/properties-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              최적화 의미 체계 보기
            </Link>
            <Link
              to="/operators-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              연산자 실현 구조 보기
            </Link>
            <Link
              to="/analysis-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              실현 실험실 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}