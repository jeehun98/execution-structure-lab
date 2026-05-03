export default function GraphEdge({ edge }) {
  if (!edge) return null;

  return (
    <div className="rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs text-lime-200">
      {edge.from} → {edge.to}
      {edge.type ? (
        <span className="ml-2 text-neutral-400">({edge.type})</span>
      ) : null}
    </div>
  );
}