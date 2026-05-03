export default function GraphNode({ node, isActive, onClick }) {
  return (
    <div
      onClick={() => onClick(node.id)}
      className={`cursor-pointer rounded-xl border px-4 py-2 text-sm transition
        ${
          isActive
            ? "border-lime-400 bg-lime-400/10 text-white"
            : "border-white/10 bg-white/5 text-neutral-400 hover:border-white/30"
        }
      `}
    >
      {node.label}
    </div>
  );
}