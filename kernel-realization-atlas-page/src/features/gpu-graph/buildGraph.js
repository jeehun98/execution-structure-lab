import { gpuGraphNodes } from "./nodes";

function buildEdges(nodes) {
  return nodes.flatMap((sourceNode) => {
    const connectsTo = sourceNode.connectsTo ?? [];

    return connectsTo.map((edge) => ({
      id: `${sourceNode.id}-${edge.type ?? "to"}-${edge.id}`,
      source: sourceNode.id,
      target: edge.id,
      type: edge.type ?? "related",
    }));
  });
}

export default function buildGraph() {
  const nodes = gpuGraphNodes;
  const edges = buildEdges(nodes);

  return {
    nodes,
    edges,
  };
}