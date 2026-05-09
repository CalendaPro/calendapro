"""Replace every `console.<level>` call in app/, lib/, components/ by `logger.<level>`.

Behavior:
  - Maps console.log -> logger.info, console.info -> logger.info,
    console.warn -> logger.warn, console.error -> logger.error,
    console.debug -> logger.debug.
  - Skips lines that contain the trailing comment ``// dev`` (escape hatch
    used to keep deliberate dev-only prints).
  - Skips files inside node_modules / .next.
  - Inserts ``import { logger } from '@/lib/logger'`` once per modified file,
    using a relative path for files inside lib/ to avoid alias loops.
  - Leaves the lib/logger.ts file itself untouched (the only place that may
    legitimately call console.*).
"""
from __future__ import annotations

import os
import re

ROOTS = ["app", "lib", "components"]
LOGGER_FILE = os.path.normpath("lib/logger.ts")
LOGGER_SOURCE_DIRS = {"lib"}  # files in lib use relative import

LEVEL_MAP = {
    "log": "info",
    "info": "info",
    "warn": "warn",
    "error": "error",
    "debug": "debug",
}

console_re = re.compile(r"\bconsole\.(log|info|warn|error|debug)\b")
import_re = re.compile(
    r"^import\s+\{[^}]*\blogger\b[^}]*\}\s+from\s+['\"][^'\"]+['\"]",
    re.MULTILINE,
)


def relative_logger_import(path: str) -> str:
    """Compute a relative import path from ``path`` to lib/logger."""
    rel_dir = os.path.dirname(path)
    target = os.path.normpath("lib/logger")
    rel = os.path.relpath(target, rel_dir).replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    return rel


def transform_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()

    # Skip if no console calls at all.
    if not console_re.search(src):
        return 0

    lines = src.split("\n")
    replacements = 0
    changed = False
    for i, line in enumerate(lines):
        if "// dev" in line:
            continue
        if not console_re.search(line):
            continue

        def sub(m: re.Match) -> str:
            nonlocal replacements
            replacements += 1
            return f"logger.{LEVEL_MAP[m.group(1)]}"

        new_line = console_re.sub(sub, line)
        if new_line != line:
            lines[i] = new_line
            changed = True

    if not changed:
        return 0

    new_src = "\n".join(lines)

    # Add logger import if missing.
    if not import_re.search(new_src):
        norm = os.path.normpath(path)
        first_segment = norm.split(os.sep)[0]
        if first_segment in LOGGER_SOURCE_DIRS:
            import_path = relative_logger_import(norm)
        else:
            import_path = "@/lib/logger"
        import_line = f"import {{ logger }} from '{import_path}'"

        # Insert after the last existing import (or after a leading 'use *' directive).
        out_lines = new_src.split("\n")
        last_import_idx = -1
        in_block_comment = False
        i = 0
        while i < len(out_lines):
            line = out_lines[i]
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
            if stripped.startswith("import ") or stripped.startswith("import{"):
                # Multi-line imports: scan to the line that closes the statement.
                while i < len(out_lines) and not (
                    out_lines[i].rstrip().endswith(";")
                    or out_lines[i].rstrip().endswith("'")
                    or out_lines[i].rstrip().endswith('"')
                ):
                    i += 1
                last_import_idx = i
                i += 1
                continue
            if (
                stripped == ""
                or stripped.startswith("//")
                or stripped.startswith("'use ")
                or stripped.startswith('"use ')
            ):
                i += 1
                continue
            break

        insert_at = last_import_idx + 1 if last_import_idx >= 0 else 0
        out_lines = (
            out_lines[:insert_at] + [import_line] + out_lines[insert_at:]
        )
        new_src = "\n".join(out_lines)

    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(new_src)
    return replacements


total_files = 0
total_replacements = 0
for root in ROOTS:
    for dirpath, _, files in os.walk(root):
        if "node_modules" in dirpath or ".next" in dirpath:
            continue
        for f in files:
            if not (f.endswith(".ts") or f.endswith(".tsx")):
                continue
            full = os.path.join(dirpath, f)
            if os.path.normpath(full) == LOGGER_FILE:
                continue
            n = transform_file(full)
            if n:
                total_files += 1
                total_replacements += n

print(f"Replaced {total_replacements} console.* calls across {total_files} files")
