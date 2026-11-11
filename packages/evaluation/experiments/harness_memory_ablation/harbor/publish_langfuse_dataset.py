"""Publish frozen Harbor cases and complete memory corpora to Langfuse.

Dry-run is the default. Existing records must match exactly; this tool never
deletes or replaces differing records. Credentials and server receipts stay local.
No agents, model calls, experiment runs, or scores are created.
"""
from __future__ import annotations

import argparse
import base64
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

VERSION = "edges-harbor-langfuse-dataset-v1"
INPUT_FIELDS = {"question", "query_at", "scope", "task_mode"}
EXPECTED_FIELDS = {"gold_memory_ids", "reference_answer", "answer_checks", "forbidden_patterns"}
MAX_REQUEST_BYTES = 900_000


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value):
    return hashlib.sha256(encoded(value)).hexdigest()


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w", encoding="utf-8") as stream:
        os.chmod(temp, 0o600)
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")
    temp.replace(path)


class Client:
    def __init__(self, path):
        config = json.loads(path.read_text())
        self.host = config.get("base_url", config.get("host", "")).rstrip("/")
        if not self.host.startswith("https://"):
            raise ValueError("An HTTPS Langfuse endpoint is required")
        self.auth = "Basic " + base64.b64encode(
            (config["public_key"] + ":" + config["secret_key"]).encode()).decode()

    def request(self, method, endpoint, payload=None, params=None, missing_ok=False):
        url = self.host + endpoint
        if params:
            url += "?" + urllib.parse.urlencode(params)
        data = encoded(payload) if payload is not None else None
        if data is not None and len(data) > MAX_REQUEST_BYTES:
            raise ValueError("Request exceeds conservative payload budget; no truncation allowed")
        request = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": self.auth, "Accept": "application/json",
            "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 EdgesDatasetPublisher/1.0",
        })
        for attempt in range(6):
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    return json.load(response)
            except urllib.error.HTTPError as exc:
                if exc.code == 404 and missing_ok:
                    return None
                if exc.code not in (429, 500, 502, 503, 504) or attempt == 5:
                    raise RuntimeError(f"Langfuse HTTP {exc.code}; response withheld") from None
            except (TimeoutError, urllib.error.URLError):
                if attempt == 5:
                    raise RuntimeError("Langfuse transport retries exhausted") from None
            time.sleep(min(2 ** attempt, 10))

    def dataset(self, name):
        return self.request("GET", "/api/public/v2/datasets/" + urllib.parse.quote(name, safe=""),
                            missing_ok=True)

    def items(self, name):
        found = {}
        page = 1
        expected_total = None
        while True:
            result = self.request("GET", "/api/public/dataset-items",
                                  params={"datasetName": name, "page": page, "limit": 100})
            rows, meta = result["data"], result["meta"]
            if expected_total is None:
                expected_total = meta["totalItems"]
            if meta["totalItems"] != expected_total:
                raise ValueError("Dataset changed during paginated read")
            for row in rows:
                if row["id"] in found:
                    raise ValueError("Duplicate item in pagination")
                found[row["id"]] = row
            if page >= meta["totalPages"]:
                break
            page += 1
        if len(found) != expected_total:
            raise ValueError("Incomplete item pagination")
        return found


