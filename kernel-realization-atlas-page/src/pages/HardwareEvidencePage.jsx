import { Link } from "react-router-dom";

const evidenceSections = [
  {
    title: "Hardware Response Patterns",
    desc: "GPU의 반응을 스펙이 아니라 측정된 거동으로 읽습니다. memory hierarchy, access pattern, scheduling 특성이 실제 실행에서 어떤 비용과 제약으로 나타나는지 추적합니다.",
    items: [
      "Stride sweep / coalescing",
      "Cache line / locality",
      "Shared memory bank conflict",
      "Occupancy / latency hiding",
      "Throughput ceilings",
    ],
  },
  {
    title: "Execution Primitive Evidence",
    desc: "primitive 단위에서 realization 가능성과 비용 구조를 봅니다. 목표는 요소를 나열하는 것이 아니라, 어떤 구현 조합이 실제 GPU에서 더 나은지 판단할 단서를 모으는 것입니다.",
    items: [
      "Reduction topology",
      "Streaming update",
      "Tile staging",
      "Rematerialization",
      "Primitive-to-kernel-family mapping",
    ],
  },
];

const chips = [
  "Hardware Probing",
  "Measured Response",
  "Memory Behavior",
  "Scheduling Clues",
  "Realization Evidence",
];

const experimentCards = [
  {
    title: "Global Stride Sweep",
    desc: "stride 변화에 따라 memory access cost와 coalescing 양상이 어떻게 바뀌는지 측정합니다.",
    href: "/analysis-new",
  },
  {
    title: "Fixed-Work Stride Sweep",
    desc: "총 작업량을 고정한 채 stride만 바꿔 hardware response를 더 분리해 관찰합니다.",
    href: "/analysis-new",
  },
  {
    title: "Shared Memory Bank Conflict",
    desc: "indexing pattern에 따라 bank conflict가 어떻게 생기고 성능에 어떻게 반영되는지 비교합니다.",
    href: "/analysis-new",
  },
  {
    title: "Execution Primitive Profiles",
    desc: "reduction, streaming, tile staging 등의 primitive가 어떤 realization 특성과 비용 구조를 갖는지 정리합니다.",
    href: "/operators-new",
  },
];

export default function HardwareEvidencePage() {
  return (
    <div className="space-y-14">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          Hardware Evidence
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          불투명한 GPU 거동을 역추적해
          <br className="hidden lg:block" />
          realization 선택 근거를 만드는 층
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 GPU가 실제로 어떻게 반응하는지를 측정 기반으로 다룹니다.
          단순한 성능 수치 정리가 아니라, probing kernel과 실험 결과를 통해
          memory, scheduling, execution primitive의 작동 단서를 역으로 읽어냅니다.
          여기서 얻은 관찰은 특정 연산과 구현 상황에서 어떤 realization이 더
          적절한지 판단하는 근거로 이어집니다.
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
          <h2 className="text-xl font-semibold text-white">
            왜 이 층이 필요한가
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
            대표 probing 실험을 통해 hardware response와 execution pattern을 읽습니다.
            이 결과는 analysis와 operator realization 페이지로 이어지며,
            realization 비교와 선택의 근거가 됩니다.
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
          <h2 className="text-xl font-semibold text-white">
            Why this layer matters
          </h2>
          <p className="mt-3 text-sm leading-7 text-neutral-400">
            의미적으로 허용되는 변환이 항상 좋은 실행으로 이어지지는 않습니다.
            실제 GPU의 memory hierarchy, bank mapping, transaction behavior,
            issue pattern은 realization quality를 크게 바꿉니다. 그래서 Atlas는
            의미 계층과 별도로 hardware evidence를 두고, 불투명한 실행 메커니즘을
            probing과 측정으로 역추적합니다. 이 층의 목적은 하드웨어를 설명하는
            데서 끝나지 않고, 어떤 구현 방식이 더 적절한지 판단할 근거를 만드는
            데 있습니다.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white">Next paths</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              to="/properties-new"
              className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
            >
              변환 성질 보기
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
              실현 비교 실험 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}