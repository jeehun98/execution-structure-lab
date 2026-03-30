from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List


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
    get_operator_profile_dict,
    has_operator,
    list_supported_operators,
)


def load_input_specs(input_path: Path) -> List[Dict[str, Any]]:
    """Load operator specs from a JSON file."""
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    with input_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Input JSON must be a list of objects.")

    for idx, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item at index {idx} must be an object.")
        if "name" not in item:
            raise ValueError(f"Item at index {idx} is missing required field 'name'.")
        if not isinstance(item["name"], str):
            raise ValueError(f"Item at index {idx} field 'name' must be a string.")

    return data


def analyze_operators(
    specs: List[Dict[str, Any]],
    include_unknown: bool = False,
) -> List[Dict[str, Any]]:
    """Analyze each operator spec using the registry."""
    results: List[Dict[str, Any]] = []

    for item in specs:
        name = item["name"]

        if has_operator(name):
            results.append(get_operator_profile_dict(name))
            continue

        unknown_result = {
            "name": name,
            "status": "unknown_operator",
            "message": (
                f"Operator '{name}' is not registered. "
                f"Supported operators: {list_supported_operators()}"
            ),
        }

        if include_unknown:
            results.append(unknown_result)
        else:
            raise KeyError(unknown_result["message"])

    return results


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Analyze operator specs and attach computation structures, "
            "preservation classes, possible primitives, and pipeline."
        )
    )
    parser.add_argument(
        "input_json",
        type=str,
        help="Path to the input JSON file containing operator specs.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="",
        help="Optional path to write the output JSON. Prints to stdout if omitted.",
    )
    parser.add_argument(
        "--include-unknown",
        action="store_true",
        help="Include unknown operators in the output instead of failing.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the output JSON with indentation.",
    )
    return parser


def main() -> int:
    parser = build_arg_parser()
    args = parser.parse_args()

    try:
        input_path = Path(args.input_json).resolve()
        specs = load_input_specs(input_path)

        results = analyze_operators(
            specs=specs,
            include_unknown=args.include_unknown,
        )

        indent = 2 if args.pretty else None
        output_text = json.dumps(results, ensure_ascii=False, indent=indent)

        if args.output:
            output_path = Path(args.output).resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(output_text + "\n", encoding="utf-8")
        else:
            print(output_text)

        return 0

    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())