from __future__ import annotations

from computation_structure.models import OperatorProfile


PROFILE = OperatorProfile(
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
    pipeline=[
        "mean_reduction",
        "variance_reduction",
        "normalize",
        "affine_transform",
    ],
    summary=(
        "Normalization driven by compact statistics such as mean and variance, "
        "often realizable through mergeable summary state."
    ),
)