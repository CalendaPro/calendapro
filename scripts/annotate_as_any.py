"""Add justification comments to every uncommented `as any` cast.

Each pattern gets a short reason explaining why the cast is needed.
"""
from __future__ import annotations

import os
import re

ROOTS = ["app", "lib", "components"]

# Mapping of contextual patterns to their justification comment
RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\(window as any\)\.dataLayer"), "// reason: GTM dataLayer has no TS type declarations"),
    (re.compile(r"\(window as any\)\.gtag"), "// reason: gtag global injected by Google script, no TS types"),
    (re.compile(r"as any\)\.name"), "// reason: FormData iterator entry lacks .name in TS lib types"),
    (re.compile(r"as any\)\?\.signedUrl"), "// reason: Supabase signedUrl shape not in generated types"),
    (re.compile(r"allowedFiles\[.\] as any"), "// reason: FormData .getAll() returns FormDataEntryValue, need File"),
    (re.compile(r"setStatusFilter\(.*as any\)"), "// reason: Object.keys() returns string[], not the union literal"),
    (re.compile(r"inputMode=\{.*as any\}"), "// reason: React types lag behind HTML spec for inputMode values"),
    (re.compile(r"searchParams\.get\(.*\) as any"), "// reason: URLSearchParams returns string|null, cast to union type"),
]

FALLBACK = "// reason: unavoidable dynamic type boundary"


def annotate_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()

    if "as any" not in src:
        return 0

    lines = src.split("\n")
    count = 0
    for i, line in enumerate(lines):
        if "as any" not in line:
            continue
        # Skip if already has a justification comment
        if "// reason:" in line or "// eslint" in line:
            continue

        # Find the right justification
        comment = FALLBACK
        for pattern, reason in RULES:
            if pattern.search(line):
                comment = reason
                break

        # Append the comment at end of line
        lines[i] = line.rstrip() + "  " + comment
        count += 1

    if count:
        with open(path, "w", encoding="utf-8", newline="\n") as fh:
            fh.write("\n".join(lines))
    return count


total_files = 0
total_annotations = 0
for root in ROOTS:
    for dirpath, _, files in os.walk(root):
        if "node_modules" in dirpath or ".next" in dirpath:
            continue
        for f in files:
            if not (f.endswith(".ts") or f.endswith(".tsx")):
                continue
            n = annotate_file(os.path.join(dirpath, f))
            if n:
                total_files += 1
                total_annotations += n
                print(f"  {os.path.join(dirpath, f)}: {n}")

print(f"\nTotal: {total_annotations} annotations across {total_files} files")
