from __future__ import annotations

import argparse
import sys
from pathlib import Path


def ensure_repo_root_on_sys_path() -> Path:
    """
    Ensure the repository root is on sys.path so that package imports work
    when this script is executed directly.
    """
    script_path = Path(__file__).resolve()
    repo_root = script_path.parent.parent

    repo_root_str = str(repo_root)
    if repo_root_str not in sys.path:
        sys.path.insert(0, repo_root_str)

    return repo_root


ensure_repo_root_on_sys_path()

from computation_structure.registry import (  # noqa: E402
    get_operator_profile,
    list_supported_operators,
)


def render_pipeline_text(operator_name: str) -> str:
    """Render a human-readable pipeline for an operator."""
    profile = get_operator_profile(operator_name)
    lines = [profile.name]

    pipeline = profile.pipeline
    for idx, step in enumerate(pipeline):
        is_last = idx == len(pipeline) - 1
        prefix = "  └─ " if is_last else "  ├─ "
        lines.append(f"{prefix}{step}")

    return "\n".join(lines)


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Render the pipeline of a registered operator."
    )
    parser.add_argument(
        "operator_name",
        type=str,
        help="Registered operator name.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List supported operators and exit.",
    )
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        if args.list:
            for name in list_supported_operators():
                print(name)
            return 0

        print(render_pipeline_text(args.operator_name))
        return 0

    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())