import argparse
import os
import subprocess
import sys


def find_executable(build_dir, exe_name):
    direct = os.path.join(build_dir, exe_name)
    if os.path.exists(direct):
        return direct

    for root, _, files in os.walk(build_dir):
        if exe_name in files:
            return os.path.join(root, exe_name)

    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-dir", default="build")
    parser.add_argument("--probe", required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    exe = "probe_runner.exe" if os.name == "nt" else "probe_runner"
    exe_path = find_executable(args.build_dir, exe)

    if exe_path is None:
        print(f"[error] executable not found under: {args.build_dir}")
        sys.exit(1)

    if not os.path.exists(args.config):
        print(f"[error] config not found: {args.config}")
        sys.exit(1)

    cmd = [exe_path, args.config]

    print(f"[probe] {args.probe}")
    print("[run]", " ".join(cmd))
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()