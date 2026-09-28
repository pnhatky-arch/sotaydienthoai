#!/usr/bin/env python3
"""Extract the fixed-grid phone directory PDF into JSON.

The source deck has two administrative units per page and four contacts per unit.
Coordinates are intentionally based on the visible table grid, which avoids the
line-wrap ambiguity of plain-text extraction.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber


X = [77.1, 129.8, 277.1, 464.8, 668.6, 794.7, 936.5]
Y = [85.6, 127.1, 168.6, 210.1, 251.6, 297.7, 339.2, 380.7, 422.2, 468.4]


def clean(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def correct_source_typo(value: str) -> str:
    """Apply confirmed administrative-name corrections from authoritative sources."""
    return {"Huyện Bàu Bàn": "Huyện Bàu Bàng"}.get(value, value)


def cell(page, x0: float, top: float, x1: float, bottom: float) -> str:
    # Pull inward slightly so grid strokes and neighbouring glyphs are excluded.
    return clean(page.crop((x0 + 1, top + 1, x1 - 1, bottom - 1)).extract_text())


def normalize_phone(raw: str) -> tuple[str, list[str]]:
    numbers = []
    for candidate in re.split(r"\s*/\s*|\s*;\s*", raw):
        digits = re.sub(r"\D", "", candidate)
        if digits:
            numbers.append(digits)
    display = " / ".join(numbers)
    return display, numbers


def extract(source: Path) -> list[dict]:
    units: list[dict] = []
    with pdfplumber.open(source) as pdf:
        for page_number, page in enumerate(pdf.pages[1:85], start=2):
            for group_index, (top, bottom, row_edges) in enumerate(
                [
                    (Y[1], Y[5], Y[1:6]),
                    (Y[5], Y[9], Y[5:10]),
                ]
            ):
                stt = cell(page, X[0], top, X[1], bottom)
                unit_name = cell(page, X[1], top, X[2], bottom)
                former = correct_source_typo(cell(page, X[5], top, X[6], bottom))
                contacts = []
                for row in range(4):
                    row_top, row_bottom = row_edges[row], row_edges[row + 1]
                    name = cell(page, X[2], row_top, X[3], row_bottom)
                    role = cell(page, X[3], row_top, X[4], row_bottom)
                    phone_raw = cell(page, X[4], row_top, X[5], row_bottom)
                    phone, phone_numbers = normalize_phone(phone_raw)
                    contacts.append(
                        {
                            "name": name,
                            "role": role,
                            "phone": phone,
                            "phoneNumbers": phone_numbers,
                        }
                    )
                units.append(
                    {
                        "id": int(re.sub(r"\D", "", stt)),
                        "unit": unit_name,
                        "formerUnit": former,
                        "contacts": contacts,
                        "sourcePage": page_number,
                    }
                )
    return units


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract_phonebook.py SOURCE.pdf OUTPUT.json")
    source, output = map(Path, sys.argv[1:])
    units = extract(source)
    assert len(units) == 168, len(units)
    assert [u["id"] for u in units] == list(range(1, 169))
    assert all(len(u["contacts"]) == 4 for u in units)
    incomplete = [
        (u["id"], index + 1, c)
        for u in units
        for index, c in enumerate(u["contacts"])
        if not c["role"]
    ]
    assert not incomplete, incomplete[:10]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(units)} units and {sum(len(u['contacts']) for u in units)} contacts")


if __name__ == "__main__":
    main()
