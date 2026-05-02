import { Link } from "react-router-dom";

import { mode0BaselineObservation } from "../data/hardware/baselineObservations";
import { hardwareChips } from "../data/hardware/chips";
import { hardwareOverview } from "../data/hardware/overview";

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

function EvidenceLevelCard({ title, desc, items = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{desc}</p>

      {items.length ? (
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

function formatNumber(value) {
  if (value === null || value === undefined) return "—";

  if (typeof value !== "number") {
    return String(value);
  }

  return value.toLocaleString("en-US");
}

function getObservationSummary(observation) {
  const records = observation.records ?? [];

  const progressValues = records.map((record) => record.progress);
  const lastClockValues = records.map((record) => record.lastClock);
  const sinkValues = records.map((record) => record.sink);

  const allProgressEqual =
    progressValues.length > 0 &&
    progressValues.every((value) => value === progressValues[0]);

  const clockDeltas = lastClockValues.slice(1).map((value, index) => {
    return value - lastClockValues[index];
  });

  const allClockDeltasEqual =
    clockDeltas.length > 0 &&
    clockDeltas.every((value) => value === clockDeltas[0]);

  const allSinkZero =
    sinkValues.length > 0 && sinkValues.every((value) => value === 0);

  return {
    warpCount: records.length,
    progressText: allProgressEqual
      ? formatNumber(progressValues[0])
      : "mixed",
    progressDesc: allProgressEqual
      ? "all warps equal"
      : "per-warp difference",
    clockText: allClockDeltasEqual ? `+${clockDeltas[0]} cycles` : "mixed",
    clockDesc: allClockDeltasEqual
      ? "regular final order"
      : "irregular final order",
    sinkText: allSinkZero ? "all zero" : "non-zero",
    sinkDesc: allSinkZero ? "needs patch" : "valid sink spread",
  };
}

function ObservationMetric({ label, value, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold text-white">{value}</div>

      {desc ? (
        <div className="mt-1 text-xs leading-5 text-neutral-500">{desc}</div>
      ) : null}
    </div>
  );
}

function ObservationSummaryCard({ observation }) {
  if (!observation) return null;

  const summary = getObservationSummary(observation);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-lime-400/30 hover:bg-white/[0.055]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
          Baseline Probe
        </span>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
          Experimental Record
        </span>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
          {observation.label}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-tight text-white">
        {observation.title}
      </h3>

      {observation.summary ? (
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-neutral-400">
          {observation.summary}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ObservationMetric
          label="warps"
          value={summary.warpCount}
          desc="recorded"
        />

        <ObservationMetric
          label="progress"
          value={summary.progressText}
          desc={summary.progressDesc}
        />

        <ObservationMetric
          label="clock delta"
          value={summary.clockText}
          desc={summary.clockDesc}
        />

        <ObservationMetric
          label="sink"
          value={summary.sinkText}
          desc={summary.sinkDesc}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
          Main Finding
        </div>

        <p className="mt-2 text-sm leading-6 text-neutral-300">
          {observation.interpretation?.[0] ??
            "관찰된 결과와 해석 범위는 상세 페이지에서 확인합니다."}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/hardware-evidence/${observation.id}`}
          className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 기록 보기
        </Link>

        {observation.nextStep?.label ? (
          <span className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-neutral-400">
            Next: {observation.nextStep.label}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ObservationSection({ observations = [] }) {
  if (!observations.length) return null;

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Observed Probes"
        title="검증이 끝난 실험 기록"
        desc="메인 페이지에서는 각 probe의 핵심 관찰값만 간단히 보여줍니다. raw records, caveat, last_clock 해석, sink patch, 다음 검증 경로는 상세 페이지에서 분리해 확인합니다."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {observations.map((observation) => (
          <ObservationSummaryCard
            key={observation.id}
            observation={observation}
          />
        ))}
      </div>
    </section>
  );
}

export default function HardwareEvidencePage() {
  const observations = [mode0BaselineObservation];

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
          이 페이지는 GPU의 일반적인 구조를 설명하는 문서가 아니다. 여기서는
          특정 커널 조건을 실제로 실행하고, 그 결과로 나온 progress, clock,
          latency, throughput, sink, warp별 편차 같은 관찰값만을 근거로 하드웨어
          반응을 기록한다.
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
          title="Probe는 설명이 아니라 검증 단위입니다"
          desc="각 probe는 하나의 실험 질문을 갖습니다. 문서에서 중요한 것은 알려진 GPU 개념을 반복하는 것이 아니라, 어떤 조건에서 어떤 결과가 관찰되었고, 그 결과로 어디까지 말할 수 있으며, 어디서부터는 아직 말하면 안 되는지를 분리하는 것입니다."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <ReadingStepCard
            index="1"
            title="고정 조건 확인"
            desc="block 수, warp 구성, cycle budget, sample period, work size처럼 비교 기준이 되는 조건을 먼저 확인합니다."
          />

          <ReadingStepCard
            index="2"
            title="변경 조건 확인"
            desc="warp role, dependency chain, memory access role, stall source처럼 실험에서 의도적으로 바꾼 조건을 봅니다."
          />

          <ReadingStepCard
            index="3"
            title="관찰값 확인"
            desc="progress, last_clock, per-warp spread, ratio, sink, latency curve처럼 실제 출력된 값을 기준으로 읽습니다."
          />

          <ReadingStepCard
            index="4"
            title="단정 범위 제한"
            desc="관찰 결과와 scheduler/cache/memory policy 자체를 구분합니다. 단일 probe는 policy를 복원하지 않고, 다음 probe의 방향을 좁힙니다."
          />
        </div>
      </section>

      <ObservationSection observations={observations} />

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Evidence Level"
          title="실험 결과의 증거 강도를 분리합니다"
          desc="모든 probe가 같은 강도의 결론을 주지는 않습니다. 어떤 것은 계측 baseline이고, 어떤 것은 특정 조건의 반응 패턴이며, 어떤 것은 문서화되지 않은 선택 경향을 역으로 읽기 위한 probe입니다."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <EvidenceLevelCard
            title="Baseline Probe"
            desc="후속 실험을 읽기 전에 측정 파이프라인과 비교 기준이 정상인지 확인합니다."
            items={[
              "동일 조건 반복 실행",
              "warp별 progress 균형 확인",
              "clock 기록 규칙성 확인",
              "anti-optimization caveat 확인",
            ]}
          />

          <EvidenceLevelCard
            title="Differential Probe"
            desc="한 조건만 바꾼 뒤 baseline과 비교해 어떤 출력값이 달라지는지 관찰합니다."
            items={[
              "dependent / independent 비교",
              "role별 progress ratio",
              "warp 내부와 warp 간 편차 분리",
              "고정 조건 유지 여부 확인",
            ]}
          />

          <EvidenceLevelCard
            title="Reverse-reading Probe"
            desc="문서에 직접 드러나지 않는 scheduler, scoreboard, cache, memory hierarchy의 선택 경향을 관찰 가능한 출력으로 좁혀 갑니다."
            items={[
              "ready warp 사이의 장기 progress 차이",
              "stall 이후 재진입 순서",
              "최종 timestamp order",
              "policy 단정이 아닌 관찰 경향 기록",
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            From Probe to Realization
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            실험 기록이 realization 선택으로 이어지는 방식
          </h2>

          <p className="mt-4 text-sm leading-7 text-neutral-400">
            hardware probe는 최적화 규칙을 먼저 선언하는 문서가 아니다. 커널
            합성기가 realization을 선택할 때 참조할 수 있는 관찰 근거를 쌓는
            과정이다. 예를 들어 동일 ready warp 간 baseline 편향이 없는지,
            dependency chain을 가진 warp가 independent warp 대비 얼마나 적은
            progress를 얻는지, stall 이후 어떤 warp가 다시 진행되는지 같은 결과는
            이후 tiling, unrolling, vectorization, shared memory 사용, lowering
            검증의 판단 근거가 된다.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
            Next
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-white">
            다음 경로
          </h2>

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