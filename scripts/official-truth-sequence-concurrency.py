#!/usr/bin/env python3
"""PG17 concurrency proof in a disposable local CI database, never Supabase.

Required: JETNITY_SEQUENCE_TEST_DATABASE=jetnity_sequence_rehearsal_<8+ chars>
Optional: JETNITY_SEQUENCE_TEST_HOST (loopback only), _PORT, _USER, _PASSWORD.
No database URLs or inherited PG* settings are used. Missing tools/server fail.
"""
from __future__ import annotations

import argparse
import hashlib
import ipaddress
import json
import os
import re
import selectors
import shutil
import subprocess
import sys
import time
import uuid
from pathlib import Path


class ProofError(RuntimeError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ProofError(message)


def configuration() -> tuple[str, dict[str, str]]:
    executable = shutil.which("psql")
    require(executable is not None, "psql is required; no test was skipped")
    database = os.environ.get("JETNITY_SEQUENCE_TEST_DATABASE", "")
    require(bool(re.fullmatch(r"jetnity_sequence_rehearsal_[a-z0-9]{8,32}", database)),
            "An explicitly named disposable sequence rehearsal database is required")
    host = os.environ.get("JETNITY_SEQUENCE_TEST_HOST", "127.0.0.1")
    if host != "localhost":
        try:
            loopback = ipaddress.ip_address(host).is_loopback
        except ValueError:
            loopback = False
        require(loopback, "Only an explicit loopback PostgreSQL host is permitted")
    port = os.environ.get("JETNITY_SEQUENCE_TEST_PORT", "5432")
    require(port.isdigit() and 1024 <= int(port) <= 65535, "Invalid local PostgreSQL port")
    user = os.environ.get("JETNITY_SEQUENCE_TEST_USER", "postgres")
    require(bool(re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", user)), "Invalid fixture user")
    # Explicit connection settings: ignore PGHOST/PGSERVICE/PGPASSFILE etc.
    env = {k: v for k, v in os.environ.items()
           if k in {"PATH", "LANG", "LC_ALL", "LD_LIBRARY_PATH", "TMPDIR"}}
    env.update(PGHOST=host, PGPORT=port, PGDATABASE=database, PGUSER=user,
               PGPASSWORD=os.environ.get("JETNITY_SEQUENCE_TEST_PASSWORD", ""),
               PGCONNECT_TIMEOUT="5", PGSSLMODE="disable", PGSERVICEFILE="/dev/null",
               PGPASSFILE="/dev/null", LC_ALL="C")
    return executable, env


class Session:
    def __init__(self, executable: str, env: dict[str, str], label: str):
        self.process = subprocess.Popen(
            [executable, "--no-psqlrc", "--quiet", "--tuples-only", "--no-align",
             "--set=ON_ERROR_STOP=1"],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            env=env, bufsize=0,
        )
        require(self.process.stdin is not None and self.process.stdout is not None,
                "Could not open psql pipes")
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.process.stdout, selectors.EVENT_READ)
        self.buffer = b""
        self.pending: str | None = None
        self.closed = False
        try:
            rows = self.execute(
                f"SET application_name='jetnity-sequence-proof-{label}'; "
                "SET statement_timeout='12s'; SET lock_timeout='8s'; "
                "SELECT pg_backend_pid();"
            )
            require(len(rows) == 1 and rows[0].isdigit(), "Could not identify fixture backend")
            self.pid = int(rows[0])
        except Exception:
            self.close()
            raise

    def send(self, sql: str) -> str:
        require(self.pending is None, "A fixture connection already has a pending command")
        require(self.process.poll() is None, "Fixture psql process exited unexpectedly")
        marker = "JETNITY_DONE_" + uuid.uuid4().hex
        self.pending = marker
        self.process.stdin.write((sql + f"\nSELECT '{marker}';\n").encode())
        self.process.stdin.flush()
        return marker

    def finish(self, marker: str, timeout: float = 12.0) -> list[str]:
        require(self.pending == marker, "Fixture result marker mismatch")
        result: list[str] = []
        deadline = time.monotonic() + timeout
        while True:
            while b"\n" in self.buffer:
                line, self.buffer = self.buffer.split(b"\n", 1)
                value = line.decode("utf-8", "replace").strip()
                if value == marker:
                    self.pending = None
                    return result
                if value:
                    result.append(value)
            remaining = deadline - time.monotonic()
            require(remaining > 0, "Fixture psql command timed out")
            ready = self.selector.select(min(remaining, 0.25))
            if not ready:
                if self.process.poll() is not None:
                    raise ProofError("Fixture psql failed: " + " | ".join(result[-4:]))
                continue
            chunk = os.read(self.process.stdout.fileno(), 65536)
            if not chunk:
                raise ProofError("Fixture psql failed: " + " | ".join(result[-4:]))
            self.buffer += chunk

    def execute(self, sql: str) -> list[str]:
        return self.finish(self.send(sql))

    def scalar(self, sql: str) -> str:
        rows = self.execute(sql)
        require(len(rows) == 1, "Fixture scalar query returned an unexpected result shape")
        return rows[0]

    def close(self) -> None:
        if self.closed:
            return
        self.closed = True
        if self.process.poll() is None:
            try:
                self.process.stdin.write(b"ROLLBACK;\n\\q\n")
                self.process.stdin.flush()
            except (BrokenPipeError, OSError):
                pass
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                try:
                    self.process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait(timeout=2)
        self.selector.close()
        self.process.stdin.close()
        self.process.stdout.close()


def wait_for_lock(admin: Session, pid: int, sequence: str, mode: str, granted: bool) -> None:
    deadline = time.monotonic() + 5.0
    while time.monotonic() < deadline:
        present = admin.scalar(
            "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='relation' "
            f"AND pid={pid} AND relation='{sequence}'::regclass "
            f"AND mode='{mode}' AND granted={'true' if granted else 'false'})::integer;"
        )
        if present == "1":
            return
        # Poll an observed server condition; elapsed sleep is never the oracle.
        time.sleep(0.01)
    raise ProofError(f"Expected {mode} granted={granted} was not observed")


def fixture(admin: Session, schema: str, name: str, start: int,
            history: tuple[int, ...], called: bool = True) -> tuple[str, str]:
    sequence = f"{schema}.{name}_seq"
    ledger = f"{schema}.{name}_history"
    values = ",".join(f"({number})" for number in history)
    admin.execute(
        f"CREATE SEQUENCE {sequence} AS bigint START {start} INCREMENT 1 CACHE 1 NO CYCLE; "
        f"CREATE TABLE {ledger}(request_id bigint PRIMARY KEY); "
        f"CREATE TABLE {schema}.{name}_dispatch(net_request_id bigint PRIMARY KEY); "
        f"CREATE TABLE {schema}.{name}_response(id bigint PRIMARY KEY); "
        f"CREATE TABLE {schema}.{name}_queue(id bigint PRIMARY KEY); "
        f"INSERT INTO {ledger} VALUES {values};"
    )
    if called:
        require(admin.scalar(f"SELECT nextval('{sequence}');") == str(start),
                "Fixture initialization returned a wrong ID")
    return sequence, ledger


class RepairCandidate:
    """Execute the actual candidate's lock and restart statements, not a copy.

    Only explicit object-name replacements occur. The hosted BG1 functions are
    replaced with named local fixture stubs. Source/method/BG1 release gates are
    deliberately outside this proof; its exact file hash is emitted as evidence.
    """
    def __init__(self, path: str):
        raw = Path(path).read_bytes()
        self.sha256 = hashlib.sha256(raw).hexdigest()
        source = raw.decode("utf-8")
        self.barrier = "ALTER SEQUENCE net.http_request_queue_id_seq INCREMENT BY 1;"
        require(source.count(self.barrier) == 1, "Candidate needs one exact lock-first barrier")
        before, after = source.split(self.barrier)
        require("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;" in before,
                "Candidate must establish READ COMMITTED before locking")
        require(re.search(r"SELECT\s+last_value\b", before, re.I) is None,
                "Candidate reads sequence state before the global barrier")
        require(re.search(r"\bsetval\s*\(", source, re.I) is None,
                "Nontransactional setval is forbidden in the candidate")
        require(source.rstrip().endswith("ROLLBACK;"), "Review candidate must remain rollback-only")
        match = re.search(r"DO \$at_locked\$.*?END \$at_locked\$;", after, re.S)
        require(match is not None, "Actual candidate at_locked block was not found")
        self.locked_block = match.group(0)
        require("ShareRowExclusiveLock" in self.locked_block,
                "Actual candidate must verify its global lock")
        start = before.rfind("\n SELECT * INTO STRICT seq FROM pg_sequence")
        require(start >= 0, "Actual candidate sequence metadata preflight was not found")
        pre = before[start:]
        require("\nEND $at_pre$;" in pre, "Actual candidate preflight boundary missing")
        self.metadata_block = pre.split("\nEND $at_pre$;", 1)[0]
        for required in ("seq.seqcache<>1", "seq.seqincrement<>1", "seq.seqcycle", "seq.seqmax"):
            require(required in self.metadata_block, "Actual candidate metadata guard incomplete")

    def preflight_sql(self, sequence: str) -> str:
        actual = self.metadata_block.replace("net.http_request_queue_id_seq", sequence)
        return "\nDO $pre$\nDECLARE seq pg_sequence%ROWTYPE;\nBEGIN\n" + actual + "\nEND $pre$;\n"

    def barrier_sql(self, sequence: str) -> str:
        return self.barrier.replace("net.http_request_queue_id_seq", sequence)

    def locked_restart_sql(self, sequence: str, ledger: str) -> str:
        base = ledger.removesuffix("_history")
        schema = sequence.split(".", 1)[0]
        replacements = {
            "net.http_request_queue_id_seq": sequence,
            "official_v3_at_production_private.watch_requests_v1": ledger,
            "jetnity_prod_import_scheduler.dispatches_v1": base + "_dispatch",
            "net._http_response": base + "_response",
            "net.http_request_queue": base + "_queue",
            "official_v3_guard_private.assert_catalog_v1()": schema + ".assert_catalog_fixture()",
            "public.official_v3_guard_alarm_status_v1()": schema + ".guard_status_fixture()",
        }
        actual = self.locked_block
        for old, new in replacements.items():
            require(old in actual, "Candidate object mapping changed; review is required")
            actual = actual.replace(old, new)
        require("official_v3_" not in actual and "jetnity_prod_" not in actual,
                "A hosted schema reference escaped the explicit fixture mapping")
        return actual


def begin_lock(session: Session, sequence: str, candidate: RepairCandidate) -> None:
    session.execute("BEGIN ISOLATION LEVEL READ COMMITTED; " + candidate.preflight_sql(sequence))
    session.execute(candidate.barrier_sql(sequence))


def run() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", required=True, help="Actual rollback-only repair candidate SQL")
    args = parser.parse_args()
    candidate = RepairCandidate(args.candidate)
    executable, env = configuration()
    sessions: list[Session] = []
    admin: Session | None = None
    schema = "sequence_native_" + uuid.uuid4().hex[:16]
    created = False
    completed: list[str] = []
    try:
        admin = Session(executable, env, "observer")
        require(admin.scalar("SELECT current_setting('server_version_num')::integer/10000;") == "17",
                "PostgreSQL 17 is mandatory; no compatible-server assumption")
        require(admin.scalar("SELECT current_database();") == env["PGDATABASE"],
                "Connected database differs from explicit disposable fixture name")
        require(admin.scalar("SELECT to_regnamespace('official_v3_guard_private') IS NULL;") == "t",
                "A real Official Truth database must never be used for this fixture")
        admin.execute(f"CREATE SCHEMA {schema};")
        created = True
        admin.execute(f"""
CREATE FUNCTION {schema}.assert_catalog_fixture() RETURNS void LANGUAGE plpgsql
 AS $fixture$ BEGIN RETURN; END $fixture$;
CREATE FUNCTION {schema}.guard_status_fixture() RETURNS jsonb LANGUAGE sql STABLE
 AS $fixture$ SELECT '{{"status":"current"}}'::jsonb $fixture$;
""")
        a = Session(executable, env, "A")
        sessions.append(a)
        b = Session(executable, env, "B")
        sessions.append(b)
        c = Session(executable, env, "C")
        sessions.append(c)

        # A owns the global sequence lock before reading a value. B must wait.
        seq, history = fixture(admin, schema, "commit", 77, (61, 62, 77, 185, 196))
        begin_lock(a, seq, candidate)
        wait_for_lock(admin, a.pid, seq, "ShareRowExclusiveLock", True)
        b.execute("BEGIN ISOLATION LEVEL READ COMMITTED;")
        waiting = b.send(f"INSERT INTO {history} VALUES(nextval('{seq}')) RETURNING request_id;")
        wait_for_lock(admin, b.pid, seq, "RowExclusiveLock", False)
        a.execute(candidate.locked_restart_sql(seq, history))
        a.execute("COMMIT;")
        require(b.finish(waiting) == ["197"], "Waiting producer did not receive first safe ID 197")
        b.execute("COMMIT;")
        require(admin.scalar(f"SELECT count(*) FROM {history} WHERE request_id=197;") == "1",
                "Committed ID was not persisted once")
        completed.append("global_lock_blocks_nextval_then_commit_allocates_above_history")

        # Called=true and called=false must both restore exactly on rollback.
        for called in (True, False):
            label = "rollback_called" if called else "rollback_uncalled"
            seq, history = fixture(admin, schema, label, 500, (61, 77, 196, 700), called=called)
            before = admin.scalar(f"SELECT last_value::text||'|'||is_called::text FROM {seq};")
            begin_lock(a, seq, candidate)
            a.execute(candidate.locked_restart_sql(seq, history))
            b.execute("BEGIN ISOLATION LEVEL READ COMMITTED;")
            waiting = b.send(f"INSERT INTO {history} VALUES(nextval('{seq}')) RETURNING request_id;")
            wait_for_lock(admin, b.pid, seq, "RowExclusiveLock", False)
            a.execute("ROLLBACK;")
            expected = "501" if called else "500"
            require(b.finish(waiting) == [expected], "Rollback did not resume the original sequence state")
            b.execute("COMMIT;")
            require(before == ("500|true" if called else "500|false"), "Fixture original state was wrong")
            require(admin.scalar(f"SELECT count(*) FROM {history} WHERE request_id={expected};") == "1",
                    "Rollback resumed with a reused fixture ID")
            completed.append(label + "_restores_old_nextval_without_duplicate")

        # A producer that allocated before repair must finish before lock-first
        # repair takes its READ COMMITTED snapshot and computes the high water.
        seq, history = fixture(admin, schema, "prior_writer", 1000, (196, 1000))
        stale_read = admin.scalar(f"SELECT last_value FROM {seq};")
        require(stale_read == "1000", "Prior-writer fixture start mismatch")
        b.execute("BEGIN ISOLATION LEVEL READ COMMITTED;")
        require(b.scalar(f"INSERT INTO {history} VALUES(nextval('{seq}')) RETURNING request_id;") == "1001",
                "Prior producer did not allocate expected ID")
        a.execute("BEGIN ISOLATION LEVEL READ COMMITTED; " + candidate.preflight_sql(seq))
        acquiring = a.send(candidate.barrier_sql(seq))
        wait_for_lock(admin, a.pid, seq, "ShareRowExclusiveLock", False)
        b.execute("COMMIT;")
        a.finish(acquiring)
        a.execute(candidate.locked_restart_sql(seq, history))
        c.execute("BEGIN ISOLATION LEVEL READ COMMITTED;")
        waiting = c.send(f"INSERT INTO {history} VALUES(nextval('{seq}')) RETURNING request_id;")
        wait_for_lock(admin, c.pid, seq, "RowExclusiveLock", False)
        a.execute("COMMIT;")
        require(c.finish(waiting) == ["1002"], "Repair lost a previously reserved producer ID")
        c.execute("COMMIT;")
        completed.append("wait_then_fresh_snapshot_preserves_prior_producer_reservation")

        # The actual four-ledger maximum must include pending IDs and responses,
        # not only the AT history or the current (possibly reset) sequence.
        seq, history = fixture(admin, schema, "all_ledgers", 100, (77, 100))
        admin.execute(f"INSERT INTO {schema}.all_ledgers_dispatch VALUES(196); "
                      f"INSERT INTO {schema}.all_ledgers_response VALUES(230); "
                      f"INSERT INTO {schema}.all_ledgers_queue VALUES(250);")
        begin_lock(a, seq, candidate)
        a.execute(candidate.locked_restart_sql(seq, history))
        require(a.scalar(f"SELECT last_value::text||'|'||is_called::text FROM {seq};") == "251|false",
                "Actual candidate omitted a durable or pending request-ID ledger")
        a.execute("ROLLBACK;")
        completed.append("all_four_actual_candidate_high_water_inputs_are_used")

        # Negative control: reproduce the old read-first race deterministically.
        seq, history = fixture(admin, schema, "unsafe_old", 197, (196, 197))
        old_value = int(a.scalar(f"SELECT last_value FROM {seq};"))
        old_high = int(a.scalar(f"SELECT max(request_id) FROM {history};"))
        stale_target = max(old_value, old_high) + 1
        require(b.scalar(f"INSERT INTO {history} VALUES(nextval('{seq}')) RETURNING request_id;") == "198",
                "Unsafe negative control could not stage concurrent reservation")
        a.execute(f"BEGIN; ALTER SEQUENCE {seq} RESTART WITH {stale_target}; COMMIT;")
        c.execute(f"""
DO $expected_duplicate$
DECLARE was_duplicate boolean:=false;
BEGIN
 BEGIN
  INSERT INTO {history} VALUES(nextval('{seq}'));
 EXCEPTION WHEN unique_violation THEN was_duplicate:=true;
 END;
 IF NOT was_duplicate THEN RAISE EXCEPTION 'OLD_READ_FIRST_RACE_WAS_NOT_REPRODUCED'; END IF;
END $expected_duplicate$;
""")
        completed.append("old_read_first_algorithm_reproduces_unique_violation")

        # Refuse unsafe parameter variants before taking the no-op lock/restart.
        for label, alteration in (("cache", "CACHE 2"), ("increment", "INCREMENT BY 2"),
                                  ("cycle", "CYCLE"), ("range", "MAXVALUE 10000")):
            seq, history = fixture(admin, schema, "bad_" + label, 77, (77, 196))
            admin.execute(f"ALTER SEQUENCE {seq} {alteration};")
            before = admin.scalar(f"SELECT last_value::text||'|'||is_called::text FROM {seq};")
            # Same predicate as production preflight; raising and catching only
            # its own fixed error proves the refusal path without killing psql.
            check = candidate.preflight_sql(seq)
            nested = check.removeprefix("\nDO $pre$\n").removesuffix("\nEND $pre$;\n")
            # Keep declaration/scoping valid by using a nested PL/pgSQL block.
            a.execute(f"""
DO $negative$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  {nested}
  END;
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM<>'AT_SEQUENCE_UNREVIEWED_GENERATOR_PARAMETERS' THEN RAISE; END IF;
  rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'UNSAFE_METADATA_WAS_ACCEPTED'; END IF;
END $negative$;
""")
            require(admin.scalar(f"SELECT last_value::text||'|'||is_called::text FROM {seq};") == before,
                    "Parameter refusal changed sequence state")
            completed.append("reject_" + label + "_without_sequence_change")

        seq, history = fixture(admin, schema, "exhausted", 9223372036854775807,
                               (9223372036854775807,))
        begin_lock(a, seq, candidate)
        # Wrap the ACTUAL candidate block so its precise range exception is the
        # expected result. No independent hand-written overflow algorithm.
        exhausted_actual = candidate.locked_restart_sql(seq, history)
        exhausted_inner = exhausted_actual.removeprefix("DO $at_locked$\n").removesuffix("END $at_locked$;")
        a.execute(f"""
DO $exhaustion$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  {exhausted_inner}
  END;
 EXCEPTION WHEN SQLSTATE 'P7998' THEN
  IF SQLERRM<>'AT_SEQUENCE_RELEASE_STOP_INVALID_OR_EXHAUSTED_RANGE' THEN RAISE; END IF;
  rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'EXHAUSTED_RANGE_WAS_ACCEPTED'; END IF;
END $exhaustion$;
""")
        a.execute("ROLLBACK;")
        require(admin.scalar(f"SELECT last_value FROM {seq};") == "9223372036854775807",
                "Exhaustion refusal changed sequence")
        completed.append("exhaustion_refused_before_overflow")
    finally:
        for session in reversed(sessions):
            session.close()
        if admin is not None:
            try:
                if created:
                    admin.execute(f"DROP SCHEMA {schema} CASCADE;")
                    require(admin.scalar(f"SELECT to_regnamespace('{schema}') IS NULL;") == "t",
                            "Fixture schema cleanup failed")
            finally:
                admin.close()
    print(json.dumps({"result": "PG17_SEQUENCE_MULTI_SESSION_PASS", "checks": len(completed),
                      "candidate_sha256": candidate.sha256,
                      "proof_scope": "actual lock/restart SQL with local BG1 fixture stubs; no hosted release proof",
                      "cases": completed, "fixture_schema_removed": True,
                      "hosted_database_used": False, "facts_published": False}, separators=(",", ":")))


if __name__ == "__main__":
    try:
        run()
    except Exception as error:
        print(json.dumps({"result": "FAIL", "error": str(error), "skipped": False}), file=sys.stderr)
        sys.exit(1)
