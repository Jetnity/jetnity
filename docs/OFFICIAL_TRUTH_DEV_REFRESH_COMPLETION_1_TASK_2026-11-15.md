# Dev refresh completion 1 — bounded live correction

## Authority and baseline

The Owner requests completion of CH→DE in Dev, with autonomous Dev execution and
rights changes where necessary. Production, merges, new costs, unrelated Admin
files and the separate #1198 remain excluded. The 206 researched destinations
remain RESEARCH_ONLY. Root is the sole integrator and Dev operator. This is a new
Technical Lead session following the length interruption of Hauptplan84.

Baseline: PR #1197 head `70a3cb09204e74f6bcd4a5b481e942e526a6102f`, tree
`169c309a3709fca5c75dc49a60e5b1ea20fc7f34`, CI4270/run43689220907 with all ten
jobs successful. The exact Dev deployment is
`dpl_5LfXB4eHPz5oC7MTmLKYLDCtVYME`. CUSTOMER-INFORMATION1 was installed only in
Dev at 10:44:56.209253 UTC. Root and an independent reviewer verified the full
readback, all seventeen bodies and baseline
`560a0994f00babd608f4902b89c69dbcb3ef280944a3d95a90071c279b50efd3`.
The regular BG1 cron then passed generation352 at 10:45 UTC. Sender cron5 and
its enabled flag are temporarily false; all other state and BG1 scheduling remain.

## Complete observed failure

The normal Owner UI enqueued and continued its original request. Tick
`9986h-1794739521691-0232931b4806` completed all fourteen spans in17.429s.
The I1 reserve took611ms and prepare3907ms, leaving479ms for finish. PostgreSQL
rejected the actual finish at10:45:35.167 UTC with P7302 intake_lease_elapsed.
The S1 lease was10:45:30.107317–10:45:35.107317 UTC. There is no completion,
M04 result/disposition or new publication. The complete PostgreSQL window also
contains29 expected watchdog cancellations and one subsequent connection reset.

Original identities:

- Job `job3_e1467267780885ae38068e6be1738958`, attempt1, revision37.
- Attempt `execution-attempt:v3:3a32cf934505f82ba078e4e41afa60c4f47c2fa29e53be1f33a2976bf5d69aea`.
- S1 operation `op3_7e003b5a015c26976fbdf3fed1b8d494`, original1425 bytes,
  SHA256 `4428af871266c369adb5c43e81b3f385f91540ddc6288e7f25b1ad57fde76cfd`.
- Lifetime9 STARTs/41 operations; all five old published versions remain.

The old first/later/gap recovery packages are not applicable to this new cycle
with existing publications. They are preserved and must not be replayed. No
normal prepared resume is claimed without an actual retained M04 result.

## Parallel ownership and implementation

`ci_runtime_review` implements the bounded I1 TypeScript correction on its own
branch: selected-frame opt-in for independent read-only method/history work
parallel to the existing reservation, complete settlement on every branch,
and propagation of the original absolute I1 deadline into S1. The full original
five-second lease, reproof, end-clock, final read and thirty-second tick remain.
Positive preparation, evidence and attestation wait for both confirmed reservation
and positive initial reads. Existing negative audit finishes after a confirmed
reservation retain their original unavailable/quarantined semantics.
No SQL optimization or persistent authorization cache is included in this scope.

`dev_install_review` implements a separately compiled additive Dev retirement
successor for exactly the observed expired original. It must use the existing
normal Owner/AAL2 surface, retain all three historical retirements, five HRS
publications, complete original rows, roles, ACLs and object identity, and add an
immutable receipt and permanent fencing for only this unknown attempt. No
invented success/failure result, history reset, token reconstruction or general
approval exemption is allowed. Root alone applies any reviewed package.

Root already integrates the independently reviewed three-file wording correction
to show every missing transit/validity subvalue as “Derzeit nicht verfügbar”.
`customer_coverage_review` prepares the next neighbouring-country source plans
read-only. A source plan confers no publication authority.

## Acceptance and stop boundary

1. Collect the complete failed group and correct it together.
2. Relevant focused negative/settlement tests and actual local PostgreSQL17
   migration/retirement tests; current source pins, historical pins unchanged.
3. Independent review of the complete integrated correction, followed by one
   full successful CI and the corresponding READY deployment.
4. Controlled additive Dev installation, full readback and next regular BG1.
5. Normal Owner/AAL2 retirement of only the proven unknown, then normal saved
   UI-request continuation and actual source publication/visitor proof.
6. Exact additive Cycle3 review, restore only the prior sender flags, then prove
   an unattended source/queued/published cycle, later regular BG1 and visitor
   response. No manual success is labelled unattended acceptance.

Agents do not push, mark Ready, merge, change Production, create new costs or
start unassigned work. Root records results on #1197. The final Owner approval
list is issued only after actual Dev acceptance; #1196 is not separately merged.
