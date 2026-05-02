import { Link } from "react-router-dom";

import { hardwareObservations } from "../data/hardware/observations";
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

function SmallInfoCard({ title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{desc}</p>
    </div>
  );
}

function BulletList({ items = [], markerClassName = "bg-lime-400/70" }) {
  if (!items.length) return null;

  return (
    <ul className="space-y-2 text-sm leading-6 text-neutral-400">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span
            className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClassName}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
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
  const knownMechanisms = observation.knownMechanisms?.items?.slice(0, 3) ?? [];
  const notTryingToProve = observation.notTryingToProve?.slice(0, 3) ?? [];

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-lime-400/30 hover:bg-white/[0.055]">
      <div className="flex flex-wrap items-center gap-2">
        {observation.groupLabel ? (
          <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
            {observation.groupLabel}
          </span>
        ) : null}

        {observation.type ? (
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
            {observation.type}
          </span>
        ) : null}

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

      {observation.probeContext?.question ? (
        <div className="mt-5 rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-lime-300/90">
            Actual Probe Question
          </div>

          <p className="mt-2 text-sm leading-6 text-lime-100">
            {observation.probeContext.question}
          </p>
        </div>
      ) : null}

      {knownMechanisms.length ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Known Mechanisms
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {knownMechanisms.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-lime-400/80">
                  {item.label}
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-neutral-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
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

      {observation.comparisonPurpose?.summary ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Comparison Role
          </div>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {observation.comparisonPurpose.summary}
          </p>
        </div>
      ) : null}

      {notTryingToProve.length ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Not Proving
          </div>

          <div className="mt-3">
            <BulletList
              items={notTryingToProve}
              markerClassName="bg-neutral-500"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/hardware-evidence/${observation.id}`}
          className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 기록 보기
        </Link>
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
        desc="메인 페이지에서는 각 probe의 질문, 전제로 둔 GPU 메커니즘, 핵심 관찰값, 그리고 단정하지 않을 범위를 함께 보여줍니다. raw records, last_clock 해석, sink patch, 다음 검증 경로는 상세 페이지에서 분리해 확인합니다."
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
          이 페이지는 GPU의 일반 구조를 설명하는 문서가 아니다. 이미 알려진
          warp execution, ready-warp issue, latency hiding, memory hierarchy 같은
          실행 모델을 전제로 두고, 특정 커널 조건을 실제로 실행해 나온 progress,
          clock, latency, throughput, sink, warp별 편차를 근거로 하드웨어 반응을
          좁혀 읽는 공간이다.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <SmallInfoCard
            title="알고 들어가는 것"
            desc="warp 단위 실행, scheduler의 ready warp issue, dependency와 memory wait가 stall을 만든다는 기본 메커니즘은 전제로 둔다."
          />

          <SmallInfoCard
            title="실험으로 바꾸는 것"
            desc="block 수, warp role, dependency chain, shared/global load, access pattern처럼 하나의 실행 조건을 의도적으로 바꾼다."
          />

          <SmallInfoCard
            title="관찰로 남기는 것"
            desc="progress, last_clock, ratio, per-warp spread, sink, latency curve를 기록하고, 말할 수 있는 범위와 말하면 안 되는 범위를 분리한다."
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {hardwareChips.map((chip) => (
            <StatPill key={chip}>{chip}</StatPill>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="How to read"
          title="Probe는 알려진 메커니즘 위에 올리는 검증 단위입니다"
          desc="각 probe는 GPU 교과서 내용을 다시 증명하려는 것이 아니다. 이미 알려진 실행 모델을 전제로 두고, 특정 조건을 바꾸었을 때 관찰값이 어떻게 달라지는지 기록한다. 핵심은 무엇을 알고 들어가는지, 무엇을 바꾸는지, 무엇이 관찰되었는지, 어디까지 단정할 수 있는지를 분리하는 것이다."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <ReadingStepCard
            index="1"
            title="전제 분리"
            desc="warp 단위 실행, ready warp issue, latency hiding처럼 이미 알고 있는 GPU 메커니즘을 먼저 분리합니다. 자명한 실행 모델을 실험 결론처럼 쓰지 않습니다."
          />

          <ReadingStepCard
            index="2"
            title="변경 조건 확인"
            desc="warp role, dependency chain, memory access type, stall source처럼 실험에서 의도적으로 다르게 만든 workload class를 확인합니다."
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

      <ObservationSection observations={hardwareObservations} />

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Evidence Level"
          title="실험 결과의 증거 강도를 분리합니다"
          desc="모든 probe가 같은 강도의 결론을 주지는 않습니다. 어떤 것은 control baseline이고, 어떤 것은 한 조건만 바꾼 differential response이며, 어떤 것은 문서화되지 않은 scheduler, scoreboard, cache, memory hierarchy의 선택 경향을 역으로 읽기 위한 probe입니다."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <EvidenceLevelCard
            title="Baseline Probe"
            desc="후속 실험을 읽기 전에 측정 파이프라인과 비교 기준이 정상인지 확인합니다. baseline은 새 메커니즘을 발견하기보다, 후속 차이를 해석할 기준을 만듭니다."
            items={[
              "동일 workload 조건 반복 실행",
              "warp_id 기반 progress 편향 확인",
              "clock 기록 규칙성 확인",
              "anti-optimization caveat 확인",
            ]}
          />

          <EvidenceLevelCard
            title="Differential Probe"
            desc="한 조건만 바꾼 뒤 baseline과 비교해 어떤 출력값이 달라지는지 관찰합니다. workload class 차이를 progress, ratio, spread로 읽습니다."
            items={[
              "dependent / independent 비교",
              "shared-load / ALU 비교",
              "global-load / ALU 비교",
              "role별 progress ratio",
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
            과정이다. 예를 들어 동일 workload warp 사이에 기본 progress 편향이
            없는지, dependency chain을 가진 warp가 independent warp 대비 얼마나
            적은 progress를 얻는지, global-load warp가 stall되는 동안 ready ALU
            warp가 얼마나 유지되는지 같은 결과는 이후 tiling, unrolling,
            vectorization, shared memory 사용, lowering 검증의 판단 근거가 된다.
          </p>

          <p className="mt-4 text-sm leading-7 text-neutral-500">
            중요한 것은 이 기록이 GPU 내부 policy를 단번에 선언하지 않는다는
            점이다. 관찰값은 scheduler 선택, scoreboard wait, memory latency,
            compiler scheduling, occupancy가 합쳐져 나온 결과다. 따라서 각 probe는
            결론이 아니라 다음 실험의 search space를 줄이는 증거 단위로 사용한다.
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