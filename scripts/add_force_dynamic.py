"""Add `export const dynamic = 'force-dynamic'` to every API route that lacks it.

Idempotent: routes that already declare `export const dynamic` are skipped.
"""
import os

ROOT = os.path.join("app", "api")

routes = []
for dirpath, _, files in os.walk(ROOT):
    for f in files:
        if f == "route.ts":
            routes.append(os.path.join(dirpath, f))

modified = 0
for path in routes:
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()
    if "export const dynamic" in src:
        continue

    lines = src.split("\n")
    last_import_idx = -1
    in_block_comment = False
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if in_block_comment:
            if "*/" in stripped:
                in_block_comment = False
            i += 1
            continue
        if stripped.startswith("/*") and "*/" not in stripped:
            in_block_comment = True
            i += 1
            continue
        if (
            stripped.startswith("import ")
            or stripped.startswith("import{")
        ):
            # An import may span multiple lines until a `;` or closing `}`
            # Track the end of the import statement.
            while i < len(lines) and not (
                lines[i].rstrip().endswith(";")
                or lines[i].rstrip().endswith("'")
                or lines[i].rstrip().endswith('"')
            ):
                i += 1
            last_import_idx = i
            i += 1
            continue
        if (
            stripped == ""
            or stripped.startswith("//")
            or stripped.startswith("/*")
            or stripped.startswith("*")
            or stripped.startswith("'use ")
            or stripped.startswith('"use ')
        ):
            i += 1
            continue
        # First real top-level statement: stop here.
        break

    insert_at = last_import_idx + 1 if last_import_idx >= 0 else 0
    new_lines = (
        lines[:insert_at]
        + ["", "export const dynamic = 'force-dynamic'"]
        + lines[insert_at:]
    )
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(new_lines))
    modified += 1

print(f"Modified {modified} route files (out of {len(routes)})")
