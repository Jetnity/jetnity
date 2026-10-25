#!/usr/bin/env python3
"""Later Root execution of four existing B tests; preparation is not execution.

Usage: python run.py REPO FULL_HEAD FULL_TREE
Normal node:test process isolation only. No retry or alternate isolation mode.
"""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile


FILES = (
    "lib/account/buchungen-abfrage.test.ts",
    "lib/account/buchungen-daten.test.ts",
    "lib/account/buchungen.test.ts",
    "lib/account/buchungen-ui.test.ts",
)
SOURCES = FILES + (
    "app/account/bookings/page.tsx",
    "components/account/AccountBuchungen.tsx",
    "components/account/BuchungenFilter.tsx",
    "lib/account/buchungen-abfrage.ts",
    "lib/account/buchungen-daten.ts",
    "lib/account/buchungen.ts",
    "scripts/server-only-test-register.mjs",
    "scripts/server-only-test-loader.mjs",
    "scripts/server-only-empty.js",
    "package.json", "package-lock.json", "tsconfig.json",
)
COUNTS = {"tests": 32, "suites": 4, "pass": 32, "fail": 0,
          "cancelled": 0, "skipped": 0, "todo": 0}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha256(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path)
    parser.add_argument("head")
    parser.add_argument("tree")
    args = parser.parse_args()
    require(args.repo.is_absolute() and not args.repo.is_symlink(), "REPO must be an absolute non-symlink working-tree root")
    repo = args.repo.resolve(strict=True)
    require(re.fullmatch(r"/tmp/jetnity-[A-Za-z0-9._-]+", str(repo)), "Expected a direct /tmp/jetnity-* review checkout")
    require(re.fullmatch(r"[0-9a-f]{40}", args.head) and re.fullmatch(r"[0-9a-f]{40}", args.tree), "Full lowercase HEAD/tree SHA-1 required")
    output = Path(tempfile.mkdtemp(prefix="jetnity-r105-b-focused-final-proof-", dir="/tmp"))
    with (output / "run.py").open("xb") as handle:
        handle.write(Path(__file__).read_bytes())
    # Same explicit non-secret environment surface as the proven C invocation.
    # Values are passed only to local children and are not recorded in evidence.
    env = {key: os.environ[key] for key in ("PATH", "LANG", "LC_ALL", "TZ") if key in os.environ}
    git_env = {**env, "GIT_NO_REPLACE_OBJECTS": "1", "GIT_GRAFT_FILE": "/dev/null",
               "GIT_NO_LAZY_FETCH": "1", "GIT_TERMINAL_PROMPT": "0", "GIT_OPTIONAL_LOCKS": "0"}
    command = ["node", "--import", "./scripts/server-only-test-register.mjs", "--import", "tsx",
               "--test", "--test-reporter=tap", *FILES]
    record = {"executionClass": "ROOT_EXECUTED_EXISTING_FOCUSED_TESTS", "status": "FAIL",
              "startedAtUtc": utc(), "repo": str(repo), "output": str(output),
              "expectedHead": args.head, "expectedTree": args.tree, "expectedCounts": COUNTS,
              "command": command, "actualWorkingDirectory": str(repo),
              "environmentKeys": sorted(env), "environmentValuesRecorded": False,
              "isolation": "normal node:test process isolation; no override or fallback",
              "permissionNote": "Execution permissions are controlled by the Root caller. This wrapper never changes permissions, escalates, or retries.",
              "nativeCiOrFullBuildClaim": False, "testInvocationAttempted": False, "phase": "preflight"}
    exit_code = 1
    bindings_safe = False
    overrides = ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "core.autocrlf=false"]

    def git(*arguments, allowed=(0,)):
        run = subprocess.run(["git", *overrides, "-C", str(repo), *arguments], env=git_env,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        require(run.returncode in allowed,
                f"Git failed ({run.returncode}): {' '.join(arguments)}: {run.stderr.decode('utf-8', 'replace')}")
        return run

    def binding():
        head = git("rev-parse", "HEAD").stdout.decode().strip()
        tree = git("rev-parse", "HEAD^{tree}").stdout.decode().strip()
        require(head == args.head and tree == args.tree, "Exact HEAD/tree mismatch")
        require(not git("status", "--porcelain=v1", "--untracked-files=all").stdout, "Checkout is not clean")
        require(git("symbolic-ref", "-q", "HEAD", allowed=(0, 1)).returncode == 1, "Expected detached exact review checkout")
        sources = {}
        for relative in SOURCES:
            path = repo / relative
            require(path.is_file() and not path.is_symlink(), f"Missing/nonregular source: {relative}")
            for parent in path.parents:
                require(not parent.is_symlink(), f"Symlink in source path: {relative}")
                if parent == repo:
                    break
            raw = path.read_bytes()
            blob = git("rev-parse", f"HEAD:{relative}").stdout.decode().strip()
            committed = git("cat-file", "blob", blob).stdout
            calculated = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
            require(raw == committed and calculated == blob, f"Source Git-byte mismatch: {relative}")
            sources[relative] = {"gitBlob": blob, "sha256": sha256(raw), "bytes": len(raw)}
        return {"head": head, "tree": tree, "gitStatus": "", "detached": True, "sources": sources}

    try:
        require(git("rev-parse", "--show-toplevel").stdout.decode().strip() == str(repo), "REPO must be the exact working-tree root")
        require(git("rev-parse", "--show-object-format").stdout.strip() == b"sha1", "Only SHA-1 Git objects are supported")
        require(git("config", "--get-regexp", r"^(extensions\.partialclone|remote\..*\.promisor)$", allowed=(0, 1)).returncode == 1,
                "Partial/promisor repository refused; no implicit network retrieval is permitted")
        names = set()
        for key in git("config", "--null", "--name-only", "--get-regexp", r"^filter\.", allowed=(0, 1)).stdout.decode().split("\0"):
            if key:
                match = re.fullmatch(r"filter\.(.+)\.([A-Za-z][A-Za-z0-9-]*)", key)
                require(match and not any(ord(c) < 32 for c in key), "Unsupported filter configuration key")
                names.add(match[1])
        for name in sorted(names):
            for setting, value in (("process", ""), ("clean", ""), ("smudge", ""), ("required", "false")):
                overrides.extend(("-c", f"filter.{name}.{setting}={value}"))
        record["gitFilterDriversNeutralizedPerCommand"] = sorted(names)
        bindings_safe = True
        record["before"] = binding()
        require((repo / "node_modules").is_dir(), "Existing repository node_modules is required; no install is performed")
        record["resolvedNodeModules"] = str((repo / "node_modules").resolve())
        record["resolvedNodeExecutable"] = shutil.which("node", path=env.get("PATH"))
        require(record["resolvedNodeExecutable"], "Node executable is unavailable")
        record["phase"] = "node-version"
        version = subprocess.run(["node", "--version"], cwd=repo, env=env,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
        record["nodeVersionCommand"] = {"command": ["node", "--version"], "exitCode": version.returncode,
                                        "stderr": version.stderr.decode("utf-8", "replace")}
        require(version.returncode == 0, "Node version command failed; no test invocation or fallback")
        record["node"] = version.stdout.decode().strip()
        require(re.fullmatch(r"v\d+\.\d+\.\d+", record["node"]), "Unexpected Node version output")
        print(json.dumps({"starting": True, "head": args.head, "output": str(output)}), flush=True)
        record["phase"] = "focused-test-command"
        record["testInvocationAttempted"] = True
        run = subprocess.run(command, cwd=repo, env=env, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, timeout=180)
        with (output / "focused.tap").open("xb") as handle:
            handle.write(run.stdout)
        with (output / "stderr.log").open("xb") as handle:
            handle.write(run.stderr)
        record["exitCode"] = run.returncode
        record["phase"] = "verify-source-and-tap"
        record["after"] = binding()
        require(record["after"] == record["before"], "Source bindings changed during the test invocation")
        text = run.stdout.decode("utf-8", errors="strict")
        counts = {}
        for name in COUNTS:
            matches = re.findall(r"^# " + name + r" (\d+)\r?$", text, re.MULTILINE)
            require(len(matches) == 1, f"Missing/ambiguous top-level TAP count: {name} {matches}")
            counts[name] = int(matches[0])
        record["counts"] = counts
        require(run.returncode == 0, f"Focused test process exited {run.returncode}")
        require(counts == COUNTS, f"Focused TAP count mismatch: {counts}")
        record["sourceBindingsUnchanged"] = True
        record["status"] = "PASS"
        record["phase"] = "complete"
        exit_code = 0
    except Exception as exc:
        record["error"] = f"{type(exc).__name__}: {exc}"
        if isinstance(exc, subprocess.TimeoutExpired):
            record["timedOut"] = True
            if record["phase"] == "focused-test-command":
                for name, raw in (("focused.tap", exc.stdout), ("stderr.log", exc.stderr)):
                    if raw is not None and not (output / name).exists():
                        with (output / name).open("xb") as handle:
                            handle.write(raw.encode() if isinstance(raw, str) else raw)
        if bindings_safe:
            try:
                record["after"] = binding()
            except Exception as binding_error:
                record["bindingError"] = f"{type(binding_error).__name__}: {binding_error}"
        else:
            record["bindingError"] = "Post-check not attempted: safe Git preflight did not finish."
    record["finishedAtUtc"] = utc()
    record["artifacts"] = {p.name: {"sha256": sha256(p.read_bytes()), "bytes": p.stat().st_size}
                           for p in output.iterdir() if p.is_file()}
    result = output / "result.json"
    with result.open("x", encoding="utf-8") as handle:
        json.dump(record, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(json.dumps({"status": record["status"], "output": str(output), "counts": record.get("counts"),
                      "error": record.get("error"), "resultSha256": sha256(result.read_bytes())}), flush=True)
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
