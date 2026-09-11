from __future__ import annotations

import argparse
import html
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Sequence

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


PAGE_W, PAGE_H = A4
MARGIN = 51
CONTENT_W = PAGE_W - (2 * MARGIN)

NAVY = colors.HexColor("#07111B")
NAVY_2 = colors.HexColor("#0D1926")
TEAL = colors.HexColor("#142B38")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#596775")
MUTED_LIGHT = colors.HexColor("#D1DCE2")
ORANGE = colors.HexColor("#FF6B2C")
ORANGE_SOFT = colors.HexColor("#FFF1EA")
PALE = colors.HexColor("#F7F9FC")
PALE_ALT = colors.HexColor("#F4F7FA")
LINE = colors.HexColor("#D9E0E8")
LINE_DARK = colors.HexColor("#AFC0D4")
WHITE = colors.white


BASE_STYLES = getSampleStyleSheet()


def style(
    name: str,
    parent: str = "BodyText",
    *,
    font: str = "Helvetica",
    size: float = 9.2,
    leading: float = 13.2,
    color=INK,
    before: float = 0,
    after: float = 0,
    keep: bool = False,
) -> ParagraphStyle:
    return ParagraphStyle(
        name,
        parent=BASE_STYLES[parent],
        fontName=font,
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceBefore=before,
        spaceAfter=after,
        keepWithNext=keep,
        allowWidows=0,
        allowOrphans=0,
    )


BODY = style("IRBody")
BODY_SMALL = style("IRBodySmall", size=8.2, leading=11.6, color=MUTED)
BODY_TIGHT = style("IRBodyTight", size=8.1, leading=10.8)
PAGE_KICKER = style("IRKicker", font="Helvetica-Bold", size=7.6, leading=9.2, color=ORANGE, after=5, keep=True)
PAGE_TITLE = style("IRPageTitle", font="Helvetica-Bold", size=18, leading=21, color=NAVY_2, after=7, keep=True)
PAGE_DEK = style("IRPageDek", size=9.4, leading=13.4, color=MUTED, after=13)
H2 = style("IRH2", font="Helvetica-Bold", size=12.8, leading=15, color=NAVY_2, before=8, after=6, keep=True)
H3 = style("IRH3", font="Helvetica-Bold", size=9.8, leading=12, color=TEAL, after=4, keep=True)
LABEL = style("IRLabel", font="Courier-Bold", size=6.8, leading=8.4, color=ORANGE, after=3, keep=True)
MONO = style("IRMono", font="Courier", size=7.2, leading=10, color=MUTED)
CODE = style("IRCode", font="Courier", size=7.25, leading=9.8, color=WHITE)
WHITE_HEAD = style("IRWhiteHead", font="Helvetica-Bold", size=7.5, leading=9, color=WHITE)
TABLE_TEXT = style("IRTableText", size=7.45, leading=9.6, color=INK)
TABLE_MUTED = style("IRTableMuted", size=7.2, leading=9.2, color=MUTED)
CALLOUT_LABEL = style("IRCalloutLabel", font="Helvetica-Bold", size=8.2, leading=10, color=ORANGE, after=2)
CALLOUT_TEXT = style("IRCalloutText", font="Helvetica-Bold", size=9.1, leading=12.3, color=INK)
QUOTE = style("IRQuote", font="Helvetica-Bold", size=10.2, leading=14, color=TEAL)


@dataclass(frozen=True)
class PdfSpec:
    filename: str
    category: str
    title: str
    subtitle: str
    thesis: str
    slug: str
    build_story: Callable[[], list[Flowable]]
    revision: str = "1.0"
    compact: bool = False
    review_required: bool = False
    edition: str = "VAULT"
    audience: str = "LEARNER EDITION"
    format_label: str | None = None
    single_page: bool = False


class CheckboxMark(Flowable):
    """Small outlined checkbox that stays visible in print and PDF viewers."""

    def __init__(self) -> None:
        super().__init__()
        self.width = 9
        self.height = 11

    def draw(self) -> None:
        self.canv.saveState()
        self.canv.setStrokeColor(LINE_DARK)
        self.canv.setLineWidth(0.85)
        self.canv.rect(1, 2.5, 6.5, 6.5, stroke=1, fill=0)
        self.canv.restoreState()


class NetworkDiagram(Flowable):
    """Compact vector graph used for traversal prompts and worked traces."""

    def __init__(
        self,
        nodes: dict[str, tuple[float, float]],
        edges: Sequence[tuple[str, str]],
        *,
        label: str,
        directed: bool = False,
        highlighted_edges: Sequence[tuple[str, str]] = (),
        highlighted_nodes: Sequence[str] = (),
        height: float = 150,
    ) -> None:
        super().__init__()
        self.nodes = nodes
        self.edges = list(edges)
        self.label = label
        self.directed = directed
        self.highlighted_edges = set(highlighted_edges)
        self.highlighted_nodes = set(highlighted_nodes)
        self.width = CONTENT_W
        self.height = height

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        self.width = min(avail_width, CONTENT_W)
        return self.width, self.height

    def draw(self) -> None:
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(PALE)
        canvas.setStrokeColor(LINE_DARK)
        canvas.setLineWidth(0.7)
        canvas.roundRect(0, 0, self.width, self.height, 5, stroke=1, fill=1)
        canvas.setFillColor(ORANGE)
        canvas.setFont("Courier-Bold", 6.8)
        canvas.drawString(12, self.height - 17, self.label.upper())

        left = 32
        bottom = 23
        usable_w = self.width - 64
        usable_h = self.height - 54
        radius = 11

        def point(name: str) -> tuple[float, float]:
            px, py = self.nodes[name]
            return left + px * usable_w, bottom + py * usable_h

        for start, end in self.edges:
            x1, y1 = point(start)
            x2, y2 = point(end)
            dx = x2 - x1
            dy = y2 - y1
            length = max((dx * dx + dy * dy) ** 0.5, 1)
            ux = dx / length
            uy = dy / length
            sx = x1 + ux * radius
            sy = y1 + uy * radius
            tx = x2 - ux * radius
            ty = y2 - uy * radius
            highlighted = (start, end) in self.highlighted_edges or (
                not self.directed and (end, start) in self.highlighted_edges
            )
            canvas.setStrokeColor(ORANGE if highlighted else LINE_DARK)
            canvas.setFillColor(ORANGE if highlighted else LINE_DARK)
            canvas.setLineWidth(2.0 if highlighted else 1.0)
            canvas.line(sx, sy, tx, ty)
            if self.directed:
                arrow_back_x = tx - ux * 7
                arrow_back_y = ty - uy * 7
                path = canvas.beginPath()
                path.moveTo(tx, ty)
                path.lineTo(arrow_back_x - uy * 3.6, arrow_back_y + ux * 3.6)
                path.lineTo(arrow_back_x + uy * 3.6, arrow_back_y - ux * 3.6)
                path.close()
                canvas.drawPath(path, stroke=0, fill=1)

        for name in self.nodes:
            x, y = point(name)
            highlighted = name in self.highlighted_nodes
            canvas.setFillColor(ORANGE if highlighted else WHITE)
            canvas.setStrokeColor(ORANGE if highlighted else TEAL)
            canvas.setLineWidth(1.2)
            canvas.circle(x, y, radius, stroke=1, fill=1)
            canvas.setFillColor(WHITE if highlighted else NAVY_2)
            canvas.setFont("Helvetica-Bold", 7.4)
            canvas.drawCentredString(x, y - 2.6, name)
        canvas.restoreState()


class GridPathDiagram(Flowable):
    """Small grid visual for the path-reconstruction exercise."""

    def __init__(
        self,
        rows: Sequence[str],
        *,
        label: str,
        path: Sequence[tuple[int, int]] = (),
        height: float = 176,
    ) -> None:
        super().__init__()
        self.rows = list(rows)
        self.label = label
        self.path = list(path)
        self.width = CONTENT_W
        self.height = height

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        self.width = min(avail_width, CONTENT_W)
        return self.width, self.height

    def draw(self) -> None:
        canvas = self.canv
        canvas.saveState()
        canvas.setFillColor(PALE)
        canvas.setStrokeColor(LINE_DARK)
        canvas.setLineWidth(0.7)
        canvas.roundRect(0, 0, self.width, self.height, 5, stroke=1, fill=1)
        canvas.setFillColor(ORANGE)
        canvas.setFont("Courier-Bold", 6.8)
        canvas.drawString(12, self.height - 17, self.label.upper())

        row_count = len(self.rows)
        col_count = len(self.rows[0])
        cell = min(31, (self.width - 70) / col_count, (self.height - 48) / row_count)
        grid_w = col_count * cell
        grid_h = row_count * cell
        origin_x = (self.width - grid_w) / 2
        origin_y = 14 + (self.height - 40 - grid_h) / 2
        path_index = {coord: index for index, coord in enumerate(self.path)}

        for row_index, row in enumerate(self.rows):
            for col_index, value in enumerate(row):
                x = origin_x + col_index * cell
                y = origin_y + (row_count - row_index - 1) * cell
                coordinate = (row_index, col_index)
                if value == "#":
                    fill = NAVY_2
                elif coordinate in path_index:
                    fill = ORANGE_SOFT
                else:
                    fill = WHITE
                canvas.setFillColor(fill)
                canvas.setStrokeColor(ORANGE if coordinate in path_index else LINE_DARK)
                canvas.setLineWidth(1.4 if coordinate in path_index else 0.65)
                canvas.rect(x, y, cell, cell, stroke=1, fill=1)
                if value in {"S", "T"}:
                    canvas.setFillColor(ORANGE)
                    canvas.setFont("Helvetica-Bold", 8.2)
                    canvas.drawCentredString(x + cell / 2, y + cell / 2 - 2.8, value)
                elif coordinate in path_index:
                    canvas.setFillColor(NAVY_2)
                    canvas.setFont("Courier-Bold", 6.5)
                    canvas.drawCentredString(x + cell / 2, y + cell / 2 - 2.4, str(path_index[coordinate]))
        canvas.restoreState()


def p(text: str, paragraph_style: ParagraphStyle = BODY) -> Paragraph:
    return Paragraph(text, paragraph_style)


def spacer(points: float = 8) -> Spacer:
    return Spacer(1, points)


def page_heading(kicker: str, title: str, dek: str) -> list[Flowable]:
    return [p(kicker.upper(), PAGE_KICKER), p(title, PAGE_TITLE), p(dek, PAGE_DEK)]


def callout(label: str, text: str, warm: bool = False) -> Table:
    table = Table(
        [[[p(label.upper(), CALLOUT_LABEL), p(text, CALLOUT_TEXT)]]],
        colWidths=[CONTENT_W],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ORANGE_SOFT if warm else PALE),
                ("BOX", (0, 0), (-1, -1), 0.7, ORANGE),
                ("LINEBEFORE", (0, 0), (0, -1), 4, ORANGE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def bullet_list(items: Iterable[str], *, checklist: bool = False, compact: bool = False) -> Table:
    rows = []
    for item in items:
        marker: Flowable = CheckboxMark() if checklist else p("+", PAGE_KICKER)
        rows.append([marker, p(item, BODY_TIGHT if compact else BODY)])
    table = Table(rows, colWidths=[24, CONTENT_W - 24], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def card(title: str, body: str, label: str | None = None) -> list[Flowable]:
    parts: list[Flowable] = []
    if label:
        parts.append(p(label.upper(), LABEL))
    parts.extend([p(title, H3), p(body, BODY_SMALL)])
    return parts


def two_cards(
    left: tuple[str, str, str | None],
    right: tuple[str, str, str | None],
    *,
    heights: float | None = None,
) -> Table:
    data = [[card(left[0], left[1], left[2]), card(right[0], right[1], right[2])]]
    table = Table(data, colWidths=[(CONTENT_W - 18) / 2] * 2, rowHeights=[heights] if heights else None, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE_DARK),
                ("INNERGRID", (0, 0), (-1, -1), 0.7, LINE_DARK),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def grid_table(
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    widths: Sequence[float],
    *,
    font_size: float = 7.45,
    row_heights: Sequence[float] | None = None,
    cell_padding: float = 6,
) -> Table:
    head_style = WHITE_HEAD
    effective_font_size = max(font_size, 7.4)
    body_style = ParagraphStyle(
        "IRGridBody",
        parent=TABLE_TEXT,
        fontSize=effective_font_size,
        leading=effective_font_size + 2.2,
    )
    data = [[p(value, head_style) for value in headers]]
    data.extend([[p(str(value), body_style) for value in row] for row in rows])
    heights = None
    if row_heights:
        heights = [24, *row_heights]
    table = Table(data, colWidths=list(widths), rowHeights=heights, repeatRows=1, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY_2),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("LINEBELOW", (0, 0), (-1, 0), 2, ORANGE),
        ("BOX", (0, 0), (-1, -1), 0.65, LINE_DARK),
        ("INNERGRID", (0, 1), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), cell_padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), cell_padding),
    ]
    for row_index in range(1, len(data)):
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_ALT if row_index % 2 == 0 else WHITE))
    table.setStyle(TableStyle(commands))
    return table


def worked_example_table(
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    widths: Sequence[float],
) -> list[Flowable]:
    """Teach the completed reasoning; personal practice belongs in the learner's notes."""
    if not rows or any(len(row) != len(headers) for row in rows):
        raise ValueError("Worked examples must have complete, aligned rows")
    if any(not str(cell).strip() for row in rows for cell in row):
        raise ValueError("Worked examples cannot contain empty cells")
    return [
        p("FICTIONAL WORKED EXAMPLE - ADAPT THE METHOD, NOT THE FACTS", LABEL),
        grid_table(headers, rows, widths, font_size=8.0),
        Spacer(1, 8),
    ]


def code_block(lines: Sequence[str]) -> Table:
    block = Preformatted("\n".join(lines), CODE)
    table = Table([[block]], colWidths=[CONTENT_W], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY_2),
                ("BOX", (0, 0), (-1, -1), 0.8, ORANGE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def numbered_chain(items: Sequence[tuple[str, str]]) -> Table:
    width = CONTENT_W / len(items)
    cells = []
    for index, (title, detail) in enumerate(items, start=1):
        cells.append([p(f"{index:02d}", LABEL), p(title, H3), p(detail, BODY_SMALL)])
    table = Table([cells], colWidths=[width] * len(items), hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.8, ORANGE),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE_DARK),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return table


def end_page(story: list[Flowable]) -> None:
    story.append(PageBreak())


def draw_wordmark(canvas: Canvas, x: float, y: float) -> None:
    canvas.setStrokeColor(colors.HexColor("#71808D"))
    canvas.setLineWidth(0.7)
    canvas.circle(x + 10, y + 8, 9, stroke=1, fill=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(x + 5.5, y + 5.4, "//")
    canvas.setFont("Helvetica-Bold", 11.2)
    canvas.drawString(x + 31, y + 4, "INTERVIEW")
    width = stringWidth("INTERVIEW", "Helvetica-Bold", 11.2)
    canvas.setFillColor(ORANGE)
    canvas.drawString(x + 31 + width, y + 4, "RUNWAY")


def draw_cover(canvas: Canvas, doc: BaseDocTemplate, spec: PdfSpec) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    draw_wordmark(canvas, MARGIN, PAGE_H - 54)
    canvas.setFillColor(colors.HexColor("#A3B2BC"))
    canvas.setFont("Courier", 6.7)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 46, f"{spec.edition} / {spec.audience}")
    bar_y = PAGE_H - 68
    for index in range(7):
        canvas.setFillColor(TEAL)
        canvas.roundRect(MARGIN + index * 67, bar_y, 47, 16, 5, stroke=0, fill=1)
    canvas.setFillColor(ORANGE)
    canvas.rect(MARGIN, PAGE_H - 83, CONTENT_W, 1.7, stroke=0, fill=1)

    canvas.setFillColor(ORANGE)
    canvas.setFont("Helvetica-Bold", 8.3)
    canvas.drawString(MARGIN + 5, PAGE_H - 210, spec.category.upper())

    title = Paragraph(
        spec.title,
        ParagraphStyle(
            "IRCoverTitle",
            fontName="Helvetica-Bold",
            fontSize=31,
            leading=34,
            textColor=WHITE,
            spaceAfter=0,
        ),
    )
    _, title_h = title.wrap(CONTENT_W - 10, 150)
    title.drawOn(canvas, MARGIN + 5, PAGE_H - 235 - title_h)

    subtitle_y = PAGE_H - 250 - title_h
    subtitle = Paragraph(
        spec.subtitle,
        ParagraphStyle(
            "IRCoverSubtitle",
            fontName="Helvetica",
            fontSize=13,
            leading=17,
            textColor=MUTED_LIGHT,
        ),
    )
    _, subtitle_h = subtitle.wrap(CONTENT_W - 10, 85)
    subtitle.drawOn(canvas, MARGIN + 5, subtitle_y - subtitle_h)

    divider_y = subtitle_y - subtitle_h - 23
    canvas.setFillColor(ORANGE)
    canvas.roundRect(MARGIN + 4, divider_y, 119, 3, 1.5, stroke=0, fill=1)
    thesis = Paragraph(
        spec.thesis,
        ParagraphStyle(
            "IRCoverThesis",
            fontName="Helvetica",
            fontSize=10.5,
            leading=14.5,
            textColor=WHITE,
        ),
    )
    _, thesis_h = thesis.wrap(CONTENT_W - 15, 85)
    thesis.drawOn(canvas, MARGIN + 5, divider_y - 22 - thesis_h)

    metadata_y = divider_y - thesis_h - 55
    canvas.setFillColor(colors.HexColor("#A3B2BC"))
    canvas.setFont("Courier", 6.8)
    canvas.drawString(MARGIN + 5, metadata_y, f"VERSION {spec.revision}")
    canvas.drawString(
        MARGIN + 5,
        metadata_y - 16,
        spec.format_label or ("FORMAT GUIDE + WORKED EXAMPLES" if spec.compact else "FORMAT GUIDE + WORKSHEET"),
    )
    canvas.drawString(MARGIN + 5, metadata_y - 32, "STATUS HUMAN REVIEW REQUIRED" if spec.review_required else "STATUS LEARNER READY")
    canvas.drawString(MARGIN + 5, metadata_y - 72, spec.slug.upper())

    canvas.setFont("Courier", 6.5)
    canvas.setFillColor(ORANGE)
    canvas.drawString(MARGIN, 27, "HUMAN REVIEW REQUIRED" if spec.review_required else spec.audience)
    canvas.setFillColor(colors.HexColor("#A3B2BC"))
    canvas.drawRightString(PAGE_W - MARGIN, 27, "interviewrunway.com")
    canvas.restoreState()


def draw_body(canvas: Canvas, doc: BaseDocTemplate, spec: PdfSpec) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY_2)
    canvas.setFont("Helvetica-Bold", 7.2)
    canvas.drawString(MARGIN, PAGE_H - 24, f"INTERVIEWRUNWAY / {spec.edition}")
    canvas.setFillColor(colors.HexColor("#8796A3"))
    canvas.setFont("Courier", 6.1)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 24, spec.slug.upper())
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, PAGE_H - 36, PAGE_W - MARGIN, PAGE_H - 36)
    canvas.line(MARGIN, 34, PAGE_W - MARGIN, 34)
    canvas.setFillColor(ORANGE)
    canvas.setFont("Courier", 6.1)
    canvas.drawString(MARGIN, 22, "HUMAN REVIEW REQUIRED" if spec.review_required else spec.audience)
    canvas.setFillColor(colors.HexColor("#8796A3"))
    canvas.drawRightString(PAGE_W - MARGIN, 22, f"{doc.page:02d}")
    canvas.restoreState()


def build_pdf(spec: PdfSpec, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=50,
        bottomMargin=48,
        title=spec.title,
        author="InterviewRunway",
        subject=spec.subtitle,
        creator=f"InterviewRunway {spec.edition.title()} content pipeline",
        keywords=f"InterviewRunway, {spec.edition}, {spec.category}, roadmap, worksheet",
    )
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover-frame")
    body_frame_y = 36 if spec.single_page else 47
    body_frame_height = PAGE_H - 74 if spec.single_page else PAGE_H - 96
    body_frame = Frame(MARGIN, body_frame_y, CONTENT_W, body_frame_height, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="body-frame")
    if spec.single_page:
        doc.addPageTemplates([PageTemplate(id="body", frames=[body_frame], onPage=lambda c, d: draw_body(c, d, spec))])
        story: list[Flowable] = []
    else:
        doc.addPageTemplates(
            [
                PageTemplate(id="cover", frames=[cover_frame], onPage=lambda c, d: draw_cover(c, d, spec)),
                PageTemplate(id="body", frames=[body_frame], onPage=lambda c, d: draw_body(c, d, spec)),
            ]
        )
        story = [NextPageTemplate("body"), PageBreak()]
    body = spec.build_story()
    # Worked-example caption chains stay beside the first table row without
    # nesting KeepTogether containers, which can strand preceding headings.
    body = [flowable for item in body for flowable in (item if isinstance(item, list) else [item])]
    if spec.compact and not spec.single_page:
        for item in body:
            if isinstance(item, Paragraph) and item.style is PAGE_DEK:
                item.style = ParagraphStyle("IRCompactPageDek", parent=PAGE_DEK, keepWithNext=True)
        # Let related teaching sections share pages instead of reserving a
        # nearly empty page for every heading. Keep enough room to begin the
        # next section, while table headers repeat naturally on continuation.
        body = [
            replacement
            for item in body
            for replacement in ([Spacer(1, 12), CondPageBreak(160)] if isinstance(item, PageBreak) else [item])
        ]
        closing_sections = {"FINISH THE REVIEW", "FINISH BOTH TASKS", "FINISH WEEK 12"}
        for index, item in enumerate(body):
            if isinstance(item, Paragraph) and item.style is PAGE_KICKER and item.getPlainText() in closing_sections:
                body = body[:index] + [KeepTogether(body[index:])]
                break
    story.extend(body)
    if story and isinstance(story[-1], PageBreak):
        story.pop()
    doc.build(story)


