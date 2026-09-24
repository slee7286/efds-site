#!/usr/bin/env python3
"""Publish only reviewed, public-source company research from efds-recruiting.

The output schema deliberately excludes applicant records, reviewer notes, model
usage, raw source bodies and any personal archive content.
"""

import json
import re
from pathlib import Path
from urllib.parse import urlparse


SITE = Path(__file__).resolve().parents[1]
RESEARCH = SITE.parent / "efds-recruiting" / "exports" / "company-research-2026-09-24"
OUTPUT = SITE / "data" / "company-research.json"
TOPICS = {"business", "teams", "differentiators", "work", "direction", "risks", "recruiting"}
PRIVATE_PATTERN = re.compile(r"(?:siheon|lee25@|@(?:ic|imperial)\.ac\.uk)", re.I)
PERSONAL_TRACKING_PATTERN = re.compile(r"\btrackr\b", re.I)


def public_text(value: str) -> str:
    if PRIVATE_PATTERN.search(value):
        raise ValueError("Personal or university email data found in publication input")
    return value.strip()


def public_url(value: str) -> str:
    url = urlparse(value)
    if url.scheme not in {"https", "http"} or not url.netloc:
        raise ValueError(f"Non-public URL in publication input: {value}")
    return value


def main() -> None:
    companies = []
    for path in sorted((RESEARCH / "briefs").glob("*.json")):
        brief = json.loads(path.read_text())
        if brief.get("review_status") != "reviewed":
            continue
        source_path = RESEARCH / "companies" / brief["company_id"] / "sources.json"
        sources = {item["source_id"]: item for item in json.loads(source_path.read_text())}
        findings = []
        for finding in brief["findings"]:
            # The recruiting archive also contains links from a personal job
            # tracker. Keep that context out of the society publication.
            if PERSONAL_TRACKING_PATTERN.search(json.dumps(finding)):
                continue
            if finding["topic"] not in TOPICS:
                raise ValueError(f"Unexpected topic: {finding['topic']}")
            citations = []
            for citation in finding["citations"]:
                source = sources[citation["source_id"]]
                citations.append({
                    "title": public_text(source["title"]),
                    "publisher": public_text(source["publisher"]),
                    "url": public_url(source["canonical_url"]),
                    "retrievedAt": source["retrieved_at"][:10],
                })
            published_finding = {
                "id": finding["finding_id"],
                "topic": finding["topic"],
                "statement": public_text(finding["statement"]),
                "scope": public_text(finding["scope"]),
                "eventDate": finding.get("event_date"),
                "citations": citations,
            }
            if PERSONAL_TRACKING_PATTERN.search(json.dumps(published_finding)):
                continue
            findings.append(published_finding)
        companies.append({
            "id": brief["company_id"],
            "name": public_text(brief["entity"]),
            "reviewedAt": brief["reviewed_at"][:10],
            "findings": findings,
            "roles": [{"title": public_text(role["title"]), "office": public_text(role.get("office") or "Office not specified"), "findingIds": role["finding_ids"]} for role in brief.get("role_briefs", []) if not PERSONAL_TRACKING_PATTERN.search(role["title"])],
            "gaps": [{"topic": gap["topic"], "description": public_text(gap["description"])} for gap in brief.get("evidence_gaps", []) if not PERSONAL_TRACKING_PATTERN.search(gap["description"])],
            "openQuestions": [public_text(question) for question in brief.get("open_questions", []) if not PERSONAL_TRACKING_PATTERN.search(question)],
        })
    companies.sort(key=lambda company: company["name"].lower())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"asOf": "2026-09-24", "companies": companies}, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Published {len(companies)} reviewed companies and {sum(len(item['findings']) for item in companies)} findings to {OUTPUT}")


if __name__ == "__main__":
    main()
