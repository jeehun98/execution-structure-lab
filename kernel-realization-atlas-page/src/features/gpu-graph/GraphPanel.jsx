import { Link } from "react-router-dom";

export default function GraphPanel({ selectedNode }) {
  if (!selectedNode) {
    return (
      <div>
        <p className="text-sm text-neutral-400">
          노드를 선택하면 관계가 드러납니다
        </p>
      </div>
    );
  }

  const { meta = {}, kind } = selectedNode;

  return (
    <div>
      {kind ? (
        <div className="mb-3 inline-flex rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
          {kind}
        </div>
      ) : null}

      <h2 className="text-xl font-semibold text-white">
        {meta.title ?? selectedNode.label}
      </h2>

      {meta.desc ? (
        <p className="mt-4 text-sm leading-7 text-neutral-400">
          {meta.desc}
        </p>
      ) : null}

      {meta.status ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
          status:{" "}
          <span className="text-lime-300">
            {meta.status}
          </span>
        </div>
      ) : null}

      {meta.detailPath ? (
        <Link
          to={meta.detailPath}
          className="mt-6 inline-flex rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2 text-sm font-medium text-lime-200 transition hover:bg-lime-400/15"
        >
          상세 실험 보기 →
        </Link>
      ) : null}
    </div>
  );
}