def build_plan(key, path, prefix):
    raw = path.read_bytes()
    source = json.loads(raw)
    if source.get("schema_version") != 1 or not source.get("cases") or not source.get("memories"):
        raise ValueError("Expected complete Harbor schema_version 1 dataset")
    byte_sha, canonical_sha = hashlib.sha256(raw).hexdigest(), digest(source)
    case_name, corpus_name = f"{prefix}/{key}/cases", f"{prefix}/{key}/corpus"
    cases, memories = source["cases"], source["memories"]
    for records, field in [(cases, "case_id"), (memories, "memory_id")]:
        ids = [row[field] for row in records]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate source record IDs")
    common = {"adapter_version": VERSION, "source_file_sha256": byte_sha,
              "source_canonical_sha256": canonical_sha,
              "source_case_count": len(cases), "source_memory_count": len(memories)}
    case_metadata = {**common, "record_type": "evaluation_cases", "corpus_dataset_name": corpus_name,
                     "source_header": {k: v for k, v in source.items() if k not in ("cases", "memories")},
                     "case_order": [c["case_id"] for c in cases],
                     "memory_order": [m["memory_id"] for m in memories],
                     "split_counts": dict(Counter(c["split"] for c in cases)),
                     "loader_contract": "Reconstruct source from case records and corpus inputs. Only time-eligible memories are materialized by the Harbor runner. Metadata and expectedOutput are verifier-only; never inject scene_truth, gold, or reviews into the agent prompt. This publication does not create experiment results."}
    corpus_metadata = {**common, "record_type": "supporting_memory_corpus", "cases_dataset_name": case_name,
                       "usage": "Supporting memory records, not evaluation questions. Preserve all memories; apply available_at < query_at at execution time."}
    specs = []
    for name, metadata, rows, kind, id_field in [
        (case_name, case_metadata, cases, "case", "case_id"),
        (corpus_name, corpus_metadata, memories, "memory", "memory_id"),
    ]:
        dataset = {"name": name, "description": (
            f"Frozen Harbor {key}: {len(cases)} cases, {len(memories)} memories. "
            + ("Evaluation cases with original dev/test split and scoring references."
               if kind == "case" else "Auxiliary corpus; do not execute these records as test cases.")),
                   "metadata": metadata}
        items = {}
        for row in rows:
            identifier = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{VERSION}:{name}:{byte_sha}:{row[id_field]}"))
            if kind == "case":
                inp = {k: v for k, v in row.items() if k in INPUT_FIELDS}
                expected = {k: v for k, v in row.items() if k in EXPECTED_FIELDS}
                item_meta = {"record_type": "case", "case_id": row["case_id"], "split": row["split"],
                             "source_record_sha256": digest(row),
                             "original_fields": {k: v for k, v in row.items()
                                                 if k not in INPUT_FIELDS | EXPECTED_FIELDS}}
            else:
                inp, expected = row, None
                item_meta = {"record_type": "memory", "memory_id": row["memory_id"],
                             "source_record_sha256": digest(row)}
            items[identifier] = {"id": identifier, "datasetName": name, "input": inp,
                                 "expectedOutput": expected, "metadata": item_meta, "status": "ACTIVE"}
        specs.append({"dataset": dataset, "items": items})
    plan = {"key": key, "specs": specs, "source": source, "source_file": str(path.resolve()),
            "source_file_sha256": byte_sha, "source_canonical_sha256": canonical_sha}
    if digest(reconstruct(specs[0]["dataset"], specs[0]["items"], specs[1]["items"])) != canonical_sha:
        raise ValueError("Local conversion lost source data")
    for spec in specs:
        for value in [spec["dataset"], *spec["items"].values()]:
            if len(encoded(value)) > MAX_REQUEST_BYTES:
                raise ValueError("Payload too large; requires explicit alternative representation")
    return plan


def reconstruct(case_dataset, case_items, corpus_items):
    metadata = case_dataset["metadata"]
    cases = {}
    for row in case_items.values():
        original = row["metadata"]["original_fields"]
        parts = [original, row["input"], row["expectedOutput"]]
        if sum(map(len, parts)) != len(set().union(*(set(p) for p in parts))):
            raise ValueError("Overlapping original case fields")
        case = {k: v for p in parts for k, v in p.items()}
        cases[case["case_id"]] = case
    memories = {row["input"]["memory_id"]: row["input"] for row in corpus_items.values()}
    return {**metadata["source_header"],
            "cases": [cases[key] for key in metadata["case_order"]],
            "memories": [memories[key] for key in metadata["memory_order"]]}


def assert_item(actual, expected):
    for key in ("id", "datasetName", "input", "expectedOutput", "metadata", "status"):
        if actual.get(key) != expected.get(key):
            raise ValueError(f"Existing item differs at {key}; refusing overwrite")


