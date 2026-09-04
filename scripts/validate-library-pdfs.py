"""Read-only checks for the repaired Library PDFs; requires pdfplumber/reportlab.

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
assert len(calls) == 38, "Expected all 38 completed teaching tables"
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
print(json.dumps({"worked_tables": len(calls), "populated_cells": cells, "pdfs": results}, indent=2))
