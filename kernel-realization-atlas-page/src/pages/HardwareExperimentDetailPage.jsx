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

  if (!Number.isFinite(value)) return String(value);

  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function formatValue(value) {
  if (value === null || value === undefined) return "—";

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
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

function toSnakeLabel(key) {
  return key
    .replace(/([A-Z])/g, "_$1")
    .replace(/__/g, "_")
    .toLowerCase();
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
        {observation.keyFindings.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
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

  const progressValues = records
    .map((record) => record.progress)
    .filter((value) => typeof value === "number");

  const lastClockValues = records
    .map((record) => record.lastClock)
    .filter((value) => typeof value === "number");

  const sinkValues = records.map((record) => record.sink);

  const allProgressEqual =
    progressValues.length > 0 &&
    progressValues.every((value) => value === progressValues[0]);

  const maxProgress =
    progressValues.length > 0 ? Math.max(...progressValues) : null;
  const minProgress =
    progressValues.length > 0 ? Math.min(...progressValues) : null;
  const progressSpread =
    maxProgress !== null && minProgress !== null ? maxProgress - minProgress : 0;

  const clockDeltas = lastClockValues.slice(1).map((value, index) => {
    return value - lastClockValues[index];
  });

  const allClockDeltasEqual =
    clockDeltas.length > 0 &&
    clockDeltas.every((value) => value === clockDeltas[0]);

  const allSinkZero =
    sinkValues.length > 0 && sinkValues.every((value) => value === 0);

  const fastestRecord = records.reduce((best, record) => {
    if (typeof record.progress !== "number") return best;
    if (!best) return record;
    return record.progress > best.progress ? record : best;
  }, null);

  const slowestRecord = records.reduce((best, record) => {
    if (typeof record.progress !== "number") return best;
    if (!best) return record;
    return record.progress < best.progress ? record : best;
  }, null);

  let items = [
    {
      label: "Record Count",
      value: records.length,
      desc: "기록된 대표 record 수",
    },
    {
      label: "Progress",
      value: allProgressEqual ? formatNumber(progressValues[0]) : "diverged",
      desc: allProgressEqual
        ? "모든 record의 progress가 동일"
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
      value: allSinkZero ? "all zero" : "mixed / n/a",
      desc: allSinkZero
        ? "anti-optimization 관점에서 개선 필요"
        : "sink가 0으로 고정되지 않거나 생략됨",
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

function KeyValueTable({ title, desc, data }) {
  if (!hasObject(data)) return null;

  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined && value !== null
  );

  if (!hasItems(entries)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      {title ? <h3 className="text-lg font-semibold text-white">{title}</h3> : null}

      {desc ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">{desc}</p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/10">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 px-4 py-4 md:grid-cols-[220px_minmax(0,1fr)]"
            >
              <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                {toSnakeLabel(key)}
              </div>

              <div className="break-words text-sm leading-6 text-neutral-300 tabular-nums">
                {formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ObjectMapTable({ title, data }) {
  if (!hasObject(data)) return null;

  const entries = Object.entries(data);

  if (!hasItems(entries)) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/10">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-2 px-4 py-3 md:grid-cols-[120px_minmax(0,1fr)]"
            >
              <div className="font-mono text-xs text-neutral-500">{key}</div>
              <div className="font-mono text-xs leading-6 text-neutral-300">
                {formatValue(value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataTable({ title, rows = [], preferredColumns = [] }) {
  if (!hasItems(rows)) return null;

  const rowObjects = rows.filter((row) => hasObject(row));
  if (!hasItems(rowObjects)) return null;

  const discoveredColumns = Array.from(
    new Set(rowObjects.flatMap((row) => Object.keys(row)))
  );

  const columns = [
    ...preferredColumns.filter((column) => discoveredColumns.includes(column)),
    ...discoveredColumns.filter((column) => !preferredColumns.includes(column)),
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/20">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-4 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500"
                >
                  {toSnakeLabel(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {rowObjects.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {columns.map((column) => (
                  <td
                    key={`${title}-${rowIndex}-${column}`}
                    className="max-w-[320px] break-words px-4 py-3 text-neutral-300 tabular-nums"
                  >
                    {formatValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConditionMetadataBlock({ observation }) {
  const show =
    hasObject(observation.roleMap) ||
    hasObject(observation.conditionMap) ||
    hasItems(observation.conditionParameters);

  if (!show) return null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <ObjectMapTable title="Role Map" data={observation.roleMap} />
        <ObjectMapTable title="Condition Map" data={observation.conditionMap} />
      </div>

      <DataTable
        title="Condition Parameters"
        rows={observation.conditionParameters}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "activeBlocks",
          "blocks",
          "cycleBudget",
          "scaledThreshold",
          "normalizedThreshold",
          "dummyBefore",
        ]}
      />
    </div>
  );
}

function RecordTable({ records = [] }) {
  if (!hasItems(records)) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
      <div className="grid min-w-[980px] grid-cols-[90px_90px_1fr_140px_160px_190px_110px] border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">
        <div>Block</div>
        <div>Warp</div>
        <div>Role</div>
        <div className="text-right">Progress</div>
        <div className="text-right">Norm</div>
        <div className="text-right">Last Clock</div>
        <div className="text-right">Sink</div>
      </div>

      <div className="min-w-[980px] divide-y divide-white/10">
        {records.map((record, index) => (
          <div
            key={`${record.block ?? 0}-${record.warpId ?? "na"}-${
              record.role ?? "record"
            }-${index}`}
            className="grid grid-cols-[90px_90px_1fr_140px_160px_190px_110px] px-4 py-3 text-sm text-neutral-300"
          >
            <div>{formatValue(record.block ?? 0)}</div>

            <div>
              {record.warpId !== undefined && record.warpId !== null
                ? `warp ${record.warpId}`
                : "—"}
            </div>

            <div className="font-mono text-xs">{record.role}</div>

            <div className="text-right tabular-nums">
              {formatNumber(record.progress)}
            </div>

            <div className="text-right tabular-nums">
              {formatNumber(record.normalizedProgress)}
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

  const numericRecords = signatureRecords.filter(
    (record) => typeof record.progress === "number"
  );

  const maxProgress = hasItems(numericRecords)
    ? Math.max(...numericRecords.map((record) => record.progress))
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {signatureRecords.map((record, index) => {
        const ratio =
          maxProgress && typeof record.progress === "number"
            ? ((record.progress / maxProgress) * 100).toFixed(2)
            : null;

        return (
          <div
            key={`${record.role}-${record.warpId ?? "na"}-${index}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-sm text-white">{record.role}</div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-neutral-400">
                {record.warpId !== undefined ? `warp ${record.warpId}` : "record"}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-neutral-400">
              {record.signature}
            </p>

            {ratio ? (
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
            ) : null}
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
          <div key={`${role}-${index}`} className="flex items-center gap-2">
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
      {entries.map(([key, value]) => {
        const suffix = typeof value === "number" ? "x" : "";

        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
          >
            <span className="text-sm text-neutral-400">{ratioLabel(key)}</span>
            <span className="font-mono text-sm text-white">
              {formatValue(value)}
              {suffix}
            </span>
          </div>
        );
      })}
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
        <p className="mt-3 text-sm leading-6 text-neutral-300">{patch.desc}</p>
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
          {refinementPlan.items.map((item, index) => (
            <div
              key={`${item.version}-${index}`}
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

function EvidenceTablesBlock({ observation }) {
  const hasEvidence =
    hasItems(observation.roleAggregateStats) ||
    hasItems(observation.warpConditionStatsHighlights) ||
    hasItems(observation.blockConditionStatsHighlights) ||
    hasItems(observation.batchConditionHighlights) ||
    hasItems(observation.multiBlockCoOccurrenceHighlights) ||
    hasItems(observation.transientEvents) ||
    hasItems(observation.rawRunHighlights);

  if (!hasEvidence) return null;

  return (
    <div className="space-y-5">
      <DataTable
        title="Role Aggregate Stats"
        rows={observation.roleAggregateStats}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "roleId",
          "roleName",
          "cycleBudget",
          "scaledThreshold",
          "meanProgress",
          "meanNormalizedProgress",
          "coefficientOfVariation",
          "minProgress",
          "maxProgress",
          "minNormalizedProgress",
          "maxNormalizedProgress",
          "transientCount",
          "transientRate",
        ]}
      />

      <DataTable
        title="Warp Condition Highlights"
        rows={observation.warpConditionStatsHighlights}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "blockId",
          "warpId",
          "roleName",
          "meanProgress",
          "meanNormalizedProgress",
          "coefficientOfVariation",
          "minProgress",
          "maxProgress",
          "transientCount",
          "transientRate",
        ]}
      />

      <DataTable
        title="Block Condition Highlights"
        rows={observation.blockConditionStatsHighlights}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "blockId",
          "globalMeanProgress",
          "globalMinProgress",
          "transientCount",
          "transientRate",
        ]}
      />

      <DataTable
        title="Batch Condition Highlights"
        rows={observation.batchConditionHighlights}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "batchId",
          "globalTransientRunCount",
          "globalMinProgress",
          "note",
        ]}
      />

      <DataTable
        title="Multi-block Co-occurrence"
        rows={observation.multiBlockCoOccurrenceHighlights}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "batchId",
          "runId",
          "affectedBlocks",
          "minGlobalProgressByBlock",
          "note",
        ]}
      />

      <DataTable
        title="Transient Events"
        rows={observation.transientEvents}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "batchId",
          "runId",
          "blockId",
          "cycleBudget",
          "scaledThreshold",
          "minGlobalProgress",
          "minGlobalNormalizedProgress",
          "note",
        ]}
      />

      <DataTable
        title="Raw Run Highlights"
        rows={observation.rawRunHighlights}
        preferredColumns={[
          "conditionId",
          "conditionName",
          "batchId",
          "runId",
          "blockId",
          "cycleBudget",
          "scaledThreshold",
          "warpProgress",
          "minGlobalProgress",
          "note",
        ]}
      />
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

  if (
    hasObject(observation.roleMap) ||
    hasObject(observation.conditionMap) ||
    hasItems(observation.conditionParameters)
  ) {
    items.push({ href: "#condition-metadata", label: "condition map" });
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

  if (
    hasItems(observation.roleAggregateStats) ||
    hasItems(observation.warpConditionStatsHighlights) ||
    hasItems(observation.blockConditionStatsHighlights) ||
    hasItems(observation.batchConditionHighlights) ||
    hasItems(observation.multiBlockCoOccurrenceHighlights) ||
    hasItems(observation.transientEvents) ||
    hasItems(observation.rawRunHighlights)
  ) {
    items.push({ href: "#evidence-tables", label: "evidence" });
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
            <KeyValueTable
              title="실험 조건"
              desc="observation.config에 등록된 모든 실행 조건을 표시합니다."
              data={observation.config}
            />
          </SectionBlock>

          <SectionBlock
            show={
              hasObject(observation.roleMap) ||
              hasObject(observation.conditionMap) ||
              hasItems(observation.conditionParameters)
            }
            id="condition-metadata"
            eyebrow="Condition Metadata"
            title="role / condition mapping"
          >
            <ConditionMetadataBlock observation={observation} />
          </SectionBlock>

          <SectionBlock
            show={hasItems(observation.records)}
            id="records"
            eyebrow="Representative Records"
            title="대표 record 관찰값"
            desc="progress, normalizedProgress, last_clock, sink를 record별로 분리해 표시합니다."
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

          <SectionBlock
            show={
              hasItems(observation.roleAggregateStats) ||
              hasItems(observation.warpConditionStatsHighlights) ||
              hasItems(observation.blockConditionStatsHighlights) ||
              hasItems(observation.batchConditionHighlights) ||
              hasItems(observation.multiBlockCoOccurrenceHighlights) ||
              hasItems(observation.transientEvents) ||
              hasItems(observation.rawRunHighlights)
            }
            id="evidence-tables"
            eyebrow="Evidence Tables"
            title="세부 통계와 event evidence"
            desc="최신 observation JS에서 추가된 aggregate stats, transient event, raw run highlight를 표시합니다."
          >
            <EvidenceTablesBlock observation={observation} />
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