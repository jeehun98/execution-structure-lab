from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, List


@dataclass(frozen=True)
class OperatorProfile:
    """Structure-first description of an operator."""

    name: str
    computation_structures: List[str]
    preservation_classes: List[str]
    possible_primitives: List[str]
    summary: str


_OPERATOR_REGISTRY: Dict[str, OperatorProfile] = {
    "reduction_sum": OperatorProfile(
        name="reduction_sum",
        computation_structures=[
            "reduction",
            "summary_state",
        ],
        preservation_classes=[
            "order",
            "representation",
            "summary_state",
            "rematerialization",
        ],
        possible_primitives=[
            "sequential_accumulation",
            "warp_reduction",
            "block_reduction",
            "tree_reduction",
        ],
        summary=(
            "Reduction over many inputs into a single accumulated value. "
            "Supports mergeable partial states and parallel tree-style execution."
        ),
    ),
    "softmax": OperatorProfile(
        name="softmax",
        computation_structures=[
            "reduction",
            "rescaled_streaming",
            "summary_state",
            "weighted_aggregation",
        ],
        preservation_classes=[
            "order",
            "representation",
            "summary_state",
            "rescaling",
            "rematerialization",
        ],
        possible_primitives=[
            "max_reduction",
            "sum_reduction",
            "streaming_state_update",
            "shared_memory_staging",
            "blockwise_merge",
        ],
        summary=(
            "Normalized exponential transform with reduction, stable rescaling, "
            "and compact running-state structure."
        ),
    ),
    "layernorm": OperatorProfile(
        name="layernorm",
        computation_structures=[
            "summary_state",
            "reduction",
        ],
        preservation_classes=[
            "order",
            "representation",
            "summary_state",
            "rematerialization",
        ],
        possible_primitives=[
            "mean_reduction",
            "variance_reduction",
            "streaming_statistics",
            "shared_memory_staging",
        ],
        summary=(
            "Normalization driven by compact statistics such as mean and variance, "
            "often realizable through mergeable summary state."
        ),
    ),
}


def list_supported_operators() -> List[str]:
    """Return all supported operator names in sorted order."""
    return sorted(_OPERATOR_REGISTRY.keys())


def has_operator(name: str) -> bool:
    """Check whether an operator exists in the registry."""
    return name in _OPERATOR_REGISTRY


def get_operator_profile(name: str) -> OperatorProfile:
    """Return the operator profile or raise KeyError if unsupported."""
    if name not in _OPERATOR_REGISTRY:
        supported = ", ".join(list_supported_operators())
        raise KeyError(
            f"Unsupported operator '{name}'. Supported operators: {supported}"
        )
    return _OPERATOR_REGISTRY[name]


def get_operator_profile_dict(name: str) -> Dict[str, Any]:
    """Return a JSON-serializable dictionary for the operator profile."""
    return asdict(get_operator_profile(name))