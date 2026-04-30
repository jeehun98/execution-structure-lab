import { Link } from "react-router-dom";

import { hardwareChips } from "../data/hardware/chips";
import { hardwareOverview } from "../data/hardware/overview";
import {
  hardwareExperimentGroups,
  hardwareExperimentsIntro,
} from "../data/hardware/experiments";

function StatPill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, desc }) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>

      {desc ? (
        <p className="mt-3 max-w-4xl text-sm leading-7 text-neutral-400">
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function ReadingStepCard({ index, title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-400/30 bg-lime-400/10 text-sm font-semibold text-lime-300">
          {index}
        </div>

        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function SignalChips({ items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-neutral-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompactList({ title, items = [] }) {
  if (!items?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h4 className="text-sm font-semibold text-white">{title}</h4>

      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-400">
        {items.slice(0, 4).map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceLevelCard({ title, desc, items = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{desc}</p>

      {items?.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-neutral-400">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ExperimentCard({ experiment }) {
  const signals =
    experiment.observe?.slice(0, 4) ??
    experiment.outputs?.slice(0, 4) ??
    experiment.resultHighlights?.slice(0, 4) ??
    [];

  const controlled =
    experiment.variables?.slice?.(0, 4) ??
    experiment.sweepParams?.slice?.(0, 4) ??
    experiment.inputs?.slice?.(0, 4) ??
    [];

  const fixed =
    experiment.fixedConditions?.slice?.(0, 4) ??
    experiment.controls?.slice?.(0, 4) ??
    [];

  const caveats =
    experiment.caveats?.slice?.(0, 4) ??
    experiment.limitations?.slice?.(0, 4) ??
    [];

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-lime-400/30 hover:bg-white/[0.055]">
      <div className="flex flex-wrap items-center gap-2">
        {experiment.groupLabel ? (
          <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
            {experiment.groupLabel}
          </span>
        ) : null}

        {experiment.category ? (
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
            {experiment.category}
          </span>
        ) : null}

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
          Probe
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">
        {experiment.label}
      </h3>

      {experiment.summary ? (
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          {experiment.summary}
        </p>
      ) : null}

      {experiment.question ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Question
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            {experiment.question}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CompactList title="무엇을 바꾸는가" items={controlled} />
        <CompactList title="무엇을 고정하는가" items={fixed} />
      </div>

      {signals?.length ? (
        <div className="mt-5">
          <div className="mb-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Signals to read
          </div>
          <SignalChips items={signals} />
        </div>
      ) : null}

      {experiment.whyItMatters ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Why it matters
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {experiment.whyItMatters}
          </p>
        </div>
      ) : null}

      {caveats?.length ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Do not overclaim
          </div>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-400">
            {caveats.map((item, index) => (
              <li key={`caveat-${experiment.id}-${index}`} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/hardware-evidence/${experiment.id}`}
          className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 보기
        </Link>

        {experiment.nextLinks?.[0]?.href ? (
          <Link
            to={experiment.nextLinks[0].href}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/30 hover:text-white"
          >
            다음 검증 경로
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function ProbeAtlasIntro({ experiments }) {
  const groupCount = new Set(
    experiments.map((experiment) => experiment.groupId).filter(Boolean)
  ).size;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Probe Atlas
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            {hardwareExperimentsIntro?.title ?? "하드웨어 질문을 가진 실험 목록"}
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-neutral-400">
            {hardwareExperimentsIntro?.desc ??
              "각 probe는 단순한 성능 측정이 아니라, 특정 커널 모양을 GPU에 입력했을 때 어떤 하드웨어 반응이 드러나는지 읽기 위한 실험입니다. 이 페이지에서는 분류를 먼저 고르기보다, 개별 실험이 어떤 질문을 던지는지 먼저 보여줍니다."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-right">
            <div className="text-3xl font-semibold text-white">
              {experiments.length}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
              Probes
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-right">
            <div className="text-3xl font-semibold text-white">
              {groupCount}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
              Layers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HardwareEvidencePage() {
  const experiments = hardwareExperimentGroups.flatMap((group) =>
    (group.experiments ?? []).map((experiment) => ({
      ...experiment,
      groupId: group.id,
      groupLabel: group.label,
      groupSummary: group.summary,
    }))
  );

  return (
    <div className="space-y-16">
      <section className="py-8">
        <p className="text-sm uppercase tracking-[0.2em] text-lime-400">
          {hardwareOverview.eyebrow}
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
          {hardwareOverview.title}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-400">
          이 페이지는 GPU 성능 점수를 모아두는 곳이 아닙니다. 각 probe는 하나의
          커널 구조를 GPU에 입력하고, 그 실행 반응에서 memory layout, cache
          reuse, bank conflict, work collapse, scheduler bias 같은 하드웨어 단서를
          읽기 위한 실험입니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {hardwareChips.map((chip) => (
            <StatPill key={chip}>{chip}</StatPill>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="How to read"
          title="Probe는 benchmark가 아니라 질문을 가진 커널입니다"
          desc="이 페이지에서는 하드웨어 분류보다 개별 실험의 질문을 먼저 봅니다. 중요한 것은 어느 카테고리에 속하는지가 아니라, 이 커널이 무엇을 흔들고, 무엇을 고정하며, 어떤 반응을 근거로 하드웨어 특성을 읽어내는가입니다."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <ReadingStepCard
            index="1"
            title="무엇을 바꾸는가"
            desc="stride, padding, work size, address pattern, warp role처럼 실험에서 의도적으로 흔드는 변수를 먼저 봅니다."
          />

          <ReadingStepCard
            index="2"
            title="무엇을 고정하는가"
            desc="total work, thread shape, memory size, iteration count, cycle budget처럼 비교 기준을 고정합니다."
          />

          <ReadingStepCard
            index="3"
            title="어떤 반응이 드러나는가"
            desc="latency spike, throughput drop, work collapse, conflict, reuse, warp별 progress 같은 관찰 신호를 읽습니다."
          />

          <ReadingStepCard
            index="4"
            title="무엇을 단정하면 안 되는가"
            desc="단일 결과를 하드웨어 원리로 과잉해석하지 않고, 후속 probe와 대조 실험으로 검증합니다."
          />
        </div>
      </section>

      <ProbeAtlasIntro experiments={experiments} />

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Experiments"
          title="개별 실험이 하나의 하드웨어 질문으로 서는 구조"
          desc="Global Memory, Shared Memory 같은 분류는 보조 태그로만 남기고, 메인 흐름은 개별 probe의 질문과 관찰 신호를 따라갑니다. 상세 페이지에서는 커널 코드, 그래프, 결과 해석, caveat를 분리해서 다룹니다."
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {experiments.map((experiment) => (
            <ExperimentCard key={experiment.id} experiment={experiment} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Evidence Level"
          title="모든 probe가 같은 강도의 증거를 주는 것은 아닙니다"
          desc="일부 실험은 계측 파이프라인을 검증하는 calibration에 가깝고, 일부는 문서에 명확히 드러나지 않는 하드웨어 선택 편향을 역추적하는 강한 evidence에 가깝습니다. 이 구분을 명시해야 실험의 의미가 과장되지 않습니다."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <EvidenceLevelCard
            title="Calibration Probe"
            desc="이미 알려진 모델이나 예상 가능한 현상을 다시 확인해 계측기와 분석 파이프라인이 정상인지 확인합니다."
            items={[
              "known rule 재현",
              "measurement pipeline 검증",
              "baseline 생성",
              "후속 실험의 기준점 확보",
            ]}
          />

          <EvidenceLevelCard
            title="Mechanism Probe"
            desc="단일 성능 수치가 아니라 특정 조건 변화에 따른 반응 지형을 관찰해 하드웨어 메커니즘의 흔적을 읽습니다."
            items={[
              "phase 변화 관찰",
              "latency / throughput response 비교",
              "control condition과 대조",
              "해석 가능한 반응 패턴 추출",
            ]}
          />

          <EvidenceLevelCard
            title="Reverse-reading Probe"
            desc="문서에 명시되지 않은 scheduler, scoreboard, cache, memory hierarchy의 선택 편향을 관찰 가능한 evidence로 끌어냅니다."
            items={[
              "warp별 progress 차이",
              "stall 이후 재진입 패턴",
              "ready warp 사이의 선택 편향",
              "정확한 알고리즘 복원이 아닌 관찰 가능한 경향 추적",
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            From Evidence to Realization
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            이 증거가 realization 선택으로 이어지는 방식
          </h2>

          <p className="mt-4 text-sm leading-7 text-neutral-400">
            하드웨어 probe는 결과 보관소가 아니라, 커널 합성기가 realization을
            선택할 때 참조하는 경험적 근거입니다. 특정 stride에서 spike가
            생기는지, padding으로 완화되는지, fixed-work 조건에서도 비용이
            유지되는지, register pressure가 어느 지점에서 occupancy를 무너뜨리는지,
            warp scheduler가 ready warp를 어떤 식으로 다시 선택하는지 같은 관찰은
            이후 layout transformation, tiling, vectorization, shared memory 사용
            여부, compiler lowering 검증으로 연결됩니다.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Next
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">다음 경로</h2>

          <div className="mt-5 space-y-3 text-sm">
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