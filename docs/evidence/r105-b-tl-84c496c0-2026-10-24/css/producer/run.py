#!/usr/bin/env python3
"""Prepare fresh project CSS provenance for a later synthetic layout check.

Usage: python run.py REPO FULL_HEAD FULL_TREE NEW_OUTPUT_DIRECTORY
This is not a Next build, browser test, or Technical-Lead acceptance gate.
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


SOURCES = (
    "styles/globals.css", "postcss.config.js", "tailwind.config.js",
    "next.config.js", "package.json", "package-lock.json", "tsconfig.json",
    "components/account/AccountBuchungen.tsx",
    "components/account/BuchungenFilter.tsx",
    "lib/account/buchungen.ts", "lib/account/buchungen-abfrage.ts",
    "lib/account/buchungen-daten.ts",
    "scripts/account-booking-folder-completion-1/montage.ts",
)
CONTENT_ROOTS = ("app", "components", "lib", "content")
HEX = re.compile(r"[0-9a-f]{40}\Z")


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def git_blob(raw):
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def no_symlink(path):
    for item in (path, *path.parents):
        require(not item.is_symlink(), f"Symlink path is not supported: {item}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", type=Path)
    parser.add_argument("head")
    parser.add_argument("tree")
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    report = {"kind": "ROOT_LOCAL_POSTCSS_CSS_PROVENANCE", "status": "FAILED",
              "startedAtUtc": utc(), "nextBuildClaim": False, "layoutExecuted": False,
              "nativeNextBuildGate": "Separate; this runner does not satisfy it."}
    output_created = False
    sidecar = None
    exit_code = 1
    try:
        require(HEX.fullmatch(args.head) and HEX.fullmatch(args.tree), "Full lowercase HEAD/tree SHA-1 required")
        repo, output = args.repo, args.output
        require(repo.is_absolute() and output.is_absolute(), "Use absolute paths")
        require(".." not in repo.parts and ".." not in output.parts, "Parent traversal is not supported")
        no_symlink(repo)
        no_symlink(output)
        repo = repo.resolve(strict=True)
        require(repo.is_dir(), "Repository directory is missing")
        require(output.parent.is_dir() and output.parent.resolve().is_relative_to(Path("/tmp")), "New output parent must already exist below /tmp")
        require(not os.path.lexists(output), "Output directory must be fresh; refusing overwrite")
        require(not output.is_relative_to(repo), "Output must be outside the repository")
        for parent in output.parents:
            if parent == Path("/tmp"):
                break
            require(not (parent / ".git").exists(), "Output must be outside all review checkouts")
        require((repo / "node_modules").is_dir(), "Existing repository node_modules is required; no install is performed")
        node = shutil.which("node")
        git = shutil.which("git")
        require(node and git, "Existing Node and Git executables are required")
        node, git = str(Path(node).resolve()), str(Path(git).resolve())
        # Deliberate child allowlist: no inherited provider/DB/cloud credentials,
        # dotenv loading, npm lifecycle, NODE_OPTIONS, NODE_PATH, or Git overrides.
        child_env = {"PATH": os.pathsep.join((str(Path(node).parent), os.defpath)),
                     "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "NODE_ENV": "production",
                     "TMPDIR": "/tmp"}
        git_env = {**child_env, "GIT_NO_REPLACE_OBJECTS": "1", "GIT_GRAFT_FILE": "/dev/null",
                   "GIT_NO_LAZY_FETCH": "1", "GIT_TERMINAL_PROMPT": "0", "GIT_OPTIONAL_LOCKS": "0"}
        overrides = ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", "-c", "core.autocrlf=false"]

        def g(*arguments, allowed=(0,)):
            result = subprocess.run([git, *overrides, "-C", str(repo), *arguments],
                                    env=git_env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            require(result.returncode in allowed,
                    f"Git failed ({result.returncode}): {' '.join(arguments)}: {result.stderr.decode('utf-8', 'replace')}")
            return result

        require(g("rev-parse", "--show-toplevel").stdout.decode().strip() == str(repo), "REPO must be the exact working-tree root")
        require(g("rev-parse", "--show-object-format").stdout.strip() == b"sha1", "Only SHA-1 repositories are supported")
        require(g("config", "--get-regexp", r"^(extensions\.partialclone|remote\..*\.promisor)$", allowed=(0, 1)).returncode == 1,
                "Partial/promisor repositories are not supported; no implicit fetch is permitted")
        filters = g("config", "--null", "--name-only", "--get-regexp", r"^filter\.", allowed=(0, 1)).stdout
        names = set()
        for key in filters.decode().split("\0"):
            if key:
                match = re.fullmatch(r"filter\.(.+)\.([A-Za-z][A-Za-z0-9-]*)", key)
                require(match and not any(ord(c) < 32 for c in key), "Unsupported filter configuration key")
                names.add(match[1])
        for name in sorted(names):
            for setting, value in (("process", ""), ("clean", ""), ("smudge", ""), ("required", "false")):
                overrides.extend(("-c", f"filter.{name}.{setting}={value}"))

        def snapshot():
            head = g("rev-parse", "HEAD").stdout.decode().strip()
            tree = g("rev-parse", "HEAD^{tree}").stdout.decode().strip()
            require(head == args.head and tree == args.tree, "Exact HEAD/tree mismatch")
            status = g("status", "--porcelain=v1", "--untracked-files=all").stdout
            require(not status, "Repository is not clean; source/output mutation is not permitted")
            ignored = g("ls-files", "--others", "--ignored", "--exclude-standard", "--", *CONTENT_ROOTS).stdout
            require(not ignored, "Ignored files in Tailwind content roots would weaken exact source binding")
            sources = []
            for relative in SOURCES:
                path = repo / relative
                no_symlink(path)
                require(path.is_file(), f"Required source is missing: {relative}")
                raw = path.read_bytes()
                expected = g("rev-parse", f"HEAD:{relative}").stdout.decode().strip()
                committed = g("cat-file", "blob", expected).stdout
                require(raw == committed and git_blob(raw) == expected, f"Source Git-byte mismatch: {relative}")
                sources.append({"path": relative, "gitBlob": expected, "sha256": digest(raw), "bytes": len(raw)})
            return {"head": head, "tree": tree, "cleanStatus": "", "sources": sources,
                    "ignoredFilesInTailwindContentRoots": []}

        before = snapshot()
        output.mkdir(mode=0o700)
        output_created = True
        css_path = output / f"jetnity-b-postcss-{args.head[:12]}.css"
        sidecar = output / f"css-provenance-{args.head[:12]}.json"
        helper = Path(__file__).resolve().with_name("compile-css.mjs")
        require(helper.is_file(), "Adjacent compile-css.mjs is required")
        command = [node, str(helper), str(repo), str(css_path)]
        report.update({"repo": str(repo), "expectedHead": args.head, "expectedTree": args.tree,
                       "output": str(output), "actualWorkingDirectory": str(repo), "command": command,
                       "childEnvironmentKeys": sorted(child_env), "nodeEnvironment": "production",
                       "repositoryNodeModules": str(repo / "node_modules"),
                       "resolvedNodeModules": str((repo / "node_modules").resolve()),
                       "before": before, "gitFilterDriversNeutralizedPerCommand": sorted(names),
                       "wrapperSha256": digest(Path(__file__).read_bytes()), "helperSha256": digest(helper.read_bytes())})
        result = subprocess.run(command, cwd=repo, env=child_env, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=180)
        report["child"] = {"exitCode": result.returncode, "stdoutSha256": digest(result.stdout),
                           "stderrSha256": digest(result.stderr), "stderr": result.stderr.decode("utf-8", "replace")}
        report["after"] = snapshot()
        require(report["after"] == before, "Source bindings changed during CSS compilation")
        require(result.returncode == 0, "CSS helper failed; inspect the sidecar child diagnostics")
        compiled = json.loads(result.stdout)
        require(compiled["actualWorkingDirectory"] == str(repo), "CSS helper working directory mismatch")
        require(compiled["outputPath"] == str(css_path), "CSS helper output path mismatch")
        require(css_path.is_file() and not css_path.is_symlink(), "Fresh CSS output is missing or not regular")
        css = css_path.read_bytes()
        require(css and digest(css) == compiled["cssSha256"] and len(css) == compiled["cssBytes"], "CSS output digest mismatch")
        require(compiled["inputSha256"] == next(s["sha256"] for s in before["sources"] if s["path"] == "styles/globals.css"),
                "CSS helper input binding mismatch")
        report.update({"status": "CSS_COMPILED_SOURCES_UNCHANGED", "compilation": compiled,
                       "limitations": ["Locally compiled project PostCSS/Tailwind CSS; not claimed byte-identical to Next build output.",
                                       "No .next output is created or imitated.", "No browser, layout, hosted-data, native-device or native-zoom proof is produced.",
                                       "Actual runtime/dependency versions are recorded; native Next build and CI gates remain separate."]})
        exit_code = 0
    except Exception as exc:
        report["error"] = f"{type(exc).__name__}: {exc}"
        # A failed source recheck is a failed run, never a cleanup/reset request.
        if "snapshot" in locals():
            try:
                report["afterFailure"] = snapshot()
            except Exception as after_exc:
                report["afterFailureError"] = f"{type(after_exc).__name__}: {after_exc}"
    finally:
        report["finishedAtUtc"] = utc()
        if output_created:
            sidecar = sidecar or args.output / f"css-provenance-{args.head[:12]}.json"
            with sidecar.open("x", encoding="utf-8") as handle:
                json.dump(report, handle, ensure_ascii=False, indent=2)
                handle.write("\n")
        print(json.dumps({"status": report["status"], "sidecar": str(sidecar) if sidecar else None,
                          "error": report.get("error")}, ensure_ascii=False))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
