import warp from "./nodes/execution/warp";
import sameBaseline from "./nodes/experiments/sameBaseline";
import mixedProbe from "./nodes/experiments/mixedProbe";

const ALL_NODES = [warp, sameBaseline, mixedProbe];

function buildEdges(nodes) {
  return nodes.flatMap((node) =>
    (node.connectsTo ?? []).map((target) => ({
      id: `${node.id}->${target.id}`,
      from: node.id,
      to: target.id,
      type: target.type,
    }))
  );
}

export function buildGraph() {
  return {
    nodes: ALL_NODES,
    edges: buildEdges(ALL_NODES),
  };
}