import { Link, useParams } from "react-router-dom";

import {
  findHardwareObservationById,
  hardwareObservations,
} from "../data/hardware/observations";

function formatNumber(value) {
  if (value === null || value === undefined) return "—";

  if (typeof value !== "number") {
    return String(value);
  }

  return value.toLocaleString("en-US");
}

function hasItems(items) {
  return Array.isArray(items) && items.length > 0;
}

function hasObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function hasSignatureRecords(records = []) {
  return records.some((record) => Boolean(record.signature));
}

function ratioLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

function SectionBlock({ show = true, id, eyebrow, title, desc, children }) {
  if (!show) return null;

  return (
    <section
      id={id}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      {(eyebrow || title || desc) && (
        <div>
          {eyebrow ? (
            <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
              {eyebrow}
            </div>
          ) : null}

          {title ? (
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          ) : null}

          {desc ? (
            <p className="mt-3 text-sm leading-6 text-neutral-400">{desc}</p>
          ) : null}
        </div>
      )}

      <div className={title || desc || eyebrow ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AnchorNav({ items = [] }) {
  if (!hasItems(items)) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="block rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function DetailList({ title, items = [], markerClassName = "bg-lime-400/70" }) {
  if (!hasItems(items)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <ul className="mt-4 space-y-3 text-sm text-neutral-300">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 leading-6"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClassName}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoCardGrid({ items = [] }) {
  if (!hasItems(items)) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-lime-400/80">
            {item.label}
          </div>

          <p className="mt-3 text-sm leading-6 text-neutral-300">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProbeContextBlock({ context }) {
  if (!context) return null;

  return (
    <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-6">
      <h3 className="text-lg font-semibold text-white">{context.title}</h3>

      {context.body ? (
        <p className="mt-3 text-sm leading-7 text-neutral-300">
          {context.body}
        </p>
      ) : null}

      {context.question ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Actual Question
          </div>

          <p className="mt-3 text-sm leading-7 text-lime-100">
            {context.question}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ComparisonPurposeBlock({ comparisonPurpose }) {
  if (!comparisonPurpose) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">
        {comparisonPurpose.title}
      </h3>

      {comparisonPurpose.summary ? (
        <p className="mt-3 text-sm leading-7 text-neutral-400">
          {comparisonPurpose.summary}
        </p>
      ) : null}

      <div className="mt-5">
        <DetailList title="비교 해석 예시" items={comparisonPurpose.examples} />
      </div>
    </div>
  );
}

function KeyFindingGrid({ observation }) {
  if (hasItems(observation.keyFindings)) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {observation.keyFindings.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
          >
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              {item.label}
            </div>

            <div className="mt-3 break-words text-xl font-semibold leading-tight text-white">
              {item.value}
            </div>

            {item.desc ? (
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                {item.desc}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  const records = observation.records ?? [];

  if (!hasItems(records)) return null;

  const progressValues = records.map((record) => record.progress);
  const lastClockValues = records
    .map((record) => record.lastClock)
    .filter((value) => typeof value === "number");
  const sinkValues = records.map((record) => record.sink);

  const allProgressEqual =
    progressValues.length > 0 &&
    progressValues.every((value) => value === progressValues[0]);

  const maxProgress = Math.max(...progressValues);
  const minProgress = Math.min(...progressValues);
  const progressSpread = maxProgress - minProgress;

  const clockDeltas = lastClockValues.slice(1).map((value, index) => {
    return value - lastClockValues[index];
  });

  const allClockDeltasEqual =
    clockDeltas.length > 0 &&
    clockDeltas.every((value) => value === clockDeltas[0]);

  const allSinkZero =
    sinkValues.length > 0 && sinkValues.every((value) => value === 0);

  const fastestRecord = records.reduce((best, record) => {
    if (!best) return record;
    return record.progress > best.progress ? record : best;
  }, null);

  const slowestRecord = records.reduce((best, record) => {
    if (!best) return record;
    return record.progress < best.progress ? record : best;
  }, null);

  let items = [
    {
      label: "Warp Count",
      value: records.length,
      desc: "기록된 warp 수",
    },
    {
      label: "Progress",
      value: allProgressEqual ? formatNumber(progressValues[0]) : "diverged",
      desc: allProgressEqual
        ? "모든 warp의 progress가 동일"
        : `spread ${formatNumber(progressSpread)}`,
    },
    {
      label: "Fastest Path",
      value: fastestRecord?.role ?? "—",
      desc: fastestRecord
        ? `progress ${formatNumber(fastestRecord.progress)}`
        : "기록 없음",
    },
    {
      label: "Sink",
      value: allSinkZero ? "all zero" : "mixed",
      desc: allSinkZero
        ? "anti-optimization 관점에서 개선 필요"
        : "sink가 0으로 고정되지 않음",
    },
  ];

  if (allClockDeltasEqual) {
    items = [
      items[0],
      items[1],
      {
        label: "Clock Delta",
        value: `+${clockDeltas[0]} cycles`,
        desc: "last_clock이 고정 간격으로 증가",
      },
      items[3],
    ];
  }

  if (!allProgressEqual && slowestRecord) {
    items = [
      items[0],
      items[1],
      items[2],
      {
        label: "Slowest Path",
        value: slowestRecord.role,
        desc: `progress ${formatNumber(slowestRecord.progress)}`,
      },
    ];
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
        >
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            {item.label}
          </div>

          <div className="mt-3 break-words text-xl font-semibold leading-tight text-white">
            {item.value}
          </div>

          <p className="mt-2 text-sm leading-6 text-neutral-400">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function ConfigTable({ config }) {
  if (!config) return null;

  const entries = [
    ["mode", config.mode],
    ["blocks", config.blocks],
    ["cycle_budget", config.cycleBudget],
    ["sample_period", config.samplePeriod],
    ["global_elements", config.globalElements],
  ].filter(([, value]) => value !== undefined && value !== null);

  if (!hasItems(entries)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">실험 조건</h3>

      <p className="mt-3 text-sm leading-6 text-neutral-400">
        이 표는 해당 probe를 해석하는 데 필요한 실행 조건만 남깁니다.
      </p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/10">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 px-4 py-4 md:grid-cols-[180px_minmax(0,1fr)]"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                {key}
              </div>

              <div className="text-sm leading-6 text-neutral-300 tabular-nums">
                {formatNumber(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordTable({ records = [] }) {
  if (!hasItems(records)) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
      <div className="grid min-w-[860px] grid-cols-[90px_1fr_140px_190px_110px] border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
        <div>Warp</div>
        <div>Role</div>
        <div className="text-right">Progress</div>
        <div className="text-right">Last Clock</div>
        <div className="text-right">Sink</div>
      </div>

      <div className="min-w-[860px] divide-y divide-white/10">
        {records.map((record) => (
          <div
            key={`${record.block ?? 0}-${record.warpId}`}
            className="grid grid-cols-[90px_1fr_140px_190px_110px] px-4 py-3 text-sm text-neutral-300"
          >
            <div>warp {record.warpId}</div>

            <div className="font-mono text-xs">{record.role}</div>

            <div className="text-right tabular-nums">
              {formatNumber(record.progress)}
            </div>

            <div className="text-right tabular-nums">
              {formatNumber(record.lastClock)}
            </div>

            <div className="text-right tabular-nums">
              {formatNumber(record.sink)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignatureGrid({ records = [] }) {
  const signatureRecords = records.filter((record) => record.signature);

  if (!hasItems(signatureRecords)) return null;

  const maxProgress = Math.max(
    ...signatureRecords.map((record) => record.progress)
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {signatureRecords.map((record) => {
        const ratio = maxProgress
          ? ((record.progress / maxProgress) * 100).toFixed(2)
          : "0.00";

        return (
          <div
            key={record.role}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-sm text-white">{record.role}</div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-400">
                warp {record.warpId}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-400">
              {record.signature}
            </p>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-lime-300/80"
                  style={{ width: `${ratio}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-neutral-500">
                max progress 대비 {ratio}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderingBlock({ ordering = [] }) {
  if (!hasItems(ordering)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {ordering.map((role, index) => (
          <div key={role} className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-neutral-300">
              {role}
            </span>

            {index < ordering.length - 1 ? (
              <span className="text-neutral-600">→</span>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-500">
        이 순서는 절대적인 GPU 일반 법칙이 아니라, 현재 probe 설계에서 관찰된
        execution signature의 상대적 순서입니다.
      </p>
    </div>
  );
}

function RatioGrid({ ratios }) {
  if (!hasObject(ratios)) return null;

  const entries = Object.entries(ratios);

  if (!hasItems(entries)) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
        >
          <span className="text-sm text-neutral-400">{ratioLabel(key)}</span>
          <span className="font-mono text-sm text-white">{value}x</span>
        </div>
      ))}
    </div>
  );
}

function CodegenImpactBlock({ impact }) {
  if (!impact) return null;

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-violet-300">
        Codegen Impact
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        compiler decision으로 환원되는 지점
      </h3>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {impact.targetPattern ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
              Target Pattern
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              {impact.targetPattern}
            </p>
          </div>
        ) : null}

        {impact.affectedDecision ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
              Affected Decision
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              {impact.affectedDecision}
            </p>
          </div>
        ) : null}
      </div>

      {impact.costSignal ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Cost Signal
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            {impact.costSignal}
          </p>
        </div>
      ) : null}

      {impact.ruleCandidate ? (
        <div className="mt-4 rounded-xl border border-lime-400/20 bg-lime-400/[0.05] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-lime-300">
            Candidate Rule
          </div>
          <p className="mt-2 text-sm leading-6 text-lime-100">
            {impact.ruleCandidate}
          </p>
        </div>
      ) : null}

      {impact.confidence ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Object.entries(impact.confidence).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-black/25 p-4"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                {key}
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {impact.reminder ? (
        <p className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-neutral-300">
          {impact.reminder}
        </p>
      ) : null}
    </div>
  );
}

function CostModelRoleBlock({ role }) {
  if (!role) return null;

  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-cyan-300">
        Cost Model Role
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        이 probe가 cost model에서 맡는 역할
      </h3>

      {role.role ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Role
          </div>
          <p className="mt-2 font-mono text-sm text-cyan-100">{role.role}</p>
        </div>
      ) : null}

      {role.description ? (
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          {role.description}
        </p>
      ) : null}

      {hasItems(role.usedBy) ? (
        <div className="mt-5">
          <DetailList
            title="이 기준선을 사용하는 후속 probe"
            items={role.usedBy}
          />
        </div>
      ) : null}
    </div>
  );
}

function MeasurementReliabilityBlock({ reliability }) {
  if (!reliability) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-amber-300">
        Measurement Reliability
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        측정 신뢰도와 보강 필요성
      </h3>

      {reliability.status ? (
        <div className="mt-5 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
          {reliability.status}
        </div>
      ) : null}

      {reliability.issue ? (
        <p className="mt-4 text-sm leading-6 text-neutral-300">
          {reliability.issue}
        </p>
      ) : null}

      {reliability.impact ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Impact
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            {reliability.impact}
          </p>
        </div>
      ) : null}

      {reliability.mitigation ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Mitigation
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-300">
            {reliability.mitigation}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CodegenReminderBlock({ reminder }) {
  if (!reminder || !hasItems(reminder.items)) return null;

  return (
    <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-lime-300">
        Codegen Reminder
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        {reminder.title ?? "나중에 codegen rule을 만들 때 기억할 것"}
      </h3>

      <div className="mt-5">
        <DetailList title="Reminder" items={reminder.items} />
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  if (!children) return null;

  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-neutral-200">
      <code>{children}</code>
    </pre>
  );
}

function PatchBlock({ patch }) {
  if (!patch) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-amber-300">
        Suggested Patch
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">{patch.title}</h3>

      {patch.desc ? (
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          {patch.desc}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
            Before
          </div>
          <CodeBlock>{patch.before}</CodeBlock>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
            After
          </div>
          <CodeBlock>{patch.after}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

function NextStepBlock({ nextStep }) {
  if (!nextStep) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        Next Probe
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        {nextStep.label}
      </h3>

      {nextStep.desc ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          {nextStep.desc}
        </p>
      ) : null}

      <div className="mt-5">
        <CodeBlock>{nextStep.configText}</CodeBlock>
      </div>

      <div className="mt-5">
        <DetailList title="다음에 볼 지표" items={nextStep.metrics} />
      </div>
    </div>
  );
}

function RefinementPlanBlock({ refinementPlan }) {
  if (!refinementPlan) return null;

  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-6">
      <div className="text-xs uppercase tracking-[0.16em] text-sky-300">
        Refinement Plan
      </div>

      <h3 className="mt-2 text-lg font-semibold text-white">
        {refinementPlan.title}
      </h3>

      {refinementPlan.summary ? (
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          {refinementPlan.summary}
        </p>
      ) : null}

      {hasItems(refinementPlan.items) ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {refinementPlan.items.map((item) => (
            <div
              key={item.version}
              className="rounded-2xl border border-white/10 bg-black/25 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-400">
                  {item.version}
                </span>
                <h4 className="font-semibold text-white">{item.title}</h4>
              </div>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                {item.goal}
              </p>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                {item.question}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ClockObservationBlock({ clockObservation }) {
  if (!clockObservation) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm leading-6 text-neutral-300">
        {clockObservation.summary}
      </p>

      {hasItems(clockObservation.values) ? (
        <div className="mt-4">
          <CodeBlock>{clockObservation.values.join("\n")}</CodeBlock>
        </div>
      ) : null}

      {clockObservation.caveat ? (
        <p className="mt-4 text-sm leading-6 text-neutral-500">
          {clockObservation.caveat}
        </p>
      ) : null}
    </div>
  );
}

function buildAnchorItems(observation) {
  const items = [{ href: "#overview", label: "개요" }];

  if (observation.probeContext) {
    items.push({ href: "#probe-context", label: "probe 질문" });
  }

  if (hasItems(observation.knownMechanisms?.items)) {
    items.push({ href: "#known-mechanisms", label: "실행 모델" });
  }

  if (observation.config) {
    items.push({ href: "#condition", label: "조건" });
  }

  if (hasItems(observation.records)) {
    items.push({ href: "#records", label: "records" });
  }

  if (hasItems(observation.ordering) || hasSignatureRecords(observation.records)) {
    items.push({ href: "#signature", label: "signature" });
  }

  if (hasObject(observation.ratios)) {
    items.push({ href: "#ratios", label: "ratios" });
  }

  if (hasItems(observation.interpretation) || hasItems(observation.caveats)) {
    items.push({ href: "#interpretation", label: "해석" });
  }

  if (observation.codegenImpact) {
    items.push({ href: "#codegen-impact", label: "codegen" });
  }

  if (observation.costModelRole) {
    items.push({ href: "#cost-model-role", label: "cost model" });
  }

  if (observation.measurementReliability) {
    items.push({ href: "#measurement-reliability", label: "reliability" });
  }

  if (observation.codegenReminder) {
    items.push({ href: "#codegen-reminder", label: "reminder" });
  }

  if (observation.comparisonPurpose) {
    items.push({ href: "#comparison", label: "비교 방식" });
  }

  if (observation.clockObservation) {
    items.push({ href: "#clock", label: "clock" });
  }

  if (hasItems(observation.notTryingToProve)) {
    items.push({ href: "#not-proving", label: "경계" });
  }

  if (observation.suggestedPatch) {
    items.push({ href: "#patch", label: "patch" });
  }

  if (observation.nextStep) {
    items.push({ href: "#next", label: "next" });
  }

  if (observation.refinementPlan) {
    items.push({ href: "#refinement", label: "보강 계획" });
  }

  return items;
}

function NotFoundDetailPage({ experimentId }) {
  const firstObservation = hardwareObservations[0];

  return (
    <div className="space-y-6">
      <Link
        to="/hardware-evidence"
        className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
      >
        ← Hardware Evidence
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.18em] text-lime-400/80">
          No Detail Record
        </div>

        <h1 className="mt-3 text-2xl font-semibold text-white">
          등록된 hardware probe 상세 기록이 없습니다
        </h1>

        <p className="mt-4 text-sm leading-7 text-neutral-400">
          요청한 id와 일치하는 observation을 찾지 못했습니다. 현재 등록된
          observation 목록에서 다시 선택하세요.
        </p>

        {experimentId ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-neutral-400">
            requested id:{" "}
            <span className="text-neutral-200">{experimentId}</span>
          </div>
        ) : null}

        {firstObservation ? (
          <div className="mt-6">
            <Link
              to={`/hardware-evidence/${firstObservation.id}`}
              className="inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
            >
              첫 번째 observation 보기
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function HardwareExperimentDetailPage() {
  const { experimentId } = useParams();

  const observation = findHardwareObservationById(experimentId);

  if (!observation) {
    return <NotFoundDetailPage experimentId={experimentId} />;
  }

  const anchorItems = buildAnchorItems(observation);

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <Link
          to="/hardware-evidence"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-neutral-300 transition hover:border-lime-400/40 hover:text-white"
        >
          ← Hardware Evidence
        </Link>

        <div
          id="overview"
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
        >
          <div className="flex flex-wrap gap-2">
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

            {observation.label ? (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-neutral-400">
                {observation.label}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-tight text-white lg:text-4xl">
            {observation.title}
          </h1>

          {observation.summary ? (
            <p className="mt-4 max-w-4xl text-base leading-8 text-neutral-400">
              {observation.summary}
            </p>
          ) : null}
        </div>

        <section id="key-findings">
          <KeyFindingGrid observation={observation} />
        </section>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SidebarCard title="이 페이지에서 확인할 것">
            <AnchorNav items={anchorItems} />
          </SidebarCard>

          <SidebarCard title="등록된 상세 기록">
            <div className="space-y-3">
              {hardwareObservations.map((item) => {
                const isActive = item.id === observation.id;

                return (
                  <Link
                    key={item.id}
                    to={`/hardware-evidence/${item.id}`}
                    className={`block rounded-xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? "border-lime-400/30 bg-lime-400/10 text-lime-200 hover:bg-lime-400/15"
                        : "border-white/10 bg-black/20 text-neutral-300 hover:border-lime-400/40 hover:text-white"
                    }`}
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {item.groupLabel}
                    </div>
                  </Link>
                );
              })}
            </div>
          </SidebarCard>
        </aside>

        <div className="space-y-6">
          <SectionBlock
            show={Boolean(observation.probeContext)}
            id="probe-context"
            eyebrow="Probe Question"
            title="이 실험이 실제로 묻는 것"
          >
            <ProbeContextBlock context={observation.probeContext} />
          </SectionBlock>

          <SectionBlock
            show={hasItems(observation.knownMechanisms?.items)}
            id="known-mechanisms"
            eyebrow="Known Mechanisms"
            title={
              observation.knownMechanisms?.title ??
              "실험 전에 알고 들어가는 실행 모델"
            }
          >
            <InfoCardGrid items={observation.knownMechanisms?.items} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.config)}
            id="condition"
            eyebrow="Condition"
            title="실험 조건"
          >
            <ConfigTable config={observation.config} />
          </SectionBlock>

          <SectionBlock
            show={hasItems(observation.records)}
            id="records"
            eyebrow="Raw Records"
            title="warp별 관찰값"
            desc="progress, last_clock, sink를 warp별로 분리해 기록합니다."
          >
            <div className="overflow-x-auto">
              <RecordTable records={observation.records} />
            </div>
          </SectionBlock>

          <SectionBlock
            show={
              hasItems(observation.ordering) ||
              hasSignatureRecords(observation.records)
            }
            id="signature"
            eyebrow="Execution Signature"
            title="관찰된 실행 서명"
            desc="각 workload class가 progress rate에 남긴 상대적 흔적입니다."
          >
            <div className="space-y-5">
              <OrderingBlock ordering={observation.ordering} />
              <SignatureGrid records={observation.records} />
            </div>
          </SectionBlock>

          <SectionBlock
            show={hasObject(observation.ratios)}
            id="ratios"
            eyebrow="Relative Ratios"
            title="상대 progress 비율"
            desc="이 값은 절대적인 연산 속도비가 아니라 workload iteration 기준의 상대 progress 비율입니다."
          >
            <RatioGrid ratios={observation.ratios} />
          </SectionBlock>

          {hasItems(observation.interpretation) ||
          hasItems(observation.caveats) ? (
            <div id="interpretation" className="grid gap-6 lg:grid-cols-2">
              <DetailList
                title="결과에서 말할 수 있는 것"
                items={observation.interpretation}
              />

              <DetailList
                title="단정하면 안 되는 것"
                items={observation.caveats}
                markerClassName="bg-neutral-500"
              />
            </div>
          ) : null}

          <SectionBlock
            show={Boolean(observation.codegenImpact)}
            id="codegen-impact"
            eyebrow="Codegen"
            title="codegen 관점에서의 의미"
          >
            <CodegenImpactBlock impact={observation.codegenImpact} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.costModelRole)}
            id="cost-model-role"
            eyebrow="Cost Model"
            title="cost model에서의 역할"
          >
            <CostModelRoleBlock role={observation.costModelRole} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.measurementReliability)}
            id="measurement-reliability"
            eyebrow="Reliability"
            title="측정 신뢰도"
          >
            <MeasurementReliabilityBlock
              reliability={observation.measurementReliability}
            />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.codegenReminder)}
            id="codegen-reminder"
            eyebrow="Reminder"
            title="codegen reminder"
          >
            <CodegenReminderBlock reminder={observation.codegenReminder} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.comparisonPurpose)}
            id="comparison"
            eyebrow="Comparison"
            title="후속 probe와 비교하는 방식"
          >
            <ComparisonPurposeBlock
              comparisonPurpose={observation.comparisonPurpose}
            />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.clockObservation)}
            id="clock"
            eyebrow="Clock Observation"
            title="last_clock 해석"
          >
            <ClockObservationBlock
              clockObservation={observation.clockObservation}
            />
          </SectionBlock>

          <SectionBlock
            show={hasItems(observation.notTryingToProve)}
            id="not-proving"
            eyebrow="Boundary"
            title="이 실험이 직접 증명하지 않는 것"
          >
            <DetailList
              title="단정하지 않을 내용"
              items={observation.notTryingToProve}
              markerClassName="bg-neutral-500"
            />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.suggestedPatch)}
            id="patch"
            eyebrow="Anti-optimization"
            title="sink cancellation 개선"
          >
            <PatchBlock patch={observation.suggestedPatch} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.nextStep)}
            id="next"
            eyebrow="Next"
            title="다음 검증"
          >
            <NextStepBlock nextStep={observation.nextStep} />
          </SectionBlock>

          <SectionBlock
            show={Boolean(observation.refinementPlan)}
            id="refinement"
            eyebrow="Refinement"
            title="보강 실험 방향"
          >
            <RefinementPlanBlock refinementPlan={observation.refinementPlan} />
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}