def build_target_role_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Start with the decision",
        "A target role is a testable preparation boundary",
        "The target is not a dream-job label. It is a compact hypothesis about role, level, company shape, location, timing, and the evidence an interviewer will expect.",
    )
    s += [callout("Core idea", "Narrow the target enough that every study block can answer: which interview decision or evidence gap does this improve?"), spacer(11)]
    s += [numbered_chain([
        ("Boundary", "Role family, level, geography, company shape, and date."),
        ("Signals", "Repeated responsibilities and interview capabilities."),
        ("Evidence", "Projects, decisions, stories, and solved problems that prove fit."),
        ("Sequence", "The first gap to test before polishing everything else."),
    ]), spacer(12)]
    s += [p("Why this matters", H2), two_cards(
        ("Without a boundary", "Preparation expands into a generic syllabus. Progress feels busy but does not reduce uncertainty about the actual loop.", "Risk"),
        ("With a boundary", "You can compare current evidence with a visible bar, choose a first test, and ignore work that does not change the target decision.", "Outcome"),
    ), spacer(10)]
    s += [p("A good first draft", H2), bullet_list([
        "Specific enough to change what you practise this week.",
        "Flexible enough to survive uncertainty in one company's loop.",
        "Grounded in observable evidence, not title inflation or prestige language.",
        "Dated, so you know when assumptions should be checked again.",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Read the role",
        "Turn a job description into capability signals",
        "Do not copy every keyword. Cluster repeated responsibilities into capabilities, then identify what observable proof would let an interviewer assess each one.",
    )
    s += [grid_table(
        ["Signal in the role", "Capability behind it", "Evidence that can travel", "Question to test"],
        [
            ["Own services end to end", "Operational ownership", "Incident decision, reliability change, or on-call mechanism", "What failed, what did you decide, and what changed?"],
            ["Design scalable APIs", "System trade-off reasoning", "Requirements, load model, data choice, failure behavior", "Which constraint forced the design?"],
            ["Partner across teams", "Influence without authority", "Alignment decision, disagreement, or durable interface", "How did another team's plan change?"],
            ["Mentor engineers", "Leverage and judgment", "Review system, coaching decision, or improved team behavior", "What became repeatable without you?"],
            ["Move quickly in ambiguity", "Problem framing", "Unknowns reduced, reversible choice, and evidence checkpoint", "What did you deliberately postpone?"],
        ],
        [104, 106, 154, 129],
        font_size=7.05,
    ), spacer(10)]
    s += [callout("Evidence rule", "A tool name is context, not proof. The proof is the decision you made, the constraint you handled, and the outcome or changed behavior that followed."), spacer(9)]
    s += [p("Extraction checklist", H2), bullet_list([
        "Circle responsibilities that appear more than once or shape the whole role.",
        "Separate table-stakes skills from differentiators for this level.",
        "Translate local titles and product names into plain scope.",
        "Mark claims you cannot yet support with an example or artifact.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading(
        "Calibrate the level",
        "Match evidence strength to the seniority claim",
        "Level is usually visible through the size of the decision, ambiguity handled, reach of influence, and durability of the result - not years alone.",
    )
    s += [grid_table(
        ["Dimension", "Earlier-career evidence", "Senior evidence", "Staff-track evidence"],
        [
            ["Scope", "Component or bounded feature", "Service, product area, or multi-quarter system", "Portfolio or cross-team technical direction"],
            ["Ambiguity", "Clarifies assigned work", "Frames unclear requirements and trade-offs", "Defines the problem and creates decision mechanisms"],
            ["Influence", "Works effectively with nearby peers", "Aligns product, operations, and engineering partners", "Changes decisions across teams without relying on authority"],
            ["Technical depth", "Implements known patterns correctly", "Chooses architecture under realistic constraints", "Sets principles and resolves competing system-level risks"],
            ["Impact", "Completes a useful output", "Changes a measurable product or operating outcome", "Creates durable leverage that compounds across teams"],
        ],
        [82, 126, 136, 149],
        font_size=6.85,
    ), spacer(12)]
    s += [two_cards(
        ("Under-claiming", "Hiding decision size behind internal jargon, team pronouns, or a local title the interviewer cannot calibrate.", "Common miss"),
        ("Over-claiming", "Using level language that the project, ownership boundary, or follow-up evidence cannot defend.", "Common miss"),
    ), spacer(11)]
    s += [callout("Calibration test", "For each target-level claim, write the follow-up an interviewer could ask. If you cannot answer with a specific decision and consequence, lower or qualify the claim."), spacer(8)]
    s += [p("Useful language", H2), bullet_list([
        "I owned the decision about ... within a team of ...",
        "The constraint that changed our approach was ...",
        "I aligned ... by making ... explicit.",
        "The durable change was ... and we observed it through ...",
    ], compact=True)]
    end_page(s)

    s += page_heading(
        "Map the loop",
        "Connect likely stages to evidence, not predictions",
        "A loop map is a preparation tool, not a promise about exact interview questions. Record what is known, what is inferred, and what remains uncertain.",
    )
    s += [grid_table(
        ["Likely stage", "Capability assessed", "Your evidence", "Current gap", "Confidence"],
        [
            ["Recruiter screen", "Target clarity and communication", "90-second role and scope summary", "Company motivation is generic", "High"],
            ["Coding", "Problem framing and correctness", "Pattern cues, invariant, tests", "Boundary cases become silent", "Medium"],
            ["System design", "Trade-offs and operational thinking", "Notification and queue design examples", "Scale assumptions appear late", "Medium"],
            ["Behavioral", "Ownership, influence, learning", "Incident and migration stories", "Team action is clearer than personal decision", "High"],
            ["Hiring manager", "Level and role fit", "Evidence map across three requirements", "No example of cross-team leverage", "Low"],
        ],
        [88, 104, 126, 119, 56],
        font_size=6.85,
    ), spacer(11)]
    s += [p("Confidence labels", H2), two_cards(
        ("High / Medium", "High means repeated official or consistent public evidence. Medium means a plausible pattern supported by more than one current source.", "Use"),
        ("Low / Unknown", "Low is a working hypothesis. Unknown stays a question for the recruiter; it should not create a new study syllabus.", "Guardrail"),
    ), spacer(11)]
    s += [callout("Ethical boundary", "Prepare capabilities and decision patterns. Do not collect leaked questions, copy candidate answers, or present anecdotes as guaranteed stages.", warm=True)]
    end_page(s)

    s += page_heading('Worked map', 'Read a completed Target Role and Evidence Map', 'This fictional senior-backend example shows how a target changes preparation. Use its logic, not its career facts; create your own dated map in a notebook.')
    s += [worked_example_table(
        ['Target boundary', 'Example hypothesis'],
        [['Role family and level',
  'Senior backend engineer: own one service and cross-team interfaces; do not claim staff scope '
  'without cross-team strategy evidence.'],
 ['Geography / work model',
  'India-based remote role with a written three-hour overlap window; confirm employment model with the '
  'recruiter.'],
 ['Company shape / domain',
  'Product company with multi-tenant APIs and reliability ownership; exclude roles dominated by '
  'frontend implementation.'],
 ['Interview date or horizon',
  'Fictional six-week horizon: establish baseline in week 1; spend weeks 2-4 on the first evidence '
  'gap; rehearse in weeks 5-6.'],
 ['Most uncertain assumption',
  'Target-level influence bar. Ask what decisions the engineer is expected to make across teams in the '
  'first six months.']],
        [145, 348],
    ), spacer(12)]
    s += [worked_example_table(
        ['Recurring requirement', 'Example evidence', 'Confidence', 'Gap / next proof'],
        [['Own services end to end',
  'Incident timeline: chose rollback, communicated impact, and added a deployment guard after '
  'recovery.',
  'High: owned decision and artifact exist.',
  'Rehearse a two-minute story; explain why rollback beat a hotfix and which guard prevented '
  'recurrence.'],
 ['Design reliable APIs',
  'Notification design includes idempotency keys, retry limits, and delivery-state transitions.',
  'Medium: design exists, failure probe untested.',
  'Run a 35-minute rehearsal; inject a worker crash after provider acceptance and defend duplicate '
  'handling.'],
 ['Influence another team',
  'Versioned API migration adopted by two consuming teams; decision record lists compatibility '
  'trade-offs.',
  'Medium: team result is clearer than personal role.',
  "Separate my proposal, the other team's objection, the change I negotiated, and evidence of "
  'adoption.'],
 ['Communicate under constraints',
  'Timed coding solution is correct, but invariant is first stated after implementation.',
  'Low: behavior not yet repeatable.',
  'State the window invariant before the loop on two unfamiliar prompts; retain a timestamp and '
  'tests.']],
        [126, 155, 70, 142],
    )]
    end_page(s)

    s += page_heading(
        "Finish the task",
        "Choose the first preparation sequence",
        "The map is complete when it changes the order of your work and makes one evidence gap testable this week.",
    )
    s += [numbered_chain([
        ("Minutes 0-5", "Write the target boundary and date every assumption."),
        ("Minutes 5-10", "Extract three repeated capability signals."),
        ("Minutes 10-15", "Attach one defensible evidence example to each."),
        ("Minutes 15-20", "Choose the highest-risk gap and its first proof action."),
    ]), spacer(13)]
    s += [p("Common mistakes", H2), bullet_list([
        "Targeting several unrelated role families in one map.",
        "Treating years, title, or employer prestige as evidence of level.",
        "Copying job-description language without naming observable proof.",
        "Building a company-specific syllabus from one unverified anecdote.",
        "Polishing resume wording before testing the underlying evidence gap.",
    ], compact=True), spacer(8)]
    s += [p("Next: save the map, then use the Technical Baseline Scorecard to test the gap most likely to change your preparation order.", BODY_SMALL), spacer(7)]
    s += [p("Completion check", H2), bullet_list([
        "One role family and level are explicit.",
        "Three recurring requirements have evidence or a named gap.",
        "Confidence is separated from wishful certainty.",
        "One next action has a visible completion condition.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'In your notebook: write one target boundary, three repeated requirements, one truthful evidence item for each, a confidence label, and the first proof action. If evidence is missing, name the gap rather than invent a result.')]
    return s


def build_baseline_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Measure the start",
        "A baseline captures behavior, not identity",
        "Use the same conditions, observable dimensions, and evidence notes so the next attempt can show whether a specific correction worked.",
    )
    s += [callout("Core idea", "The baseline is a starting measurement, not a readiness score. Record what happened, where the explanation broke, and the earliest decision that would improve the next attempt."), spacer(11)]
    s += [numbered_chain([
        ("Prompt", "One coding prompt and one system-design prompt."),
        ("Conditions", "Fixed time, tools, recording method, and no hidden assistance."),
        ("Evidence", "Quotes, timestamps, tests, assumptions, and missed decisions."),
        ("Correction", "One behavior to front-load in the next comparable attempt."),
    ]), spacer(12)]
    s += [two_cards(
        ("Score the behavior", "Clarification, decision order, invariant or requirements, correctness, trade-offs, tests, failure handling, and explanation.", "Do"),
        ("Avoid the label", "Do not turn one attempt into 'good at coding,' 'bad at design,' or a fabricated percent-ready number.", "Do not"),
    ), spacer(10)]
    s += [p("Three-point evidence scale", H2), grid_table(
        ["Score", "Meaning", "Evidence standard"],
        [
            ["0 - Missing", "The behavior did not appear when it was needed.", "Name the moment and consequence."],
            ["1 - Inconsistent", "It appeared late, needed prompting, or was incomplete.", "Quote or timestamp the partial behavior."],
            ["2 - Reliable", "It appeared unaided, at the right moment, and changed the answer.", "Record the decision and resulting quality."],
        ],
        [80, 176, 237],
        font_size=7.3,
    )]
    end_page(s)

    s += page_heading(
        "Coding baseline",
        "Score the decisions that make a solution trustworthy",
        "Use the neutral prompt below so the attempt is reproducible. The goal is to observe the full interview sequence, not maximize difficulty.",
    )
    s += [callout(
        "Baseline prompt",
        "Given a string, return the length of its longest contiguous substring with no repeated characters. Explain your state and invariant, then test empty input, all-identical characters, and a repeat that occurs after a gap.",
        warm=True,
    ), spacer(10), worked_example_table(
        ['Dimension', 'Observed fictional attempt', 'Score + reason'],
        [['Clarification',
  'At 01:10, learner confirms substring means contiguous and returns a length; empty input returns 0.',
  '2: contract stated unaided.'],
 ['Pattern choice',
  'At 03:20, chooses a sliding window because extending right can create a repeat that shrinking left '
  'repairs.',
  '2: cue linked to method.'],
 ['State / invariant',
  'At 18:00, after a wrong trace, finally says the active window contains no repeated characters.',
  '1: correct but late.'],
 ['Correctness',
  'Changes left = last[c] + 1 to max(left, last[c] + 1) after the abba case moves left backward.',
  '1: repaired after a failing trace.'],
 ['Complexity',
  'Explains one right pass, monotonic left boundary, and a last-seen map: O(n) time and O(min(n, '
  'alphabet)) space.',
  '2: bound tied to state.'],
 ['Testing',
  'Runs empty, bbbb, and abcabcbb; misses abba until the observer asks about an old duplicate.',
  '1: key boundary prompted.'],
 ['Communication',
  'Approach is audible, but the pointer update is silent until the failed dry run.',
  '1: decision checkpoint missing.']],
        [88, 300, 95],
    ), spacer(10)]
    s += [p("Prompt setup", H2), two_cards(
        ("Recommended timing", "5 minutes clarify and choose; 20 minutes implement; 5 minutes test and explain complexity.", "30-minute run"),
        ("Evidence to save", "Prompt, approach, invariant, code or notes, first missed edge, and one exact quote where reasoning became unclear.", "Record"),
    )]
    end_page(s)

    s += page_heading(
        "System-design baseline",
        "Score the decisions that keep architecture explainable",
        "Use the neutral prompt below so the baseline tests reasoning order and trade-offs rather than trivia about a particular technology.",
    )
    s += [callout(
        "Baseline prompt",
        "Design a notification-delivery service for product events. Support in-app and email delivery, user preferences, retries without duplicate visible sends, and delivery status. Assume 10 million monthly active users and a peak of 5,000 events per second; clarify any missing product promise before designing.",
        warm=True,
    ), spacer(10), worked_example_table(
        ['Dimension', 'Observed fictional attempt', 'Score + reason'],
        [['Requirements',
  'At 02:00, separates in-app persistence from email delivery and asks what the user should see after '
  'a provider timeout.',
  '2: contract clarified first.'],
 ['Scale model',
  'At 06:00, writes 5,000 peak events/s and asks about fan-out; average recipients per event is still '
  'an estimate.',
  '2: uncertainty labeled.'],
 ['Decision order',
  'Draws queue workers at 08:00 before stating delivery semantics or replay policy.',
  '1: component precedes reason.'],
 ['Data and state',
  'Event store owns accepted work; delivery record keyed by event, recipient, channel tracks each '
  'attempt.',
  '2: state meanings visible.'],
 ['Trade-offs',
  'Chooses asynchronous delivery for latency isolation and accepts eventual delivery status.',
  '2: cost stated.'],
 ['Failure behavior',
  'Retries described only at 29:00 after a crash probe; external email duplicate prevention is still '
  'uncertain.',
  '1: incomplete boundary.'],
 ['Operations',
  'Names oldest-event age and provider-error rate, but does not define a replay check for stuck work.',
  '1: metric without recovery proof.']],
        [88, 300, 95],
    ), spacer(10)]
    s += [p("Prompt setup", H2), two_cards(
        ("Recommended timing", "5 minutes requirements; 5 scale and API; 15 architecture/data; 10 failure, trade-offs, and close.", "35-minute run"),
        ("Evidence to save", "Requirements, estimates, architecture sketch, three assumptions, first bottleneck, one rejected alternative, and the first unclear transition.", "Record"),
    )]
    end_page(s)

    s += page_heading(
        "Worked example",
        "Turn an observation into one testable correction",
        "This fictional example shows the difference between a vague weakness label and evidence that can guide the next attempt.",
    )
    s += [grid_table(
        ["Observation", "Weak interpretation", "Evidence-led interpretation", "Next correction"],
        [
            ["Chose a hash map quickly but never stated what the values represented.", "I am weak at hash maps.", "Pattern choice was timely; the state invariant stayed implicit, so duplicate handling became confused.", "Before coding, say: map stores value -> last index; query before insert."],
            ["Drew a queue before estimating peak load.", "My architecture is shallow.", "The component appeared before the load/failure requirement that justified it, making capacity and retry policy hard to defend.", "State peak arrival, service rate, and retry bound before drawing the queue."],
            ["Explained the answer after finishing rather than during decisions.", "I communicate badly.", "Decision moments were silent; the final summary was clear but too late for an interviewer to follow the reasoning.", "Use a one-sentence decision checkpoint before each major move."],
        ],
        [94, 101, 171, 127],
        font_size=6.95,
    ), spacer(12)]
    s += [callout("Correction rule", "Choose the earliest missing behavior that caused later confusion. A small front-loaded correction is easier to test than a broad promise to 'study more.'"), spacer(10)]
    s += [p("A correction is testable when", H2), bullet_list([
        "It can be observed at a specific moment in the next attempt.",
        "The prompt and rubric stay comparable.",
        "Success does not depend on knowing the exact same answer in advance.",
        "You can name what stronger evidence would look like.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading('Worked baseline record', 'Connect baseline scores to exact evidence', 'The fictional attempts below use the two prompts in this guide. Notice how the selected correction addresses a decision moment rather than labeling the learner.')
    s += [worked_example_table(
        ['Setup', 'Coding attempt', 'System-design attempt'],
        [['Prompt',
  'Longest substring with no repeated characters; return length.',
  'Notification delivery: in-app plus email, preferences, retries, and delivery status.'],
 ['Time / tools',
  '30 minutes; local editor; no solution lookup; observer only clarifies contract.',
  '35 minutes; blank canvas; calculator allowed; no architecture hints.'],
 ['Strongest observable behavior',
  '03:20: explains why a window can expand and shrink while retaining one scan.',
  '02:00: separates acceptance, persistence, and downstream delivery guarantees.'],
 ['First unclear or missing decision',
  'No explicit no-repeat invariant before code; left moves backward on abba.',
  'Queue chosen before delivery/retry promise; crash-after-send case unresolved.'],
 ['Quote / timestamp / artifact',
  '18:00: "The active window must have no repeats." Saved abba trace and failed test.',
  '29:00: "If acceptance succeeded but the response was lost, I need provider support or '
  'reconciliation."'],
 ['Consequence in the answer',
  'Late pointer repair compresses testing; sample success initially hides the bug.',
  'Failure follow-up exposes a gap between at-least-once work and visible email effects.']],
        [122, 185.5, 185.5],
    ), spacer(12)]
    s += [worked_example_table(
        ['Selected first correction (one total)', 'Where it must appear', 'Evidence of success'],
        [['Before choosing mechanics, state the invariant or user-visible delivery guarantee and one event '
  'that could break it.',
  'After contract clarification, before the first loop or component box.',
  'In a comparable re-test, the learner states the guarantee unaided and uses it to resolve one '
  'boundary probe without silently changing it.']],
        [205, 132, 156],
    )]
    end_page(s)

    s += page_heading(
        "Finish the task",
        "Choose one correction and schedule the re-test",
        "The baseline is complete when the next attempt has a defined behavior to test - not when every dimension receives a high score.",
    )
    s += [numbered_chain([
        ("Run", "Use fixed conditions and save the artifacts."),
        ("Observe", "Score dimensions and quote the first breakdown."),
        ("Select", "Choose one early behavior with downstream impact."),
        ("Re-test", "Use a comparable prompt within 48-72 hours."),
    ]), spacer(12)]
    s += [p("Do not compare totals blindly", H2), p("A coding 10 and a design 10 do not mean the same thing, and a two-point movement can be noise if prompt difficulty or conditions changed. Compare dimension evidence and decision moments, not a single combined number."), spacer(8)]
    s += [p("Common mistakes", H2), bullet_list([
        "Choosing a prompt so hard that no complete interview sequence appears.",
        "Changing the rubric after seeing an uncomfortable result.",
        "Scoring from memory without quotes, timestamps, tests, or artifacts.",
        "Selecting several corrections, which makes improvement impossible to attribute.",
        "Treating a baseline as a prediction of hiring outcome.",
    ], compact=True), spacer(8)]
    s += [callout("Your next action", "Write the correction as an observable sentence, choose the comparable re-test prompt now, and place it on the calendar before returning to the roadmap."), spacer(10)]
    s += [p("Completion check", H2), bullet_list([
        "Two prompts were attempted under recorded conditions.",
        "Both scorecards contain evidence, not only numbers.",
        "The earliest important breakdown is named.",
        "One correction and one re-test condition are scheduled.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'After your own two attempts: copy the setup labels, preserve one quote or timestamp per score, identify the earliest missing decision, and choose one correction before scheduling a comparable re-test.')]
    return s


def build_company_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Research with boundaries",
        "Use company context to focus preparation, not predict questions",
        "A useful interview-loop map separates public evidence, reasonable inference, and open uncertainty - then converts only the highest-value gaps into actions.",
    )
    s += [callout("Core idea", "Research should change which capabilities and evidence you rehearse. It should never become a collection of alleged leaked questions or a guarantee about the exact loop."), spacer(11)]
    s += [numbered_chain([
        ("Collect", "Use current public role, company, engineering, and candidate-pattern evidence."),
        ("Label", "Record source date, confidence, and what is fact versus inference."),
        ("Map", "Connect likely stages to capabilities and your evidence."),
        ("Prioritize", "Choose only gaps where context changes the preparation decision."),
    ]), spacer(12)]
    s += [p("Evidence hierarchy", H2), grid_table(
        ["Evidence type", "Best use", "Confidence starting point"],
        [
            ["Official role and company material", "Responsibilities, level language, products, values, and public process", "High for what it explicitly states"],
            ["Current recruiter guidance", "Confirmed stages, logistics, and evaluation focus", "High; date the conversation"],
            ["Repeated candidate reports", "Patterns worth asking about or rehearsing", "Medium when consistent and current"],
            ["Single anecdote or old post", "A question to verify, not a syllabus", "Low"],
        ],
        [132, 224, 137],
        font_size=7.25,
    )]
    end_page(s)

    s += page_heading(
        "Build the loop map",
        "Translate stages into capabilities and evidence",
        "Use a four-row map first. Add detail only when it changes an action or exposes an uncertainty worth asking the recruiter.",
    )
    s += [grid_table(
        ["Stage hypothesis", "Likely capability", "Evidence to prepare", "Uncertainty to verify"],
        [
            ["Recruiter conversation", "Role clarity, motivation, communication", "Target summary, location/work model, timeline", "Level, loop sequence, work authorization"],
            ["Coding interview", "Clarification, correctness, tests, complexity", "Two pattern explanations and a timed rehearsal", "Language/tools, number of rounds, emphasis"],
            ["System design", "Requirements, scale, data, failures, trade-offs", "One role-relevant architecture and decision chain", "Product vs infrastructure depth; seniority bar"],
            ["Behavioral / manager", "Ownership, influence, learning, role fit", "Story index mapped to recurring capabilities", "Competencies, interviewer mix, final decision owner"],
        ],
        [104, 126, 160, 103],
        font_size=7.0,
    ), spacer(12)]
    s += [two_cards(
        ("What belongs", "Capabilities, public product context, role-level evidence, logistics, current sources, and questions that reduce uncertainty.", "Include"),
        ("What stays out", "Leaked prompts, copied answers, unverifiable scoring claims, stale salary/legal assumptions, and private candidate details.", "Exclude"),
    ), spacer(10)]
    s += [callout("Map discipline", "Every row must end in either an evidence item to rehearse, a question to verify, or no action. If it creates only anxiety or trivia, remove it.")]
    end_page(s)

    s += page_heading(
        "Worked example",
        "A fictional company map that stays honest",
        "The example below uses a fictional cloud-product company. It demonstrates method, not claims about any real employer.",
    )
    s += [grid_table(
        ["Public signal", "Inference", "Confidence", "Preparation action"],
        [
            ["Role repeatedly names multi-tenant APIs and reliability ownership.", "Design and operations reasoning likely matter beyond component coding.", "Medium", "Rehearse tenant isolation, rate limits, overload, and incident ownership."],
            ["Engineering blog discusses regional failover and asynchronous processing.", "Failure and recovery follow-ups are plausible.", "Medium", "Add regional dependency failure and reconciliation to one design."],
            ["Candidate reports disagree on the number of coding rounds.", "Exact sequence is uncertain.", "Low", "Ask recruiter; do not increase total coding volume yet."],
            ["Manager profile emphasizes cross-team platform adoption.", "Influence evidence may help calibrate seniority.", "Low", "Prepare one truthful adoption story; verify level expectations."],
        ],
        [145, 155, 62, 131],
        font_size=6.95,
    ), spacer(12)]
    s += [p("How the map changes preparation", H2), bullet_list([
        "It adds one failure-recovery follow-up to an existing design rehearsal.",
        "It selects one adoption story already supported by evidence.",
        "It creates one recruiter question about loop sequence.",
        "It does not create a new technology list or memorize alleged questions.",
    ], checklist=True, compact=True), spacer(9)]
    s += [callout("Restraint is a skill", "Company context should sharpen existing preparation themes. If the map doubles your syllabus, it is probably turning uncertainty into busywork.", warm=True)]
    end_page(s)

    s += page_heading(
        "Prioritize the gaps",
        "Select three contextual gaps with visible proof actions",
        "A contextual gap matters because this company, role, or level changes the evidence bar. A general weakness belongs in the broader roadmap, not in every company map.",
    )
    s += [grid_table(
        ["Factor", "High", "Medium", "Low"],
        [
            ["Likelihood", "Repeated, current evidence across strong sources", "Plausible pattern with partial support", "Single, stale, or contradictory signal"],
            ["Interview impact", "Could block a core stage or level decision", "Would weaken a follow-up or one dimension", "Minor polish with little decision value"],
            ["Evidence deficit", "No defensible example or repeatable behavior", "Evidence exists but is unclear or untested", "Evidence is already reliable"],
            ["Correction effort", "Can be improved with one focused action", "Needs several linked sessions", "Requires broad new learning before the loop"],
        ],
        [104, 139, 139, 111],
        font_size=6.9,
    ), spacer(11)]
    s += [p("Selection rule", H2), p("Prioritize a gap when likelihood, interview impact, and evidence deficit are high enough to justify the effort. Use High / Medium / Low labels; false numerical precision does not make uncertain research more reliable."), spacer(8)]
    s += [two_cards(
        ("Proof action", "A material, rehearsal, story rewrite, recruiter question, or small artifact with a visible completion condition.", "Required"),
        ("Stop condition", "What evidence will show the gap is narrow enough that preparation should return to the main roadmap?", "Required"),
    ), spacer(9)]
    s += [callout("Three-gap limit", "Selecting more than three company-specific gaps usually hides priority. Park lower-confidence items until stronger evidence appears.")]
    end_page(s)

    s += page_heading('Worked company map', 'Build a sourced map without pretending certainty', 'Northstar Cloud and all source notes below are fictional. Replace them with real dated public or authorized evidence when you create your own notebook map.')
    s += [worked_example_table(
        ['Target company / role', 'Level', 'Prepared on', 'Interview date'],
        [['Northstar Cloud / backend engineer (fictional)',
  'Senior, still to verify',
  'Day 1 of this example',
  'Day 21 (illustrative)']],
        [170, 90, 116, 117],
    ), spacer(11)]
    s += [worked_example_table(
        ['Stage / evidence', 'Capability', 'Example evidence', 'Action / question', 'Confidence'],
        [['Recruiter screen / example role brief',
  'Role clarity and scope',
  '90-second service-ownership summary',
  'Confirm level, location model, and current round sequence.',
  'High for written facts; open for process.'],
 ['Coding / fictional recruiter note',
  'Correctness and explanation',
  'Sliding-window invariant and test set',
  'Ask permitted language and tools; rehearse one unfamiliar prompt.',
  'High for tool policy in this scenario.'],
 ['Design / role emphasizes multi-tenant APIs',
  'Isolation and failure trade-offs',
  'Notification design with per-tenant limits',
  'Test a noisy tenant and regional dependency failure.',
  'Medium: focus inferred from role.'],
 ['Behavioral / ownership language',
  'Personal judgment and learning',
  'Rollback story with decision timeline',
  'Name alternatives, escalation, measured impact, and prevention.',
  'Medium: competency plausible, not guaranteed.'],
 ['Manager / cross-team adoption signal',
  'Influence beyond service boundary',
  'Versioned API migration and objections resolved',
  'Ask how senior scope is calibrated across teams.',
  'Low: manager emphasis unconfirmed.']],
        [100, 95, 115, 118, 65],
    ), spacer(9)]
    s += [p('Illustrative source ledger - replace with real sources', H2), worked_example_table(
        ['Source / URL or conversation', 'Date', 'What it supports', 'Confidence'],
        [['Fictional role brief, section "Responsibilities"; no real URL asserted',
  'Example Day 1',
  'Explicit API ownership and reliability responsibilities; not interview questions.',
  'High for example text.'],
 ['Fictional recruiter conversation notes, retained with permission',
  'Example Day 2',
  'Tools and known stages only; unanswered questions remain open.',
  'High for explicit answers.'],
 ['Fictional candidate-pattern summary; conflicting stage counts',
  'Example Day 2',
  'A question about sequence, not evidence for adding another syllabus.',
  'Low; verify with recruiter.']],
        [208, 68, 157, 60],
    )]
    end_page(s)

    s += page_heading('Worked gap selection', 'See which gaps change the next action', 'Each illustrative row connects a role signal to a missing capability and observable proof. A low-confidence signal can remain a recruiter question instead of becoming study work.')
    s += [worked_example_table(
        ['Contextual gap',
 'Likelihood',
 'Interview impact',
 'Evidence deficit',
 'Proof action',
 'Completion evidence'],
        [['Tenant isolation is mentioned, but my design only has a global queue.',
  'Medium',
  'High',
  'High',
  'Rehearse per-tenant admission, fair scheduling, and saturation recovery.',
  'Explain how a hot tenant is contained and name a per-tenant delay metric.'],
 ['My reliability story describes team action, not my decision boundary.',
  'Medium',
  'High',
  'Medium',
  'Rewrite the opening around rollback versus hotfix and rehearse one objection.',
  'Two-minute answer identifies my decision, consequence, and durable prevention.'],
 ['Cross-team influence is expected but my API migration evidence is untested.',
  'Low',
  'Medium',
  'Medium',
  'Ask recruiter about level bar; run one adoption-story follow-up if confirmed.',
  'Either confirm the gap and show negotiated adoption, or park it if role scope differs.']],
        [105, 57, 58, 58, 102, 113],
    ), spacer(12)]
    s += [p("Questions for the recruiter", H2), worked_example_table(
        ['Question that reduces uncertainty', 'Why the answer changes preparation'],
        [['Which stages and approximate lengths are confirmed for this role now?',
  'Sets the rehearsal clock; stops stale anecdotes from adding unnecessary rounds.'],
 ['Does the design stage emphasize product behavior or infrastructure depth?',
  'Changes the follow-up depth, not the need to clarify requirements and failure behavior.'],
 ['What differentiates successful senior scope from the next lower level?',
  'Determines whether cross-team influence evidence needs rehearsal or whether service ownership is '
  'the main bar.']],
        [245, 248],
    ), spacer(10)]
    s += [callout("Boundary check", "Remove any action based only on a leaked prompt, a copied answer, or a low-confidence detail that would not change the underlying capability you need."), spacer(8)]
    end_page(s)

    s += page_heading(
        "Finish both Week 9 tasks",
        "Turn research into a short preparation queue",
        "The work is complete when you have a dated loop map, three contextual gaps at most, and a proof action for each selected gap.",
    )
    s += [numbered_chain([
        ("0-10 min", "Collect and date the strongest public evidence."),
        ("10-20 min", "Map stages to capabilities, evidence, and uncertainty."),
        ("20-30 min", "Label confidence and remove unsupported predictions."),
        ("30-50 min", "Select three gaps and define proof actions."),
    ]), spacer(12)]
    s += [p("Common mistakes", H2), bullet_list([
        "Treating the loop map as a forecast instead of a preparation hypothesis.",
        "Confusing company trivia with interview capability evidence.",
        "Using old candidate reports without dates or corroboration.",
        "Creating a new syllabus for every low-confidence signal.",
        "Preparing leaked questions or memorized company-specific answers.",
    ], compact=True), spacer(8)]
    s += [callout("Your next action", "Place the three proof actions into the main roadmap. Keep the source ledger beside the map so new evidence can update confidence without rewriting the whole plan."), spacer(10)]
    s += [p("Completion check", H2), bullet_list([
        "Every stage claim has a source or is labeled as inference.",
        "The map connects stages to capabilities and your evidence.",
        "No more than three contextual gaps are active.",
        "Each gap has a proof action and stop condition.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'For your actual target: keep a dated source ledger, label each stage fact or inference, choose no more than three gaps, and give each an action plus stop condition. Write unknown and an owner when evidence is missing.')]
    return s


def build_evidence_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Compare with discipline",
        "Find the repeated decision, not the lowest number",
        "Three attempts become useful only when the prompt shape, conditions, and rubric are comparable enough to reveal a recurring behavior.",
    )
    s += [callout("Core idea", "A persistent gap is a repeated observable moment under comparable conditions. One awkward answer is a hypothesis; three low totals without evidence are still only three numbers."), spacer(11)]
    s += [numbered_chain([
        ("Normalize", "Use the same dimensions and record prompt difficulty and conditions."),
        ("Quote", "Capture the exact moment the decision became unclear or late."),
        ("Cluster", "Look for repeated cues, causes, and downstream consequences."),
        ("Correct", "Choose one front-loaded behavior and define the re-test."),
    ]), spacer(12)]
    s += [two_cards(
        ("Signal", "The same behavior appears in similar decision moments and affects correctness, clarity, trade-offs, or recovery.", "Persistent"),
        ("Noise", "The prompt, time, assistance, fatigue, rubric, or domain changed enough that the result is not directly comparable.", "One-off"),
    ), spacer(11)]
    s += [p("Before comparing", H2), bullet_list([
        "Prompt type and difficulty are recorded.",
        "Time, tools, and assistance are visible.",
        "The same rubric dimensions were used.",
        "Evidence includes quotes, timestamps, code/tests, diagrams, or reviewer notes.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading(
        "Use one shared rubric",
        "Compare behavior across interview types",
        "The wording changes by domain, but the comparison should still expose framing, decision quality, boundary handling, and communication.",
    )
    s += [grid_table(
        ["Dimension", "Coding evidence", "System-design evidence", "Behavioral evidence"],
        [
            ["Framing", "Contract, examples, constraints", "Requirements, quality attributes, non-goals", "Question, context, stakes"],
            ["Decision", "Pattern and state choice", "Architecture/data choice", "Your choice, not only team action"],
            ["Reason", "Invariant and complexity proof", "Requirement and trade-off", "Constraint, alternative, judgment"],
            ["Boundary", "Empty, duplicate, off-by-one", "Failure, overload, stale state", "Conflict, uncertainty, follow-up"],
            ["Evidence", "Dry run, tests, correct output", "Estimate, metric, recovery behavior", "Measured result and durable change"],
            ["Communication", "Decisions audible at the right time", "Flow remains traceable as design expands", "Scope is clear without excessive setup"],
        ],
        [82, 137, 145, 129],
        font_size=6.75,
    ), spacer(12)]
    s += [callout("Scoring discipline", "Use the same 0 / 1 / 2 evidence scale from the Technical Baseline Scorecard, but compare the notes behind each score. The number is an index into evidence, not the conclusion."), spacer(9)]
    s += [p("A useful quote", H2), p("Record enough surrounding context to understand the decision. 'I forgot consistency' is weaker evidence than: 'I selected asynchronous replication, then described read-your-writes only after the interviewer asked what a user sees after an update.'", QUOTE)]
    end_page(s)

    s += page_heading(
        "Find the repeated moment",
        "Trace symptom, cause, and downstream consequence",
        "Do not stop at the visible mistake. Find the earliest decision whose absence made later parts of the answer harder to recover.",
    )
    s += [grid_table(
        ["Repeated symptom", "Possible earlier cause", "Downstream consequence", "Correction candidate"],
        [
            ["Edge cases appear only after prompting", "The input contract and invariant were never stated", "Implementation changes late; testing becomes random", "Name contract and one boundary before coding"],
            ["Design becomes a list of components", "Requirements and first bottleneck were not used as decision anchors", "Trade-offs sound generic; failures are bolted on", "State requirement -> decision -> cost for each major box"],
            ["Ownership sounds team-wide", "The speaker never named the personal decision boundary", "Level and judgment are hard to calibrate", "Open with context, then 'My decision was...'"],
            ["Follow-up answers contradict the opening", "Assumptions were implicit and changed silently", "The interviewer cannot tell whether the design adapted coherently", "Label the assumption before changing the decision"],
        ],
        [111, 135, 133, 114],
        font_size=6.85,
    ), spacer(12)]
    s += [p("Root-cause questions", H2), bullet_list([
        "What cue was present before the gap appeared?",
        "Which decision should have been made at that moment?",
        "Did the same absence create problems in more than one attempt?",
        "Would correcting it improve several downstream dimensions?",
        "Can the behavior be observed in the next comparable attempt?",
    ], compact=True), spacer(8)]
    s += [callout("Choose the smallest correction", "Prefer the earliest observable behavior with broad downstream impact. Do not replace a correction with a new syllabus.")]
    end_page(s)

    s += page_heading(
        "Worked example",
        "From three attempts to one correction",
        "The fictional evidence below shows how an apparent knowledge gap can actually be a decision-order problem.",
    )
    s += [grid_table(
        ["Attempt", "Prompt", "Observed moment", "Consequence"],
        [
            ["A", "Notification system", "Retry policy added after the queue diagram", "Duplicate effects and overload path stayed vague"],
            ["B", "File processing", "Consumer failure discussed only after a follow-up", "No dead-letter or poison-message plan"],
            ["C", "Metrics pipeline", "Delivery semantics named after storage choice", "Reconciliation and idempotency contradicted earlier claims"],
        ],
        [48, 104, 212, 129],
        font_size=7.1,
    ), spacer(12)]
    s += [two_cards(
        ("Weak conclusion", "I need to learn queues again. This is broad, hides what was already known, and gives no moment to test.", "Too broad"),
        ("Evidence-led conclusion", "I understand queue components, but delivery and retry semantics appear after architecture. Front-load them immediately after requirements.", "Specific"),
    ), spacer(11)]
    s += [callout("Correction", "Before drawing components, state: critical work is at-least-once; consumers are idempotent; retries are bounded with dead letters; oldest-event age is the recovery signal."), spacer(10)]
    s += [p("Re-test condition", H2), p("Use a nearby asynchronous-workflow prompt, the same 35-minute structure, and the same rubric. Success means delivery/retry behavior appears before architecture and remains coherent during one failure follow-up.")]
    end_page(s)

    s += page_heading('Worked comparison', 'Compare three attempts without hiding the evidence', 'These fictional runs use comparable asynchronous-workflow prompts and the same six dimensions. Read each score with its timestamp; the repeated sequence matters more than the totals.')
    s += [worked_example_table(
        ['Context', 'Attempt A', 'Attempt B', 'Attempt C'],
        [['Date / prompt',
  'Example Day 1: notifications',
  'Example Day 3: file processing',
  'Example Day 5: metrics pipeline'],
 ['Type / difficulty',
  'Async system design; moderate scope',
  'Async system design; moderate scope',
  'Async system design; moderate scope'],
 ['Time / tools / assistance',
  '35 min; blank canvas; no hints',
  '35 min; blank canvas; no hints',
  '35 min; blank canvas; no hints'],
 ['Rubric used',
  'Shared six dimensions; 0/1/2 plus artifacts',
  'Same dimensions and scoring rule',
  'Same dimensions and scoring rule']],
        [118, 125, 125, 125],
    ), spacer(11)]
    s += [worked_example_table(
        ['Shared dimension',
 'Attempt A: 0/1/2 + evidence',
 'Attempt B: 0/1/2 + evidence',
 'Attempt C: 0/1/2 + evidence'],
        [['Framing',
  '2: 02:10 identifies accepted versus delivered.',
  '2: 02:40 defines upload and processing result.',
  '2: 03:00 separates ingestion from query freshness.'],
 ['Decision',
  '1: 08:00 queue drawn before delivery guarantee.',
  '1: 09:20 workers drawn before crash behavior.',
  '1: 08:40 store chosen before delivery semantics.'],
 ['Reason',
  '1: retry cost named only after queue choice.',
  '1: parallelism chosen without poison-message boundary.',
  '1: throughput discussed; replay cost omitted.'],
 ['Boundary',
  '0: crash after email acceptance unresolved.',
  '1: consumer failure addressed at 27:00 after probe.',
  '1: duplicates addressed at 28:30 after probe.'],
 ['Evidence',
  '1: diagram exists; no duplicate timeline.',
  '1: retry sketch exists; no dead-letter re-drive test.',
  '1: retention estimate exists; reconciliation untested.'],
 ['Communication',
  '2: major choices audible; assumptions dated.',
  '2: scope changes explicitly named.',
  '2: flow remains traceable despite late semantics.']],
        [91, 134, 134, 134],
    )]
    end_page(s)

    s += page_heading('Worked synthesis', 'Turn score notes into a defensible pattern', 'The synthesis below uses the same three attempts. It preserves strengths, separates domain differences from the repeated gap, and states what is still uncertain.')
    s += [worked_example_table(
        ['Synthesis', 'Evidence across Attempts A / B / C'],
        [['Strongest repeated behavior',
  'All three answers clarify user-facing goals early and keep major choices audible. Preserve those '
  'habits; the correction is not "communicate more."'],
 ['First repeated weak decision moment',
  'At about minutes 8-9, the learner draws storage or workers before stating delivery, retry, and '
  'replay guarantees.'],
 ['Cue present immediately before it',
  'The prompt introduces asynchronous work that can be retried after a crash. That cue should trigger '
  'a semantics checkpoint.'],
 ['Quote / timestamp / artifact references',
  'A 08:00 queue sketch; B 09:20 worker sketch and 27:00 failure probe; C 08:40 storage choice and '
  '28:30 duplicate probe.'],
 ['What is noise or still uncertain?',
  'Domains differ, so totals are not directly comparable. The repeated ordering gap is stronger '
  'evidence than the exact score change; external-provider guarantees still need verification.']],
        [165, 328],
    ), spacer(10)]
    s += [callout(
        "Comparison rule",
        "A score without an evidence note is incomplete. If prompt type, difficulty, assistance, or time changed enough to explain the difference, mark the comparison as uncertain instead of forcing a trend.",
    )]
    end_page(s)

    s += page_heading('Worked correction', 'Turn the pattern into one observable behavior', 'Follow the chain from the repeated architecture-first moment to a specific checkpoint. In your notebook, repeat this chain using your own quotes and artifacts.')
    s += [worked_example_table(
        ['Step', 'Illustrative evidence'],
        [['Repeated observable moment',
  'Architecture appears before failure and retry semantics in all three asynchronous-workflow '
  'attempts.'],
 ['Cue present before it',
  'Accepted work can outlive the request and be retried after a worker or dependency failure.'],
 ['Earliest missing decision',
  'Define the durable acceptance boundary, duplicate-effect rule, bounded retry policy, and recovery '
  'owner.'],
 ['Downstream consequence',
  'Failure follow-ups force late changes to IDs, state transitions, metrics, and reconciliation.'],
 ['One correction sentence',
  'When work becomes asynchronous, I will state delivery and duplicate-effect guarantees before '
  'drawing workers so retries and recovery follow the same contract.'],
 ['Evidence that would show improvement',
  'Checkpoint appears unaided before architecture; crash-after-side-effect probe is answered without '
  'an unexplained guarantee change.']],
        [145, 348],
    ), spacer(11)]
    s += [callout("Correction sentence template", "When I notice [cue], I will [observable behavior] before [decision point], so [quality or failure consequence] stays explicit."), spacer(9)]
    s += [p("Keep / change", H2), two_cards(
        ("Keep stable", "Prompt shape, time box, tools, assistance, rubric dimensions, and scoring evidence.", "Comparable"),
        ("Change once", "The one intended behavior. Do not add several new techniques during the same re-test.", "Attribution"),
    )]
    end_page(s)

    s += page_heading('Worked re-test', 'Repeat the weak decision window, then test transfer', 'This fictional 35-minute block contains 28 minutes on the original weak scenario and a seven-minute adjacent probe. Its evidence is not a new full-length baseline score.')
    s += [worked_example_table(
        ['Re-test setup', 'Illustrative plan'],
        [['Phase 1: original lowest-score scenario',
  'Repeat notification delivery, the scenario with Boundary = 0; replay the original '
  'requirements-to-failure decision window.'],
 ['Same prompt conditions / decision-window time box / tools',
  '28 minutes; same prompt scope, blank canvas, no hints, and six-dimension evidence rubric. This is a '
  'focused replay, not a shorter full baseline comparison.'],
 ['Correction cue', 'A notification is accepted now but may be delivered later and retried.'],
 ['Where the behavior must appear',
  'Immediately after requirements, before API persistence or queue-worker boxes.'],
 ['Primary success evidence',
  'Record the checkpoint timestamp and a crash-after-provider-acceptance timeline; do not assume the '
  'provider prevents duplicates.'],
 ['Phase 2: 7-minute adjacent transfer probe',
  'Switch to file processing: worker crashes after writing output but before acknowledging work. '
  'Explain stable job ID, output state, and safe retry.']],
        [158, 335],
    ), spacer(12)]
    s += [worked_example_table(
        ['Result', 'Evidence / quote / timestamp', 'Next decision'],
        [['Phase 1: same scenario',
  '04:10: acceptance is durable before acknowledgment; duplicate email effects need provider '
  'idempotency or reconciliation. At 18:30, failure probe reuses this boundary.',
  'Keep correction; confirm the provider capability rather than claiming exactly-once delivery.'],
 ['Phase 2: brief transfer probe',
  '02:00: output path uses stable job ID; retry checks durable completion before writing again. A '
  'stale partial object is quarantined.',
  'Transfer observed once; return to roadmap and check again during the next normal rehearsal.']],
        [92, 255, 146],
    ), spacer(10)]
    s += [callout("Stop condition", "Return to the main roadmap when the correction appears unaided in the comparable re-test and at least once in a nearby prompt. Do not rehearse until the answer becomes a script.")]
    end_page(s)

    s += page_heading(
        "Finish the review",
        "Make the next test smaller and clearer",
        "The review is complete when one repeated gap has evidence, one correction has a visible moment, and the re-test conditions are recorded.",
    )
    s += [numbered_chain([
        ("Compare", "Normalize conditions and use one rubric."),
        ("Quote", "Capture repeated moments, not vague impressions."),
        ("Correct", "Choose the earliest behavior with downstream impact."),
        ("Re-test", "Change one variable and check transfer."),
    ]), spacer(12)]
    s += [p("Common mistakes", H2), bullet_list([
        "Picking the lowest score without reading the evidence behind it.",
        "Comparing prompts or conditions that are not meaningfully comparable.",
        "Calling a single bad moment persistent because it felt uncomfortable.",
        "Choosing several corrections and losing attribution.",
        "Repeating the identical answer until it becomes memorized rather than transferable.",
    ], compact=True), spacer(8)]
    s += [callout("Your next action", "Complete the comparison grid, write one correction sentence, and schedule one comparable re-test plus one adjacent transfer check."), spacer(10)]
    s += [p("Completion check", H2), bullet_list([
        "Three attempts use the same dimensions and include evidence.",
        "A repeated decision moment is separated from noise.",
        "One correction is attached to a cue and decision point.",
        "The comparable re-test and transfer check are defined.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'Use your last three artifacts: normalize conditions, attach evidence to the same six dimensions, write one repeated cue-to-consequence chain, and schedule the 28-minute replay plus seven-minute transfer probe.')]
    return s


def build_timed_rehearsal_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Rehearse the decision order",
        "Use the clock without racing",
        "A timed rehearsal tests whether clarification, reasoning, testing, and trade-offs still appear when the interview window is fixed.",
    )
    s += [callout(
        "Core idea",
        "The timer measures decision order, not intelligence or readiness. Protect the steps that make an answer trustworthy; compress detail before silently skipping the contract, evidence, testing, or failure handling.",
    ), spacer(11)]
    s += [numbered_chain([
        ("Set", "Choose one coding prompt and one design prompt, then lock time, tools, and assistance."),
        ("Run", "Speak decisions aloud and mark the moments where the answer changes direction."),
        ("Capture", "Save the prompt, artifacts, score, quote, timestamp, and first missed decision."),
        ("Correct", "Choose one behavior to test next; do not turn the debrief into a new syllabus."),
    ]), spacer(12)]
    s += [two_cards(
        ("Solo mode", "Record audio or screen only when permitted. Use visible timestamps and score from artifacts immediately after the run.", "Self-review"),
        ("Observer mode", "Ask the observer to note quotes and decision moments. Neutral prompts may clarify; they must not rescue the solution.", "Paired review"),
    ), spacer(11)]
    s += [p("The 80-minute practice block", H2), bullet_list([
        "Coding rehearsal: 30-minute attempt plus 10-minute evidence capture.",
        "System-design rehearsal: 35-minute attempt plus 5-minute evidence capture.",
        "Use the stated clock, the task-specific rubric, one 0 / 1 / 2 evidence scale, and the same assistance policy for each run.",
        "Save the required artifacts before choosing a correction.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading(
        "Prepare the conditions",
        "Select prompts that expose decisions",
        "Use an active Library mock or a prompt you have not recently solved. The goal is retrieval and explanation, not recognition from memory.",
    )
    s += [grid_table(
        ["Block", "Prompt choice", "Target dimension", "Locked conditions"],
        [
            ["Coding", "One sliding-window, graph, or dynamic-programming prompt", "The decision you want the clock to expose", "30 min; editor; language; no solution lookup"],
            ["Design", "One URL, notification, storage, or scheduling prompt", "Requirements, scale, trade-off, or failure handling", "35 min; blank canvas; calculator policy stated"],
            ["Recording", "Audio, screen, observer notes, or written timestamps", "Exact quote and decision moment", "Permission confirmed; no confidential prompt capture"],
            ["Evidence", "Code and tests; diagram and decision ledger", "Observable result, not a feeling", "Scored immediately with the same rubric"],
        ],
        [70, 158, 126, 139],
    ), spacer(12)]
    s += [p('Illustrative setup record', H2), worked_example_table(
        ['Field', 'Coding block', 'System-design block'],
        [['Prompt / source',
  'Fictional fresh prompt: longest substring containing at most two distinct characters.',
  'Fictional fresh notification variant: preserve delivery state while one provider is slow.'],
 ['Start time / end time',
  'Example 09:00-09:30; evidence capture 09:30-09:40.',
  'Example 09:45-10:20; evidence capture 10:20-10:25.'],
 ['Tools / assistance',
  'Local editor and tests; no lookup or hints; speak major decisions aloud.',
  'Blank canvas and calculator; no component suggestions; one neutral failure probe.'],
 ['Completion evidence',
  'Code, eceba trace, edge tests, invariant timestamp, complexity, and one missed decision.',
  'Diagram, three assumption-to-decision rows, failure timeline, metric, and one trade-off.']],
        [94, 199, 200],
    ), spacer(9)]
    s += [callout("Prompt rule", "Use the Library mock as a prompt source, not as an answer script. If you remember the solution path, choose another prompt and record why.", warm=True)]
    end_page(s)

    s += page_heading(
        "Coding block",
        "Protect the contract, invariant, and tests",
        "The 30-minute run keeps the roadmap task interview-shaped. The following 10 minutes preserve evidence before memory rewrites the attempt.",
    )
    s += [grid_table(
        ["Clock", "Decision to make", "What the learner says or saves"],
        [
            ["0-5 min", "Clarify contract, constraints, and examples", "Inputs, outputs, edge rules, one normal example, one boundary example"],
            ["5-10 min", "Choose approach and state invariant", "Pattern cue, state, invariant, rejected alternative, expected complexity"],
            ["10-25 min", "Implement with audible checkpoints", "What each block preserves; any changed assumption; uncertainty named"],
            ["25-30 min", "Test and close", "Empty/minimum, boundary or duplicate, main transition, time and space complexity"],
            ["30-40 min", "Capture evidence", "Artifacts, scores, quote/timestamp, first missed edge, one correction"],
        ],
        [70, 177, 246],
    ), spacer(12)]
    s += [p("If you are stuck", H2), numbered_chain([
        ("Restate", "Say the contract and the exact uncertainty."),
        ("Shrink", "Use the smallest example that forces the main state change."),
        ("Baseline", "Name a correct simple approach before optimizing."),
        ("Resume", "Choose the next observable step and state its cost."),
    ]), spacer(10)]
    s += [callout("Time-pressure rule", "Do not hide. A visible correct baseline plus a named optimization gap is stronger evidence than silent guessing or an unexplained code jump.")]
    end_page(s)

    s += page_heading('Worked coding record', 'Make a sliding-window solution inspectable', 'This completed example solves a fresh at-most-two-distinct-characters prompt. Use its contract, invariant, trace, and test reasoning as a standard for your own record, not an answer to memorize.')
    s += [worked_example_table(
        ['Artifact', 'Illustrative record'],
        [['Contract and constraints',
  'Input is a string; return longest contiguous length with at most two distinct characters. Empty '
  'returns 0; character model must be clarified.'],
 ['Normal + boundary example', 'eceba -> 3 (ece); empty -> 0; aa -> 2; abaccc -> 4 (accc).'],
 ['Pattern cue / approach',
  'A right extension can create a third character; shrink left until at most two remain. Use a sliding '
  'window, not global frequency counts.'],
 ['State and invariant',
  'Counts represent only the current window. After shrinking, it contains at most two distinct '
  'characters; best is updated only then.'],
 ['Rejected alternative + reason',
  'Enumerating every substring is correct but quadratic or worse. Sorting destroys contiguity, so it '
  'changes the problem.'],
 ['Time / space complexity',
  'Both pointers move forward at most n times: O(n). With limit two, the count map has at most three '
  'keys during repair, so O(1) auxiliary space.'],
 ['First missed edge + timestamp',
  'At 18:00, eceba exposes update-before-shrink. At 26:00, abaccc passes after moving best update '
  'after the shrinking loop.']],
        [139, 354],
    ), spacer(10)]
    s += [grid_table(
        ["Score", "Evidence standard"],
        [
            ["0 - absent", "The behavior never appears or appears only after the run."],
            ["1 - prompted / late", "The behavior appears after a rescue, late realization, or unexplained change."],
            ["2 - independent", "The behavior appears at the correct decision point and is supported by an artifact."],
        ],
        [92, 401],
    )]
    end_page(s)

    s += page_heading('Worked coding evidence', 'Score the attempt behind the code', 'These fictional timestamps refer to the same at-most-two-distinct attempt. Correct final code can still contain late reasoning; the evidence shows what should move earlier.')
    s += [worked_example_table(
        ['Dimension', 'Score + evidence', 'Quote, timestamp, code, or test evidence'],
        [['Clarification / contract',
  '2',
  '01:00: distinguishes substring from subsequence and confirms at most two distinct characters.'],
 ['Approach / decision order',
  '2',
  '04:20: expansion may break the constraint; shrinking repairs it without revisiting old starts.'],
 ['State / invariant',
  '1',
  '18:00: invariant first stated after the update-before-shrink bug appears.'],
 ['Correctness / recovery',
  '1',
  '20:30: moves best update after the while loop, then traces counts and boundaries.'],
 ['Complexity / alternatives',
  '2',
  '24:00: each pointer moves at most n; sorting rejected because order matters.'],
 ['Testing / communication',
  '1',
  '26:00: eceba and abaccc pass; empty and aa verified, but the first pointer repair was initially '
  'silent.']],
        [123, 73, 297],
    ), spacer(11)]
    s += [p("Worked evidence example", H2), grid_table(
        ["Observed moment", "Cause hypothesis", "Smallest correction"],
        [
            ["Invariant stated at minute 18 after implementation drifted", "Planning named the pattern but not what the window must preserve", "State the invariant before the first loop and re-check it at each pointer move"],
            ["Final duplicate boundary test was missed", "Testing started without a written edge list", "Write four test labels during clarification; run them in the last five minutes"],
        ],
        [171, 159, 163],
    ), spacer(9)]
    s += [callout("Do not copy the example", "Use it to separate symptom, cause, and correction. Your correction must attach to your own evidence and decision cue.", warm=True)]
    end_page(s)

    s += page_heading(
        "System-design block",
        "Make assumptions reversible",
        "A strong timed design answer connects requirements and scale to components, then closes with bottlenecks, recovery, and one deliberate trade-off.",
    )
    s += [grid_table(
        ["Clock", "Decision to make", "What the learner says or saves"],
        [
            ["0-5 min", "Requirements and non-goals", "Users, core actions, latency/durability needs, boundaries, explicit exclusions"],
            ["5-9 min", "Order-of-magnitude scale", "Traffic, storage, peaks, retention, and which estimate changes the design"],
            ["9-17 min", "API, data, and main flow", "Contract, source of truth, write/read path, key entities, access pattern"],
            ["17-25 min", "Architecture and bottleneck", "Components, ownership boundaries, first saturation or contention point"],
            ["25-31 min", "Failure and recovery", "Failure mode, detection signal, containment, retry/idempotency or fallback"],
            ["31-35 min", "Trade-off and operations close", "Alternative rejected, consequence accepted, observability, next question"],
            ["35-40 min", "Capture evidence", "Diagram, three assumptions, decision ledger, score, quote, correction"],
        ],
        [65, 161, 267],
    ), spacer(10)]
    s += [callout("Compression rule", "When time is short, reduce breadth and say what is deferred. Never silently skip requirements, a source of truth, the primary bottleneck, or failure handling.")]
    end_page(s)

    s += page_heading('Worked design ledger', 'Connect assumptions to decisions and reversal points', 'The illustrative notification design below makes every assumption revisitable. In your next run, write three comparable rows in a notebook with your actual estimates and guarantees.')
    s += [worked_example_table(
        ['Assumption', 'Decision caused', 'Cost / trade-off', 'What would change it'],
        [['Peak 5,000 events/s; average fan-out of two recipients is an explicit estimate.',
  'Plan for 10,000 recipient deliveries/s before channel fan-out; separate durable event acceptance '
  'from delivery workers.',
  'More queue and status state; capacity depends on real fan-out and provider quotas.',
  'A hot tenant or fan-out of 100 changes partitioning, admission control, and capacity math.'],
 ['Product accepts delayed delivery but must not lose accepted events.',
  'Acknowledge after durable event write; retry delivery asynchronously with bounded backoff.',
  'Status is eventually updated; backlog and replay ownership must be explicit.',
  'A strict immediate-send promise requires a separate synchronous path and a different failure '
  'contract.'],
 ['A provider timeout may hide a successful send.',
  'Use stable delivery ID and provider idempotency where supported; otherwise expose uncertainty and '
  'reconcile.',
  'Extra state and possible manual resolution; a database flag alone cannot prove external '
  'exactly-once effects.',
  'Verified provider semantics or a product-approved duplicate policy changes the retry boundary.']],
        [116, 134, 121, 122],
    ), spacer(11)]
    s += [worked_example_table(
        ['Design evidence', 'Illustrative record'],
        [['Source of truth + data flow',
  'Durable event store -> recipient/channel work -> provider -> delivery-state record. A stable '
  'event/recipient/channel ID links retries.'],
 ['Primary bottleneck + limit',
  'Provider throughput quota, not queue size, bounds drain rate. At peak, compare arrival rate with '
  'measured service rate by channel.'],
 ['Failure / recovery / metric',
  'Provider outage: bounded retries, dead letters, controlled re-drive. Watch oldest-event age and '
  'failed-delivery rate, then validate recovery on a small batch.'],
 ['Trade-off to revisit',
  'Global FIFO is simpler but lets one tenant delay others; add fairness when per-tenant age or load '
  'evidence justifies it.']],
        [145, 348],
    ), spacer(10)]
    s += [callout("Decision test", "If an assumption changes, point to the component, data path, or operating policy that changes with it. If nothing changes, the assumption may not be decision-relevant.")]
    end_page(s)

    s += page_heading('Worked design evidence', 'Use a failure probe to expose the remaining uncertainty', 'The fictional score record continues the same notification scenario. Scores cite decisions; an unresolved external guarantee remains a named question rather than a confident claim.')
    s += [worked_example_table(
        ['Dimension', 'Score + evidence', 'Quote, timestamp, diagram, or decision evidence'],
        [['Requirements / non-goals',
  '2',
  '03:00: accepted work must survive; immediate email completion is excluded from the response '
  'promise.'],
 ['Scale / capacity',
  '2',
  '07:00: 5,000 events/s x two recipients = 10,000 deliveries/s before channel fan-out.'],
 ['Decision order / data flow',
  '2',
  '12:00: durable acceptance and delivery state precede component detail.'],
 ['Architecture / bottleneck',
  '1',
  '24:00: provider quota identified late after the worker count was chosen.'],
 ['Trade-off clarity',
  '2',
  '30:00: asynchronous delivery reduces request coupling but requires visible eventual status.'],
 ['Failure / recovery / metrics',
  '1',
  '28:00: oldest-event age named; crash-after-send outcome still needs provider verification.'],
 ['Communication / recovery',
  '2',
  '31:00: labels the unresolved guarantee and updates only retry behavior during the pivot.']],
        [126, 73, 294],
    ), spacer(10)]
    s += [p("Worked pivot", H2), grid_table(
        ["Requirement change", "What changes", "What stays stable"],
        [[
            "Delivery may be delayed, but duplicate actions are unacceptable",
            "Idempotency key, deduplication store, retry policy, and success metric become explicit",
            "The product contract, source of truth, and unrelated read path remain unchanged",
        ]],
        [149, 188, 156],
    ), spacer(8)]
    s += [callout("Neutral observer prompts", "Use: What assumption drives that? What fails first? Which decision changes if the requirement changes? Avoid suggesting the component or answer.", warm=True)]
    end_page(s)

    s += page_heading(
        "Finish both tasks",
        "Leave with artifacts and one next correction",
        "The rehearsal is complete when both runs are saved, evidence is scored, and the next test is smaller than the practice block you just finished.",
    )
    s += [grid_table(
        ["Roadmap task", "Required saved artifact", "Completion proof"],
        [
            ["Timed coding rehearsal", "Prompt, approach, invariant, complexity, test list, first missed edge", "One quote/timestamp and a rubric score tied to code or tests"],
            ["Timed system-design rehearsal", "Prompt, three assumptions and caused decisions, diagram, trade-off to revisit", "One quote/timestamp and a rubric score tied to the decision ledger"],
        ],
        [121, 230, 142],
    ), spacer(11)]
    s += [p("Common mistakes", H2), bullet_list([
        "Starting implementation or architecture before clarifying the contract.",
        "Optimizing for speed while dropping tests, failure handling, or a clear close.",
        "Using a familiar prompt whose solution is already memorized.",
        "Scoring from confidence instead of quotes, artifacts, and decision moments.",
        "Choosing several corrections and losing evidence about what worked.",
    ], compact=True), spacer(8)]
    s += [callout("Your next action", "Choose one lowest evidence dimension, write one correction sentence, and schedule one comparable rehearsal. Keep the prompt shape and rubric stable enough to measure change."), spacer(10)]
    s += [p("Completion check", H2), bullet_list([
        "Both prompts and conditions are recorded.",
        "Both clocks preserve the required decision stages.",
        "Coding and design artifacts are saved.",
        "Scores cite observable evidence.",
        "Only one correction is active for the next test.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'For a fresh prompt: save contract, examples, invariant, approach, rejected alternative, tests, complexity, and first missed decision. For design: save three assumption-to-decision rows, failure timeline, metric, and a reversal condition.')]
    return s


def build_final_loop_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Consolidate, then reduce friction",
        "Use the final loop to protect proven skills",
        "The capstone combines a compressed multi-round rehearsal with a one-page operating runbook. It is a practice sequence, not a prediction of a company's exact interview loop.",
    )
    s += [callout(
        "Core idea",
        "Week 12 is a taper. Use representative prompts, protect transitions, prove recovery, and remove day-of uncertainty. Do not add a new syllabus or chase a perfect score.",
    ), spacer(11)]
    s += [numbered_chain([
        ("Assemble", "Select one coding, design, behavioral, and follow-up segment from existing preparation."),
        ("Rehearse", "Run the 60-minute sequence and reset deliberately between segments."),
        ("Debrief", "Record three stable strengths, one remaining risk, and one final action."),
        ("Operate", "Build the 15-minute day-of runbook from the rehearsal evidence."),
    ]), spacer(12)]
    s += [two_cards(
        ("60 minutes", "A compressed full-loop rehearsal that tests retrieval, transitions, recovery, and a focused close.", "Rehearsal"),
        ("15 minutes", "A one-page logistics and cognitive-load runbook that supports the real interview day.", "Runbook"),
    ), spacer(11)]
    s += [p("Boundaries", H2), bullet_list([
        "Use only prompts, stories, and frameworks already prepared.",
        "Use mini-prompts that fit the compressed segment windows.",
        "Do not record confidential prompts or another person without permission.",
        "The runbook lowers cognitive load; it is not a binder to read during answers.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading('Worked loop plan', 'Choose four segments with observable stopping points', 'This illustrative plan fits the existing 60-minute clock. Select your own fresh, authorized prompts and truthful story; keep the capability, evidence cue, and stop condition explicit.')
    s += [worked_example_table(
        ['Segment', 'Capability', 'Prompt / source', 'Evidence cue', 'Time / stop'],
        [['Coding',
  'Invariant plus boundary test',
  'Own fresh mini-prompt: maximum unique-character substring length.',
  'Say no-repeat invariant before code; trace abba without moving left backward.',
  '18 min; approach, implementation, boundary, complexity.'],
 ['System design',
  'Requirement-led reliability trade-off',
  'Mini-design: accept and deliver a notification when provider is slow.',
  'State acceptance and retry guarantee before queue; explain one timeout timeline.',
  '18 min; main flow, one failure, metric, trade-off.'],
 ['Behavioral',
  'Owned judgment under pressure',
  'Own incident story: rollback versus hotfix, using only recorded facts.',
  'Name personal decision, rejected alternative, result, and prevention.',
  '10 min; story plus one evidence probe.'],
 ['Follow-up pivot',
  'Adapt without contradicting contract',
  'Change notification request: one tenant now creates half of all work.',
  'Update fairness and admission limits; retain unrelated event semantics.',
  '6 min; affected decision and one cost.']],
        [76, 99, 134, 104, 80],
    ), spacer(11)]
    s += [p("Selection rules", H2), bullet_list([
        "Coding: use a prompt that requires a visible invariant or boundary decision.",
        "Design: use a prompt with one meaningful capacity or failure trade-off.",
        "Behavioral: use a story with ownership, tension, action, and measurable result.",
        "Follow-up: change one requirement or ask for one deeper evidence layer.",
        "Corrected gap: name the segment and exact cue where the new behavior must appear.",
    ], compact=True), spacer(9)]
    s += [callout("Source rule", "Select from active Library mocks and your own evidence map. Do not use leaked company questions, confidential material, or a prompt you can answer from memory.", warm=True)]
    end_page(s)

    s += page_heading(
        "The 60-minute clock",
        "Protect transitions as part of the answer",
        "A full loop is more than four prompts. It tests whether the learner can release one context, establish the next contract, and recover without carrying forward stale assumptions.",
    )
    s += [grid_table(
        ["Clock", "Segment", "Protected behavior"],
        [
            ["0-2", "Setup", "Confirm prompts, assistance policy, timer, evidence capture, and corrected-gap cue"],
            ["2-20", "Coding", "Clarify contract; state approach and invariant; implement; test one boundary and close"],
            ["20-22", "Reset 1", "Release code context; breathe; restate the design contract; ask first clarification"],
            ["22-40", "System design", "Set requirements and scale; draw flow; name bottleneck, failure, trade-off, metric"],
            ["40-42", "Reset 2", "Release architecture assumptions; retrieve the selected story cue; reopen listening"],
            ["42-52", "Behavioral", "Answer with context, ownership, actions, result, learning, and evidence"],
            ["52-58", "Follow-up pivot", "Respond to one changed constraint or probe without rewriting the whole answer"],
            ["58-60", "Capture", "Write strongest skill, remaining risk, and one action before the real loop"],
        ],
        [61, 96, 336],
    ), spacer(10)]
    s += [callout("Compressed-prompt rule", "If a segment cannot reach its main decision inside the time box, shorten the prompt before the rehearsal. Do not create artificial speed by skipping the contract or evidence.")]
    end_page(s)

    s += page_heading(
        "Transition protocol",
        "Close, clear, and reopen",
        "The two-minute reset prevents a weak moment from becoming the next round's starting state. It is a controlled handoff, not a postmortem.",
    )
    s += [numbered_chain([
        ("Close", "Name what is complete and what you would verify with more time."),
        ("Clear", "Release the prior artifact; one breath, posture reset, water if needed."),
        ("Contract", "State the new segment's input, output, scope, and first uncertainty."),
        ("Clarify", "Ask one useful opening question before importing any old assumption."),
    ]), spacer(12)]
    s += [grid_table(
        ["Carryover risk", "Reset sentence", "Evidence of recovery"],
        [
            ["A coding edge case was missed", "That round is closed. For this design prompt, I will first define users, guarantees, and scale.", "The design answer opens with its own contract rather than an apology"],
            ["A design assumption changed late", "The prior assumption belongs to that prompt. For this story, I will use only facts from the selected event.", "The behavioral answer does not borrow invented scale or ownership"],
            ["A prior answer felt weak", "I have one note for later. The next contract starts now.", "First clarification arrives without re-litigating the old answer"],
        ],
        [137, 221, 135],
    ), spacer(10)]
    s += [p('Illustrative transition evidence', H2), worked_example_table(
        ['Reset', 'What I released', 'First new contract / clarification'],
        [['Coding -> design',
  'Noted the missed duplicate test for later; closed editor and released pointer state.',
  'For notifications, does acceptance mean stored safely or delivered to every channel?'],
 ['Design -> behavioral',
  'Parked the unresolved provider capability; did not borrow fictional traffic for the story.',
  'I will use the actual rollback event and distinguish my decision from team execution.']],
        [80, 172, 241],
    )]
    end_page(s)

    s += page_heading('Worked loop score', 'See recovery evidence without averaging away risk', 'These fictional observations follow the plan on the earlier page. Every score contains a reason; a missing boundary stays visible even when the rest of the segment is strong.')
    s += [worked_example_table(
        ['Segment',
 'Opening contract',
 'Decision quality',
 'Boundary / failure',
 'Communication / recovery',
 'Close'],
        [['Coding',
  '2: output and empty case at 00:50.',
  '2: invariant before loop.',
  '1: duplicate test prompted.',
  '2: repair explained without hiding it.',
  '2: bound and remaining check named.'],
 ['Design',
  '2: acceptance versus delivery clarified.',
  '2: durable state before workers.',
  '1: provider timeout uncertain.',
  '2: uncertainty labeled, not guessed.',
  '2: age metric and next check.'],
 ['Behavioral',
  '2: scope and stakes in first 30 sec.',
  '2: rollback choice and alternative.',
  '2: failure and prevention factual.',
  '2: personal role clear; no invented metric.',
  '2: result and learning separated.'],
 ['Follow-up',
  '2: new tenant load restated.',
  '2: fairness decision updated.',
  '2: noisy-tenant containment.',
  '2: unrelated guarantees preserved.',
  '1: no final cost summary.']],
        [78, 80, 83, 85, 92, 75],
    ), spacer(12)]
    s += [worked_example_table(
        ['Transition', 'Score + evidence', 'Quote, timestamp, or observer evidence'],
        [['Coding -> design',
  '2',
  'At 20:25, asks the new acceptance question instead of apologizing for the missed coding test.'],
 ['Design -> behavioral',
  '2',
  'At 40:30, opens the incident story with actual scope and owned rollback decision; no design '
  'assumptions carried over.']],
        [123, 78, 292],
    ), spacer(11)]
    s += [callout("Evidence rule", "Do not average away a missing contract or unsafe failure decision. Record the specific moment, then decide whether it is a remaining risk or normal performance noise.")]
    end_page(s)

    s += page_heading(
        "Worked recovery example",
        "An imperfect moment does not have to spread",
        "The purpose of the final rehearsal is not a flawless sequence. It is evidence that the learner can notice, reset, and restore the next decision order.",
    )
    s += [grid_table(
        ["Moment", "Carryover risk", "Reset used", "Evidence after reset"],
        [
            ["Coding closes without the duplicate-input test", "Learner keeps replaying the miss and enters design silently", "Writes one later-note, closes the editor, breathes, states design users and guarantees", "First design clarification appears within 25 seconds"],
            ["Design bottleneck is identified late", "Learner overexplains the miss inside the behavioral story", "Labels the assumption for debrief, retrieves the selected story cue only", "Story opens with factual context and owned decision"],
            ["Behavioral result lacks one metric", "Learner invents precision during follow-up", "States what was measured and what was not; asks which result layer matters", "Follow-up stays accurate and distinguishes fact from estimate"],
        ],
        [119, 132, 146, 96],
    ), spacer(12)]
    s += [two_cards(
        ("Recovery", "The next segment regains its contract, evidence, and decision order without needing a rescue.", "Useful signal"),
        ("Masking", "The learner rushes, apologizes repeatedly, invents evidence, or silently imports the prior answer.", "Risk signal"),
    ), spacer(10)]
    s += [p('Completed recovery note', H2), worked_example_table(
        ['Imperfect moment', 'Reset action', 'Evidence that the next segment recovered'],
        [['Missed duplicate-input test in coding; urge to explain it again during design.',
  'Wrote one factual note, closed editor, took water, and asked the new contract question.',
  'Design opened within 25 seconds with acceptance versus delivery; the prior error did not consume '
  'the next segment.']],
        [144, 155, 194],
    )]
    end_page(s)

    s += page_heading(
        "Debrief and taper",
        "Keep three strengths and one remaining risk",
        "Use the final evidence to reduce work. A taper protects retrieval, sleep, and decision clarity; it does not reopen every weak topic.",
    )
    s += [worked_example_table(
        ['Final evidence', 'Quote, artifact, or observed moment', 'What to carry forward'],
        [['Stable strength 1',
  'Coding invariant stated before implementation in the last two comparable runs.',
  'Keep one invariant checkpoint; do not add a second framework.'],
 ['Stable strength 2',
  'Both resets establish the next contract within 30 seconds without rescue.',
  'Use close, clear, contract, clarify between rounds.'],
 ['Stable strength 3',
  'Incident story separates personal judgment, team execution, measured result, and learning.',
  'Use three factual story labels rather than memorize full answers.'],
 ['One remaining risk',
  'Timeout-after-send answer still jumps from retry to guaranteed no duplicates.',
  'Rehearse one honest boundary sentence and ask what external guarantee exists.']],
        [112, 229, 152],
    ), spacer(11)]
    s += [grid_table(
        ["Time horizon", "Do", "Avoid"],
        [
            ["48-24 hours", "One short retrieval pass; confirm logistics; normal sleep and meals", "Novel hard problems, whole-plan rewrite, long late-night mock"],
            ["24-2 hours", "Review cue cards and one risk sentence; stop when retrieval is clean", "Adding stories, memorizing scripts, comparing yourself to others"],
            ["Last 2 hours", "Protect energy, equipment, water, quiet, and arrival time", "Score analysis, forum browsing, or another full rehearsal"],
        ],
        [84, 212, 197],
    ), spacer(9)]
    s += [callout("Final action", "Rehearse one exact sentence or decision once more only if it addresses the remaining risk. Stop when it appears unaided; do not rehearse until it becomes a brittle script.", warm=True)]
    end_page(s)

    s += page_heading(
        "Runbook design",
        "Build a one-page operating sheet",
        "The runbook should answer what to do before, between, and after rounds without competing for attention during the interview.",
    )
    s += [grid_table(
        ["Section", "Include", "Exclude"],
        [
            ["Logistics", "Timezone, date, format, links, contact, backup connection, accommodation", "Passwords, sensitive identity data, unnecessary account details"],
            ["Evidence cues", "Target-role sentence, compact story index, technical decision cues, two reminders", "Full scripts, model answers, leaked prompts, confidential notes"],
            ["Reset ritual", "One fact, one question, one adjustment; breath, posture, water", "A full postmortem while the loop continues"],
            ["Recovery path", "Contact method, interruption sentence, reconnect order, backup device", "Improvised promises or unauthorized recording"],
            ["Questions", "Two role- and team-relevant questions with one follow-up each", "Questions already answered in the interview or public role brief"],
        ],
        [94, 233, 166],
    ), spacer(12)]
    s += [p("Carry only useful evidence", H2), bullet_list([
        "One target-role and level sentence.",
        "Three story labels with outcome and ownership cue, not full scripts.",
        "Coding contract / invariant / test cue and design requirement / failure / trade-off cue.",
        "Two questions and the two personal reminders most likely to improve decisions.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Ethical boundary", "Use your own notes and public or authorized preparation material. Never carry leaked questions, confidential employer information, or recordings made without consent.", warm=True)]
    end_page(s)

    s += page_heading(
        "Pre-loop checklist",
        "Remove avoidable friction by horizon",
        "Confirm the items when they can still be fixed. The final ten minutes should be a calm readiness check, not a technology project.",
    )
    s += [p("24 hours before", H2), bullet_list([
        "Date, timezone, expected duration, round format, and interviewers when supplied.",
        "Meeting links, calendar access, contact path, and any requested documents.",
        "Accommodation or accessibility needs are confirmed through the proper contact.",
        "Primary and backup location, internet path, and transport or arrival buffer.",
        "Sleep, meal, medication, and other personal energy needs are planned safely.",
    ], checklist=True, compact=True), spacer(9)]
    s += [p("60 minutes before", H2), bullet_list([
        "Power, charger, audio, microphone, camera, browser, editor, and permitted tools work.",
        "Primary link opens; backup connection and backup device are available.",
        "Quiet space, lighting, background, temperature, water, and interruption plan are ready.",
        "Runbook, blank paper, and allowed notes are visible but do not obstruct the screen.",
    ], checklist=True, compact=True), spacer(9)]
    s += [p("10 minutes before", H2), bullet_list([
        "Close notifications, unrelated tabs, messaging apps, downloads, and system updates.",
        "Use the restroom, reset posture, breathe normally, and take water.",
        "Open the correct link and join at the expected time; do not start a new practice problem.",
    ], checklist=True, compact=True), spacer(9)]
    s += [callout("Interruption sentence", "I am experiencing [brief factual issue]. I am switching to [backup] now. If we disconnect, may I rejoin through the same link or contact [name / channel]?")]
    end_page(s)

    s += page_heading(
        "Between rounds",
        "Use the three-minute reset",
        "Capture only what helps the next round. Do not grade the entire interview while the loop is still running.",
    )
    s += [grid_table(
        ["Minute", "Action", "Write only"],
        [
            ["0-1", "Release", "One factual moment from the prior round; no verdict"],
            ["1-2", "Recover", "One breath cycle, posture, water, and any immediate logistics need"],
            ["2-3", "Reopen", "One question and one adjustment for the next round's contract"],
        ],
        [70, 182, 241],
    ), spacer(12)]
    s += [worked_example_table(
        ['Round', 'One fact', 'One question', 'One adjustment'],
        [['After coding',
  'Invariant was clear; one duplicate test was prompted.',
  'What does acceptance promise in the next design?',
  'Start from the new contract, not the old score.'],
 ['After design',
  'Provider timeout guarantee remained uncertain.',
  'Which owned decision best answers the next story question?',
  'Use actual incident facts; do not invent a metric.'],
 ['After behavioral',
  'Rollback alternative and prevention were explicit.',
  'Which part of the role has the most ambiguous ownership?',
  'Ask a role-relevant question and listen before adding examples.']],
        [72, 142, 142, 137],
    ), spacer(11)]
    s += [grid_table(
        ["Situation", "Recovery script"],
        [
            ["Prompt is unclear", "Before I choose an approach, may I confirm [input / goal / constraint]?"],
            ["You are stuck", "I will restate the contract, test the smallest case, and name the correct baseline."],
            ["Connection fails", "Reconnect using the backup path, then send the prepared factual message."],
            ["Prior round felt weak", "I have one note for later. I will start the next contract without carrying a verdict."],
        ],
        [135, 358],
    )]
    end_page(s)

    s += page_heading('Completed runbook example', 'Read a compact operating sheet that supports listening', 'This illustrative record models the level of detail to keep. Copy your real private logistics into your own notes; do not treat example times, events, or contacts as yours.')
    s += [worked_example_table(
        ['Runbook field', 'Illustrative final record'],
        [['Schedule / timezone / links',
  'Fictional practice: 09:00-10:00 IST (UTC+05:30). In a real runbook, copy the actual date, zone, and '
  'approved link from the invite; test the link privately.'],
 ['Contact / interruption path',
  'Use the recruiter contact from the invite. If disconnected: reconnect once, then send a brief '
  'factual update through the agreed channel. Do not put credentials here.'],
 ['Backup connection / device',
  'Charged laptop and phone hotspot tested before the loop; charger connected. Confirm the backup is '
  'allowed and available in the interview location.'],
 ['Target role + two evidence cues',
  'Senior backend: reliable service ownership; cross-team API migration. Cues: rollback judgment and '
  'backwards-compatible adoption.'],
 ['Three story labels',
  'Rollback: bounded risk; API migration: influence; review mechanism: repeatable team leverage. Use '
  'only truthful events from your own work.'],
 ['Technical reset cues',
  'Coding: contract -> invariant -> boundary. Design: guarantee -> state -> failure -> trade-off. When '
  'stuck, shrink the case and name the uncertainty.'],
 ['Two questions to ask',
  'Which decisions should this engineer own in the first six months? What reliability trade-off '
  'currently causes the team the most recurring work?']],
        [143, 350],
    ), spacer(10)]
    s += [worked_example_table(
        ['Final summary', 'Illustrative evidence'],
        [['Three stable strengths',
  'Invariant before code; reset to each new contract; factual incident ownership with a clear '
  'alternative.'],
 ['One remaining risk',
  'External-send timeout handling still tempts an unsupported exactly-once claim.'],
 ['One next action before the loop',
  'Rehearse the provider-boundary sentence once, verify logistics, then stop adding content and '
  'protect normal rest.']],
        [143, 350],
    )]
    end_page(s)

    s += page_heading(
        "Finish Week 12",
        "Stop when the system is ready",
        "The capstone is complete when the rehearsal proves usable skills, the remaining risk is bounded, and the runbook removes avoidable day-of decisions.",
    )
    s += [grid_table(
        ["Roadmap task", "Required artifact", "Completion proof"],
        [
            ["Complete the full-loop rehearsal", "Selected prompts, 60-minute run sheet, segment evidence, transition notes", "Three stable strengths, one remaining risk, and one exact next action"],
            ["Finish the interview-day runbook", "One-page schedule, logistics, evidence cues, reset ritual, backup path, questions", "The sheet can be used in under one minute without reading answer scripts"],
        ],
        [126, 226, 141],
    ), spacer(12)]
    s += [p("Common mistakes", H2), bullet_list([
        "Using full-length prompts that cannot reach the intended decision in the compressed clock.",
        "Treating transitions as dead time instead of a recovery skill.",
        "Turning one imperfect segment into a verdict about the whole loop.",
        "Adding new content during the taper or rehearsing until language becomes brittle.",
        "Building a long runbook that competes with listening and live reasoning.",
    ], compact=True), spacer(8)]
    s += [callout("Your next action", "Confirm the runbook once, rehearse the one remaining risk only to the stop condition, then protect sleep, energy, logistics, and honest decision-making."), spacer(10)]
    s += [p("Completion check", H2), bullet_list([
        "Four representative segments and two transitions were rehearsed.",
        "Each score cites an observable moment.",
        "Three strengths, one risk, and one action are recorded.",
        "The logistics and backup path are confirmed.",
        "The three-minute reset and ethical boundaries are visible.",
    ], checklist=True, compact=True)]
    s += [spacer(10), callout("Apply the method to your own evidence", 'Build your own one-page private runbook: verified logistics, backup path, three truthful story labels, two technical cues, two questions, three evidenced strengths, one risk, and one action. Keep scripts and credentials out.')]
    return s


def build_traversal_practice_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Complete the exact Week 3 task",
        "Four problems, four visible decisions",
        "This workbook turns traversal practice into evidence: choose from the guarantee, name the state, preserve an invariant, test the boundary, and explain the near miss.",
    )
    s += [callout(
        "Task objective",
        "Solve one component problem, one shortest unweighted path, one directed dependency-cycle problem, and one path-reconstruction problem. Attempt each prompt before opening its worked review.",
    ), spacer(10)]
    s += [numbered_chain([
        ("Classify", "Name the guarantee the prompt requires before naming BFS or DFS."),
        ("Separate", "Define frontier, discovery, problem state, and final answer independently."),
        ("Prove", "State the invariant and the exact moment a node becomes discovered."),
        ("Review", "Test boundaries, defend complexity, and name a prompt change that breaks the choice."),
    ]), spacer(11)]
    s += [p("The 75-minute practice block", H2), grid_table(
        ["Clock", "Activity", "Required artifact"],
        [
            ["0-8", "Refresh the decision model", "Guarantee, frontier, state, invariant, visited timing"],
            ["8-20", "Problem 1: components", "Attempt plus three tests"],
            ["20-33", "Problem 2: minimum edges", "Attempt plus queue-layer trace"],
            ["33-46", "Problem 3: dependency cycle", "Attempt plus active-path trace"],
            ["46-61", "Problem 4: reconstruct route", "Attempt plus parent chain"],
            ["61-70", "Open the worked reviews", "Compare decisions, not just final answers"],
            ["70-75", "Save evidence", "One repeated weakness and one correction sentence"],
        ],
        [55, 142, 296],
        row_heights=[32, 32, 32, 32, 32, 32, 32],
    ), spacer(9)]
    s += [p("Evidence to save for every problem", H2), bullet_list([
        "Decisive cue and required guarantee.",
        "Traversal, frontier, state meanings, and invariant.",
        "At least three boundary tests and a complexity explanation.",
        "One near miss: the smallest prompt change that would require another method.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading(
        "Decision model",
        "Choose from the guarantee, not the keyword",
        "Words such as graph, path, or dependency do not choose the algorithm. The required guarantee and the state carried through the traversal do.",
    )
    s += [two_cards(
        ("BFS", "Use a queue when equal-cost edges must be explored by layer: minimum edges, minimum steps, nearest target, or level order.", "Layer guarantee"),
        ("DFS", "Use a stack or recursion when the central job is to finish a component, explore a branch, or expose active-path state.", "Branch guarantee"),
    ), spacer(10)]
    s += [grid_table(
        ["Prompt requirement", "Default tool", "State that makes it correct", "Disqualifying cue"],
        [
            ["Explore every node in one component", "DFS or BFS", "Global discovered set", "If minimum distance is required, order now matters"],
            ["Minimum edges or steps", "BFS", "Distance at discovery; queue by layer", "Unequal edge costs break plain BFS"],
            ["Directed cycle on the active dependency path", "3-color DFS", "Unseen / visiting / done", "One visited set cannot identify a back edge"],
            ["Return an actual shortest route", "BFS + parent", "Parent fixed on first discovery", "DFS proves reachability, not minimum edges"],
            ["Nonnegative weighted shortest path", "Weight-aware search", "Best-known cost and priority frontier", "Plain BFS / DFS is not enough"],
        ],
        [137, 76, 163, 117],
        row_heights=[48, 48, 48, 48, 48],
    ), spacer(10)]
    s += [callout(
        "Truthful nuance",
        "BFS and DFS are both correct for basic reachability and component discovery. Choose deliberately, then explain the real trade-off: queue width, stack depth, path-local state, or a required layer guarantee.",
    ), spacer(9)]
    s += [p("Separate these four layers", H2), numbered_chain([
        ("Frontier", "Queue, stack, or recursion: what is processed next."),
        ("Discovery", "What has already entered the search and cannot be added again."),
        ("Problem state", "Distance, color, component ID, indegree, or other meaning."),
        ("Answer", "Count, boolean, parent chain, path, or requested evidence."),
    ])]
    end_page(s)

    component_nodes = {
        "0": (0.03, 0.72), "1": (0.20, 0.83), "2": (0.34, 0.59),
        "3": (0.52, 0.80), "4": (0.67, 0.62), "5": (0.57, 0.23),
        "6": (0.73, 0.31), "7": (0.84, 0.13), "8": (0.96, 0.73),
    }
    component_edges = [("0", "1"), ("1", "2"), ("3", "4"), ("5", "6"), ("6", "7"), ("7", "5")]
    s += page_heading(
        "Problem 1 / attempt first",
        "Count connected components",
        "This is a disconnected undirected graph. The result must include isolated nodes and every component, not only the region reachable from node 0.",
    )
    s += [callout(
        "Prompt",
        "Given n = 9 nodes labeled 0 through 8 and undirected edges {0-1, 1-2, 3-4, 5-6, 6-7, 7-5}, return the number of connected components.",
        warm=True,
    ), spacer(9)]
    s += [NetworkDiagram(component_nodes, component_edges, label="Undirected communication graph", height=154), spacer(9)]
    s += [two_cards(
        ("Input contract", "Adjacency-list graph; an isolated node has an empty neighbor list; edges may appear in both directions.", "Representation"),
        ("Return contract", "One integer: the number of disjoint connected components across all n nodes.", "Output"),
    ), spacer(9)]
    s += [p("Write these decisions before coding", H2), bullet_list([
        "What prompt cue makes traversal appropriate, and does BFS versus DFS affect correctness here?",
        "When is a node marked discovered: before it enters the frontier or after it leaves?",
        "Why is an outer loop over every node necessary?",
        "What remains true when one complete traversal finishes?",
        "Test an isolated node, no edges, one large component, and the triangle 5-6-7.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Attempt boundary", "Spend up to 12 minutes. Save your count, pseudocode or code, invariant, three tests, complexity, and one near-miss before turning the page.")]
    end_page(s)

    s += page_heading(
        "Problem 1 / worked review",
        "Finish one component before counting the next",
        "An iterative DFS is used here to make stack depth explicit. BFS would also be correct because this prompt asks for component membership, not minimum distance.",
    )
    s += [numbered_chain([
        ("Cue", "Count every disconnected region, including isolated nodes."),
        ("Choice", "Scan all nodes; start iterative DFS from each unseen node."),
        ("State", "A global discovered set survives between component traversals."),
        ("Invariant", "Each completed start marks exactly one full component."),
    ]), spacer(10)]
    s += [code_block([
        "count = 0",
        "discovered = empty set",
        "for node in 0 .. n - 1:",
        "    if node in discovered: continue",
        "    count = count + 1",
        "    stack = [node]; add node to discovered",
        "    while stack is not empty:",
        "        current = stack.pop()",
        "        for next in neighbors[current]:",
        "            if next not in discovered:",
        "                add next to discovered; stack.push(next)",
        "return count",
    ]), spacer(10)]
    s += [grid_table(
        ["Outer-loop start", "Newly finished component", "Discovered after traversal", "Count"],
        [
            ["0", "{0, 1, 2}", "{0, 1, 2}", "1"],
            ["3", "{3, 4}", "{0, 1, 2, 3, 4}", "2"],
            ["5", "{5, 6, 7}", "{0, 1, 2, 3, 4, 5, 6, 7}", "3"],
            ["8", "{8}", "All nine nodes", "4"],
        ],
        [86, 132, 216, 59],
        row_heights=[37, 37, 37, 37],
    ), spacer(9)]
    s += [two_cards(
        ("Near miss", "One DFS from node 0 returns one component and silently misses nodes 3 through 8. If the prompt changes to minimum edges, DFS no longer supplies the required guarantee.", "What fails"),
        ("Boundary proof", "Mark on push so duplicate edges and the 5-6-7 cycle cannot add the same node repeatedly. The isolated node 8 still starts and completes a component.", "Why it holds"),
    ), spacer(8)]
    s += [callout("Complexity", "With adjacency lists, every node is discovered once and every stored edge is scanned: O(V + E) time and O(V) discovered/frontier space.")]
    end_page(s)

    shortest_nodes = {
        "S": (0.03, 0.50), "A": (0.27, 0.77), "B": (0.27, 0.22),
        "C": (0.56, 0.74), "D": (0.56, 0.25), "T": (0.94, 0.50),
    }
    shortest_edges = [("S", "A"), ("S", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "S"), ("C", "T"), ("D", "T")]
    s += page_heading(
        "Problem 2 / attempt first",
        "Find the minimum number of edges",
        "The graph is directed and every edge has equal cost. Duplicate edges and a cycle are present, so discovery timing is part of correctness and efficiency.",
    )
    s += [callout(
        "Prompt",
        "Adjacency: S -> [A, B, B], A -> [C], B -> [C, D], C -> [S, T], D -> [T], T -> []. Return the minimum number of edges from S to T, 0 when source equals target, and -1 when unreachable.",
        warm=True,
    ), spacer(9)]
    s += [NetworkDiagram(shortest_nodes, shortest_edges, label="Directed equal-cost graph; the duplicate S -> B input edge is shown once", directed=True, highlighted_nodes=["S", "T"], height=154), spacer(9)]
    s += [two_cards(
        ("Required guarantee", "The returned distance must be the smallest number of directed equal-cost edges from source to target.", "Minimum"),
        ("Noise to handle", "S points to B twice and C points back to S. Neither should duplicate useful work.", "Duplicates + cycle"),
    ), spacer(9)]
    s += [p("Before coding", H2), bullet_list([
        "Name the cue that rules out a plain DFS answer.",
        "Define what the queue stores and what distance means at discovery.",
        "Choose mark-on-enqueue or mark-on-dequeue and defend the timing.",
        "Write the layer invariant and the unreachable return contract.",
        "Test source equals target, direct edge, duplicate edge, cycle, and unreachable target.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Attempt boundary", "Spend up to 13 minutes. Draw the queue by layer and record the distance assigned to each node on first discovery.")]
    end_page(s)

    s += page_heading(
        "Problem 2 / worked review",
        "First discovery is shortest only because edges cost the same",
        "BFS processes equal-cost edges in layers. Distance can double as the discovery marker, preventing duplicate queue entries and preserving the first shortest distance.",
    )
    s += [numbered_chain([
        ("Cue", "Minimum number of equal-cost directed edges."),
        ("Choice", "BFS from S with distance assigned before enqueue."),
        ("State", "Queue frontier plus distance map; no separate visited set needed."),
        ("Invariant", "Queued nodes have final shortest distance and leave in nondecreasing distance."),
    ]), spacer(10)]
    s += [code_block([
        "distance = {source: 0}",
        "queue = [source]",
        "while queue is not empty:",
        "    node = queue.pop_left()",
        "    if node == target: return distance[node]",
        "    for next in neighbors[node]:",
        "        if next in distance: continue",
        "        distance[next] = distance[node] + 1",
        "        queue.push_right(next)",
        "return -1",
    ]), spacer(10)]
    s += [grid_table(
        ["Layer", "First discoveries", "Frontier before layer", "Meaning"],
        [
            ["0", "S = 0", "[S]", "Source contract"],
            ["1", "A = 1, B = 1", "[A, B]", "Duplicate S -> B is ignored"],
            ["2", "C = 2, D = 2", "[C, D]", "C is not enqueued twice"],
            ["3", "T = 3", "[T]", "First T discovery proves minimum 3"],
        ],
        [54, 135, 116, 188],
        row_heights=[38, 38, 38, 38],
    ), spacer(9)]
    s += [two_cards(
        ("Near miss", "DFS may return a valid but longer path first. Marking only on dequeue lets duplicate edges add the same node repeatedly and can destabilize later state.", "Wrong guarantee"),
        ("Prompt change", "If edges carry unequal nonnegative costs, minimum edges is not minimum cost. Use a cost-aware method such as Dijkstra instead of plain BFS.", "Switch method"),
    ), spacer(8)]
    s += [callout("Complexity", "Each discovered vertex enters the queue once; every adjacency entry, including duplicates, is scanned once: O(V + E) time and O(V) space.")]
    end_page(s)

    dependency_nodes = {
        "0": (0.02, 0.65), "1": (0.25, 0.72), "2": (0.50, 0.78),
        "3": (0.71, 0.50), "4": (0.10, 0.16), "5": (0.38, 0.16),
        "6": (0.92, 0.17),
    }
    dependency_edges = [("0", "1"), ("1", "2"), ("2", "3"), ("3", "1"), ("4", "5")]
    s += page_heading(
        "Problem 3 / attempt first",
        "Detect a directed dependency cycle",
        "Edge direction is part of the contract: u -> v means u must finish before v. A cycle means at least one chain of work can never become complete.",
    )
    s += [callout(
        "Prompt",
        "Tasks are 0 through 6 with dependencies 0 -> 1, 1 -> 2, 2 -> 3, 3 -> 1, and 4 -> 5. Node 6 is isolated. Return whether every task can finish; if not, identify one blocking cycle.",
        warm=True,
    ), spacer(9)]
    s += [NetworkDiagram(dependency_nodes, dependency_edges, label="Directed prerequisite graph", directed=True, height=154), spacer(9)]
    s += [two_cards(
        ("Global fact", "A node may have been seen in an earlier, completely finished branch.", "Completed state"),
        ("Path-local fact", "A node may still be active in the current dependency chain.", "Visiting state"),
    ), spacer(9)]
    s += [p("Define the evidence before coding", H2), bullet_list([
        "Choose 3-color DFS or Kahn's indegree BFS and state why it exposes the evidence you need.",
        "If using DFS, define unseen, visiting, and done precisely.",
        "Name the exact edge event that proves a directed cycle.",
        "Handle a self-loop, a safe edge to a completed node, disconnected work, and an isolated node.",
        "State the dependency edge direction before interpreting any output.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Attempt boundary", "Spend up to 13 minutes. Save the color transition trace for the first cycle proof; do not rely on a single visited set.")]
    end_page(s)

    s += page_heading(
        "Problem 3 / worked review",
        "A back edge to the active path proves the cycle",
        "Three-color DFS distinguishes a safe edge to completed work from an edge that re-enters the dependency chain currently being explored.",
    )
    s += [NetworkDiagram(
        dependency_nodes,
        dependency_edges,
        label="Cycle evidence: 1 -> 2 -> 3 -> 1",
        directed=True,
        highlighted_edges=[("1", "2"), ("2", "3"), ("3", "1")],
        highlighted_nodes=["1", "2", "3"],
        height=118,
    ), spacer(6)]
    s += [numbered_chain([
        ("Enter", "Set the node to visiting when its DFS frame opens."),
        ("Explore", "Recurse on unseen work; an edge to visiting work proves a cycle."),
        ("Finish", "Mark done only after every outgoing edge is safe."),
        ("Scan", "Start from every unseen node to include disconnected work."),
    ]), spacer(6)]
    s += [code_block([
        "color = all UNSEEN; active = []; position = {}",
        "visit(node):",
        "    color[node] = VISITING; position[node] = len(active); active.push(node)",
        "    for next in neighbors[node]:",
        "        if color[next] == VISITING: return active[position[next]:] + [next]",
        "        if color[next] == UNSEEN:",
        "            cycle = visit(next); if cycle: return cycle",
        "    active.pop(); position.remove(node); color[node] = DONE; return []",
        "# scan every unseen node; any returned cycle blocks completion",
    ]), spacer(6)]
    s += [grid_table(
        ["Trace moment", "Colors / active path", "Conclusion"],
        [
            ["Enter 0, 1, 2, 3", "0, 1, 2, 3 are visiting", "Current path is 0 -> 1 -> 2 -> 3"],
            ["Inspect 3 -> 1", "1 is still visiting", "Back edge proves cycle 1 -> 2 -> 3 -> 1"],
            ["Return", "No need to finish remaining branches", "Not every dependency can complete"],
        ],
        [117, 184, 192],
        row_heights=[34, 34, 34],
    ), spacer(6)]
    s += [two_cards(
        ("Why one visited set fails", "It cannot distinguish completed work from a node still on the active path.", "Near miss"),
        ("Valid alternative", "Kahn's BFS removes zero-indegree nodes. If it removes fewer than V, a cycle remains.", "Comparison"),
    ), spacer(5)]
    s += [callout("Complexity", "Every node changes color at most twice and every directed edge is inspected once: O(V + E) time and O(V) color, active-path, position, and DFS-stack space.")]
    end_page(s)

    grid_rows = ["S.#..", "#.#.#", ".....", ".##.T"]
    worked_path = [(0, 0), (0, 1), (1, 1), (2, 1), (2, 2), (2, 3), (2, 4), (3, 4)]
    s += page_heading(
        "Problem 4 / attempt first",
        "Return one shortest route through a grid",
        "Four-direction moves have equal cost. The learner must return the route itself, not only prove reachability or report its length.",
    )
    s += [callout(
        "Prompt",
        "In the 4 x 5 grid, move through open cells using Right, Down, Left, Up as the fixed neighbor order. Return any shortest coordinate path from S to T, [S] when source equals target, and [] when unreachable.",
        warm=True,
    ), spacer(8)]
    s += [GridPathDiagram(grid_rows, label="Open cells are white; # cells are blocked", height=160), spacer(8)]
    s += [two_cards(
        ("Discovery contract", "The first time a cell is discovered, save exactly one parent and do not overwrite it.", "Stable parent"),
        ("Answer contract", "Backtrack from T to S through parent links, then reverse the collected coordinates.", "Reconstruction"),
    ), spacer(8)]
    s += [p("Before coding", H2), bullet_list([
        "Separate queue order, discovered cells, parent links, and the final path.",
        "Choose the exact moment a parent is assigned and a cell becomes discovered.",
        "State when it is safe to stop: target discovery or target dequeue.",
        "Test source equals target, blocked target, unreachable target, one corridor, and multiple shortest paths.",
        "Explain why fixed neighbor order stabilizes this example without proving a globally lexicographic path.",
    ], checklist=True, compact=True), spacer(3)]
    s += [p("Pre-code decision record", H2), grid_table(
        ["Decision", "Write this before implementation", "Quality check"],
        [
            ["Guarantee", "Minimum moves plus the coordinate route", "Reachability alone is insufficient"],
            ["Frontier + state", "FIFO queue; discovered cells; one stable parent", "Keep final path separate"],
            ["Invariant", "Each queued cell has a shortest parent chain from S", "Assign parent before enqueue"],
            ["Attempt trace", "Predict the first parent chain that reaches T", "Use stated neighbor order"],
            ["Boundaries", "[S] for same cell; [] if blocked or unreachable; tied routes allowed", "Never overwrite parents"],
        ],
        [78, 244, 171],
        row_heights=[27, 30, 30, 28, 35],
    )]
    end_page(s)

    s += page_heading(
        "Problem 4 / worked review",
        "Parent links turn a distance guarantee into a route",
        "BFS provides the minimum-edge guarantee. The parent map preserves the evidence needed to reconstruct one of the shortest paths.",
    )
    s += [GridPathDiagram(grid_rows, label="Worked shortest path; numbers show path order", path=worked_path, height=128), spacer(5)]
    s += [numbered_chain([
        ("Discover", "Queue S with parent[S] = none."),
        ("Assign once", "Set each unseen neighbor's parent before enqueue."),
        ("Stop safely", "First target discovery has minimum distance."),
        ("Reverse", "Follow T back to S, then reverse the chain."),
    ]), spacer(5)]
    s += [code_block([
        "parent = {source: none}; queue = [source]",
        "while queue is not empty and target not in parent:",
        "    cell = queue.pop_left()",
        "    for next in valid_neighbors(cell):",
        "        if next in parent: continue",
        "        parent[next] = cell; queue.push_right(next)",
        "if target not in parent: return []",
        "path = []; cell = target",
        "while cell is not none: path.append(cell); cell = parent[cell]",
        "reverse(path); return path",
    ]), spacer(5)]
    s += [grid_table(
        ["Evidence", "Worked result"],
        [
            ["Path", "(0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,2) -> (2,3) -> (2,4) -> (3,4)"],
            ["Length", "7 moves; eight coordinates including source and target"],
            ["Why shortest", "Every discovered cell receives its parent from the earliest reachable BFS layer"],
            ["Multiple answers", "Another equal-length route is valid if its parent chain follows the same first-discovery rule"],
        ],
        [105, 388],
        row_heights=[34, 30, 35, 35],
    ), spacer(5)]
    s += [two_cards(
        ("Near miss", "Overwriting a parent destabilizes the chain. DFS finds a route but may not find the fewest moves.", "What fails"),
        ("Prompt change", "Different cell costs require a cost-aware shortest-path method, not equal-layer BFS.", "Switch method"),
    ), spacer(5)]
    s += [callout("Complexity", "Each grid cell is discovered at most once and checks four neighbors: O(R x C) time and O(R x C) queue, parent, and output space.")]
    end_page(s)

    s += page_heading(
        "Cross-problem review",
        "Explain the decision, not only the code",
        "A strong answer links the prompt guarantee to frontier order, state meaning, visited timing, tests, and complexity. The method name alone is not evidence.",
    )
    s += [grid_table(
        ["Problem", "Decisive cue", "Traversal", "Extra state", "Invariant / proof"],
        [
            ["Components", "Finish every disconnected region", "DFS or BFS", "Global discovered + count", "Each unseen outer-loop start completes exactly one component"],
            ["Minimum edges", "Equal-cost shortest distance", "BFS", "Distance at discovery", "Queue order is nondecreasing shortest distance"],
            ["Dependency cycle", "Edge back to active directed path", "3-color DFS", "Unseen / visiting / done", "Visiting nodes are exactly the current recursion path"],
            ["Shortest route", "Minimum edges plus actual path", "BFS", "Stable parent at discovery", "First discovery supplies a shortest parent chain"],
        ],
        [82, 118, 69, 108, 116],
        row_heights=[58, 58, 58, 58],
    ), spacer(10)]
    s += [p("Use the 0 / 1 / 2 explanation rubric", H2), grid_table(
        ["Score", "Evidence standard", "What to improve"],
        [
            ["0 - absent", "Method is named after coding, or state meanings never appear", "Return to the prompt guarantee and define state before the loop"],
            ["1 - prompted / late", "Correct idea appears after a hint, failed trace, or unexplained change", "Move the decision to the cue that should trigger it"],
            ["2 - independent", "Cue, state, invariant, timing, tests, and complexity appear at the correct decision point", "Preserve the behavior and test it on an adjacent prompt"],
        ],
        [74, 242, 177],
        row_heights=[48, 48, 53],
    ), spacer(10)]
    s += [two_cards(
        ("Correct but silent", "Code returns the expected sample, but the learner cannot say why traversal order and state guarantee correctness.", "Weak evidence"),
        ("Interview-ready", "The learner predicts the approach, traces the state, tests a boundary, and explains what prompt change would invalidate it.", "Strong evidence"),
    ), spacer(8)]
    s += [callout("Correction sentence", "When I notice [cue], I will state [required guarantee], define [frontier and state], and name [invariant] before implementation so the choice is observable.")]
    end_page(s)

    s += page_heading(
        "Completion and next action",
        "Save four decisions and one correction",
        "The task is complete when each attempt has inspectable reasoning. A solved sample without cue, state, proof, tests, and a near miss is not yet useful interview evidence.",
    )
    s += [grid_table(
        ["Required attempt", "Completion proof", "Near-miss check"],
        [
            ["Connected components", "Count = 4; outer loop and discovery invariant explained", "Minimum-edge version would require BFS"],
            ["Shortest unweighted path", "Distance = 3; queue layers and mark-on-discovery shown", "Weighted edges require cost-aware search"],
            ["Directed dependency cycle", "False; cycle 1 -> 2 -> 3 -> 1 proved with visiting state", "One visited set is insufficient"],
            ["Shortest reconstructed route", "A 7-move path; stable parent chain reversed", "DFS does not guarantee minimum moves"],
        ],
        [126, 225, 142],
        row_heights=[58, 58, 58, 58],
    ), spacer(10)]
    s += [p("Common mistakes", H2), bullet_list([
        "Choosing BFS or DFS from a keyword instead of the required guarantee.",
        "Mixing frontier order, visited state, distance or color, parent, and final answer into one vague variable.",
        "Marking on dequeue and allowing duplicate work or parent overwrite.",
        "Using a single visited set for a directed active-path cycle.",
        "Starting from one node and forgetting disconnected components.",
        "Claiming O(V + E) without explaining the graph representation and stored edges.",
    ], compact=True), spacer(8)]
    s += [p("Completion check", H2), bullet_list([
        "All four prompts were attempted before the worked reviews were opened.",
        "Every solution records cue, traversal, state, invariant, three tests, complexity, and near miss.",
        "The component, layer, active-path, and parent-chain traces can be explained aloud.",
        "One repeated weak decision and one observable correction sentence are saved.",
        "The next practice problem is chosen to test the correction, not to add a new topic.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout(
        "Final talk track",
        "I choose [method] because the prompt requires [guarantee]. My frontier is [structure]; state means [definition]; invariant is [truth]. I mark discovery [when]. I will test [boundaries]. Complexity is [bound]. I would switch approaches if [prompt change].",
        warm=True,
    )]
    return s


def build_remote_compensation_offer_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Decision system",
        "Compare the whole offer, not the USD headline",
        "A remote offer is a bundle of cash, benefits, working conditions, contract terms, currency exposure, and career options. This workbook makes each part visible before you decide or negotiate.",
    )
    s += [callout(
        "Core idea",
        "Use one comparison date, one currency anchor, and one set of assumptions. Separate verified facts from estimates so a precise-looking total never hides uncertainty.",
    ), spacer(10)]
    s += [numbered_chain([
        ("Gate", "Remove any offer that fails a non-negotiable safety or work condition."),
        ("Normalize", "Put cash, benefits, costs, and time on the same annual basis."),
        ("Stress-test", "Change the uncertain inputs and see whether the decision survives."),
        ("Negotiate", "Ask for the few changes that can actually alter the result."),
    ]), spacer(12)]
    s += [p("Write the decision before scoring", H2), two_cards(
        ("Decision statement", "By [date], choose the offer that best supports [12-24 month goal] while meeting [must-have conditions] and keeping [named risk] within an acceptable range.", "Use"),
        ("Comparison boundary", "Offers A and B, evaluated on the same date, with figures converted using the same planning rate and only written terms treated as facts.", "Control"),
    ), spacer(10)]
    s += [p("Three evidence labels", H2), grid_table(
        ["Label", "Meaning", "How to record it"],
        [
            ["Verified", "Written in the offer, benefits document, or contract.", "Quote the clause or attach the source and date."],
            ["Estimated", "A reasonable planning input that is not guaranteed.", "Record the basis, range, owner, and next check."],
            ["Unknown", "Material information is missing or ambiguous.", "Turn it into a named employer or adviser question."],
        ],
        [76, 190, 217],
    ), spacer(10)]
    s += [callout("Boundary", "This workbook is educational. It does not determine employment status or provide tax, legal, investment, or currency advice. Use qualified India-specific advisers for personal conclusions.", warm=True)]
    end_page(s)

    s += page_heading(
        "Step 1",
        "Identify the engagement model",
        "The same headline amount can produce very different obligations and protections. Confirm who employs or contracts with you, who pays you, and which promises are enforceable in writing.",
    )
    s += [grid_table(
        ["Question", "Direct employee", "Employee through EOR", "Independent contractor"],
        [
            ["Legal relationship", "You are employed by the hiring entity or its local entity.", "A local employer-of-record employs you and supplies services to the client.", "You or your business supplies services under a commercial contract."],
            ["Pay evidence", "Offer, payroll terms, payslip, and benefit documents.", "Offer and local employment terms from the EOR; client promises should also be written.", "Signed services agreement, statement of work, invoice terms, and payment method."],
            ["Time off", "Confirm paid leave, holidays, and approval rules.", "Confirm local policy, client policy, and which one controls.", "Assume time off is unpaid unless the contract says otherwise."],
            ["Protection to verify", "Notice, termination, benefits, probation, and policy coverage.", "Employer identity, client assignment ending, transfer, notice, and benefit continuity.", "Termination, notice, liability, IP, exclusivity, disputes, and invoice remedies."],
            ["Operating reality", "Manager, review cycle, payroll, and working hours.", "Split responsibilities between EOR and client; escalation path matters.", "Deliverables, acceptance, availability, on-call, expenses, and scope changes."],
        ],
        [93, 130, 130, 130],
        font_size=7.2,
    ), spacer(10)]
    s += [p("Ask until the relationship is unambiguous", H2), bullet_list([
        "What is the exact legal name and country of the entity signing with me?",
        "Am I an employee, an EOR employee, or an independent contractor in the written agreement?",
        "Who owns payroll or invoicing problems, benefits questions, performance management, and termination?",
        "What happens if the client ends its relationship with the EOR or changes providers?",
        "Which document controls if a recruiter message conflicts with the final agreement?",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Do not infer", "A company laptop, full-time schedule, or monthly payment does not by itself answer the legal classification question. Record the written model and obtain qualified advice when the reality and paperwork appear inconsistent.")]
    end_page(s)

    s += page_heading(
        "Step 2",
        "Normalize cash without false precision",
        "Build an annual planning view, but keep guaranteed cash, probability-weighted cash, and speculative upside separate. Never add an uncertain promise to base pay as if both were equally reliable.",
    )
    s += [code_block([
        "Guaranteed annual cash = fixed pay + guaranteed allowances",
        "Probable annual cash   = guaranteed cash + (target bonus x confidence)",
        'Contractor planning cash = expected receipts - business costs - payment/FX costs',
        "Planning INR value = USD cash x chosen planning rate",
    ]), spacer(11)]
    s += [grid_table(
        ["Component", "Record", "Do not assume"],
        [
            ["Base or retainer", "Currency, pay frequency, start date, review date, and any guaranteed minimum.", "A monthly number always means twelve paid months or survives a pause."],
            ["Bonus or commission", "Target, eligibility, measurement period, payout date, first-year proration, and history.", "Target equals expected payout or is guaranteed."],
            ["Sign-on or retention", "Vesting, repayment trigger, tax treatment to verify, and leaving date risk.", "A one-time payment should be compared with recurring base."],
            ["Equity", "Instrument, quantity, vesting, exercise rules, liquidity, expiry, and written valuation evidence.", "An internal valuation is cash or a future sale is certain."],
            ["Overtime or on-call", "Whether paid, expected frequency, rate, and time-off recovery.", "Availability outside overlap hours is rare because the recruiter said so."],
        ],
        [100, 203, 180],
        font_size=7.25,
    ), spacer(9)]
    s += [p("Confidence rule", H2), two_cards(
        ("Guaranteed", "Include at 100 percent only when the amount and condition are written and the condition is already satisfied.", "High confidence"),
        ("Variable", "Use a range or explicit confidence such as 0, 50, and 100 percent. Keep it visible beside the total.", "Uncertain"),
    ), spacer(9)]
    s += [callout("Equity rule", "Show equity as a separate scenario, not as salary. A useful decision can say Offer A wins on cash even if Offer B has uncertain upside.", warm=True)]
    end_page(s)

    s += page_heading(
        "Step 3",
        "Price benefits, unpaid time, and replacement costs",
        "A contractor premium is not extra money until it covers the protections and costs that moved from the employer to you. Use your real replacement cost, not a generic percentage.",
    )
    s += [grid_table(
        ["Area", "Employee or EOR evidence", "Contractor replacement question"],
        [
            ["Paid time off", "Days, public holidays, sick leave, carryover, and first-year eligibility.", "How many non-billable days will I reserve for leave, illness, holidays, and administration?"],
            ["Health cover", "People covered, limits, exclusions, waiting periods, and effective date.", "What policy or emergency reserve would I buy for the same practical protection?"],
            ["Retirement and insurance", "Employer contributions and scheme documents; confirm actual eligibility.", "What saving and protection must I fund independently?"],
            ["Equipment and workspace", "Laptop, repair, replacement, internet, coworking, and security requirements.", "Which purchase, depreciation, support, or security cost remains mine?"],
            ["Administration", "Payroll, statutory records, and employer support path.", "Accountant, invoicing, record keeping, banking, compliance review, and collection time."],
            ["Income continuity", "Notice, severance or policy terms, and benefit end date to verify.", "Bench reserve, delayed payment buffer, termination notice, and client concentration."],
        ],
        [95, 194, 194],
        font_size=7.2,
    ), spacer(10)]
    s += [p("Convert unpaid days carefully", H2), code_block([
        'Day-billed expected receipts = written day rate x expected paid days',
        'If quoting full-capacity annual value: day rate = value / capacity days',
        'Subtract non-billable days only if the starting value includes those days',
    ]), spacer(9)]
    s += [two_cards(
        ("Avoid double counting", 'If B is a guaranteed annual retainer paid regardless of leave, or USD90,000 already represents expected receipts after time off, do not subtract the same days again. Derive revenue from the written billing model before comparing.', "Check"),
        ("Value access, not labels", "A benefit name has zero decision value until you confirm eligibility, coverage, start date, and practical use.", "Check"),
    ), spacer(9)]
    s += [callout("Personalize", "Replacement cost depends on dependants, health needs, existing cover, savings, and risk tolerance. Record your source and range instead of copying someone else's contractor uplift.")]
    end_page(s)

    s += page_heading(
        "Step 4",
        "Make currency and payment risk visible",
        "Do not predict one exchange rate. Choose a documented planning rate, then test a stronger-rupee and weaker-rupee case while separating market movement from fees and payment failure.",
    )
    s += [numbered_chain([
        ("Anchor", "Record the source, timestamp, and rate used for the main comparison."),
        ("Range", "Run at least three rates; treat them as sensitivity cases, not forecasts."),
        ("Friction", "Separate provider spread, transfer fee, receiving fee, and conversion timing."),
        ("Control", "Decide which party bears late-payment and currency-conversion choices."),
    ]), spacer(12)]
    s += [worked_example_table(
        ['Scenario', 'USD annual cash', 'Planning rate', 'Gross INR view', 'What it tests'],
        [['Stronger INR',
  'USD 72,000',
  'INR 80 / USD',
  'INR 5,760,000',
  'Lower rupee value for the same USD cash.'],
 ['Planning',
  'USD 72,000',
  'INR 85 / USD',
  'INR 6,120,000',
  'Common illustrative anchor; not a current market quote.'],
 ['Weaker INR',
  'USD 72,000',
  'INR 90 / USD',
  'INR 6,480,000',
  'Upside scenario, not guaranteed income.']],
        [78, 86, 78, 93, 148],
    ), spacer(10)]
    s += [p("These hypothetical rates apply only to USD-exposed cash. Offer A's fixed INR payroll does not move with this sensitivity; its USD equivalent is only a comparison anchor.", BODY_SMALL), spacer(8)]
    s += [p("Payment-path checklist", H2), bullet_list([
        "Invoice currency, due date, acceptance condition, and late-payment remedy are written.",
        "Transfer platform, bank fees, FX spread, intermediary deductions, and who pays each cost are known.",
        "A small test payment confirms beneficiary details before a material invoice is due.",
        "You know what evidence the bank, accountant, or adviser needs you to retain.",
        "A buffer covers at least one realistic delay; the comparison records the chosen buffer, not a universal rule.",
    ], checklist=True, compact=True), spacer(8)]
    s += [callout("Keep two risks separate", "Exchange-rate movement changes the INR value of valid payment. Payment risk is the chance that money arrives late, short, disputed, or not at all. They need different controls.", warm=True)]
    end_page(s)

    s += page_heading(
        "Step 5",
        "Compare the operating reality",
        "A high-paying role can be a poor offer if the written schedule, on-call burden, decision access, or manager relationship makes the work unsustainable. Score the actual operating system, not the remote label.",
    )
    s += [grid_table(
        ["Dimension", "Evidence to request", "Decision question"],
        [
            ["Time-zone overlap", "Named hours, daylight-saving impact, meeting distribution, and escalation exceptions.", "How often will work cross my protected hours, and who can change the expectation?"],
            ["On-call and incidents", "Rotation size, pages, severity, compensation or recovery, and backup coverage.", "What does a bad week look like, and how often does it occur?"],
            ["Leave in practice", "Approval path, blackout periods, team coverage, and actual use.", "Can I use the stated leave without creating an invisible performance penalty?"],
            ["Manager and feedback", "Reporting line, review cadence, first 90-day outcomes, and promotion ownership.", "Who decides whether I am succeeding, and what evidence will they use?"],
            ["Scope and learning", "First projects, decision authority, technical surface, mentorship, and roadmap access.", "Will this role produce stronger evidence for my next target?"],
            ["Remote support", "Equipment, security, travel, coworking, communication norms, and local escalation.", "Which failure or expense becomes mine because I am remote?"],
        ],
        [93, 208, 182],
        font_size=7.2,
    ), spacer(10)]
    s += [p("Turn vague promises into observable terms", H2), two_cards(
        ("Vague", "Flexible hours, strong growth, generous equity, global team, and unlimited leave.", "Promise"),
        ("Observable", "Three overlap hours, monthly career review, written grant terms, six-person rotation, and named equipment budget.", "Evidence"),
    ), spacer(10)]
    s += [callout("Career value", "Do not force career value into rupees. Score it separately using evidence: scope you will own, decisions you can make, systems you will touch, feedback quality, and the stories you can later defend.")]
    end_page(s)

    s += page_heading(
        "Step 6",
        "Inspect the contract and compliance questions",
        "Your job is not to become a lawyer or tax adviser. Your job is to spot terms that can change value or risk, record the uncertainty, and route the exact question to the right owner.",
    )
    s += [grid_table(
        ["Term", "What to locate", "Question to ask"],
        [
            ["Payment", "Amount, currency, invoice trigger, due date, acceptance, expenses, withholding, and dispute path.", "What event starts the payment clock, and what happens if payment is late or short?"],
            ["Termination", "Notice for each side, immediate triggers, pay through notice, final invoice, and benefit end date.", "Which amounts survive termination, and can the client end an EOR assignment without the same notice?"],
            ["IP and confidentiality", "Background IP, work product, open source, side projects, inventions, and confidentiality duration.", "Does the language reach work created outside the engagement or tools I already own?"],
            ["Liability and indemnity", "Caps, exclusions, insurance expectations, data/security obligations, and defence control.", "Is my downside bounded and proportionate to the fees and control I have?"],
            ["Exclusivity and restrictions", "Other clients, moonlighting, non-solicit, non-compete, geography, and duration.", "Which real future work would this prevent?"],
            ["Law and disputes", "Governing law, venue, arbitration, language, costs, and notice method.", "How would I practically enforce or defend this term from India?"],
        ],
        [95, 204, 184],
        font_size=7.05,
    ), spacer(9)]
    s += [p("Route the question", H2), grid_table(
        ["Owner", "Best used for"],
        [
            ["Employer or recruiter", "Missing package facts, policy documents, operating expectations, and written amendments."],
            ["Qualified legal adviser", "Classification, enforceability, IP, liability, restrictions, governing law, and disputes."],
            ["Qualified tax or accounting adviser", "Personal tax, GST, invoicing, withholding, records, deductions, and entity choices."],
            ["Bank or authorized payment provider", "Receiving requirements, fees, conversion, remittance evidence, and payment tracing."],
        ],
        [128, 355],
        font_size=7.4,
    ), spacer(8)]
    s += [callout("Red flag", "A promise is not resolved because someone says it is standard. Ask where it appears in the document and whether an authorized person can amend the term in writing.", warm=True)]
    end_page(s)

    s += page_heading(
        "Step 7",
        "Use gates before weights",
        "A weighted score can make an unacceptable offer look attractive. Remove or escalate any offer that fails a must-have condition before assigning preference weights.",
    )
    s += [p('Worked must-have checks', H2), worked_example_table(
        ['Must-have condition', 'Evidence or clause', 'A', 'B', 'Action if unclear'],
        [['Legal engagement and payer are clear',
  'A: local EOR contract. B: services agreement and named payer.',
  'Pass',
  'Pass',
  'Verify entity, authority, and payment owner before signing.'],
 ['Minimum cash and pay timing',
  'A: USD72k equivalent on written INR payroll. B: day-rate capacity; no annual minimum.',
  'Pass',
  'Review',
  'Confirm billable-day basis and payment trigger, not headline alone.'],
 ['Sustainable overlap and on-call',
  'A: three protected hours. B: five hours and unclear incident availability.',
  'Pass',
  'Hold',
  'Require a written sustainable schedule and escalation boundary.'],
 ['Acceptable termination and downside',
  'A: verified notice. B: 14-day termination.',
  'Pass',
  'Hold',
  'Request longer notice or a funded exit buffer acceptable to the learner.'],
 ['IP and restrictions acceptable',
  'A: review complete in this fictional case. B: background-IP clause unresolved.',
  'Pass',
  'Hold',
  'Route clause to qualified adviser; do not let a high score override it.']],
        [142, 151, 42, 42, 106],
    ), spacer(11)]
    s += [p('Provisional preference comparison', H2), worked_example_table(
        ['Dimension', 'Weight 1-5', 'Offer A 1-5', 'Offer B 1-5', 'Evidence and confidence'],
        [['Normalized cash',
  '5',
  '3',
  '3',
  'A72k vs B72.6k in 30-day base case: near tie, not B headline win. Medium confidence.'],
 ['Benefit certainty / access',
  '3',
  '4',
  '2',
  'Coverage access, eligibility and continuity: A verified; B policy not secured. Cost is already in cash. Medium.'],
 ['Operating sustainability',
  '5',
  '4',
  '2',
  'Three protected versus five unclear overlap hours. B cannot pass gate yet.'],
 ['Contract / payment risk',
  '5',
  '4',
  '2',
  'B short notice and no annual minimum; source is sample contract terms.'],
 ['Role scope / career value',
  '3',
  '3',
  '4',
  'B architecture scope attractive; manager and review path still unconfirmed. Low.']],
        [132, 70, 70, 70, 141],
    ), spacer(9)]
    s += [p("Multiply each rating by its weight and add: A = 76/105; B = 53/105 (maximum 5 x 21). These are subjective preferences, not probabilities or market benchmarks. Cash already deducts B's estimated benefit replacement cost; the benefit row assesses access and certainty, not that cost twice. B's unresolved gates still prevent acceptance regardless of its score.", BODY_SMALL), spacer(8)]
    s += [callout("Scoring rule", "Write the evidence before the score. If two offers are within the uncertainty range, call the result close and prioritize the missing facts instead of pretending the decimal total decides.")]
    end_page(s)

    s += page_heading("Worked example", 'Calculate the difference, then test what could reverse it', 'Fictional A is a USD72,000-equivalent EOR salary. B is USD90,000 gross capacity at 260 day-billed days, not a guaranteed retainer. All amounts below are before personal tax and FX; A benefits are considered separately.')
    s += [grid_table(
        ["Input", "Offer A: EOR employee", "Offer B: contractor"],
        [
            ["Written fixed cash", 'USD 72,000 equivalent on fixed INR payroll in this example', 'USD 90,000 capacity at 260 day-billed days; no guaranteed minimum'],
            ["Paid time", "20 leave days plus stated holidays", "No paid time; learner plans 30 non-billable days"],
            ["Benefits", "Medical cover and employer retirement contribution; eligibility verified", "Learner estimates USD 4,000 replacement cost"],
            ["Business and payment cost", "No separate estimate", "USD 3,000 administration, tools, and payment friction"],
            ["Termination", "Written notice; terms verified", "Client may terminate in 14 days"],
            ["Working hours", "Three protected overlap hours", "Five overlap hours plus an unclear incident expectation"],
            ["Career evidence", "Clear ownership of one service", "Broader architecture scope, but manager and review path unclear"],
        ],
        [123, 180, 180],
        font_size=7.15,
    ), spacer(9)]
    s += [code_block(['B day rate = 90,000 / 260 = USD 346.1538',
 '30 non-billable days = 30 x 346.1538 = USD 10,384.62',
 'B base = 90,000 - 10,384.62 - 4,000 - 3,000 = USD 72,615.38',
 'A fixed salary = USD 72,000 equivalent; B cash difference = USD 615.38',
 '45 non-billable days: B = 90,000 - 15,576.92 - 7,000 = USD 67,423.08',
 'Stress-case B minus A = -USD 4,576.92']), spacer(9)]
    s += [two_cards(
        ("Base case", 'The apparent USD18,000 headline premium shrinks to USD615 after the stated unpaid days and replacement costs. Treat this as close: small estimate changes outweigh the difference. B remains on hold while schedule, termination, and IP questions are unresolved.', "Provisional"),
        ("Stress case", 'At 45 non-billable days, B falls below A on this planning cash view. This is a sensitivity assumption, not a prediction. A payment delay changes liquidity and buffer needs; do not count it as lost income unless there is an actual loss assumption.', "Sensitivity"),
    ), spacer(9)]
    s += [callout("Lesson", "The correct output is not EOR always wins or contractor always wins. It is: here is the current choice, the assumptions holding it up, and the exact fact that could reverse it.", warm=True)]
    end_page(s)

    s += page_heading(
        "Step 8",
        "Negotiate the gap that changes the decision",
        "Do not send a list of everything that could improve. Use the comparison to identify one to three gaps, explain why they matter, and propose alternatives the employer can actually approve.",
    )
    s += [grid_table(
        ["Gap", "Evidence", "Primary ask", "Possible trade"],
        [
            ["Contractor carries benefit and leave cost", "Replacement-cost worksheet", "Higher fixed fee or paid closure days", "Longer commitment or defined delivery scope"],
            ["Currency or fee uncertainty", "Payment-path and scenario check", "USD denomination, fee coverage, or clearer conversion rule", "Different payment schedule"],
            ["Termination downside", "Notice and continuity comparison", "Longer notice or termination payment", "Shorter initial term with mutual review"],
            ["Overlap burden", "Written calendar and team evidence", "Protected hours or rotating late meetings", "A smaller fixed overlap window"],
            ["Cash gap", "Normalized guaranteed-cash comparison", "Base, sign-on, or guaranteed first-year component", "Title, start date, or review checkpoint if cash is fixed"],
        ],
        [105, 128, 130, 120],
        font_size=7.15,
    ), spacer(10)]
    s += [p('Worked negotiation priorities', H2), worked_example_table(
        ['Priority', 'Target', 'Evidence-based rationale', 'Fallback', 'Walk-away boundary'],
        [['1: hours',
  'Three protected overlap hours',
  "Five hours plus undefined incidents exceeds this fictional learner's sustainable schedule.",
  'Rotating late meeting plus a defined incident rota.',
  'No open-ended daily availability.'],
 ['2: continuity',
  '30-day notice or equivalent termination payment',
  "14 days is below this learner's planned transition buffer.",
  'Short initial term with funded notice on early exit.',
  'No unbounded interruption without a realistic cash buffer.'],
 ['3: package',
  'Higher day rate or paid closure days',
  'At 30 unpaid days, B normalizes to USD72,615 before personal tax; premium over A nearly disappears.',
  'Contracted minimum billable days or explicit paid closure allowance.',
  'Do not count non-guaranteed work as annual guaranteed cash.']],
        [80, 82, 160, 82, 79],
    ), spacer(9)]
    s += [callout("Talk track", 'Fictional negotiation: I am interested in owning the architecture work. Five overlap hours plus an undefined incident window is not sustainable for me. Could we agree on three protected hours and a written incident rota? A rotating late meeting could be an alternative.', warm=True)]
    end_page(s)

    s += page_heading('Completed comparison', 'Read the whole offer on one evidence page', 'This fictional comparison carries the same A and B offers through cash, costs, risk, working reality, and uncertainty. It is an example of method, not a recommended offer or personal advice.')
    s += [worked_example_table(
        ['Decision input', 'Offer A', 'Offer B', 'Source / confidence / next check'],
        [['Engagement / signing entity',
  'Local EOR employee; written model verified.',
  'Independent contractor; named services-agreement payer.',
  'Fictional contracts; verify classification for real facts.'],
 ['Annual cash basis',
  'USD72,000 equivalent on fixed local payroll.',
  'USD90,000 gross capacity at 260 day-billed days; not a guarantee.',
  'Offer and rate schedule; confirm minimum billable days.'],
 ['Variable cash',
  'No bonus counted in example.',
  'No bonus counted in example.',
  'Keep any real target payout separate from fixed cash.'],
 ['Equity',
  'Excluded from cash comparison.',
  'Excluded from cash comparison.',
  'If offered, obtain grant terms and model separately.'],
 ['Time / replacement cost',
  '20 paid leave days; eligibility verified.',
  '30 non-billable days + USD4k benefits + USD3k operating costs.',
  'B estimates; collect quotes and avoid subtracting leave twice.'],
 ['FX / payment cases',
  'INR payroll fixed by written offer; USD figure is comparison anchor.',
  'USD invoices exposed to conversion and collection delay.',
  'Use actual payment terms; hypothetical rates are not forecasts.'],
 ['Termination / contract',
  'Notice terms verified in this example.',
  '14-day exit and unresolved background-IP clause.',
  'B on hold pending written terms and qualified review.'],
 ['Hours / sustainability',
  'Three protected overlap hours.',
  'Five hours plus unclear incident expectation.',
  'Written rota and exception policy needed for B.'],
 ['Scope / career evidence',
  'Own one service; manager and review path clear.',
  'Broader architecture scope; review path uncertain.',
  'Ask for first-90-day decisions and success evidence.']],
        [104, 119, 130, 130],
    ), spacer(10)]
    s += [callout("Provisional decision", 'In this fictional case A is provisionally preferred for predictable cash and working hours. Reopen B only after its schedule and contract gates clear and its normalized package remains stronger under realistic time-off assumptions.')]
    end_page(s)

    s += page_heading(
        "Decision memo",
        "Close with evidence, uncertainty, and action",
        "A useful decision memo is short enough to reread before signing and specific enough to show what you verified, what remains uncertain, and why the choice still makes sense.",
    )
    s += [worked_example_table(
        ['Memo field', 'Completed example'],
        [['Decision',
  'In this fictional comparison, choose A provisionally; do not accept B while its must-have schedule '
  'and contract questions remain unresolved.'],
 ['Why',
  "A has a written salary, verified operating boundary, and clear manager. B's normalized base-case "
  'cash advantage is only USD615 before personal tax and FX.'],
 ['Trade-off accepted',
  'Accept narrower architecture scope in exchange for a more predictable operating and payment '
  'arrangement; seek growth evidence in the first-90-day plan.'],
 ['Uncertainty',
  "B's 30 non-billable days, USD4k benefit replacement, and USD3k operating cost are estimates. At 45 "
  'days its planning cash falls below A.'],
 ['Reversal condition',
  'Reopen B if sustainable hours, acceptable exit/IP terms, a clear manager, and a reliably higher '
  'normalized package are documented. A higher headline alone is insufficient.'],
 ['Next action',
  'Before a real decision, obtain final authorized documents, current cost quotes, and qualified '
  'advice on personal tax, classification, and contract implications.']],
        [126, 357],
    ), spacer(11)]
    s += [p("Before you sign", H2), bullet_list([
        "The signing entity, engagement model, payment path, start date, and first payment date agree across documents.",
        "Every negotiated change appears in the final written offer, contract, or authorized amendment.",
        "A qualified adviser has reviewed the personal legal, tax, GST, or classification questions you identified.",
        "You retained the offer, policy documents, contract version, written answers, calculations, sources, and comparison date.",
        "You reread termination, IP, liability, restrictions, governing law, confidentiality, and dispute terms in the final version.",
        "You know the first-week contacts for manager, HR or EOR, payroll or invoicing, security, and equipment support.",
    ], checklist=True, compact=True), spacer(9)]
    s += [callout("Action", "Choose one real offer or two fictional offers. Complete the evidence labels first, run three sensitivity cases, write the reversal condition, and only then draft the negotiation ask.", warm=True)]
    end_page(s)

    s += page_heading(
        "Source discipline",
        "Verify dated and personal questions at the source",
        "The framework is durable; tax rules, forms, benefits, payment methods, fees, and contract effects can change. Use the official starting points below and obtain advice for your facts.",
    )
    s += [grid_table(
        ["Starting point", "Use it to verify", "Official URL"],
        [
            ["Income Tax Department", "Current forms, filing services, tax calendar, AIS, and official help material.", "https://www.incometax.gov.in/"],
            ["GST portal", "Current registration, returns, taxpayer services, notifications, and official learning resources.", "https://www.gst.gov.in/"],
            ["Reserve Bank of India", "Official foreign-exchange information and regulated banking or remittance guidance.", "https://www.rbi.org.in/"],
            ["Employees' Provident Fund Organisation", "Current scheme information and member or employer services where relevant.", "https://www.epfindia.gov.in/"],
        ],
        [122, 203, 158],
        font_size=7.2,
    ), spacer(10)]
    s += [p("Record the evidence, not only the link", H2), bullet_list([
        "Source title, publisher, URL or document name, and the date you checked it.",
        "The exact question the source answers and the part that still needs interpretation.",
        "The qualified adviser or employer owner responsible for applying it to your situation.",
        "A refresh date for any figure, fee, rule, policy, or market-dependent assumption.",
    ], checklist=True), spacer(8)]
    s += [p("Quick recap", H2), numbered_chain([
        ("Facts", "Treat only written, current terms as verified."),
        ("Value", "Normalize cash and replacement costs without hiding ranges."),
        ("Risk", "Stress-test currency, payment, contract, and operating assumptions."),
        ("Choice", "Name the decision, trade-off, reversal condition, and next action."),
    ]), spacer(10)]
    s += [callout("Final takeaway", "The best offer is not the one with the largest converted number. It is the one whose verified value, working reality, downside, and career path best fit your decision boundary - and whose uncertainty you can explain honestly.")]
    s += [spacer(10), callout("Apply the method to your own evidence", 'Using actual written offers: label every input verified, estimated, or unknown; normalize cash on a stated billing basis; run a time-off and FX sensitivity; resolve must-have gates; then write the decision and what would reverse it.')]
    return s


def build_behavioral_bank_story() -> list[Flowable]:
    source = (Path(__file__).parent / "learning-materials" / "behavioral-question-bank.md").read_text(encoding="utf-8")
    story: list[Flowable] = []
    question: list[Flowable] = []

    def flush_question() -> None:
        if question:
            story.append(KeepTogether(question[:]))
            question.clear()

    for block in source.strip().split("\n\n"):
        block = block.strip()
        if block.startswith("# ") or block.startswith("## InterviewRunway /"):
            continue
        if block.startswith("## "):
            flush_question()
            story += [CondPageBreak(150), spacer(7), p(html.escape(block[3:]), H2)]
        elif block.startswith("### "):
            flush_question()
            title = block[4:]
            heading = p(html.escape(title), H3)
            if title.split(".", 1)[0].isdigit() or title == "A completed evidence card":
                question.append(heading)
            else:
                story += [CondPageBreak(90), heading]
        elif block.startswith("- "):
            flush_question()
            story += [bullet_list([html.escape(line[2:]) for line in block.splitlines() if line.startswith("- ")], checklist=True), spacer(8)]
        else:
            content = [p(html.escape(block.replace("\n", " ")), BODY), spacer(7)]
            (question if question else story).extend(content)
    flush_question()
    return story


def build_architecture_narrative_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Make the level signal visible",
        "An architecture story is a decision record spoken aloud",
        "A strong Senior-to-Staff narrative lets the listener inspect the system constraint, the expensive decision, your authority boundary, the people you influenced, and the consequence that persisted after launch. The comparison below is a fictional teaching example; replace every fact, date, metric, and ownership claim with your own verified evidence.",
    )
    s += [callout(
        "Core idea",
        "Do not narrate every component equally. Lead with the choice that was costly to reverse, then use architecture, influence, and outcome evidence to prove why it mattered.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Pressure", "Name the user, operating, or business constraint that forced a decision."),
        ("Decision", "State the options, the chosen path, the accepted cost, and what would reverse it."),
        ("Influence", "Show whose behavior or plan had to change and how alignment was earned."),
        ("Consequence", "Connect the decision to a measured result, durable mechanism, and honest limit."),
    ]), spacer(11)]
    s += [p("What the listener must be able to repeat", H2), bullet_list([
        "The system problem and the non-negotiable constraint.",
        "The primary decision you personally shaped, not just the final architecture.",
        "The strongest rejected alternative and the trade-off you accepted.",
        "The stakeholder tension, decision owner, and influence move that changed the path.",
        "The baseline, observation window, result, and limit of the evidence.",
    ], checklist=True)]
    s += [p("Fictional micro-example: project tour versus staff-level narrative", H2), grid_table(
        ["Signal", "Weak version", "Decision-led version"],
        [
            ["Opening", "We rebuilt the platform with several services.", "A 40-minute recovery target could not survive the shared database failure domain."],
            ["Ownership", "We decided to migrate.", "I framed the decision, tested two alternatives, and brought the final owner an evidence-backed recommendation."],
            ["Trade-off", "The new design scaled better.", "We accepted duplicate processing during retry and paid the cost with idempotency plus reconciliation."],
            ["Outcome", "Reliability improved a lot.", "Recovery fell from 38 to 11 minutes across six observed incidents; low-volume tenants were not yet tested."],
        ],
        [78, 176, 239],
    )]
    end_page(s)

    s += page_heading(
        "Choose the right story",
        "Select for decision density, not project size",
        "The best narrative contains a real fork in the road, observable ownership, cross-boundary coordination, and evidence after the change. A famous project with no decision tension is usually weaker.",
    )
    s += [grid_table(
        ["Selection test", "What qualifies", "What weakens the story"],
        [
            ["Decision", "Two credible paths existed and each carried a cost.", "The answer was obvious or dictated before you entered."],
            ["Personal scope", "You framed, recommended, tested, sequenced, or changed the decision.", "Your role cannot be separated from the team summary."],
            ["Influence", "Another team, leader, or function changed a commitment or behavior.", "Only your direct reports needed instruction."],
            ["Consequence", "A user, operating, delivery, or organizational result was observed.", "Only implementation completion is available."],
            ["Truth boundary", "Sources, dates, estimates, and unknowns can be stated precisely.", "The story requires invented scale, causality, or ownership."],
        ],
        [92, 210, 191],
    ), spacer(10)]
    s += [p("Candidate story comparison", H2)]
    s += worked_example_table(
        ["Candidate", "Decision tension", "Influence evidence", "Outcome evidence", "Choice"],
        [
            ["A: notification migration", "Dual-write speed versus one source of truth", "Three consuming teams changed adoption sequence", "Six-week delivery and on-call trend", "Primary"],
            ["B: dashboard rewrite", "Library choice after direction was set", "One local team", "Launch completed; adoption not measured", "Backup"],
        ],
        [98, 128, 110, 99, 58],
    )
    s += [two_cards(
        ("Use a backup story", "Keep a second story with a different decision type: reliability, migration, cost, platform adoption, or operating model. It protects against a probe that makes the primary story a poor fit.", "Coverage"),
        ("Reject an unsafe story", "Do not use confidential architecture, another person's decision, unverified impact, or a story whose evidence cannot be separated from later unrelated work.", "Boundary"),
    )]
    end_page(s)

    s += page_heading(
        "Build the decision spine",
        "Make the irreversible choice easy to inspect",
        "Treat the narrative as a compact architecture decision record. Supporting components belong only when they explain a constraint, a trade-off, a failure path, or the measured consequence.",
    )
    s += [numbered_chain([
        ("Contract", "Users, guarantee, scale, and decision deadline."),
        ("Constraint", "The pressure that eliminated the default path."),
        ("Options", "Two credible alternatives evaluated on the same criteria."),
        ("Choice", "Decision, accepted cost, safeguards, and owner."),
        ("Reversal", "Evidence or condition that would trigger a different path."),
    ]), spacer(10)]
    s += [grid_table(
        ["Layer", "Question to answer", "Evidence to carry", "Red flag"],
        [
            ["Contract", "What had to remain true for users and operators?", "SLO, data rule, volume band, deadline", "Starting with services and tools"],
            ["Constraint", "Which limit made the choice non-trivial?", "Failure history, cost, coupling, compliance, migration window", "Calling every requirement critical"],
            ["Options", "Why were both paths plausible?", "Same criteria, test result, prototype, operating cost", "A straw-man rejected option"],
            ["Choice", "What did you choose and pay for?", "Accepted risk, mitigation, decision owner, sequence", "Only describing benefits"],
            ["Reversal", "When would the decision stop being correct?", "Threshold, new fact, review date, exit path", "Pretending the choice is permanent"],
        ],
        [67, 145, 173, 108],
    ), spacer(9)]
    s += [two_cards(
        ("Rejected alternative", "Represent the strongest alternative fairly. Name what it optimized, why it lost under the current constraints, and the future condition under which it could win.", "Decision quality"),
        ("Accepted cost", "Every credible decision spends something: latency, complexity, migration time, consistency, money, or team attention. State the cost before the interviewer has to ask.", "Trade-off"),
    )]
    end_page(s)

    s += page_heading(
        "Carry architecture evidence",
        "Connect each component to a reason",
        "A diagram is useful only when the learner can explain the system before and after the decision, the invariant that protects correctness, and what happens when the happy path breaks.",
    )
    s += [grid_table(
        ["Architecture evidence", "Minimum useful explanation", "Proof or artifact"],
        [
            ["Before state", "Where state lived, the critical flow, and the recurring failure or delivery cost.", "Incident timeline, delivery lead time, dependency map"],
            ["After state", "What changed in ownership, data flow, boundary, or operating responsibility.", "Decision record, migration plan, interface contract"],
            ["Invariant", "The rule that must remain true across retries, races, partial failure, or migration.", "Test, reconciliation rule, version check, idempotency key"],
            ["Failure path", "Detection, containment, recovery, and the unsafe failure you explicitly rejected.", "Alert, rollback, replay, dead-letter or repair path"],
            ["Rollout", "How risk was bounded while evidence accumulated.", "Shadow read, cohort, dual run, feature flag, stop threshold"],
            ["Operating loop", "Who owns the signal and what decision the metric triggers.", "Dashboard owner, review cadence, runbook action"],
        ],
        [111, 244, 138],
    ), spacer(9)]
    s += [callout(
        "Narration rule",
        "Use one sentence per component: the constraint it answers, the failure it contains, or the evidence it enables. If a box serves none of those purposes, remove it from the spoken story.",
    ), spacer(9)]
    s += [p("A before-and-after explanation", H2)]
    s += worked_example_table(
        ["Moment", "Spoken evidence", "Why it earns signal"],
        [
            ["Before", "A single scheduler owned priority and delivery state, so one noisy tenant delayed every queue.", "Names the coupling and user consequence."],
            ["Decision", "Partition admission by tenant class, keep delivery state durable, and preserve at-least-once processing with idempotent consumers.", "States boundary, guarantee, and accepted retry behavior."],
            ["Failure", "If a worker dies after send, the durable attempt is retried; duplicate risk is bounded by the idempotency contract and reconciliation.", "Explains uncertainty without claiming impossible ownership."],
            ["Rollout", "Shadow the new scheduler, compare age and duplicate rates, then move three cohorts with a rollback threshold.", "Shows reversible evidence gathering."],
        ],
        [66, 298, 129],
    )
    end_page(s)

    s += page_heading(
        "Show influence without inflating authority",
        "Trace how a decision moved across boundaries",
        "Staff-level influence is not a list of meetings. It is evidence that you understood competing incentives, changed the decision process, and left a mechanism that continued working without personal heroics.",
    )
    s += [numbered_chain([
        ("Map", "Identify decision owner, affected teams, incentives, and cost of the ask."),
        ("Listen", "State the strongest objection in terms the other stakeholder would accept."),
        ("Reduce", "Offer the smallest reversible commitment that can produce decision evidence."),
        ("Durabilize", "Leave an interface, review, ownership rule, or metric after alignment."),
    ]), spacer(10)]
    s += [p("Influence map", H2)]
    s += worked_example_table(
        ["Actor", "Competing constraint", "Your move", "Decision evidence"],
        [
            ["Payments team", "Could not absorb a breaking event contract during quarter close.", "Proposed a versioned adapter and a two-cohort migration instead of a single cutover.", "Committed to cohort one after replay tests passed."],
            ["Platform owner", "Wanted one reusable scheduler rather than tenant-specific forks.", "Made tenant class a policy input and documented the extension boundary.", "Approved the shared contract and ownership split."],
            ["Support lead", "Needed predictable escalation when delivery age crossed the customer promise.", "Added an age-based signal and named the responding owner in the runbook.", "Used the signal during the first production incident."],
            ["Director", "Needed a decision before the staffing window closed.", "Presented options, accepted cost, open risk, and the reversal threshold in one page.", "Selected staged migration with a dated review."],
        ],
        [82, 142, 164, 105],
    )
    s += [p("Common influence mistakes", H2), bullet_list([
        "Saying I convinced everyone without naming the legitimate objection or decision owner.",
        "Using meeting count as impact instead of showing which commitment changed.",
        "Claiming the team's execution as personal ownership.",
        "Treating escalation as failure instead of explaining why the decision needed the right owner.",
        "Ending at agreement without the durable mechanism that kept teams aligned.",
    ])]
    end_page(s)

    s += page_heading(
        "Prove the consequence",
        "Use bounded evidence instead of impact theater",
        "A result is credible when the listener can see the baseline, the change, the observation window, the measured movement, and what the data does not prove.",
    )
    s += [grid_table(
        ["Evidence layer", "Question", "Good answer pattern"],
        [
            ["Baseline", "What was true before the decision?", "Metric or recurring observable behavior, with source and date."],
            ["Change", "What action could plausibly affect it?", "Specific architecture, rollout, ownership, or operating change."],
            ["Window", "When and for how long was it observed?", "A stated cohort and period, not immediately after launch."],
            ["Result", "What moved and by how much?", "Exact measure when stored; qualitative evidence labeled when not."],
            ["Limit", "What remains uncertain or confounded?", "Missing cohort, concurrent change, small sample, or proxy limitation."],
            ["Durability", "What continued after you stepped away?", "Ownership, review, interface, runbook, or automated guardrail."],
        ],
        [86, 151, 256],
    ), spacer(10)]
    s += worked_example_table(
        ["Baseline", "Change", "Window", "Observed result", "Honest limit"],
        [
            ["Priority queue age exceeded 18 minutes in four of seven peak periods.", "Tenant-aware admission, durable attempt state, and an age alert with named owner.", "Six weeks; three migrated cohorts.", "Peak age stayed below six minutes; two incidents recovered without manual queue surgery.", "Low-volume cohorts and seasonal peak behavior were not yet observed."],
        ],
        [102, 125, 75, 127, 64],
    )
    s += [two_cards(
        ("Leading signal", "A rehearsal, rollout, adoption, latency, or error signal can show movement early. Label it as leading evidence; do not present it as the final business outcome.", "Use carefully"),
        ("Lagging outcome", "Customer, reliability, cost, or delivery impact needs enough observation time and a plausible connection to the change. Name concurrent factors when they exist.", "Stronger proof"),
    )]
    end_page(s)

    s += page_heading(
        "Assemble the spoken narrative",
        "Use a decision-first spine at three depths",
        "Prepare one truthful source narrative, then rehearse a 90-second summary and a four-minute version. Do not memorize separate stories that drift apart under follow-up.",
    )
    s += [grid_table(
        ["Clock", "Purpose", "Content"],
        [
            ["0:00-0:30", "Orient", "User or operating problem, scope, personal role, and the decision deadline."],
            ["0:30-1:15", "Create tension", "Constraint, two credible options, and why the default path was unsafe or insufficient."],
            ["1:15-2:45", "Show judgment", "Chosen path, accepted cost, safeguards, rollout, failure path, and reversal condition."],
            ["2:45-3:35", "Show influence", "Competing constraint, your move, changed commitment, final decision owner, durable mechanism."],
            ["3:35-4:15", "Prove consequence", "Baseline, observation window, result, limit, and what you learned or would change."],
            ["4:15-close", "Invite depth", "One sentence that names the richest technical or influence follow-up available."],
        ],
        [65, 99, 329],
    ), spacer(10)]
    s += [p("Fictional four-minute spine", H2)]
    s += worked_example_table(
        ["Beat", "Illustrative line"],
        [
            ["Pressure", "Our shared notification scheduler breached the 15-minute delivery promise when one large tenant burst, and three teams depended on the same event contract."],
            ["Decision", "I compared a larger shared queue with tenant-aware admission. I recommended the second path because it bounded noisy-neighbor risk, while accepting policy and reconciliation complexity."],
            ["Architecture", "We kept durable attempt state, at-least-once delivery, an idempotency contract, and a staged cohort migration with age and duplicate thresholds."],
            ["Influence", "Payments could not take a breaking change. I reframed the migration around a versioned adapter and replay proof; the platform owner retained the final interface decision."],
            ["Outcome", "Across six weeks and three cohorts, peak age stayed under six minutes and two incidents recovered through the new runbook. Low-volume cohorts remained an open evidence gap."],
        ],
        [81, 412],
    )
    s += [two_cards(
        ("90-second compression", "Keep pressure, primary decision, strongest trade-off, one influence move, one bounded outcome, and the limit. Remove component detail before removing the decision.", "First answer"),
        ("Deep-dive expansion", "Expand only the layer the interviewer probes: option criteria, invariant, failure timeline, stakeholder objection, rollout evidence, or causal limit.", "Follow-up"),
    )]
    end_page(s)

    s += page_heading(
        "Rehearse for inspection",
        "Use probes to test ownership, judgment, and truth boundaries",
        "A credible narrative survives follow-up without changing facts. Record the sentence where evidence becomes inference, the question that exposes a weak layer, and one correction for the next run.",
    )
    s += [grid_table(
        ["Probe", "What it tests", "Evidence-ready response"],
        [
            ["Why was this the decision to lead with?", "Prioritization", "Cost of delay, reversibility, user or operating risk, and decision deadline."],
            ["Why not the strongest alternative?", "Trade-off quality", "Shared criteria, what the alternative optimized, why it lost now, and reversal condition."],
            ["What was specifically yours?", "Ownership precision", "Your framing, analysis, recommendation, sequencing, or mechanism; final owner and team work separated."],
            ["Who disagreed and why?", "Influence maturity", "A fair competing constraint, the smallest commitment, evidence produced, and changed decision."],
            ["What failed during rollout?", "Operating depth", "Detection, containment, recovery, user impact, and the safeguard changed afterward."],
            ["What did the metric not prove?", "Evidence honesty", "Observation window, sample, proxy, concurrent change, and remaining unknown."],
        ],
        [135, 102, 256],
    ), spacer(9)]
    s += [p("0-2 evidence rubric", H2), grid_table(
        ["Dimension", "0 - absent or unsafe", "1 - present but weak", "2 - inspectable"],
        [
            ["Decision", "No real fork", "Choice named; criteria vague", "Options, criteria, cost, owner, reversal"],
            ["Architecture", "Component tour", "Flow clear; failure thin", "Invariant, failure, rollout, operating signal"],
            ["Ownership", "Team-only claims", "Personal role broad", "Personal decision separated from team and owner"],
            ["Influence", "Agreement asserted", "Stakeholders named", "Constraint, move, changed commitment, durable mechanism"],
            ["Outcome", "Unbounded claim", "Metric without context", "Baseline, window, result, limit, durability"],
            ["Delivery", "Chronology without thesis", "Decision arrives late", "Decision-first, concise, probe-ready"],
        ],
        [72, 135, 123, 163],
    ), spacer(8)]
    s += [callout(
        "Coach handoff",
        "Bring two story cards, one recorded four-minute run, the lowest rubric row with a timestamped quote, and one corrected sentence. That is enough evidence for a focused calibration session.",
        warm=True,
    ), spacer(8)]
    s += [p("Completion check", H2), bullet_list([
        "The primary decision appears in the opening minute.",
        "The rejected alternative is credible and the accepted cost is explicit.",
        "Personal scope, team execution, and final authority are separated.",
        "Influence ends in a changed commitment and a durable mechanism.",
        "The outcome includes a baseline, window, result, and honest limit.",
        "The 90-second and four-minute versions preserve the same facts.",
    ], checklist=True), spacer(8)]
    s += [p("Use after every rehearsal", H2), numbered_chain([
        ("Observe", "Save one exact quote or timestamp from the lowest-scoring dimension."),
        ("Correct", "Rewrite one sentence or reorder one decision; do not rebuild the whole story."),
        ("Transfer", "Retest the correction with a fresh probe and stop when it appears without rescue."),
    ]), spacer(8)]
    s += [callout(
        "Next action",
        "Choose two truthful architecture stories now. Score both, select the decision-dense primary story, and record one four-minute run for coach review.",
        warm=True,
    )]
    return s


def build_target_company_preparation_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Turn research into an interview-week decision",
        "A target-company brief should change what you rehearse",
        "This guide converts dated public evidence, recruiter-confirmed facts, and your existing story bank into a focused Senior-to-Staff preparation plan. It does not predict exact questions or treat candidate anecdotes as fact.",
    )
    s += [callout(
        "Core idea",
        "Separate fact, inference, and unknown. Then spend interview week on the three gaps where better evidence or a better rehearsal can change the hiring signal.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Anchor", "Confirm role, level, location, work model, dates, and known loop logistics."),
        ("Calibrate", "Translate role evidence into observable capabilities at the target level."),
        ("Map", "Assign truthful primary and backup evidence to each likely interview stage."),
        ("Rehearse", "Prescribe one test per open risk, then taper when the stop condition is met."),
    ]), spacer(11)]
    s += [p("What belongs in the private brief", H2), grid_table(
        ["Include", "Use", "Keep out"],
        [
            ["Official role and company material", "Responsibilities, products, values, public process, role language", "Copied answers or confidential internal detail"],
            ["Recruiter-confirmed facts", "Actual stages, dates, format, level, work authorization, logistics", "Assumptions presented as recruiter promises"],
            ["Current repeated candidate patterns", "Questions to verify and capabilities worth rehearsing", "Alleged leaked questions or one anonymous anecdote as truth"],
            ["Your own evidence and scores", "Story coverage, technical gaps, rehearsal stop conditions", "Invented ownership, scale, metrics, or company-specific claims"],
        ],
        [135, 228, 130],
    ), spacer(9)]
    s += [p("The interview-week output", H2), bullet_list([
        "One target sentence and a dated source ledger.",
        "A likely loop map labeled by confidence, not certainty.",
        "Primary and backup evidence for each capability.",
        "Three ranked risks with a rehearsal and stop condition.",
        "A taper plan, verified logistics, and two high-value questions.",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Build the evidence ledger",
        "Label what is known before acting on it",
        "Freshness and provenance matter. A useful brief lets a coach or learner trace every company-specific preparation choice back to a current source or a clearly labeled hypothesis. The dated entries below are fictional teaching data; replace every fact, date, metric, and ownership claim with your own verified evidence.",
    )
    s += [grid_table(
        ["Label", "Meaning", "How to use it"],
        [
            ["Fact", "Explicitly stated by an official source or confirmed directly by the recruiter.", "Prepare against it; record the source and date."],
            ["Inference", "A reasonable pattern derived from multiple current signals.", "Use to choose transferable practice; never claim certainty."],
            ["Unknown", "A detail that can materially change preparation but is not supported yet.", "Ask the right person or prepare a resilient fallback."],
            ["Stale", "Previously credible information whose date or context no longer matches the current role.", "Do not act on it until revalidated."],
        ],
        [68, 221, 204],
    ), spacer(10)]
    s += worked_example_table(
        ["Claim", "Label and source", "Preparation decision", "Recheck"],
        [
            ["Role owns reliability for event-driven services.", "Fact - current role description, accessed 12 Aug.", "Lead one architecture story with failure containment and operating evidence.", "Recheck if role text changes."],
            ["Design round may emphasize multi-tenant boundaries.", "Inference - role language plus two current public engineering posts.", "Rehearse a transferable noisy-neighbor follow-up, not a predicted prompt.", "Ask recruiter about interview focus."],
            ["Final decision owner and round order.", "Unknown - not in invite or recruiter note.", "Keep stories reusable across manager and cross-functional conversations.", "Confirm before T-3 days."],
        ],
        [124, 139, 170, 60],
    )
    s += [callout(
        "Source rule",
        "Date recruiter guidance, public pages, and candidate-pattern research. If two sources disagree, preserve the disagreement; do not average them into a false fact.",
    ), spacer(9)]
    s += [p("Freshness check", H2), bullet_list([
        "Is the source about this role, location, and level rather than the company in general?",
        "Is the publication or confirmation date visible?",
        "Does the source state the claim, or are you inferring it?",
        "Would a changed fact alter the rehearsal plan? If yes, assign a recheck date.",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Calibrate the level bar",
        "Translate titles into observable interview evidence",
        "Level is not proved by using the word strategic. It is proved by the scope of the decision, the ambiguity handled, the boundaries influenced, and the mechanism that kept working.",
    )
    s += [grid_table(
        ["Capability", "Senior signal", "Staff signal", "Evidence to prepare"],
        [
            ["Technical judgment", "Chooses a sound design for a bounded service.", "Frames a decision spanning systems or teams and names long-term option value.", "Decision record, criteria, accepted cost, reversal condition"],
            ["Operations", "Owns reliability and recovery for a service.", "Changes failure boundaries or the operating model across a wider system.", "Incident trend, SLO movement, runbook or ownership change"],
            ["Execution", "Ships a complex project with dependencies.", "Sequences uncertainty and creates leverage for multiple teams.", "Milestones, risk retirement, reusable interface or platform"],
            ["Influence", "Aligns peers and partner teams.", "Changes decisions beyond authority while representing competing constraints fairly.", "Objection, smallest commitment, changed decision, durable mechanism"],
            ["Communication", "Explains decisions and trade-offs clearly.", "Adjusts depth for executives, engineers, and cross-functional owners without changing facts.", "90-second summary, deep dive, and probe-ready evidence"],
        ],
        [85, 122, 169, 117],
    ), spacer(10)]
    s += [two_cards(
        ("Coach hypothesis", "A coach may infer the likely bar from role evidence and prior sessions. Keep the hypothesis labeled until the company or recruiter confirms the level and evaluation focus.", "Calibration"),
        ("Transferable preparation", "Prepare capabilities that remain useful if the round order or exact prompt changes: decision quality, failure reasoning, ownership precision, influence, and evidence.", "Resilience"),
    ), spacer(9)]
    s += [p("Write one target sentence", H2), callout(
        "Fictional completed example",
        "I am testing for a Staff backend role where cross-system reliability and influence beyond authority matter. I will prove those capabilities with a tenant-isolation decision and a versioned API migration, while asking the recruiter to confirm the exact level bar.",
    )]
    end_page(s)

    s += page_heading(
        "Map the likely loop",
        "Attach evidence and a follow-up risk to every stage",
        "A loop map is a planning hypothesis. It should survive a changed order because each stage is tied to a capability and truthful evidence, not a memorized answer.",
    )
    s += worked_example_table(
        ["Stage hypothesis", "Capability", "Primary evidence", "Backup evidence", "Follow-up risk"],
        [
            ["Recruiter", "Role clarity and motivation", "Target sentence; reason for this scope and work model", "Career-transition story", "Answer becomes company praise without role fit"],
            ["Coding", "Correctness under dialogue", "Two timed runs with invariant, tests, and complexity", "Debugging recovery example", "Silent implementation before contract"],
            ["System design", "Requirement-led judgment", "Tenant-aware scheduling decision narrative", "Versioned API migration", "Guarantees and failure path arrive late"],
            ["Manager", "Ownership and learning", "Rollback decision with measurable prevention", "Priority conflict story", "Team outcome presented as personal action"],
            ["Cross-functional", "Influence beyond authority", "Versioned adapter adoption across three teams", "Operating review mechanism", "Disagreement is flattened into easy consensus"],
            ["Values or final", "Judgment, principles, and questions", "Customer-impact trade-off with honest limit", "Learning-after-miss story", "Values repeated without a real decision"],
        ],
        [86, 88, 123, 105, 91],
    )
    s += [p("Coverage check", H2), grid_table(
        ["Pattern", "Risk", "Correction"],
        [
            ["One story appears in four stages", "A single weak probe collapses the whole portfolio.", "Add one backup with a different decision and outcome type."],
            ["Six stories prove delivery only", "The level bar for judgment or influence remains unsupported.", "Select evidence with a real fork, objection, and durable mechanism."],
            ["Technical practice has scores but no quotes", "The behavior behind the score cannot be reproduced.", "Save one timestamped opening, trade-off, failure, and close."],
            ["Every company claim is marked fact", "Inference and stale evidence can distort the plan.", "Relabel each claim and assign a verification owner."],
        ],
        [126, 177, 190],
    )]
    end_page(s)

    s += page_heading(
        "Rank only three open risks",
        "Convert uncertainty into a bounded rehearsal",
        "Interview week is too late for a new syllabus. Rank risks qualitatively by likely exposure, consequence at the target bar, and the current evidence deficit, then prescribe one comparable test.",
    )
    s += [grid_table(
        ["Risk factor", "High", "Medium", "Low"],
        [
            ["Likely exposure", "Confirmed or repeated across current sources", "Plausible from several signals", "Single weak or stale signal"],
            ["Consequence", "Missing it blocks a core target-level signal", "Weakens one stage but other evidence exists", "Small polish issue"],
            ["Evidence deficit", "No recent comparable proof", "Mixed or indirect proof", "Recent repeated proof"],
        ],
        [109, 151, 137, 96],
    ), spacer(10)]
    s += worked_example_table(
        ["Ranked risk", "Why now", "Rehearsal prescription", "Stop condition"],
        [
            ["1. Design guarantee arrives late", "Confirmed design stage; repeated feedback across two runs.", "18-minute prompt; state users, acceptance guarantee, source of truth, and failure before components.", "The opening appears unaided in two fresh prompts."],
            ["2. Influence story hides objection", "Staff-level role; coach marked agreement as unearned.", "Four-minute story plus probe: represent the partner constraint before stating your proposal.", "Observer can repeat objection, changed commitment, and final owner."],
            ["3. Coding close loses boundary test", "Coding likely; one recent timeout, one strong run.", "Two 25-minute problems; reserve final three minutes for boundary test and complexity.", "Both runs close with a correct boundary test before time."],
        ],
        [105, 124, 185, 79],
    )
    s += [callout(
        "Stop rule",
        "Stop rehearsing when the target behavior transfers to fresh prompts at the defined standard. Repetition after stable proof consumes recovery without reducing meaningful risk.",
        warm=True,
    )]
    end_page(s)

    s += page_heading(
        "Prescribe the rehearsal",
        "Test the decision moment, not topic recall",
        "Every rehearsal should name the risk, the observable behavior to front-load, the evidence to capture, and the condition that proves transfer.",
    )
    s += [grid_table(
        ["Prescription field", "Required decision"],
        [
            ["Capability", "One target-level behavior: clarify, choose, test, trade off, influence, recover, or close."],
            ["Prompt", "Fresh and representative; no leaked questions, confidential material, or memorized answer."],
            ["Constraint", "One change that forces judgment rather than recall."],
            ["Front-loaded behavior", "The exact action that must appear early enough to change the answer."],
            ["Evidence", "Quote, timestamp, artifact, test result, or observer note."],
            ["Transfer check", "A second prompt with the same decision type but different surface details."],
            ["Stop condition", "Observable standard met without rescue; not a target mood or perfect score."],
        ],
        [125, 368],
    ), spacer(10)]
    s += worked_example_table(
        ["Risk", "Prompt and changed constraint", "Evidence captured", "Decision"],
        [
            ["Failure path arrives late", "Design a webhook platform; receiver times out after processing.", "At 01:10 states at-least-once boundary, idempotency key, retry state, and reconciliation.", "Behavior present; re-test on a file-processing prompt."],
            ["Ownership remains broad", "Tell the migration story; probe who had final authority.", "Separates personal framing and recommendation from director approval and team implementation.", "Behavior present once; needs one fresh story probe."],
            ["Closing test is rushed", "Solve a window problem; introduce duplicate input near the end.", "Names no-repeat invariant, traces boundary case, states O(n) time before minute 25.", "Two comparable proofs; stop."],
        ],
        [101, 170, 155, 67],
    )
    s += [two_cards(
        ("Correct one variable", "Change the behavior that caused the evidence gap while keeping prompt depth, time box, assistance policy, and scoring dimensions comparable.", "Experimental control"),
        ("Protect confidence", "A risk board is not a verdict. Keep stable capabilities visible so interview week narrows work instead of turning every skill into an emergency.", "Operating posture"),
    )]
    end_page(s)

    s += page_heading(
        "Read a completed private brief",
        "Use a fictional dossier to see the method end to end",
        "The example below uses a fictional company and invented teaching data. It demonstrates structure only; replace it with current authorized evidence and your own truthful experience.",
    )
    s += [p("Fictional target: Northstar Ledger", H2)]
    s += worked_example_table(
        ["Brief field", "Completed example"],
        [
            ["Target", "Staff backend engineer; remote India; event platform and reliability scope; interview week begins 19 Aug."],
            ["Confirmed", "Recruiter named coding, system design, manager, and cross-functional conversations; dates and format confirmed by email on 12 Aug."],
            ["Inferred", "Public role and engineering material suggest multi-tenant reliability and platform adoption matter; exact prompts remain unknown."],
            ["Primary evidence", "Tenant-aware scheduler decision; versioned API migration; rollback judgment; two timed coding runs with observable closes."],
            ["Open risks", "Design guarantee order, fair representation of stakeholder objection, and final coding boundary test."],
            ["Stop point", "Two fresh proofs for design opening and coding close; one observer-verifiable influence retell; then taper."],
        ],
        [104, 389],
    )
    s += [spacer(9)]
    s += [p("Evidence coverage", H2), grid_table(
        ["Capability", "Primary", "Backup", "Remaining gap"],
        [
            ["Technical judgment", "Scheduler partition decision", "API versioning", "External provider boundary needs one probe"],
            ["Operations", "Age-alert and recovery ownership", "Rollback runbook", "Seasonal peak evidence not available"],
            ["Influence", "Payments adapter adoption", "Operating review cadence", "State the partner objection earlier"],
            ["Learning", "Duplicate test miss and correction", "Incident review mechanism", "No current gap"],
            ["Role motivation", "Target sentence tied to platform leverage", "Career transition", "Ask about first-six-month ownership"],
        ],
        [101, 128, 109, 155],
    ), spacer(9)]
    s += [callout(
        "Why this brief is useful",
        "Every company-specific claim has a confidence label, every likely stage has truthful evidence, and every risk ends in a test or a question. Nothing depends on predicting an exact interview prompt.",
    )]
    end_page(s)

    s += page_heading(
        "Run the countdown",
        "Reduce work as the interview approaches",
        "The final week should improve retrieval, confidence, and logistics. It should not reopen the curriculum or replace sleep with low-quality repetition.",
    )
    s += [grid_table(
        ["Horizon", "Do", "Stop when", "Avoid"],
        [
            ["T-7 to T-4", "Verify loop facts; map evidence; run one baseline per high risk.", "Three risks and prescriptions are explicit.", "Broad topic expansion"],
            ["T-3 to T-2", "Run transfer checks; fix one sentence or decision order; confirm logistics.", "Stop conditions are met or one bounded risk remains.", "Chasing a perfect score"],
            ["T-1", "One retrieval pass; review cues and questions; normal meals and sleep.", "Evidence is retrievable without scripts.", "New hard problems or story rewrites"],
            ["Interview morning", "Check link, timezone, audio, backup, water, and the one-page run sheet.", "The environment is ready and attention is calm.", "Forums, comparison, or full mocks"],
        ],
        [75, 184, 144, 90],
    ), spacer(10)]
    s += [p("Questions that reduce uncertainty", H2), bullet_list([
        "Which decisions should this role own independently in the first six months?",
        "What distinguishes a strong Senior-level answer from a Staff-level answer in this loop?",
        "Which system or organizational boundary creates the most recurring work for the team today?",
        "How are design decisions reviewed, and who is the final owner when teams disagree?",
        "Is there any interview format, tool, or assistance policy I should confirm before the session?",
    ])]
    s += [p("Final readiness check", H2), bullet_list([
        "Role, level, date, timezone, work model, and confirmed stages are dated and sourced.",
        "Fact, inference, unknown, and stale evidence are visibly separated.",
        "Each capability has primary evidence and a useful backup.",
        "The top three risks have comparable rehearsals and stop conditions.",
        "No story depends on invented ownership, metrics, or company knowledge.",
        "The final day is protected for retrieval, logistics, energy, and honest listening.",
    ], checklist=True), spacer(8)]
    s += [two_cards(
        ("Bring to calibration", "Dated source ledger, target sentence, loop-to-evidence map, three ranked risks, transfer evidence, and the one-page Interview-Day Run Sheet.", "Coach handoff"),
        ("Leave out", "Leaked prompts, copied answers, full scripts, confidential company material, unverified claims, and personal data that is not needed for preparation.", "Trust boundary"),
    ), spacer(8)]
    s += [callout(
        "Next action",
        "Write the three highest-value preparation decisions on one page: what to rehearse, what to verify, and what to stop. Carry those decisions into the Interview-Day Run Sheet.",
        warm=True,
    )]
    return s


def build_interview_day_run_sheet_story() -> list[Flowable]:
    s: list[Flowable] = []
    run_title = ParagraphStyle("IRRunSheetTitle", parent=PAGE_TITLE, fontSize=16.5, leading=18.5, spaceAfter=4)
    run_dek = ParagraphStyle("IRRunSheetDek", parent=PAGE_DEK, fontSize=8.5, leading=11.2, spaceAfter=7)
    s += [p("PRIVATE OPERATING SHEET", PAGE_KICKER), p("Interview-Day Run Sheet", run_title), p(
        "A one-page cue sheet for readiness, answer order, retrieval, and recovery. Copy verified logistics and your own truthful story labels into private notes before interview day; never store passwords here.",
        run_dek,
    )]
    s += [callout(
        "Operating rule",
        "One round at a time. Listen, establish the new contract, make the next useful decision, and close with evidence. A prior answer is a note for later - not the starting state of the next round.",
        warm=True,
    ), spacer(4)]
    s += [p("READINESS BY HORIZON", PAGE_KICKER), grid_table(
        ["24 hours before", "60 minutes before", "10 minutes before"],
        [[
            "Confirm date, timezone, format, contact path, access needs, quiet-space or travel plan, sleep, meal, and permitted materials.",
            "Test power, network, backup, camera, microphone, browser, editor, allowed tools, meeting link, lighting, water, and interruption plan.",
            "Close notifications and updates; reset posture; open the correct link; review only cues; do not start a new problem or full rehearsal.",
        ]],
        [164, 164, 165],
        font_size=7.4,
        cell_padding=3.5,
    ), spacer(4)]
    s += [p("ANSWER CUES - SAY THE DECISION ORDER, NOT A MEMORIZED SCRIPT", PAGE_KICKER), grid_table(
        ["Round", "Decision order", "Minimum close"],
        [
            ["Coding", "Contract -> examples -> approach -> invariant -> implement -> boundary tests", "Complexity, remaining check, and what you would verify with more time"],
            ["System design", "Users and guarantees -> scale -> source of truth -> flow -> failure -> trade-off", "Metric, accepted cost, open assumption, and reversal condition"],
            ["Behavioral", "Question -> context -> my decision -> alternative -> action -> evidence -> learning", "Measured result, honest limit, and what changed afterward"],
            ["Story retrieval", "Decision label -> competing constraint -> stakeholder -> changed commitment -> outcome", "Use three cue labels only; keep full scripts out of view"],
        ],
        [75, 272, 146],
        font_size=7.4,
        cell_padding=3.5,
    ), spacer(4)]
    s += [p("THREE-MINUTE BETWEEN-ROUND RESET", PAGE_KICKER), grid_table(
        ["01 - Release", "02 - Recover", "03 - Reopen"],
        [[
            "Write one factual moment from the prior round. No score, verdict, or replay.",
            "Use one slow breath, posture, water, and an immediate logistics check.",
            "Name one question and one adjustment for the next round's new contract.",
        ]],
        [164, 164, 165],
        font_size=7.4,
        cell_padding=3.5,
    ), spacer(4)]
    s += [p("RECOVERY LANGUAGE", PAGE_KICKER), grid_table(
        ["Moment", "Useful sentence"],
        [
            ["Prompt is unclear", "Before I choose an approach, may I confirm the input, success condition, and most important constraint?"],
            ["You are stuck", "I will restate the contract, test the smallest case, and name the correct baseline before optimizing."],
            ["Connection fails", "I am reconnecting through my tested backup now. If we disconnect again, I will use the agreed contact path."],
            ["Prior round felt weak", "That round is closed. I have one note for later; I will start this round from its own contract."],
        ],
        [105, 388],
        font_size=7.4,
        cell_padding=3.5,
    ), spacer(4)]
    s += [p("CARRY, ASK, AND PROTECT", PAGE_KICKER), grid_table(
        ["Private retrieval cues", "Questions and close", "Privacy and ethics"],
        [[
            "Carry one target sentence, three truthful story labels with decision and outcome, one coding invariant cue, one design failure cue, and one remaining risk.",
            "Ask what this person should own in six months and which boundary creates recurring work. Thank the interviewers; save factual notes after the loop.",
            "Use only your notes and authorized material. Exclude leaked prompts, confidential data, credentials, private personal data, and recordings without consent.",
        ]],
        [164, 164, 165],
        font_size=7.4,
        cell_padding=3.5,
    ), spacer(4)]
    s += [p("AFTER THE LOOP - FACTS BEFORE INTERPRETATION", PAGE_KICKER), grid_table(
        ["Capture now", "Close safely", "Review later"],
        [[
            "Record the date, round type, interviewer names and roles as provided, question themes, commitments, interruptions, and exact facts you can still distinguish from interpretation.",
            "Send only promised follow-ups through the approved channel. Close recordings and confidential material, preserve permitted notes securely, and remove data you are not authorized to keep.",
            "After recovery, compare evidence with the rubric: what decision was clear, which probe exposed a gap, and one behavior to test next. Do not invent a score or rewrite history from emotion.",
        ]],
        [164, 164, 165],
        font_size=7.2,
        cell_padding=3.5,
    ), spacer(4)]
    s += [callout(
        "Close rule",
        "Capture facts, complete promised actions, and step away. A calm evidence review later is more useful than an immediate verdict about how the interview went.",
    )]
    return s


def build_metrics_pipeline_replay_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Start from the user-visible contract",
        "Design a metrics pipeline by deciding what must remain true",
        "A strong answer does not begin with a queue or a database. It defines who emits data, what acknowledgement means, how fresh results must be, which queries matter, and how loss, duplication, lateness, cardinality, and cost will be bounded.",
    )
    s += [callout(
        "Teaching-data boundary",
        "This is a scripted teaching replay. Names, timestamps, workloads, scores, incidents, and outcomes are fictional sample data and do not represent a learner or employer. Adapt the method and use only verified evidence.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Promise", "State freshness, completeness, query latency, retention, and isolation targets."),
        ("Semantics", "Define the sample, series identity, timestamps, acknowledgement, and replay rules."),
        ("Flow", "Separate admission, durable buffering, processing, storage, and query serving."),
        ("Pressure", "Test cardinality, skew, late data, hot series, store failure, and regional loss."),
        ("Evidence", "Close with measurable SLIs, accepted costs, and a reversal condition."),
    ]), spacer(10)]
    s += [p("The 38-minute interview contract", H2), grid_table(
        ["Clock", "Decision to make", "Evidence to leave audible"],
        [
            ["0-5", "Frame users, alerts, dashboards, scale, freshness, retention, and non-goals.", "A one-sentence contract and the first uncertainty to resolve."],
            ["5-9", "Estimate samples, bytes, series, write rate, query rate, and retention pressure.", "Rounded ranges connected to architecture decisions, not false precision."],
            ["9-16", "Define metric types, label policy, event time, ingest time, and acknowledgement.", "A stable sample envelope and explicit delivery semantics."],
            ["16-24", "Choose partitioning, durable buffer, processors, hot storage, rollups, and cold retention.", "Every component tied to a requirement or failure boundary."],
            ["24-31", "Walk query, late-data, replay, overload, and tenant-isolation paths.", "User-visible behavior during partial failure."],
            ["31-38", "Compare trade-offs, operating signals, alternatives, and the close.", "Accepted cost, trigger to revisit, and the highest-risk assumption."],
        ],
        [52, 198, 243],
    )]
    s += [p("Clarify before drawing", H2), bullet_list([
        "Who emits samples: services, hosts, devices, customer workloads, or internal agents?",
        "Which product actions depend on the pipeline: alerts, dashboards, investigations, billing, or compliance?",
        "What does accepted mean, and may an acknowledged sample later be missing from a query?",
        "What freshness and query-latency targets matter by use case and time window?",
        "Which labels are permitted, and which identifiers or sensitive values must never become dimensions?",
        "How long must raw and rolled-up data remain available, and which historical questions need full resolution?",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Make the data contract explicit",
        "Metric semantics determine whether the answer is correct",
        "Storage can be replaced. Ambiguous samples, unbounded labels, and undefined late-data behavior leak into every downstream component. State these rules before choosing the store.",
    )
    s += [grid_table(
        ["Concept", "Meaning", "Interview consequence"],
        [
            ["Counter", "A cumulative value that normally increases until a reset.", "Compute change over a time window and detect resets; do not treat the absolute value as a rate."],
            ["Gauge", "A point-in-time value that may rise or fall.", "Define sampling and staleness behavior; last value is not automatically current truth."],
            ["Histogram", "Counts observations in compatible value buckets.", "Aggregate bucket counts before estimating quantiles; never average percentiles."],
            ["Series identity", "Metric name plus the complete normalized label set.", "Cardinality is unique series count, not simply the number of label keys."],
            ["Event time", "When the measurement occurred at the source.", "Needed for correct windows when transport or processing is delayed."],
            ["Ingest time", "When the platform accepted the sample.", "Useful for freshness and operational lag, but not a substitute for event time."],
        ],
        [82, 160, 251],
    ), spacer(9)]
    s += worked_example_table(
        ["Rounded assumption", "Pressure created", "Decision it informs"],
        [
            ["500,000 samples/s", "The admission and log path must sustain burst headroom above the average.", "Partition writes and enforce per-tenant admission rather than relying on one shared endpoint."],
            ["40-80 encoded bytes/sample", "About 1.7-3.5 TB/day before indexes and replication.", "Compress, tier retention, and keep full-resolution duration explicit."],
            ["20 million active series", "Catalog memory, compaction, and query fan-out can dominate raw byte cost.", "Set label budgets, reject unsafe dimensions, and isolate tenant explosions."],
            ["Alerts need under 60 s freshness", "Long batch intervals or an opaque replay can violate the primary promise.", "Track end-to-end freshness and reserve a low-latency processing path."],
        ],
        [125, 170, 198],
    )
    s += [callout(
        "Sizing rule",
        "Use a range and show the unit chain: samples/second x bytes/sample x 86,400 seconds/day. Then name what the estimate excludes, such as indexes, replicas, metadata, compaction, and headroom.",
    )]
    end_page(s)

    s += page_heading(
        "Keep ingestion and queries independently survivable",
        "Name each boundary, source of truth, and replay path",
        "The architecture is valuable only when the listener can trace a sample from emission to a visible query result and explain what happens if any stage slows or fails.",
    )
    s += [numbered_chain([
        ("Collect", "Batch locally, apply backpressure, and attach stable source identity."),
        ("Admit", "Authenticate tenant, validate schema, enforce label and rate budgets."),
        ("Buffer", "Acknowledge at the chosen durable boundary and partition for bounded skew."),
        ("Process", "Normalize, deduplicate within scope, aggregate, and manage late events."),
        ("Serve", "Use hot time-series storage plus rollups, cold data, and a bounded query plan."),
    ]), spacer(10)]
    s += [grid_table(
        ["Stage", "Contract", "Failure question", "Evidence"],
        [
            ["Agent/SDK", "Local buffering has a byte/time limit.", "What is dropped or blocked when the device is offline?", "Dropped-sample count and oldest buffered age."],
            ["Admission", "Only valid, authorized, bounded-cardinality samples enter.", "Can one tenant exhaust shared capacity?", "Rejected samples by reason and tenant budget saturation."],
            ["Durable log", "Acknowledged data survives a process restart within the stated durability target.", "What ordering and replay guarantees exist per partition?", "Oldest unprocessed age, partition skew, and under-replicated state."],
            ["Processor", "Retries cannot multiply effects or move the watermark silently.", "How are duplicates, late data, and counter resets handled?", "Replay duplicates, correction count, checkpoint age."],
            ["Query tier", "Fresh and historical results expose known staleness or approximation.", "What happens when hot storage or a region is unavailable?", "Query latency, partial-result flag, freshness age, error budget."],
        ],
        [78, 137, 151, 127],
        font_size=7.4,
    ), spacer(9)]
    s += [two_cards(
        ("Write path owns acceptance", "Declare the exact acknowledgement boundary. A durable log may be the replay source, but only if retention and recovery meet the accepted-sample contract.", "Boundary"),
        ("Read path owns interpretation", "A query must reveal staleness, partial coverage, rollup resolution, or approximation. A fast number without its meaning is not a reliable result.", "Boundary"),
    )]
    end_page(s)

    s += page_heading(
        "Pressure-test correctness before optimizing cost",
        "Design the failure behavior a learner can defend",
        "At-least-once delivery is useful only when duplicate scope, idempotency, late data, replay, and query-visible correction are explicit. Exactly-once claims must be limited to a named boundary.",
    )
    s += [grid_table(
        ["Pressure", "Unsafe shortcut", "Defensible policy"],
        [
            ["Duplicate replay", "Assume the queue prevents every duplicate.", "Use a stable source/sample identity, a bounded deduplication horizon, and idempotent aggregate updates or reconciliation."],
            ["Late or out-of-order sample", "Drop it without telling query users.", "Define watermark and lateness allowance; mark provisional windows and publish corrections when policy permits."],
            ["Counter reset", "Interpret a negative delta as negative usage.", "Detect restart/reset markers, split the interval, and expose unknown data when the reset cannot be reconstructed."],
            ["Hot series or tenant", "Add partitions without a fairness rule.", "Enforce tenant/series budgets, isolate heavy workloads, and choose a partition key with a stated skew trade-off."],
            ["Store outage", "Keep accepting forever with no capacity bound.", "Use a durable buffer with time/byte limits, shed by explicit priority, and communicate freshness degradation."],
            ["Wide historical query", "Fan out without a cost or deadline budget.", "Select rollup resolution, bound fan-out, cache safe results, and return partial/timeout semantics deliberately."],
        ],
        [97, 137, 259],
    ), spacer(10)]
    s += [p("Pipeline health must be observable from the user's promise", H2), bullet_list([
        "End-to-end freshness from event time to query visibility, split by tenant and priority.",
        "Accepted-sample completeness, explicit drop/reject reasons, and correction/replay volume.",
        "Oldest unprocessed age and partition skew, not only average consumer lag.",
        "Query latency and error/partial-result rate by time range and resolution.",
        "Active-series cardinality, new-series creation rate, hot-series concentration, and budget rejections.",
        "An alert includes an owner and action; dashboards alone do not create recovery.",
    ])]
    s += [callout("Trust boundary", "Never place secrets, raw personal identifiers, request IDs, or unbounded user-controlled values in metric labels. Sampling is not automatically safe for billing, security, or other authoritative events.")]
    end_page(s)

    s += page_heading(
        "Inspect the answer at the decision moment",
        "Annotated scored replay: preserve what worked, repair what did not",
        "A replay is not a rewritten perfect answer. It quotes the observable move, keeps the correct reasoning, identifies the missing decision, and adds one sentence that changes the downstream design.",
    )
    s += worked_example_table(
        ["Moment", "What the candidate did", "Evidence and gap", "Precise improved sentence"],
        [
            ["06:14", "Separated ingestion from query serving and gave each an independent scaling path.", "Correct boundary. The acknowledgement point and accepted-sample durability were still unstated.", "I will acknowledge after the tenant-validated sample is durably appended; query freshness can degrade without losing that accepted record."],
            ["14:52", "Added replication for the time-series store.", "Useful availability instinct. The answer did not choose stale, partial, or unavailable query behavior during failover.", "During failover I will serve the last complete window with its freshness age; I will not merge an incomplete replica as if it were current."],
            ["27:08", "Suggested adding workers while monitoring queue length.", "Capacity may help, but depth alone hides oldest-event SLO breach, partition skew, retry amplification, and downstream headroom.", "I will scale only after confirming parallel partitions and downstream capacity, while tracking oldest unprocessed age and successful throughput."],
        ],
        [52, 126, 145, 170],
    )
    s += [p("Follow-up probes that reveal real understanding", H2), grid_table(
        ["Probe", "Strong decision to expose"],
        [
            ["Can you guarantee exactly once?", "Scope the guarantee, name duplicate boundaries, and explain idempotent effects plus reconciliation."],
            ["A customer adds user_id as a label. What happens?", "Reject or transform it under a documented cardinality/privacy policy and show the rejection signal."],
            ["How do you aggregate p99 latency?", "Aggregate compatible histogram buckets or a mergeable sketch; do not average precomputed percentiles."],
            ["A sample arrives ten minutes late. Is history rewritten?", "Apply the declared watermark/correction policy and make provisional or corrected results visible."],
            ["Why not store raw data forever?", "Tie retention and rollups to query value, cost, privacy, and the questions that still need full resolution."],
        ],
        [188, 305],
    )]
    end_page(s)

    s += page_heading(
        "Explain the representative score",
        "Every point must trace back to evidence",
        "The catalog's scripted score is a teaching example, not learner history or a readiness verdict. The dimensions below average to 78 only because the same prompt, clock, and evidence record are used.",
    )
    s += [p("FICTIONAL SCRIPTED SCORECARD - ADAPT THE RUBRIC, NOT THE SCORE", LABEL), grid_table(
        ["Dimension", "Score", "Evidence", "Highest-value next move"],
        [
            ["Problem framing", "82", "Users and ingest/query separation were clear by 06:14.", "State freshness, completeness, retention, and acknowledgement in the opening contract."],
            ["Technical depth", "76", "Replication and scaling mechanisms appeared, but semantics and replay were incomplete.", "Choose delivery, deduplication, late-data, and counter-reset behavior before topology detail."],
            ["Trade-off clarity", "70", "Alternatives were named, but accepted costs and reversal triggers were rarely explicit.", "For each major choice, name the cost, user-visible failure behavior, and trigger to revisit."],
            ["Communication", "84", "The flow was traceable and interviewer probes were answered directly.", "Front-load the decision sentence so strong detail does not arrive before its purpose."],
        ],
        [91, 46, 184, 172],
    ), spacer(10)]
    s += [two_cards(
        ("Why 78, not 90", "The answer was coherent and organized, but key correctness semantics arrived late or remained implied. A high score requires those choices before storage topology and under failure probes.", "Score reason"),
        ("What not to infer", "Do not compare this number with a different prompt, interviewer, rubric, or assistance condition and call the difference improvement. Normalize conditions before claiming movement.", "Evidence rule"),
    ), spacer(10)]
    s += [callout(
        "One correction",
        "Before naming a store, say: accepted samples are durably buffered with at-least-once delivery; duplicate effects are bounded by stable identity; late samples follow a visible correction policy; alerts optimize freshness while historical queries may use rollups.",
        warm=True,
    )]
    s += [p("Comparable re-test exit criteria", H2), bullet_list([
        "Use the same prompt family, 38-minute clock, rubric, and assistance rules.",
        "Semantics appear before topology without an interviewer reminder.",
        "The late-data, replay, failover, and hot-cardinality probes each receive a user-visible policy.",
        "A chosen trade-off includes accepted cost and a measurable reversal trigger.",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Run the replay as deliberate practice",
        "Turn one transcript into a stronger adjacent answer",
        "The goal is transfer: the learner should make the corrected decision in a nearby telemetry or event-stream prompt without copying a memorized architecture.",
    )
    s += [p("A stronger 90-second opening", H2), p(
        "I will design for multi-tenant infrastructure metrics used by alerts and dashboards. Before topology, I want to confirm sample rate, active-series cardinality, alert freshness, query windows, retention, and accepted loss. My initial contract is that a tenant-valid sample is acknowledged only after durable append, then processed at least once with bounded duplicate effects. Event time drives windows; late samples follow a stated correction policy. I will separate the write path from query serving so a query-tier failure can degrade freshness without losing accepted samples. Next I will size the write and series pressure, then choose partitioning, hot retention, rollups, and the failure behavior for overload and replay.",
        QUOTE,
    ), spacer(9)]
    s += [grid_table(
        ["Practice block", "Action", "Proof of completion"],
        [
            ["Replay - 8 min", "Listen/read only around 06:14, 14:52, and 27:08; record the decision that was audible and the missing consequence.", "Three evidence notes with timestamps; no general impression words."],
            ["Repair - 8 min", "Say the improved opening and one corrected sentence for each moment without adding invented requirements.", "Semantics precede store choice; each correction changes a downstream decision."],
            ["Pressure - 10 min", "Answer duplicate replay, high-cardinality label, late event, hot tenant, and regional failover probes.", "Each response contains policy, signal, and user-visible behavior."],
            ["Transfer - 9 min", "Use a nearby clickstream or device-telemetry prompt with different scale and query needs.", "The method transfers while the architecture changes with the contract."],
            ["Close - 3 min", "Choose one remaining weakness and schedule a comparable re-test.", "One behavior, one evidence source, one stop condition."],
        ],
        [82, 259, 152],
    ), spacer(10)]
    s += [p("Completion checklist", H2), bullet_list([
        "The answer states user-visible freshness, completeness, latency, retention, and isolation before components.",
        "Sample schema, timestamps, series identity, label budget, acknowledgement, delivery, and replay are explicit.",
        "Capacity math uses rounded ranges and connects to partitioning, compression, retention, or rollups.",
        "Every failure probe ends with observable behavior, not only a mechanism name.",
        "The corrected response preserves what was already correct and adds only the missing decisions.",
        "The final re-test uses comparable conditions and records evidence rather than a confidence impression.",
    ], checklist=True)]
    s += [callout("Next action", "Open the latest metrics-pipeline transcript, mark the three decision moments, rehearse the corrected opening once, and run one comparable transfer prompt before changing any other part of the answer.", warm=True)]
    return s


def build_queue_backlog_replay_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Protect the promise before touching capacity",
        "A queue backlog is a symptom, not a diagnosis",
        "The first job is to identify affected work, oldest age, arrival pressure, successful service rate, retry amplification, partition skew, and downstream health. Adding workers is a conditional intervention, not a default answer.",
    )
    s += [callout(
        "Teaching-data boundary",
        "This is a scripted teaching replay. Names, rates, scores, incidents, timestamps, and outcomes are fictional sample data and do not represent a learner or employer. Adapt the method and use only verified production evidence.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Impact", "Name the user promise, affected priority, start time, and accepted-work risk."),
        ("Rates", "Separate new arrivals, retry arrivals, successful completions, and backlog age."),
        ("Cause", "Test demand, consumers, partitions, poison work, and downstream dependencies."),
        ("Contain", "Protect critical traffic and stop amplification before expanding concurrency."),
        ("Recover", "Drain safely, reconcile effects, prove age falls, and prevent recurrence."),
    ]), spacer(10)]
    s += [p("The 31-minute incident conversation", H2), grid_table(
        ["Clock", "Decision", "Minimum output"],
        [
            ["0-3", "Define impact, priority, onset, and data-loss/duplicate risk.", "One user promise and one protection goal."],
            ["3-8", "Read age, arrivals, successful completions, retries, skew, and dependency health.", "A rate model plus the most dangerous unknown."],
            ["8-13", "Rank hypotheses and choose fast confirming/disconfirming checks.", "Three hypotheses ordered by evidence and reversibility."],
            ["13-18", "Contain user harm and retry amplification.", "One protection action, owner, and rollback trigger."],
            ["18-23", "Bound retries, quarantine poison work, and define safe re-drive.", "Attempt/deadline budget plus DLQ ownership."],
            ["23-28", "Choose drain or scale conditions and verify downstream headroom.", "Conditional capacity decision and approximate drain range."],
            ["28-31", "Declare recovery, reconcile, communicate, and prevent recurrence.", "Exit criteria and the next durable guardrail."],
        ],
        [50, 217, 226],
    )]
    s += [p("Say this before proposing a fix", H2), bullet_list([
        "Which workflow is delayed, what deadline or user promise is at risk, and which priority/tenant/partition is worst?",
        "Did accepted work stop completing, complete twice, expire, or move into an unowned dead-letter path?",
        "What changed near the onset: demand, deploy, configuration, schema, dependency, quota, or partition ownership?",
        "Can optional producers be paused or critical work isolated without violating a stronger contract?",
    ], checklist=True)]
    end_page(s)

    s += page_heading(
        "Use rates and age to describe the incident",
        "Depth alone can improve while users get worse",
        "Measure new work, retry work, successful effects, and oldest age separately. A falling queue depth may reflect expiry, drops, or dead-letter movement rather than recovery.",
    )
    s += [callout(
        "Rate model",
        "Backlog change per second is approximately new arrivals + retry arrivals - successful completions. When successful completions exceed effective arrivals and rates remain stable, drain time is approximately backlog divided by the net drain rate.",
    ), spacer(9)]
    s += worked_example_table(
        ["Moment", "Observed rates", "Meaning", "Safe inference"],
        [
            ["Before containment", "500 new/s + 750 retry/s; 400 successful/s", "Backlog grows about 850/s. Retries exceed new demand.", "Stop amplification and inspect dependency errors before adding concurrency."],
            ["After retry bound", "200 effective arrivals/s; 800 successful/s", "The theoretical net drain is about 600/s.", "Estimate a drain range only if partitions, priorities, quotas, and rates remain stable."],
            ["Depth falls, oldest age rises", "Low-priority depth drops; critical oldest age reaches 22 min", "Global depth hides starvation or expiry in a critical lane.", "Segment age and successful throughput by priority, tenant, and partition."],
            ["Attempts rise, success is flat", "1,600 dequeues/s; 420 successful effects/s", "More work is being attempted, not completed.", "Track acknowledgements and effect completion separately from dequeue rate."],
        ],
        [92, 126, 143, 132],
    )
    s += [p("The minimum incident panel", H2), grid_table(
        ["Signal", "Why it matters"],
        [
            ["Oldest age by priority/tenant/partition", "Directly exposes deadline risk, starvation, and localized hot spots."],
            ["New arrivals and retry arrivals", "Separates demand from incident-created amplification."],
            ["Successful completions", "Measures useful service; attempts and dequeues can rise while effects fail."],
            ["Processing time and downstream latency/errors/quota", "Shows whether consumers or a dependency set the real service ceiling."],
            ["Partition lag, ownership, and saturation", "Reveals skew, idle workers, unavailable leases, and misleading global capacity."],
            ["DLQ ingress, reason, oldest age, and re-drive status", "Makes quarantined work visible and accountable rather than discarded."],
        ],
        [191, 302],
    )]
    end_page(s)

    s += page_heading(
        "Test a causal tree, not a favorite explanation",
        "Every hypothesis needs confirming and disconfirming evidence",
        "Start with the cheapest safe checks that separate demand, service degradation, skew, poison work, retry storms, and downstream saturation. Preserve evidence before changing the system.",
    )
    s += [grid_table(
        ["Hypothesis", "Confirming evidence", "Disconfirming evidence", "First safe check"],
        [
            ["Demand spike", "New-arrival rate rises before age and backlog.", "New arrivals are normal while retries surge.", "Compare producer accepts by tenant/event type with the prior baseline."],
            ["Consumer regression", "Processing time or failure starts with a deploy/config change.", "Old and new versions have the same profile.", "Split success/latency by version and canary a rollback if safe."],
            ["Hot partition", "One partition ages while workers elsewhere are idle.", "Lag and ownership are balanced.", "Inspect key distribution, leases, and partition ownership."],
            ["Poison message", "Same item/error repeats and blocks ordered work.", "Failures are broad and input-independent.", "Trace one safe identifier and compare the next item in that key."],
            ["Dependency throttle", "Remote latency, 429/5xx, quota, or pool saturation rises first.", "Dependency headroom and latency remain normal.", "Compare successful effects with dependency capacity and error classes."],
            ["Retry storm", "Retry arrivals and synchronized attempts dominate new work.", "Attempts are mostly first tries.", "Group attempts by original operation, error class, and retry age."],
        ],
        [83, 146, 129, 135],
        font_size=7.4,
    ), spacer(9)]
    s += [two_cards(
        ("Preserve evidence", "Record onset, deploy/config identifiers, representative failure classes, rates, age, and partition state before broad restarts or purges erase the sequence.", "Incident discipline"),
        ("Prefer reversible moves", "Pause optional producers, reduce retry concurrency, isolate priority, roll back a suspect change, or canary capacity with explicit stop conditions.", "Incident discipline"),
    ), spacer(9)]
    s += [callout("Never optimize the chart", "Do not purge, expire, or mass-dead-letter accepted work merely to make depth fall. Any discard or replay requires an authorized business policy, impact assessment, and auditable decision.", warm=True)]
    end_page(s)

    s += page_heading(
        "Contain before you scale",
        "More workers can accelerate the failure",
        "Concurrency helps only when work is parallelizable, partitions or leases are available, and every downstream limit has headroom. Otherwise it increases timeouts, lock pressure, database connections, duplicate effects, or provider throttling.",
    )
    s += [numbered_chain([
        ("Protect", "Reserve or prioritize capacity for deadline-critical and transactional work."),
        ("Reduce", "Pause optional producers and bound new retry creation."),
        ("Isolate", "Circuit-break failing dependencies or quarantine poison work by policy."),
        ("Canary", "Change concurrency or rollout on one bounded slice with stop signals."),
        ("Reconcile", "Prove accepted effects, duplicates, skips, and dead letters are accounted for."),
    ]), spacer(10)]
    s += [grid_table(
        ["Intervention", "Use when", "Do not use when", "Stop/rollback signal"],
        [
            ["Add workers", "Partitions and downstream capacity are available; CPU or worker slots are the bottleneck.", "Dependency quota, locks, DB pool, poison work, or retry traffic sets the ceiling.", "Downstream errors, saturation, duplicates, or oldest age worsen."],
            ["Pause optional producers", "New low-priority demand threatens a stronger accepted-work promise.", "The paused work is itself the highest-priority contract or cannot be recovered.", "Critical age does not improve or lost-input risk exceeds policy."],
            ["Reduce retry concurrency", "Transient failures are amplifying load faster than new work.", "A deadline-critical retry would be silently abandoned.", "Successful throughput falls without reducing dependency pressure."],
            ["Quarantine poison work", "A permanent or malformed item blocks ordered or shared progress.", "Skipping violates strict per-key ordering or an authorized loss policy.", "Ordering/effect integrity cannot be preserved for affected keys."],
        ],
        [82, 140, 151, 120],
        font_size=7.4,
    )]
    s += [p("Recovery is a set of exit conditions", H2), bullet_list([
        "Successful throughput exceeds effective arrivals with margin across critical partitions.",
        "Oldest age falls for the affected priority and tenant, not only globally.",
        "Downstream latency, errors, quotas, pools, and locks remain inside safe operating bounds.",
        "Retries return to baseline, DLQ ingress stops, and quarantined work has an owner and plan.",
        "Accepted effects are reconciled for missing, duplicate, expired, or out-of-order outcomes.",
    ])]
    end_page(s)

    s += page_heading(
        "Treat retries and dead letters as product behavior",
        "Bound attempts, time, side effects, and re-drive",
        "Retries are new load. A dead-letter queue is a controlled evidence and recovery path, not a trash bin and not proof that work is correct.",
    )
    s += [grid_table(
        ["Failure class", "Retry policy", "Required evidence"],
        [
            ["Transient and safe", "Exponential backoff with jitter, attempt and elapsed-time budget, deadline awareness.", "Original operation ID, attempt number, error class, first/last failure time."],
            ["Permanent input error", "Do not repeat unchanged work; quarantine under an explicit product policy.", "Validation reason, safe reference, owning team, customer-visible consequence."],
            ["Ambiguous effect", "Check an idempotency/effect ledger or reconcile before repeating the external action.", "Stable idempotency key, prior response/effect state, reconciliation result."],
            ["Dependency overload", "Respect server guidance, reduce concurrency, randomize retries, and stop at the user deadline.", "Quota/headroom, retry-after signal where supplied, effective retry arrival rate."],
        ],
        [104, 213, 176],
    ), spacer(9)]
    s += [p("A safe dead-letter record", H2), bullet_list([
        "Stable operation reference and safe payload pointer; redact secrets and unnecessary personal data.",
        "Failure class, first and last failure timestamps, attempt count, producer/consumer version, and partition/key context.",
        "Business priority, expiry or ordering consequence, current owner, alert state, and retention policy.",
        "Re-drive requires an approved fix, effect-level idempotency, a canary batch, rate limit, monitoring, pause control, and audit trail.",
    ], checklist=True), spacer(8)]
    s += [two_cards(
        ("Ordering trade-off", "Skipping a poison item can restore throughput but violate strict per-key order. State whether the product prefers blocking, quarantine with key isolation, or an explicit compensating path.", "Decision"),
        ("Visibility trade-off", "A short visibility/ack deadline can duplicate slow work. A very long deadline delays takeover after failure. Use extension/heartbeat only with bounded ownership.", "Decision"),
    )]
    s += [callout("Idempotency boundary", "Broker deduplication does not guarantee the external effect occurs once. Use a stable operation key and record or reconcile the effect at the system that owns the business consequence.")]
    end_page(s)

    s += page_heading(
        "Replay the weak answer without discarding its useful instinct",
        "Capacity may help - after rates, age, retries, and headroom are known",
        "The scripted response begins with adding workers and monitoring queue length. Keep the valid capacity hypothesis, then insert the missing diagnostic and safety decisions before acting.",
    )
    s += worked_example_table(
        ["Interviewer probe", "Weak-but-useful move", "Missing decision", "Improved response"],
        [
            ["The queue is growing. What first?", "Add more workers and watch queue length.", "Impact, oldest age, effective arrivals, successful service, partitions, and downstream headroom.", "I will first protect critical work and compare oldest age, new/retry arrivals, successful completions, partition skew, and downstream capacity; workers are conditional."],
            ["Why not scale immediately?", "More consumers should drain faster.", "Parallelism and the true service ceiling.", "I will canary concurrency only if partitions are available and downstream latency, quotas, pools, and locks have headroom."],
            ["What enters the DLQ?", "Messages that fail many times.", "Failure class, deadline, effect ambiguity, ordering, ownership, and re-drive safety.", "Permanent invalid work is quarantined with evidence; ambiguous effects are reconciled; re-drive is canaried, idempotent, rate-limited, owned, and audited."],
            ["How do you know recovery is real?", "Queue depth returns to normal.", "Depth can fall through expiry, drops, or starvation.", "Recovery requires successful throughput above effective arrivals, falling oldest age across critical partitions, safe dependencies, bounded retries, and reconciled effects."],
        ],
        [105, 103, 130, 155],
    )
    s += [p("Common incident-answer mistakes", H2), bullet_list([
        "Using dequeue or attempt rate as successful service rate.",
        "Applying a global drain-time estimate while one priority or partition remains blocked.",
        "Treating backoff without jitter as sufficient protection against synchronized retries.",
        "Moving failed work to a DLQ without owner, alert, retention, ordering policy, or re-drive control.",
        "Scaling consumers while the database, provider quota, lock, or connection pool is already saturated.",
        "Calling the incident resolved before accepted effects are reconciled.",
    ])]
    end_page(s)

    s += page_heading(
        "Explain the 71 and run a comparable correction",
        "A score is useful only when it changes the next observable behavior",
        "This representative catalog score is scripted teaching data. It identifies why retry bounds and recovery evidence arrived too late; it is not account history or a production incident assessment.",
    )
    s += [p("FICTIONAL SCRIPTED SCORECARD - ADAPT THE RUBRIC, NOT THE SCORE", LABEL), grid_table(
        ["Dimension", "Score", "Evidence", "Correction"],
        [
            ["Problem framing", "72", "The backlog was recognized, but user promise and oldest-age segmentation were not first.", "Open with impact, priority, accepted-work risk, and the rate model."],
            ["Technical depth", "74", "Workers and queue monitoring were plausible, but retries, DLQ, idempotency, and partitions lacked bounds.", "Classify failures and state attempt, deadline, effect, ordering, and re-drive rules."],
            ["Trade-off clarity", "62", "Capacity was presented as a default rather than a conditional intervention.", "Name when workers help, when they amplify collapse, and the stop signal."],
            ["Communication", "76", "The response was direct but skipped the evidence sequence required for a safe incident decision.", "Use impact -> rates -> hypothesis -> containment -> recovery -> prevention."],
        ],
        [91, 46, 184, 172],
    ), spacer(10)]
    s += [callout(
        "Corrected opening",
        "I will first protect the affected deadline and establish oldest age, new and retry arrivals, successful completions, partition skew, and downstream headroom. I will bound retry amplification and isolate poison work before adding workers. I will scale only if parallelism and dependencies allow it, and declare recovery only when successful throughput exceeds effective arrivals and oldest age falls across critical partitions.",
        warm=True,
    ), spacer(9)]
    s += [grid_table(
        ["Practice block", "Action", "Success evidence"],
        [
            ["Replay - 6 min", "Mark every claim as observation, hypothesis, action, or exit condition.", "No mechanism is presented as evidence of recovery."],
            ["Rate model - 5 min", "Calculate growth/drain ranges and list conditions that make them invalid.", "New, retry, and successful rates remain separate."],
            ["Pressure - 8 min", "Answer worker, DLQ, priority, poison, idempotency, and re-drive probes.", "Each answer includes a boundary and stop condition."],
            ["Transfer - 9 min", "Debug a nearby file-scan or notification backlog under the same clock and rubric.", "The method transfers without copying the original fix."],
            ["Close - 3 min", "Select one prevention guardrail and accountable owner.", "Alert threshold, action, and review date are explicit."],
        ],
        [82, 259, 152],
    )]
    s += [p("Completion checklist", H2), bullet_list([
        "Impact and oldest age are segmented by priority, tenant, and partition.",
        "New arrivals, retry arrivals, successful completions, and downstream ceiling are separate.",
        "The chosen containment is reversible and has an owner plus rollback signal.",
        "Retries, dead letters, effect idempotency, ordering, and re-drive are bounded.",
        "Recovery includes falling age and reconciliation, not merely lower depth.",
        "The re-test uses comparable conditions and records transcript evidence for the score.",
    ], checklist=True)]
    s += [callout("Next action", "Rehearse the corrected opening once, then run the same six pressure probes on an adjacent backlog scenario. Stop when the evidence sequence is audible without prompting.", warm=True)]
    return s


def build_resume_profile_lab_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Make role evidence inspectable",
        "A stronger resume bullet is not a louder claim",
        "This lab compares controlled revisions against a deterministic role-alignment rubric. The objective is to preserve the learner's verified facts while making scope, personal judgment, technical context, and outcome easier to evaluate.",
    )
    s += [callout(
        "Teaching-data boundary",
        "All names, roles, companies, dates, metrics, and bullet examples in this guide are fictional teaching data. Use the method with your own verified evidence; never copy a sample claim into a real resume.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Target", "Select one role capability and the evidence the job description actually requests."),
        ("Source", "Record the truthful work facts before improving the sentence."),
        ("Score", "Apply the same anchored rubric to the original and both revisions."),
        ("Change", "Rewrite one weak dimension at a time so score movement is explainable."),
        ("Defend", "Save the final bullet only if every word survives an interviewer probe."),
    ]), spacer(10)]
    s += [p("The 25-minute guided lab", H2), grid_table(
        ["Clock", "Action", "Output"],
        [
            ["0-3", "Choose one target role capability and one existing bullet.", "Capability phrase, source, and reason this bullet is relevant."],
            ["3-6", "Build the evidence ledger from records and memory you can defend.", "Facts, personal action, decision, scope, outcome, and unknowns."],
            ["6-10", "Score the original using the six 0-2 anchors.", "Dimension evidence and one highest-value gap."],
            ["10-17", "Create Revision A and Revision B with controlled changes.", "One version improves decision/scope; one improves outcome/clarity."],
            ["17-22", "Blind-compare all three and probe the claims.", "Selected version with reasons, not preference alone."],
            ["22-25", "Save final text, source pointer, uncertainty, and likely follow-up.", "A defensible bullet plus the interview story it should open."],
        ],
        [51, 217, 225],
    )]
    s += [callout("Truth gate", "Unsupported ownership, scale, outcome, tool use, title, or keyword cannot earn a high score. If a fact is unknown, narrow the wording or verify it; do not estimate because the sentence sounds stronger.")]
    end_page(s)

    s += page_heading(
        "Separate source evidence from resume language",
        "Write the ledger before writing the bullet",
        "A resume sentence is a compressed evidence claim. The ledger protects truth, exposes missing proof, and gives the learner material for interviewer follow-up without adding confidential detail.",
    )
    s += [grid_table(
        ["Evidence field", "Question to answer", "Acceptable source"],
        [
            ["Target capability", "Which decision in the target role should this bullet help prove?", "Current job description, recruiter note, or dated role evidence map."],
            ["Context and constraint", "What system or business condition made the work non-trivial?", "Design note, ticket, incident record, review note, or verified recollection."],
            ["Personal action", "What did you decide, design, implement, influence, or own directly?", "Commit/review trail, document authorship, task record, or specific manager feedback."],
            ["Technical judgment", "Which alternative or trade-off did you evaluate?", "Decision record, test, benchmark, experiment, or design review."],
            ["Scope", "What boundary was affected: service, users, tenants, regions, team, or process?", "Telemetry, inventory, ownership map, release record, or bounded qualitative fact."],
            ["Outcome", "What changed, over what window, and how was it observed?", "Metric/dashboard, incident trend, adoption record, cost report, or labeled qualitative evidence."],
            ["Limit", "What does the evidence not prove?", "Missing baseline, shared ownership, concurrent change, confidentiality, or unobserved cohort."],
        ],
        [99, 202, 192],
    ), spacer(9)]
    s += worked_example_table(
        ["Ledger field", "Verified teaching fact", "How it constrains wording"],
        [
            ["Context", "Checkout alerts had noisy duplicates during payment retries.", "The bullet may say duplicate alerts, not that payments themselves duplicated."],
            ["Personal action", "Riya proposed a stable event key, implemented deduplication, and added replay tests.", "Use proposed/implemented; do not claim sole ownership of the whole alerting platform."],
            ["Scope", "Two checkout services and three migrated event types.", "Name the bounded migration rather than enterprise-wide scale."],
            ["Outcome", "Duplicate alerts fell from 18% to 3% during a six-week observed window.", "Include metric, baseline, window, and result; do not claim revenue impact."],
            ["Limit", "A platform engineer approved the shared event contract.", "Show collaboration and keep final contract ownership accurate."],
        ],
        [92, 251, 150],
    )
    s += [p("When no reliable metric exists", H2), two_cards(
        ("Use observable evidence", "Release adopted by named teams, review cycle shortened, manual handoff removed, incident class no longer observed in a stated window, or ownership rule used after launch.", "Credible"),
        ("Avoid impact theater", "Do not invent percentages, users, savings, performance, or revenue. 'Improved efficiency significantly' is neither precise nor verifiable.", "Unsafe"),
    )]
    end_page(s)

    s += page_heading(
        "Score with anchored evidence",
        "Use the same 0-2 rubric for every revision",
        "The total is a comparison index for this lab, not a hiring prediction. A higher score is valid only when the sentence becomes more relevant, specific, credible, and readable without changing the underlying facts.",
    )
    s += [grid_table(
        ["Dimension", "0 - absent or unsafe", "1 - partial", "2 - clear and defensible"],
        [
            ["Role relevance", "No visible connection to a target capability.", "Related topic or tool, but the role decision is implied.", "The bullet directly evidences a capability the target role requires."],
            ["Ownership precision", "Team claim or inflated personal ownership.", "Action is named but personal boundary is blurry.", "The learner's decision/action and collaborators' ownership are distinguishable."],
            ["Scope and constraint", "No boundary or challenge.", "Scale or constraint is vague or context-heavy.", "A concise, verified system/business boundary explains difficulty."],
            ["Technical judgment", "Tool list without a decision.", "Mechanism is present; alternative or reason is weak.", "Choice, alternative, accepted cost, or test makes judgment inspectable."],
            ["Outcome evidence", "Unsupported superlative or invented impact.", "Direction is plausible but baseline/window/source is missing.", "Measured or explicitly qualitative result has a bounded source and honest limit."],
            ["Clarity and ATS", "Unparseable structure, jargon pile, or overloaded sentence.", "Readable but generic, repetitive, or longer than needed.", "Plain language, standard terms, strong verb, and one coherent evidence claim."],
        ],
        [91, 132, 127, 143],
        font_size=7.4,
    ), spacer(9)]
    s += [callout("Scoring order", "Apply the truth gate first. Then underline exact words that earn each point. If a reviewer cannot point to evidence in the sentence and ledger, the point is not earned.", warm=True), spacer(9)]
    s += [p("Diagnostic reading", H2), bullet_list([
        "0-4: return to the evidence ledger; polishing language will not fix missing source truth.",
        "5-7: one or two signals are visible, but the listener still must infer ownership, decision, scope, or outcome.",
        "8-10: strong evidence exists; improve only the weakest dimension and protect readability.",
        "11-12: the bullet is role-relevant, specific, defensible, and concise; stop editing unless new verified evidence changes it.",
    ])]
    s += [two_cards(
        ("Consistency check", "A second reviewer should reach a similar score from the anchors and underlined evidence. Large disagreement means the rubric or source facts are still ambiguous.", "Reliable use"),
        ("Regression check", "A rewrite fails if it raises one dimension by weakening truth, clarity, or ownership accuracy. Do not optimize the total at the expense of integrity.", "Reliable use"),
    )]
    end_page(s)

    s += page_heading(
        "Compare revisions one variable at a time",
        "Preserve the evidence; change the signal",
        "The fictional ladder below uses the same source ledger on every row. Revision A makes ownership and technical judgment visible. Revision B adds the bounded outcome without claiming work or impact that was not recorded.",
    )
    s += worked_example_table(
        ["Version", "Bullet", "Score", "Why the score moves"],
        [
            ["Original", "Worked on alert improvements using Kafka and Redis.", "3/12", "Relevant tools appear, but action, decision, scope, outcome, and personal boundary are missing."],
            ["Revision A", "Implemented stable event-key deduplication and replay tests for checkout alerts across two services.", "8/12", "Personal action, mechanism, and bounded scope are clear; the constraint, alternative, and observed result remain missing."],
            ["Revision B", "Reduced duplicate checkout alerts from 18% to 3% over six weeks by proposing a stable event key, implementing deduplication, and adding replay tests across two services and three event types.", "11/12", "The verified result, window, decision, action, and scope are visible; final shared-contract ownership is not overstated."],
        ],
        [61, 286, 50, 96],
    )
    s += [p("Blind comparison prompts", H2), grid_table(
        ["Question", "What a useful answer names"],
        [
            ["Which version proves the target capability fastest?", "The exact phrase that connects the bullet to the target decision."],
            ["Which word would trigger the hardest interviewer probe?", "The claim whose source, ownership, metric, or boundary may be weakest."],
            ["What fact is present in the ledger but absent from the bullet?", "Only the omission that materially changes role relevance or credibility."],
            ["What could be removed without losing evidence?", "Tools, adjectives, context, or implementation detail that does not support the decision."],
            ["Would the learner tell the same story aloud?", "A consistent personal action, trade-off, collaborator boundary, result, and limit."],
        ],
        [211, 282],
    )]
    s += [callout("Stop condition", "Choose the shortest revision that carries the strongest verified role evidence. Do not keep adding facts after the bullet already earns the target signal.")]
    end_page(s)

    s += page_heading(
        "Use the right correction for the weak signal",
        "Specific problems need small, specific rewrites",
        "Avoid rewriting the entire resume in one pass. Diagnose the sentence, change one dimension, score again, and keep the revision only if the evidence becomes clearer without new unsupported claims.",
    )
    s += [grid_table(
        ["Pattern", "Why it fails", "Smallest useful correction"],
        [
            ["Vague verb", "Helped, worked on, and involved in hide the learner's action.", "Replace with the verified decision or action: analyzed, proposed, designed, implemented, migrated, reviewed, or led."],
            ["Team-only claim", "The interviewer cannot separate collaboration from personal ownership.", "State the learner's action, then name shared or final ownership accurately when material."],
            ["Floating metric", "A number without baseline, window, population, or source can mislead.", "Add the missing boundary or remove the metric and use labeled qualitative evidence."],
            ["Tool inventory", "Technology names show exposure, not judgment or outcome.", "Keep only tools needed to explain the decision, constraint, or result."],
            ["Keyword stuffing", "Repeated job-description terms reduce clarity and can create claims the learner cannot defend.", "Use the standard term once where the verified work truly demonstrates it."],
            ["Confidential detail", "Private customer, security, financial, or architecture data creates trust risk.", "Generalize names and sensitive values while retaining the decision and bounded impact."],
            ["Oversized bullet", "Multiple unrelated claims compete and become difficult to parse.", "Keep one evidence claim; split only when each sentence proves a distinct target capability."],
        ],
        [89, 179, 225],
        font_size=7.4,
    ), spacer(9)]
    s += [p("Three evidence shapes", H2), two_cards(
        ("Measured technical result", "Decision + implementation + bounded scope + baseline/window/result. Include the number only when the source and interpretation are defensible.", "Shape 01"),
        ("Operational or influence result", "Decision + stakeholder/constraint + changed mechanism + observed adoption or recurring behavior. Label it qualitative when no reliable metric exists.", "Shape 02"),
    ), spacer(8), two_cards(
        ("Early-career project", "User/problem + personal build decision + technical constraint + test or demonstrable result. Separate tutorial completion from independent judgment.", "Shape 03"),
        ("Research or experiment", "Question + method + comparison + result + limit. Do not convert a controlled experiment into a production-impact claim.", "Shape 04"),
    )]
    end_page(s)

    s += page_heading(
        "Keep the profile readable and machine-safe",
        "ATS compatibility is a clarity constraint, not a keyword contest",
        "Use standard headings, plain text structure, consistent dates, and truthful terms. The resume still needs to work for a human who wants evidence of decisions rather than a dense inventory of technology.",
    )
    s += [grid_table(
        ["Check", "Pass condition", "Failure to avoid"],
        [
            ["Section structure", "Experience, projects, education, and skills use conventional text headings.", "Important content placed only in images, text boxes, decorative columns, headers, or footers."],
            ["Role and dates", "Employer/project, title, location/work model, and dates are consistent and understandable.", "Unexplained title inflation, ambiguous overlap, or inconsistent date formats."],
            ["Keywords", "Target terms appear where verified evidence demonstrates them.", "A copied job description, hidden keywords, or a skills list that the experience cannot support."],
            ["Links", "Readable labels and valid destinations; no private repositories or expired access.", "Long tracking URLs, broken links, or sensitive internal locations."],
            ["File and text", "Selectable text, sensible reading order, common font, and descriptive filename.", "Scanned-only pages, unusual glyphs, password protection, or oversized file without need."],
            ["Human scan", "Most relevant recent evidence is visible quickly and the hierarchy is consistent.", "Every bullet has equal weight or the target role signal is buried below generic content."],
        ],
        [91, 217, 185],
    ), spacer(9)]
    s += [p("Defensibility probe", H2), bullet_list([
        "What exactly did you do, and what did someone else own?",
        "Why did you choose this approach over the strongest alternative?",
        "Where did the scope, number, or outcome come from? Over what window?",
        "What failed, remained uncertain, or would you change now?",
        "Which confidential detail should stay generalized in a public resume?",
    ], checklist=True)]
    s += [callout("Parse test", "Export the resume, copy its text into a plain editor, and check reading order, headings, dates, bullets, links, and symbols. This does not reproduce every employer system, but it catches avoidable structural failures.")]
    end_page(s)

    s += page_heading(
        "Save a complete lab record",
        "The final bullet should open a truthful interview story",
        "Keep the original, both controlled revisions, scores, evidence sources, remaining uncertainty, and likely follow-up. A polished sentence without its evidence trail is difficult to maintain and risky to defend.",
    )
    s += [p("Completed fictional lab record", H2), grid_table(
        ["Record", "Saved evidence"],
        [
            ["Target capability", "Reliability engineering: diagnose duplicate effects and design a replay-safe correction."],
            ["Original retained", "Worked on alert improvements using Kafka and Redis."],
            ["Selected revision", "Reduced duplicate checkout alerts from 18% to 3% over six weeks by proposing a stable event key, implementing deduplication, and adding replay tests across two services and three event types."],
            ["Source pointer", "Incident review, replay-test change, and six-week alert-quality dashboard; fictional teaching sources."],
            ["Honest limit", "Shared event contract was approved by the platform owner; no revenue or customer-retention claim."],
            ["Likely probe", "How did the stable key behave across retries, and how did you distinguish a duplicate alert from a valid repeated event?"],
            ["Story cue", "Duplicate alert -> stable identity -> replay test -> bounded rollout -> measured six-week result."],
        ],
        [112, 381],
    ), spacer(9)]
    s += [p("Final save checklist", H2), bullet_list([
        "Target capability and current source are dated.",
        "Every fact in the selected bullet appears in the evidence ledger.",
        "Personal action and collaborator/final-owner boundaries are accurate.",
        "The same anchored rubric was applied to all three versions with underlined evidence.",
        "The selected revision is shorter or clearer without losing the strongest verified signal.",
        "No confidential details, invented scale, unsupported metric, hidden keyword, or inaccessible link remains.",
        "A likely interviewer probe and a truthful story cue are saved beside the bullet.",
    ], checklist=True)]
    s += [two_cards(
        ("Use next", "Place the selected bullet in the editable ATS resume, then re-run the plain-text parse and human scan on the complete document.", "Next action"),
        ("Review later", "Reopen the ledger only when the target capability or verified evidence changes. Avoid endless stylistic edits that do not improve the rubric.", "Maintenance"),
    )]
    return s


def build_compensation_conversation_story() -> list[Flowable]:
    s: list[Flowable] = []
    s += page_heading(
        "Prepare a conversation, not a demand",
        "Negotiate with clear units, relevant evidence, and calm boundaries",
        "This rehearsal teaches how to clarify the offer, state a reasoned target, handle location-based pushback, explore legitimate package levers, and close in writing without bluffing or inventing market facts.",
    )
    s += [callout(
        "Teaching and advice boundary",
        "All people, companies, amounts, dates, bands, offers, and dialogue are fictional teaching data - not compensation benchmarks, legal advice, or tax advice. Verify your own terms and seek qualified advice where needed.",
        warm=True,
    ), spacer(10)]
    s += [numbered_chain([
        ("Clarify", "Confirm model, currency, period, gross/net basis, components, conditions, and deadline."),
        ("Align", "Restate interest and the role scope or decision the conversation should resolve."),
        ("Anchor", "State one reasoned target in comparable units, then pause."),
        ("Explore", "Ask which levers and constraints are real; trade only across acceptable terms."),
        ("Confirm", "Summarize agreed facts, open items, owners, and timing in writing."),
    ]), spacer(10)]
    s += [p("The 20-minute rehearsal", H2), grid_table(
        ["Clock", "Scenario", "Observable skill"],
        [
            ["0-3", "Prepare the offer facts, target, rationale, fallback, questions, and deadline.", "Every amount has a currency, time unit, component, and certainty label."],
            ["3-7", "Recruiter asks for expectations before sharing the full package.", "Clarify role/level/model and respond without anchoring against an unknown unit."],
            ["7-11", "Recruiter cites a location-based band.", "Acknowledge, clarify the constraint, re-anchor in role scope and evidence, then pause."],
            ["11-15", "Base cannot move.", "Explore only real package levers and compare their value/risk explicitly."],
            ["15-18", "Replay the weakest turn with one correction.", "Improved response preserves truthful rationale and removes defensiveness or bluff."],
            ["18-20", "Close and save the written summary.", "Agreed facts, open questions, owner, next date, and no accidental acceptance."],
        ],
        [51, 240, 202],
    )]
    s += [callout("Operating rule", "Ask one clarifying question, make one evidence-backed request, and then leave space for the other person to respond. More words do not create more leverage.")]
    end_page(s)

    s += page_heading(
        "Normalize the language before negotiating",
        "A number without its unit is not an offer",
        "Separate fixed cash, variable pay, equity, benefits, one-time amounts, and working conditions. Do not compare monthly contractor revenue with annual employee salary or treat a conditional bonus as guaranteed cash.",
    )
    s += [grid_table(
        ["Field", "Clarify", "Do not assume"],
        [
            ["Engagement model", "Employee, employer-of-record, contractor, or another arrangement; employer/counterparty and governing terms.", "That labels alone determine taxes, protections, or take-home value."],
            ["Fixed cash", "Currency, annual/monthly/hourly unit, gross/net basis, pay schedule, review timing.", "That conversion to another currency is fixed or fee-free."],
            ["Variable", "Target, formula, individual/company conditions, cap, timing, historical payout if authorized.", "That target bonus is guaranteed or paid pro rata."],
            ["Equity", "Instrument, quantity, vesting, cliff, strike/exercise terms, liquidity, expiration, and documents.", "A headline value equals realizable cash."],
            ["Benefits", "Leave, insurance, retirement, equipment, learning, travel, notice, severance, and local availability.", "The same benefit exists in every location or engagement model."],
            ["Working reality", "Timezone overlap, on-call, travel, hours, equipment, expense policy, manager/team, and scope.", "Remote means schedule autonomy or no travel."],
            ["Decision timing", "Written-offer date, questions deadline, acceptance deadline, start date, and contingencies.", "A verbal discussion is the final written term."],
        ],
        [94, 231, 168],
        font_size=7.4,
    ), spacer(9)]
    s += worked_example_table(
        ["Item", "Fictional fact", "Conversation-safe interpretation"],
        [
            ["Fixed cash", "USD 72,000 annual gross through an EOR.", "Comparable only after confirming pay schedule, fees, local deductions, and written terms."],
            ["Bonus", "Up to 10%, company and individual conditions not yet documented.", "Treat as uncertain variable compensation until formula and payout rules are supplied."],
            ["Equity", "Options mentioned verbally; no grant size or terms.", "Record as unknown, not as current package value."],
            ["Work pattern", "Four hours of IST-US overlap plus one on-call week in six.", "A material time and recovery commitment to compare, clarify, and possibly negotiate."],
            ["Decision", "Written offer expected Friday; response requested Monday.", "Ask for complete documents and a reasonable review window before treating the deadline as fixed."],
        ],
        [82, 183, 228],
    )
    s += [callout("Companion use", "Use the existing compensation and offer decision workbook for detailed normalization and risk comparison. This guide focuses on how to conduct the spoken conversation and confirm it safely afterward.")]
    end_page(s)

    s += page_heading(
        "Build one defensible anchor",
        "Target, rationale, fallback, and boundary must agree",
        "An anchor is a clear request in comparable units supported by role scope, level, and truthful evidence. It is not a copied benchmark, a bluff, or a claim about personal need.",
    )
    s += [grid_table(
        ["Anchor card", "What to prepare", "Quality check"],
        [
            ["Ask", "Specific component and number/range with currency, period, and gross/net basis.", "The other person can repeat the request without guessing units."],
            ["Rationale", "Role scope, level, responsibilities, scarce relevant capability, and verified interview/work evidence.", "The reason explains value for this role, not rent, family costs, or an invented market statistic."],
            ["Package context", "Which terms are confirmed, conditional, unknown, or material to your decision.", "Fixed, variable, equity, benefits, and conditions are not collapsed into one number."],
            ["Fallback ladder", "Acceptable alternatives ordered before the call.", "Each fallback has real value to you and is available for discussion; no fake concessions."],
            ["Boundary", "Term that makes the offer unacceptable or requires more diligence.", "A private decision rule, stated professionally only when useful."],
            ["Evidence source", "Written offer, recruiter clarification, current target-role evidence, and dated source notes.", "Every factual claim is verifiable and no confidential employer data is exposed."],
        ],
        [86, 232, 175],
    ), spacer(9)]
    s += [p("Sentence framework", H2), p(
        "I am excited about the role, especially [specific scope]. Based on the responsibilities we discussed and my evidence in [relevant capability], I would like to explore [component and precise unit]. How much flexibility is available within the approved package?",
        QUOTE,
    ), spacer(9)]
    s += [two_cards(
        ("Evidence, not autobiography", "Use decisions and outcomes relevant to the role. Avoid long personal explanations, current living costs, or confidential details that do not help the company evaluate the request.", "Rationale"),
        ("Pause after the ask", "Do not immediately discount your request or fill silence with extra concessions. Listen for the actual constraint, then choose the next question.", "Delivery"),
    )]
    s += [callout("Ethics boundary", "Never invent a competing offer, current salary, benchmark, deadline, title, scope, or willingness to walk away. A negotiation that depends on a false fact is not a safe rehearsal outcome.", warm=True)]
    end_page(s)

    s += page_heading(
        "Respond to location-based pushback calmly",
        "Clarify the policy before arguing with it",
        "Location may affect approved bands, engagement model, benefits, taxes, currency, or internal equity. The learner's job is to understand the real constraint, reconnect the request to role scope, explore legitimate alternatives, and preserve the relationship.",
    )
    s += [numbered_chain([
        ("Acknowledge", "Reflect the stated constraint without agreeing that every conclusion follows."),
        ("Clarify", "Ask whether the limit applies to base, total package, level, model, or location policy."),
        ("Re-anchor", "Return to the role's scope and the learner's verified relevant evidence."),
        ("Explore", "Ask about approved alternatives, review timing, or level/scope alignment."),
        ("Pause", "Let the recruiter respond; do not debate geography or repeat the ask emotionally."),
    ]), spacer(10)]
    s += worked_example_table(
        ["Speaker", "Fictional conversation", "Why the move works"],
        [
            ["Recruiter", "For candidates based in India, this is already near the top of our band.", "States a policy constraint but does not yet define component, level, or total-package boundary."],
            ["Candidate", "Thank you for explaining that. Is the limit specific to fixed cash for this location, or does it also constrain level and the total package?", "Acknowledges and asks one precise question before countering."],
            ["Recruiter", "The fixed-cash band is location-based; level is confirmed and some other terms may be flexible.", "Reveals which constraint is fixed and which levers remain open."],
            ["Candidate", "Understood. Given the confirmed level, the on-call ownership, and the distributed-systems scope we discussed, I would like to explore USD 78,000 annual gross fixed cash. If that band cannot move, could we review sign-on support or a written six-month compensation review with clear criteria?", "Uses exact units, role evidence, one request, and truthful alternatives without attacking the policy."],
            ["Recruiter", "I can check sign-on and the review timing, but I cannot promise either today.", "Keeps unknowns explicit instead of converting interest into an agreement."],
            ["Candidate", "That would be helpful. May I send a short summary of the two questions so we can confirm the response and timing in writing?", "Closes with ownership and a safe written record."],
        ],
        [72, 309, 112],
    )
    s += [p("Avoid these reactions", H2), bullet_list([
        "Calling the policy unfair before understanding what it actually constrains.",
        "Arguing with unsourced salary screenshots or claiming a universal global rate.",
        "Explaining personal expenses as the primary business rationale.",
        "Threatening to reject the offer without a real, considered boundary.",
        "Accepting a verbal alternative without amount, conditions, owner, date, and written confirmation.",
    ])]
    end_page(s)

    s += page_heading(
        "Choose the next question from the constraint",
        "A branching conversation prevents rehearsed monologues",
        "Listen for what is fixed, unknown, conditional, or open. The next move should reduce a decision uncertainty, not repeat the same request in different words.",
    )
    s += [grid_table(
        ["What you hear", "Useful next question", "Risk to avoid"],
        [
            ["What are your expectations?", "Before I give a comparable number, can we confirm level, engagement model, currency, fixed/variable components, and the budgeted scope?", "Anchoring against an undefined package or refusing to engage indefinitely."],
            ["We need your current salary.", "Could we focus on the approved range and responsibilities for this role? I can share my expectations in the same units once those are clear.", "Inventing a number, exposing documents unnecessarily, or making legal claims without context."],
            ["Base is fixed.", "Which other terms are approved for discussion, and how are review timing and criteria documented?", "Trading for low-value perks or treating an informal review as guaranteed pay."],
            ["We can add equity.", "May I review the instrument, grant size, vesting, strike/exercise terms, expiration, and liquidity information in writing?", "Valuing the headline equity amount like cash."],
            ["This is our final package.", "Thank you for clarifying. May I confirm the complete written terms and response deadline so I can evaluate the package carefully?", "Negotiating against yourself or accepting under artificial urgency."],
            ["We can revisit later.", "What date, decision owner, performance criteria, and possible adjustment would be written into the offer or review plan?", "Treating an undefined future conversation as current compensation."],
        ],
        [117, 257, 119],
        font_size=7.4,
    ), spacer(9)]
    s += [p("A practical fallback ladder", H2), bullet_list([
        "Fixed cash in the same unit as the offer.",
        "One-time sign-on amount with repayment conditions understood.",
        "Variable target or guarantee only when formula and conditions are written.",
        "Equity only after instrument and terms are available for diligence.",
        "Paid leave, equipment, learning, travel, timezone overlap, on-call, or start-date changes with real personal value.",
        "A written review date with decision owner, criteria, and adjustment scope - not a vague promise.",
        "Role level, title, reporting line, or scope only when the work itself is accurately aligned.",
    ])]
    s += [callout("Trade deliberately", "Do not offer a concession until you understand what you receive, how certain it is, and whether it changes your decision. Package flexibility is not automatically package value.")]
    end_page(s)

    s += page_heading(
        "Rehearse under pressure and score observable behavior",
        "Keep the same facts while changing delivery",
        "Run the dialogue twice. The second attempt should preserve the target and rationale while improving unit precision, listening, composure, ethical boundaries, or the written close.",
    )
    s += [grid_table(
        ["Dimension", "0", "1", "2"],
        [
            ["Unit precision", "Amounts/components cannot be compared.", "Most units are clear; one condition remains mixed.", "Currency, period, gross/net basis, component, and certainty are explicit."],
            ["Listening and clarification", "Responds to an assumed objection.", "Acknowledges but asks a broad or stacked question.", "Reflects the constraint and asks one question that changes the next decision."],
            ["Relevant rationale", "Uses need, hype, or invented market claims.", "Role evidence is present but generic.", "Verified scope/capability evidence directly supports the request."],
            ["Pushback composure", "Argues, apologizes excessively, or discounts immediately.", "Remains calm but repeats the ask without learning.", "Acknowledges, clarifies, re-anchors, explores, and pauses."],
            ["Ethical boundary", "Bluff, false deadline/offer, or concealed uncertainty.", "No fabrication, but facts and assumptions are mixed.", "Facts, unknowns, boundaries, and confidentiality are explicit."],
            ["Written close", "No agreed summary or accidental acceptance.", "Summary exists but owner/date/open item is missing.", "Agreed facts, open items, owners, timing, and non-acceptance are clear."],
        ],
        [102, 119, 119, 153],
        font_size=7.4,
    ), spacer(9)]
    s += [p("Pressure rounds", H2), grid_table(
        ["Round", "Recruiter move", "Learner objective"],
        [
            ["A", "Expectation requested before range or package details.", "Clarify comparable units and role boundary, then provide a reasoned target if needed."],
            ["B", "Location-based fixed-cash band is cited.", "Clarify the constrained component and re-anchor once in role evidence."],
            ["C", "Base is fixed but another lever is offered vaguely.", "Ask for exact terms and compare certainty/value before trading."],
            ["D", "A quick verbal answer is requested.", "Ask for the complete written offer and a clear review deadline."],
            ["Replay", "Repeat the learner's weakest turn verbatim.", "Change one behavior only and record why the response became safer or clearer."],
        ],
        [51, 213, 229],
    )]
    s += [callout("Score reason", "Write one quoted sentence or timestamp beside every point. Confidence and politeness matter, but the rubric scores decisions the learner can repeat and improve.", warm=True)]
    end_page(s)

    s += page_heading(
        "Close without creating a false agreement",
        "Confirm facts, unknowns, owners, and dates",
        "A short written summary reduces unit confusion and gives both sides a clean record. It should not add new demands, imply acceptance, or turn a respectful conversation into an adversarial memo.",
    )
    s += [p("Fictional follow-up structure", H2), grid_table(
        ["Section", "Example content"],
        [
            ["Appreciation", "Thank you for discussing the role and package today. I remain interested in the distributed-systems scope and confirmed level."],
            ["Confirmed facts", "Current fixed-cash offer: USD 72,000 annual gross through the stated EOR; other terms remain subject to the written offer."],
            ["Open requests", "Please check whether sign-on support or a six-month compensation review can be included, with amount/criteria, owner, and timing."],
            ["Documents/questions", "Please share the complete offer and applicable bonus, equity, benefits, on-call, notice, and review terms when available."],
            ["Timing", "You expect to respond by Thursday; I will review the complete written terms and reply by the mutually confirmed deadline."],
            ["Boundary", "This note records the discussion and is not acceptance of terms."],
        ],
        [108, 385],
    ), spacer(9)]
    s += [p("Final rehearsal checklist", H2), bullet_list([
        "The engagement model and every amount use comparable currency, period, basis, component, and certainty labels.",
        "The target and fallback ladder reflect the learner's real priorities and verified role evidence.",
        "The learner asks one clarifying question before responding to location, range, current-salary, equity, or deadline pressure.",
        "No fabricated offer, benchmark, salary, deadline, authority, or willingness to walk away appears.",
        "Every alternative is evaluated for terms, conditions, certainty, and actual decision value.",
        "The close records confirmed facts, unknowns, owners, dates, and non-acceptance where appropriate.",
        "Legal, tax, currency, classification, and equity uncertainties are marked for qualified diligence rather than guessed.",
    ], checklist=True), spacer(8)]
    s += [two_cards(
        ("Keep", "Calm pace, exact units, relevant evidence, one request, one question, honest uncertainty, and a written record.", "Strong signal"),
        ("Remove", "Bluffing, excessive justification, argument about geography, unsourced benchmarks, premature concessions, and verbal-only assumptions.", "Risk"),
    )]
    s += [callout("Next action", "Complete the anchor card, rehearse the location-based pushback twice, score both attempts with quoted evidence, and send only a truthful written summary after a real conversation.", warm=True)]
    return s


SPECS = [
    PdfSpec(
        filename="behavioral_question-bank.pdf",
        category="Behavioral reference",
        title="50 Behavioral Questions",
        subtitle="Fifty distinct decision prompts, specific evidence and follow-up probes, two worked answers, and a practical self-review loop.",
        thesis="Prepare truthful evidence of judgment, ownership, and learning - not fifty memorized scripts.",
        slug="behavioral / question-bank",
        build_story=build_behavioral_bank_story,
        revision="1.1",
        compact=True,
        review_required=True,
    ),
    PdfSpec(
        filename="remote_compensation-and-offer-decision-workbook.pdf",
        category="Remote career workbook",
        title="Remote Compensation and Offer Decision Workbook",
        subtitle="A practical system for comparing employee, EOR, and contractor offers across cash, benefits, time, currency, contract risk, working reality, and career value.",
        thesis="Normalize what can be compared, keep uncertainty visible, stress-test the assumptions, and negotiate the few gaps that can change the decision.",
        slug="remote / compensation-and-offer-decision",
        build_story=build_remote_compensation_offer_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="dsa_traversal-decision-practice-workbook.pdf",
        category="DSA practice workbook",
        title="Four Traversal Problems: Decision Practice Workbook",
        subtitle="A 75-minute mixed BFS and DFS practice set with original prompts, worked traces, invariants, tests, near misses, and an explanation rubric.",
        thesis="Choose traversal from the guarantee the prompt needs, keep state separate from the answer, and prove correctness across four representative graph problems.",
        slug="dsa / traversal-decision-practice",
        build_story=build_traversal_practice_story,
    ),
    PdfSpec(
        filename="career_target-role-evidence-map.pdf",
        category="Career profile guide",
        title="Target Role and Evidence Map",
        subtitle="A practical guide and completed evidence map for defining the role, level, evidence bar, and first preparation gap.",
        thesis="Turn a broad job goal into a testable target and a preparation sequence grounded in observable evidence.",
        slug="career / target-role-evidence-map",
        build_story=build_target_role_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="operations_technical-baseline-scorecard.pdf",
        category="Operations guide",
        title="Technical Baseline Scorecard",
        subtitle="A controlled starting-point assessment for coding, system design, explanation quality, and the first correction to test.",
        thesis="Measure observable interview behavior under consistent conditions without turning one attempt into a readiness verdict.",
        slug="operations / technical-baseline-scorecard",
        build_story=build_baseline_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="company_interview-loop-gap-map.pdf",
        category="Company research guide",
        title="Company Interview Loop and Gap Map",
        subtitle="An evidence-bounded research guide for mapping likely stages, confidence, preparation themes, and three contextual gaps.",
        thesis="Use current public evidence to focus preparation while keeping uncertainty, ethics, and source quality visible.",
        slug="company / interview-loop-gap-map",
        build_story=build_company_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="operations_evidence-comparison-correction-workbook.pdf",
        category="Operations workbook",
        title="Evidence Comparison and Correction Workbook",
        subtitle="A three-attempt review system for isolating one persistent gap, choosing a correction, and running a comparable re-test.",
        thesis="Find the repeated decision moment behind the score, change one behavior, and require evidence of transfer.",
        slug="operations / evidence-comparison-correction",
        build_story=build_evidence_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="operations_timed-technical-rehearsal-workbook.pdf",
        category="Operations workbook",
        title="Timed Coding and System Design Rehearsal Workbook",
        subtitle="Two controlled, interview-shaped practice blocks with protected decision clocks, completed evidence records, and practical debriefs.",
        thesis="Use time pressure to test decision order while protecting clarification, invariants, testing, trade-offs, and failure handling.",
        slug="operations / timed-technical-rehearsal",
        build_story=build_timed_rehearsal_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="operations_final-loop-interview-day-runbook.pdf",
        category="Operations workbook",
        title="Final-Loop Rehearsal and Interview-Day Runbook",
        subtitle="A compressed multi-round rehearsal, transition protocol, evidence debrief, taper plan, and printable day-of operating sheet.",
        thesis="Consolidate proven skills, protect recovery between rounds, and remove avoidable interview-day friction.",
        slug="operations / final-loop-interview-day-runbook",
        build_story=build_final_loop_story,
        revision="1.1",
        compact=True,
    ),
    PdfSpec(
        filename="coaching_architecture-narrative-worksheet.pdf",
        category="Coach room worksheet",
        title="Architecture Narrative Worksheet",
        subtitle="A decision-led Senior-to-Staff narrative system for making architecture judgment, influence beyond authority, and bounded outcomes easy to inspect.",
        thesis="Lead with the expensive decision, connect every component to a constraint, and prove influence and consequence without inflating ownership.",
        slug="coach-room / architecture-narrative",
        build_story=build_architecture_narrative_story,
        revision="1.0",
        compact=True,
        edition="HUMAN CALIBRATION",
        audience="PRIVATE LEARNER COPY",
        format_label="FORMAT COACH WORKSHEET + COMPLETED EXAMPLES",
    ),
    PdfSpec(
        filename="coaching_target-company-preparation-guide.pdf",
        category="Coach room private guide",
        title="Target-Company Preparation Guide",
        subtitle="An evidence-bounded interview-week brief connecting the target level, likely loop, truthful evidence portfolio, rehearsals, and open risks.",
        thesis="Convert dated evidence and recruiter-confirmed facts into three focused preparation decisions without predicting or leaking interview questions.",
        slug="coach-room / target-company-preparation",
        build_story=build_target_company_preparation_story,
        revision="1.0",
        compact=True,
        edition="HUMAN CALIBRATION",
        audience="PRIVATE LEARNER COPY",
        format_label="FORMAT PRIVATE GUIDE + COMPLETED EXAMPLE",
    ),
    PdfSpec(
        filename="coaching_interview-day-run-sheet.pdf",
        category="Coach room private run sheet",
        title="Interview-Day Run Sheet",
        subtitle="A calm one-page operating sheet for readiness, answer cues, recovery, story retrieval, and between-round transitions.",
        thesis="Protect attention and honest decision-making by removing avoidable interview-day friction.",
        slug="coach-room / interview-day-run-sheet",
        build_story=build_interview_day_run_sheet_story,
        revision="1.0",
        edition="HUMAN CALIBRATION",
        audience="PRIVATE LEARNER COPY",
        format_label="FORMAT ONE-PAGE PRIVATE RUN SHEET",
        single_page=True,
    ),
    PdfSpec(
        filename="second-seat_metrics-pipeline-scored-replay.pdf",
        category="AI practice scored replay",
        title="Design a Metrics Pipeline - Scored Mock Replay",
        subtitle="A 38-minute interview-shaped replay covering the data contract, workload, architecture, correctness, failure behavior, transcript evidence, score reason, and precise correction.",
        thesis="Define the user-visible freshness and completeness contract before topology, then make delivery semantics and failure behavior audible at the moment they change the design.",
        slug="ai-practice / metrics-pipeline-scored-replay",
        build_story=build_metrics_pipeline_replay_story,
        revision="1.0",
        edition="AI PRACTICE",
        audience="HUMAN CALIBRATION REVIEW COPY",
        format_label="FORMAT SCORED MOCK REPLAY + CORRECTION LAB",
    ),
    PdfSpec(
        filename="second-seat_queue-backlog-debugging-replay.pdf",
        category="AI practice debugging replay",
        title="Debug a Queue Backlog - Production Debugging Replay",
        subtitle="A 31-minute incident conversation for diagnosing rates, age, retries, dead letters, partition skew, downstream limits, safe containment, recovery, and prevention.",
        thesis="Protect the user promise, measure effective arrivals and successful service, stop amplification, and scale only when parallelism and downstream headroom are proven.",
        slug="ai-practice / queue-backlog-debugging-replay",
        build_story=build_queue_backlog_replay_story,
        revision="1.0",
        edition="AI PRACTICE",
        audience="HUMAN CALIBRATION REVIEW COPY",
        format_label="FORMAT PRODUCTION DEBUGGING REPLAY + RETEST",
    ),
    PdfSpec(
        filename="second-seat_resume-profile-role-alignment-lab.pdf",
        category="Career profile guided lab",
        title="Resume Profile Lab",
        subtitle="A 25-minute evidence-first lab for scoring an original bullet, producing two controlled revisions, comparing role signal, and saving only the strongest defensible version.",
        thesis="Preserve verified facts, expose personal judgment and bounded outcomes, and make every score change traceable to evidence rather than louder language.",
        slug="career-profile / resume-role-alignment-lab",
        build_story=build_resume_profile_lab_story,
        revision="1.0",
        edition="AI PRACTICE",
        audience="HUMAN CALIBRATION REVIEW COPY",
        format_label="FORMAT GUIDED LAB + DETERMINISTIC RUBRIC",
    ),
    PdfSpec(
        filename="second-seat_compensation-conversation-rehearsal.pdf",
        category="AI practice conversation rehearsal",
        title="Compensation Conversation Rehearsal",
        subtitle="A 20-minute branching rehearsal for clarifying package terms, making a reasoned ask, handling location-based pushback, exploring real levers, and closing safely in writing.",
        thesis="Use exact units, role-relevant evidence, calm questions, honest boundaries, and a written record - never bluff, guess, or negotiate against an undefined package.",
        slug="ai-practice / compensation-conversation-rehearsal",
        build_story=build_compensation_conversation_story,
        revision="1.0",
        edition="AI PRACTICE",
        audience="HUMAN CALIBRATION REVIEW COPY",
        format_label="FORMAT BRANCHING CONVERSATION REHEARSAL",
    ),
]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build selected InterviewRunway learning PDFs")
    parser.add_argument("--only", nargs="+", choices=[spec.filename for spec in SPECS])
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "output" / "pdf"
    for spec in SPECS:
        if args.only and spec.filename not in args.only:
            continue
        output_path = output_dir / spec.filename
        build_pdf(spec, output_path)
        print(output_path)


if __name__ == "__main__":
    main()
