from __future__ import annotations

from computation_structure.models import OperatorProfile


PROFILE = OperatorProfile(
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
    pipeline=[
        "max_reduction",
        "exp_shift",
        "sum_reduction",
        "normalize",
    ],
    summary=(
        "Normalized exponential transform with reduction, stable rescaling, "
        "and compact running-state structure."
    ),
)