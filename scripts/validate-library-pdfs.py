"""Read-only checks for repaired and newly supplied Library PDFs.

Run after generation with --directory output/pdf, or against integrated assets
(the default). This complements, rather than replaces, rendered page review.
"""
import argparse
import ast
import json
from pathlib import Path
import re
import sys
import types

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/generate-roadmap-learning-pdfs.py"
tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
calls = [node for node in ast.walk(tree) if isinstance(node, ast.Call)
         and isinstance(node.func, ast.Name) and node.func.id == "worked_example_table"]
assert len(calls) == 48, "Expected all 48 completed teaching tables"
cells = 0
for call in calls:
    headers, rows, widths = [ast.literal_eval(arg) for arg in call.args]
    assert all(str(header).strip() for header in headers)
    assert len(widths) == len(headers) and 0 < sum(widths) <= 493.28
    assert rows and all(len(row) == len(headers) for row in rows)
    for row in rows:
        for cell in row:
            assert isinstance(cell, str) and cell.strip(), (call.lineno, cell)
            assert not re.fullmatch(r"[_ .-]+|\[(?:your |insert |fill |answer)[^\]]*\]", cell, re.I)
            cells += 1

module = types.ModuleType("ir_pdf_quality_check")
module.__file__ = str(SOURCE)
sys.modules[module.__name__] = module
exec(compile(tree, str(SOURCE), "exec"), module.__dict__)
for rows in ([], [["complete", ""]], [["complete", "   "]], [["misaligned"]]):
    try:
        module.worked_example_table(["A", "B"], rows, [240, 253])
    except ValueError:
        pass
    else:
        raise AssertionError(f"Empty-cell guard accepted {rows!r}")

parser = argparse.ArgumentParser()
parser.add_argument("--directory", default="public/pdf-guides")
args = parser.parse_args()
directory = ROOT / args.directory
results = []
for spec in module.SPECS:
    if spec.revision != "1.1":
        continue
    path = directory / spec.filename
    assert path.read_bytes().startswith(b"%PDF-")
    with pdfplumber.open(path) as pdf:
        texts = [page.extract_text() or "" for page in pdf.pages]
        assert all(len(text.strip()) >= 350 for text in texts), f"Sparse page: {path.name}"
        assert len(set(texts)) == len(texts), f"Duplicate page: {path.name}"
        for page in pdf.pages:
            assert all(0 <= c["x0"] <= c["x1"] <= page.width + 0.5
                       and 0 <= c["top"] <= c["bottom"] <= page.height + 0.5
                       for c in page.chars), f"Out-of-bounds text: {path.name}"
        if spec.filename == "behavioral_question-bank.pdf":
            markdown = (ROOT / "scripts/learning-materials/behavioral-question-bank.md").read_text(encoding="utf-8")
            questions = re.findall(r"^### (\d+)\. (.+)$", markdown, re.M)
            assert [int(n) for n, _ in questions] == list(range(1, 51))
            assert len({q.strip().casefold() for _, q in questions}) == 50
            normalize = lambda text: re.sub(r"\s+", " ", text).strip()
            full_text = normalize(" ".join(texts))
            assert all(full_text.count(normalize(f"{n}. {q}")) == 1 for n, q in questions)
            assert full_text.count("Evidence to prepare:") == full_text.count("Probe:") == 50
            assert "HUMAN REVIEW REQUIRED" in full_text
            card_page = next(text for text in texts if "A completed evidence card" in text)
            assert "Use this structure in your own notes." in card_page
        else:
            assert "FICTIONAL WORKED EXAMPLE" in " ".join(texts)
        results.append({"filename": path.name, "pages": len(pdf.pages)})
assert len(results) == 8

coach_requirements = {
    "coaching_architecture-narrative-worksheet.pdf": {
        "minimum_pages": 7,
        "phrases": [
            "Architecture Narrative Worksheet",
            "decision spine",
            "Show influence without inflating authority",
            "0-2 evidence rubric",
        ],
    },
    "coaching_target-company-preparation-guide.pdf": {
        "minimum_pages": 7,
        "phrases": [
            "Target-Company Preparation Guide",
            "Build the evidence ledger",
            "Rank only three open risks",
            "Northstar Ledger",
        ],
    },
    "coaching_interview-day-run-sheet.pdf": {
        "minimum_pages": 1,
        "maximum_pages": 1,
        "phrases": [
            "Interview-Day Run Sheet",
            "Three-minute between-round reset",
            "Recovery language",
            "Privacy and ethics",
        ],
    },
}
coach_results = []
for spec in module.SPECS:
    requirement = coach_requirements.get(spec.filename)
    if not requirement:
        continue
    path = directory / spec.filename
    assert path.read_bytes().startswith(b"%PDF-")
    with pdfplumber.open(path) as pdf:
        texts = [page.extract_text() or "" for page in pdf.pages]
        assert len(texts) >= requirement["minimum_pages"], f"Too few pages: {path.name}"
        if "maximum_pages" in requirement:
            assert len(texts) <= requirement["maximum_pages"], f"Too many pages: {path.name}"
        minimum_text = 1_100 if len(texts) == 1 else 240
        assert all(len(text.strip()) >= minimum_text for text in texts), f"Sparse page: {path.name}"
        assert len(set(texts)) == len(texts), f"Duplicate page: {path.name}"
        full_text = " ".join(texts)
        normalized_text = re.sub(r"\s+", " ", full_text).casefold()
        assert "human calibration" in normalized_text, f"Wrong edition: {path.name}"
        assert not re.search(r"\b(?:TODO|TBD|LOREM IPSUM)\b|Source material not supplied yet|_{4,}", full_text, re.I), path.name
        assert all(re.sub(r"\s+", " ", phrase).casefold() in normalized_text for phrase in requirement["phrases"]), path.name
        if len(texts) > 1:
            assert "FICTIONAL WORKED EXAMPLE" in full_text, path.name
        for page in pdf.pages:
            assert all(0 <= c["x0"] <= c["x1"] <= page.width + 0.5
                       and 0 <= c["top"] <= c["bottom"] <= page.height + 0.5
                       for c in page.chars), f"Out-of-bounds text: {path.name}"
        coach_results.append({"filename": path.name, "pages": len(pdf.pages)})
assert len(coach_results) == len(coach_requirements)
print(json.dumps({
    "worked_tables": len(calls),
    "populated_cells": cells,
    "repaired_pdfs": results,
    "human_calibration_pdfs": coach_results,
}, indent=2))