def assert_dataset(actual, expected, project_id):
    if actual["projectId"] != project_id:
        raise ValueError("Dataset belongs to unexpected project")
    for key in ("name", "description", "metadata"):
        if actual.get(key) != expected[key]:
            raise ValueError(f"Existing dataset differs at {key}; refusing overwrite")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", action="append", required=True, help="key=/path/to/dataset.json")
    parser.add_argument("--prefix", default="harness-memory-ablation/harbor")
    parser.add_argument("--config", type=Path)
    parser.add_argument("--project-id")
    parser.add_argument("--output", type=Path, required=True, help="Local ignored receipt directory")
    parser.add_argument("--workers", type=int, default=4)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--apply", action="store_true")
    mode.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.workers <= 8:
        parser.error("workers must be 1..8")
    if (args.output / "receipt.json").exists():
        parser.error("Completed receipt exists; use a new output directory for this attempt")
    plans = []
    for value in args.dataset:
        key, path = value.split("=", 1)
        if not key or "/" in key:
            parser.error("dataset key must be one nonempty path segment")
        plans.append(build_plan(key, Path(path), args.prefix.rstrip("/")))
    all_specs = [s for p in plans for s in p["specs"]]
    if len({s["dataset"]["name"] for s in all_specs}) != len(all_specs):
        raise ValueError("Duplicate target dataset name")
    summary = {"adapter_version": VERSION, "complete": False, "datasets": [
        {"name": s["dataset"]["name"], "items": len(s["items"]),
         "max_request_bytes": max(map(lambda x: len(encoded(x)), [s["dataset"], *s["items"].values()]))}
        for s in all_specs]}
    args.output.mkdir(parents=True, exist_ok=True)
    os.chmod(args.output, 0o700)
    save(args.output / "plan.json", summary)
    print(json.dumps(summary), flush=True)
    if not (args.apply or args.verify_only):
        return
    if not args.config or not args.project_id:
        parser.error("apply/verify require config and project-id")
    client = Client(args.config)
    projects = client.request("GET", "/api/public/projects")["data"]
    if args.project_id not in {p["id"] for p in projects}:
        raise ValueError("Credentials do not match requested project")
    # Preflight every existing dataset and item before making any mutation.
    existing = {}
    for spec in all_specs:
        name = spec["dataset"]["name"]
        remote = client.dataset(name)
        records = {}
        if remote:
            assert_dataset(remote, spec["dataset"], args.project_id)
            records = client.items(name)
            if set(records) - set(spec["items"]):
                raise ValueError("Unexpected remote items; refusing to modify dataset")
            for identifier, row in records.items():
                assert_item(row, spec["items"][identifier])
        existing[name] = (remote, records)
    for spec in all_specs:
        name = spec["dataset"]["name"]
        remote, records = existing[name]
        if args.verify_only:
            if remote is None or set(records) != set(spec["items"]):
                raise ValueError("Verification found missing dataset/items")
            continue
        if remote is None:
            remote = client.request("POST", "/api/public/v2/datasets", spec["dataset"])
            assert_dataset(remote, spec["dataset"], args.project_id)
        pending = [item for identifier, item in spec["items"].items() if identifier not in records]
        completed = 0
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(client.request, "POST", "/api/public/dataset-items", item): item
                       for item in pending}
            for future in as_completed(futures):
                assert_item(future.result(), futures[future])
                completed += 1
                if completed % 25 == 0 or completed == len(pending):
                    print(json.dumps({"name": name, "created": completed, "pending_total": len(pending)}), flush=True)
        print(json.dumps({"name": name, "previously_present": len(records), "uploaded": completed}), flush=True)
    receipts = []
    for plan in plans:
        remotes, item_sets = [], []
        for spec in plan["specs"]:
            name = spec["dataset"]["name"]
            remote = client.dataset(name)
            assert_dataset(remote, spec["dataset"], args.project_id)
            rows = client.items(name)
            if set(rows) != set(spec["items"]):
                raise ValueError("Remote item IDs/counts differ")
            for identifier, row in rows.items():
                assert_item(row, spec["items"][identifier])
            remotes.append(remote)
            item_sets.append(rows)
        restored = reconstruct(remotes[0], item_sets[0], item_sets[1])
        if digest(restored) != plan["source_canonical_sha256"]:
            raise ValueError("Remote roundtrip differs from complete source dataset")
        receipts.append({"key": plan["key"], "source_file": plan["source_file"],
                         "source_file_sha256": plan["source_file_sha256"],
                         "source_canonical_sha256": plan["source_canonical_sha256"],
                         "remote_roundtrip_sha256": digest(restored),
                         "case_count": len(restored["cases"]), "memory_count": len(restored["memories"]),
                         "splits": dict(Counter(c["split"] for c in restored["cases"])),
                         "datasets": [{"id": r["id"], "name": r["name"],
                                       "url": f"{client.host}/project/{args.project_id}/datasets/{r['id']}/items"}
                                      for r in remotes]})
    receipt = {"complete": True, "verified_at": datetime.now(timezone.utc).isoformat(),
               "adapter_version": VERSION, "project_id": args.project_id, "datasets": receipts}
    save(args.output / "receipt.json", receipt)
    print(json.dumps(receipt, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
