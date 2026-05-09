"""Strip all emoji characters from .ts/.tsx files in app/, lib/, components/.

Ranges targeted (matching the user's audit grep):
  U+1F300..U+1F9FF  (Miscellaneous Symbols and Pictographs, Emoticons, etc.)
  U+2600..U+26FF    (Miscellaneous Symbols)
  U+2700..U+27BF    (Dingbats)
  U+FE00..U+FEFF    (Variation Selectors, BOM)

Also strips:
  U+200B  (zero-width space — often left behind after emoji removal)
  U+200D  (zero-width joiner — used in emoji sequences)
  U+20E3  (combining enclosing keycap)
  U+FE0F  (variation selector-16, makes preceding char emoji-style)

After stripping, cleans up double-spaces left behind and trims trailing
whitespace on affected lines.
"""
from __future__ import annotations

import os
import re

ROOTS = ["app", "lib", "components"]

# Build a character class covering all target ranges
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"  # Misc Symbols & Pictographs, Emoticons, etc.
    "\u2600-\u26FF"          # Misc Symbols
    "\u2700-\u27BF"          # Dingbats
    "\uFE00-\uFEFF"          # Variation Selectors + BOM
    "\u200B\u200D"           # Zero-width space/joiner
    "\u20E3"                 # Combining enclosing keycap
    "]+"
)


def strip_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as fh:
        src = fh.read()

    if not EMOJI_RE.search(src):
        return 0

    lines = src.split("\n")
    count = 0
    for i, line in enumerate(lines):
        new_line = EMOJI_RE.sub("", line)
        if new_line != line:
            # Collapse double+ spaces (left behind) to single space
            new_line = re.sub(r"  +", " ", new_line)
            # Strip trailing whitespace
            new_line = new_line.rstrip()
            lines[i] = new_line
            count += 1

    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines))
    return count


total_files = 0
total_lines = 0
for root in ROOTS:
    for dirpath, _, files in os.walk(root):
        if "node_modules" in dirpath or ".next" in dirpath:
            continue
        for f in files:
            if not (f.endswith(".ts") or f.endswith(".tsx")):
                continue
            full = os.path.join(dirpath, f)
            n = strip_file(full)
            if n:
                total_files += 1
                total_lines += n
                print(f"  {full}: {n} lines cleaned")

print(f"\nTotal: {total_lines} lines cleaned across {total_files} files")
