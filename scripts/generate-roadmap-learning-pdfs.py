from __future__ import annotations

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
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for row_index in range(1, len(data)):
        commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE_ALT if row_index % 2 == 0 else WHITE))
    table.setStyle(TableStyle(commands))
    return table


def worksheet_table(
    headers: Sequence[str],
    rows: int,
    widths: Sequence[float],
    *,
    row_height: float = 45,
    prompts: Sequence[Sequence[str]] | None = None,
) -> Table:
    body_rows: list[list[str]] = []
    for index in range(rows):
        if prompts and index < len(prompts):
            body_rows.append(list(prompts[index]))
        else:
            body_rows.append(["" for _ in headers])
    return grid_table(headers, body_rows, widths, font_size=7.1, row_heights=[row_height] * rows)


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
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 46, "VAULT / LEARNER EDITION")
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
    canvas.drawString(MARGIN + 5, metadata_y, "VERSION 1.0")
    canvas.drawString(MARGIN + 5, metadata_y - 16, "FORMAT GUIDE + WORKSHEET")
    canvas.drawString(MARGIN + 5, metadata_y - 32, "STATUS LEARNER READY")
    canvas.drawString(MARGIN + 5, metadata_y - 72, spec.slug.upper())

    canvas.setFont("Courier", 6.5)
    canvas.setFillColor(ORANGE)
    canvas.drawString(MARGIN, 27, "LEARNER EDITION")
    canvas.setFillColor(colors.HexColor("#A3B2BC"))
    canvas.drawRightString(PAGE_W - MARGIN, 27, "interviewrunway.com")
    canvas.restoreState()


def draw_body(canvas: Canvas, doc: BaseDocTemplate, spec: PdfSpec) -> None:
    canvas.saveState()
    canvas.setFillColor(NAVY_2)
    canvas.setFont("Helvetica-Bold", 7.2)
    canvas.drawString(MARGIN, PAGE_H - 24, "INTERVIEWRUNWAY / VAULT")
    canvas.setFillColor(colors.HexColor("#8796A3"))
    canvas.setFont("Courier", 6.1)
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 24, spec.slug.upper())
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, PAGE_H - 36, PAGE_W - MARGIN, PAGE_H - 36)
    canvas.line(MARGIN, 34, PAGE_W - MARGIN, 34)
    canvas.setFillColor(ORANGE)
    canvas.setFont("Courier", 6.1)
    canvas.drawString(MARGIN, 22, "LEARNER EDITION")
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
        creator="InterviewRunway Vault content pipeline",
        keywords=f"InterviewRunway, Vault, {spec.category}, roadmap, worksheet",
    )
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover-frame")
    body_frame = Frame(MARGIN, 47, CONTENT_W, PAGE_H - 96, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="body-frame")
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=lambda c, d: draw_cover(c, d, spec)),
            PageTemplate(id="body", frames=[body_frame], onPage=lambda c, d: draw_body(c, d, spec)),
        ]
    )
    story: list[Flowable] = [NextPageTemplate("body"), PageBreak()]
    story.extend(spec.build_story())
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

    s += page_heading(
        "Worksheet",
        "Complete the one-page Target Role and Evidence Map",
        "Use one row per recurring role requirement. Keep the first version imperfect; its purpose is to choose the next evidence test.",
    )
    s += [grid_table(
        ["Target boundary", "Your current hypothesis"],
        [
            ["Role family and level", ""],
            ["Geography / work model", ""],
            ["Company shape / domain", ""],
            ["Interview date or horizon", ""],
            ["Most uncertain assumption", ""],
        ],
        [145, 348],
        row_heights=[31, 31, 31, 31, 31],
    ), spacer(12)]
    s += [worksheet_table(
        ["Recurring requirement", "Evidence I can show", "Confidence", "Gap / next proof"],
        4,
        [126, 155, 70, 142],
        row_height=57,
        prompts=[
            ["1.", "", "H / M / L", ""],
            ["2.", "", "H / M / L", ""],
            ["3.", "", "H / M / L", ""],
            ["4.", "", "H / M / L", ""],
        ],
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
    s += [callout("Your next action", "Save the completed map, open the Technical Baseline Scorecard, and test the gap that could most change your preparation order."), spacer(11)]
    s += [p("Completion check", H2), bullet_list([
        "One role family and level are explicit.",
        "Three recurring requirements have evidence or a named gap.",
        "Confidence is separated from wishful certainty.",
        "One next action has a visible completion condition.",
    ], checklist=True, compact=True)]
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
    ), spacer(10), grid_table(
        ["Dimension", "What reliable behavior sounds or looks like", "0 / 1 / 2"],
        [
            ["Clarification", "Restates inputs, outputs, constraints, and examples before selecting an approach.", ""],
            ["Pattern choice", "Connects a prompt cue to an approach and rejects one plausible alternative.", ""],
            ["State / invariant", "Names what is stored and what remains true after each step.", ""],
            ["Correctness", "Implements the stated approach without changing the contract silently.", ""],
            ["Complexity", "Explains time and space from the operations and state actually used.", ""],
            ["Testing", "Covers empty/minimum, boundary, duplicate, and main-transition cases.", ""],
            ["Communication", "Keeps decisions audible without narrating every keystroke.", ""],
        ],
        [94, 330, 69],
        font_size=7.25,
        row_heights=[43] * 7,
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
    ), spacer(10), grid_table(
        ["Dimension", "What reliable behavior sounds or looks like", "0 / 1 / 2"],
        [
            ["Requirements", "Separates critical actions, quality attributes, and explicit non-goals." , ""],
            ["Scale model", "Uses order-of-magnitude traffic, payload, peak, and retention assumptions." , ""],
            ["Decision order", "Moves from contract and data flow to components; boxes have stated reasons." , ""],
            ["Data and state", "Names source of truth, entities, invariants, partitioning, and consistency." , ""],
            ["Trade-offs", "Compares a credible alternative and ties the choice to a requirement." , ""],
            ["Failure behavior", "Explains timeout, retry, idempotency, overload, and degraded operation." , ""],
            ["Operations", "Closes with the first bottleneck, metric, alert, and recovery test." , ""],
        ],
        [94, 330, 69],
        font_size=7.15,
        row_heights=[43] * 7,
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
        row_heights=[88, 88, 88],
    ), spacer(12)]
    s += [callout("Correction rule", "Choose the earliest missing behavior that caused later confusion. A small front-loaded correction is easier to test than a broad promise to 'study more.'"), spacer(10)]
    s += [p("A correction is testable when", H2), bullet_list([
        "It can be observed at a specific moment in the next attempt.",
        "The prompt and rubric stay comparable.",
        "Success does not depend on knowing the exact same answer in advance.",
        "You can name what stronger evidence would look like.",
    ], checklist=True, compact=True)]
    end_page(s)

    s += page_heading(
        "Worksheet",
        "Record two baseline attempts",
        "Complete this page immediately after each attempt. Use short quotes and timestamps instead of reconstructing the experience later.",
    )
    s += [grid_table(
        ["Setup", "Coding attempt", "System-design attempt"],
        [
            ["Prompt", "", ""],
            ["Time / tools", "", ""],
            ["Strongest observable behavior", "", ""],
            ["First unclear or missing decision", "", ""],
            ["Quote / timestamp / artifact", "", ""],
            ["Consequence in the answer", "", ""],
        ],
        [122, 185.5, 185.5],
        font_size=7.2,
        row_heights=[38, 38, 52, 62, 52, 58],
    ), spacer(12)]
    s += [worksheet_table(
        ["Selected first correction (one total)", "Where it must appear", "Evidence of success"],
        1,
        [205, 132, 156],
        row_height=78,
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
        row_heights=[72, 72, 72, 72],
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
        row_heights=[72, 72, 72, 72],
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

    s += page_heading(
        "Worksheet 1",
        "Create the company interview-loop map",
        "Use current public information and date every source. Leave uncertain cells blank rather than filling them with generic assumptions.",
    )
    s += [grid_table(
        ["Target company / role", "Level", "Prepared on", "Interview date"],
        [["", "", "", ""]],
        [170, 90, 116, 117],
        row_heights=[42],
    ), spacer(11)]
    s += [worksheet_table(
        ["Stage / evidence", "Capability", "My evidence", "Action / question", "Confidence"],
        5,
        [100, 95, 115, 118, 65],
        row_height=58,
        prompts=[
            ["1.", "", "", "", "H/M/L"],
            ["2.", "", "", "", "H/M/L"],
            ["3.", "", "", "", "H/M/L"],
            ["4.", "", "", "", "H/M/L"],
            ["5.", "", "", "", "H/M/L"],
        ],
    ), spacer(9)]
    s += [p("Source ledger", H2), worksheet_table(
        ["Source / URL or conversation", "Date", "What it supports", "Confidence"],
        3,
        [208, 68, 157, 60],
        row_height=38,
    )]
    end_page(s)

    s += page_heading(
        "Worksheet 2",
        "Choose three company-specific gaps",
        "Write each gap as an observable difference, then rate likelihood, interview impact, and evidence deficit separately as High, Medium, or Low.",
    )
    s += [worksheet_table(
        ["Contextual gap", "Likelihood", "Interview impact", "Evidence deficit", "Proof action", "Completion evidence"],
        3,
        [105, 57, 58, 58, 102, 113],
        row_height=86,
        prompts=[
            ["1.", "H / M / L", "H / M / L", "H / M / L", "", ""],
            ["2.", "H / M / L", "H / M / L", "H / M / L", "", ""],
            ["3.", "H / M / L", "H / M / L", "H / M / L", "", ""],
        ],
    ), spacer(12)]
    s += [p("Questions for the recruiter", H2), worksheet_table(
        ["Question that reduces uncertainty", "Why the answer changes preparation"],
        3,
        [245, 248],
        row_height=40,
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
        row_heights=[49] * 6,
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
        row_heights=[70, 70, 70, 70],
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
        row_heights=[65, 65, 65],
    ), spacer(12)]
    s += [two_cards(
        ("Weak conclusion", "I need to learn queues again. This is broad, hides what was already known, and gives no moment to test.", "Too broad"),
        ("Evidence-led conclusion", "I understand queue components, but delivery and retry semantics appear after architecture. Front-load them immediately after requirements.", "Specific"),
    ), spacer(11)]
    s += [callout("Correction", "Before drawing components, state: critical work is at-least-once; consumers are idempotent; retries are bounded with dead letters; oldest-event age is the recovery signal."), spacer(10)]
    s += [p("Re-test condition", H2), p("Use a nearby asynchronous-workflow prompt, the same 35-minute structure, and the same rubric. Success means delivery/retry behavior appears before architecture and remains coherent during one failure follow-up.")]
    end_page(s)

    s += page_heading(
        "Worksheet 1",
        "Compare the last three attempts",
        "Normalize the attempt conditions first. Then score the same six dimensions and attach a short evidence note to every score.",
    )
    s += [grid_table(
        ["Context", "Attempt A", "Attempt B", "Attempt C"],
        [
            ["Date / prompt", "", "", ""],
            ["Type / difficulty", "", "", ""],
            ["Time / tools / assistance", "", "", ""],
            ["Rubric used", "", "", ""],
        ],
        [118, 125, 125, 125],
        font_size=7.0,
        row_heights=[36, 36, 42, 36],
    ), spacer(11)]
    s += [grid_table(
        ["Shared dimension", "Attempt A: 0/1/2 + evidence", "Attempt B: 0/1/2 + evidence", "Attempt C: 0/1/2 + evidence"],
        [
            ["Framing", "", "", ""],
            ["Decision", "", "", ""],
            ["Reason", "", "", ""],
            ["Boundary", "", "", ""],
            ["Evidence", "", "", ""],
            ["Communication", "", "", ""],
        ],
        [91, 134, 134, 134],
        font_size=6.75,
        row_heights=[48, 48, 48, 48, 48, 48],
    )]
    end_page(s)

    s += page_heading(
        "Worksheet 1B",
        "Turn the score grid into evidence",
        "Totals can hide the moment that matters. Use artifacts and repeated behavior to explain what is stable, what is weak, and what is still uncertain.",
    )
    s += [worksheet_table(
        ["Synthesis", "Evidence across Attempts A / B / C"],
        5,
        [165, 328],
        row_height=76,
        prompts=[
            ["Strongest repeated behavior", ""],
            ["First repeated weak decision moment", ""],
            ["Cue present immediately before it", ""],
            ["Quote / timestamp / artifact references", ""],
            ["What is noise or still uncertain?", ""],
        ],
    ), spacer(10)]
    s += [callout(
        "Comparison rule",
        "A score without an evidence note is incomplete. If prompt type, difficulty, assistance, or time changed enough to explain the difference, mark the comparison as uncertain instead of forcing a trend.",
    )]
    end_page(s)

    s += page_heading(
        "Worksheet 2",
        "Select one correction",
        "Write one line for each step. If the chain cannot be stated clearly, collect better evidence before choosing the correction.",
    )
    s += [worksheet_table(
        ["Step", "Your evidence"],
        6,
        [145, 348],
        row_height=52,
        prompts=[
            ["Repeated observable moment", ""],
            ["Cue present before it", ""],
            ["Earliest missing decision", ""],
            ["Downstream consequence", ""],
            ["One correction sentence", ""],
            ["Evidence that would show improvement", ""],
        ],
    ), spacer(11)]
    s += [callout("Correction sentence template", "When I notice [cue], I will [observable behavior] before [decision point], so [quality or failure consequence] stays explicit."), spacer(9)]
    s += [p("Keep / change", H2), two_cards(
        ("Keep stable", "Prompt shape, time box, tools, assistance, rubric dimensions, and scoring evidence.", "Comparable"),
        ("Change once", "The one intended behavior. Do not add several new techniques during the same re-test.", "Attribution"),
    )]
    end_page(s)

    s += page_heading(
        "Worksheet 3",
        "Run the targeted re-test",
        "Use one 35-minute block: spend 28 minutes replaying the original decision window, then use a seven-minute adjacent transfer probe. The probe is not a second full attempt.",
    )
    s += [grid_table(
        ["Re-test setup", "Your plan"],
        [
            ["Phase 1: original lowest-score scenario", ""],
            ["Same prompt conditions / decision-window time box / tools", ""],
            ["Correction cue", ""],
            ["Where the behavior must appear", ""],
            ["Primary success evidence", ""],
            ["Phase 2: 7-minute adjacent transfer probe", ""],
        ],
        [158, 335],
        row_heights=[42, 42, 48, 48, 58, 48],
    ), spacer(12)]
    s += [worksheet_table(
        ["Result", "Evidence / quote / timestamp", "Next decision"],
        2,
        [92, 255, 146],
        row_height=63,
        prompts=[
            ["Phase 1: same scenario", "", "Keep / adjust / gather evidence"],
            ["Phase 2: brief transfer probe", "", "Stable / prompt-specific / unclear"],
        ],
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
        row_heights=[60, 60, 60, 60],
    ), spacer(12)]
    s += [p("Setup record", H2), worksheet_table(
        ["Field", "Coding block", "System-design block"],
        4,
        [94, 199, 200],
        row_height=40,
        prompts=[
            ["Prompt / source", "", ""],
            ["Start time / end time", "", ""],
            ["Tools / assistance", "", ""],
            ["Completion evidence", "", ""],
        ],
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
        row_heights=[53, 53, 58, 58, 53],
    ), spacer(12)]
    s += [p("If you are stuck", H2), numbered_chain([
        ("Restate", "Say the contract and the exact uncertainty."),
        ("Shrink", "Use the smallest example that forces the main state change."),
        ("Baseline", "Name a correct simple approach before optimizing."),
        ("Resume", "Choose the next observable step and state its cost."),
    ]), spacer(10)]
    s += [callout("Time-pressure rule", "Do not hide. A visible correct baseline plus a named optimization gap is stronger evidence than silent guessing or an unexplained code jump.")]
    end_page(s)

    s += page_heading(
        "Coding worksheet",
        "Save the reasoning that produced the code",
        "Complete the left side during clarification and planning. Complete the evidence rows immediately after the timer ends.",
    )
    s += [worksheet_table(
        ["Artifact", "Your record"],
        7,
        [139, 354],
        row_height=44,
        prompts=[
            ["Contract and constraints", ""],
            ["Normal + boundary example", ""],
            ["Pattern cue / approach", ""],
            ["State and invariant", ""],
            ["Rejected alternative + reason", ""],
            ["Time / space complexity", ""],
            ["First missed edge + timestamp", ""],
        ],
    ), spacer(10)]
    s += [grid_table(
        ["Score", "Evidence standard"],
        [
            ["0 - absent", "The behavior never appears or appears only after the run."],
            ["1 - prompted / late", "The behavior appears after a rescue, late realization, or unexplained change."],
            ["2 - independent", "The behavior appears at the correct decision point and is supported by an artifact."],
        ],
        [92, 401],
        row_heights=[36, 40, 40],
    )]
    end_page(s)

    s += page_heading(
        "Coding evidence",
        "Score moments, not confidence",
        "Use one evidence scale across dimensions. A total is useful only when each mark points to something the learner said, wrote, implemented, or tested.",
    )
    s += [worksheet_table(
        ["Dimension", "0 / 1 / 2", "Quote, timestamp, code, or test evidence"],
        6,
        [123, 73, 297],
        row_height=49,
        prompts=[
            ["Clarification / contract", "", ""],
            ["Approach / decision order", "", ""],
            ["State / invariant", "", ""],
            ["Correctness / recovery", "", ""],
            ["Complexity / alternatives", "", ""],
            ["Testing / communication", "", ""],
        ],
    ), spacer(11)]
    s += [p("Worked evidence example", H2), grid_table(
        ["Observed moment", "Cause hypothesis", "Smallest correction"],
        [
            ["Invariant stated at minute 18 after implementation drifted", "Planning named the pattern but not what the window must preserve", "State the invariant before the first loop and re-check it at each pointer move"],
            ["Final duplicate boundary test was missed", "Testing started without a written edge list", "Write four test labels during clarification; run them in the last five minutes"],
        ],
        [171, 159, 163],
        row_heights=[60, 60],
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
        row_heights=[44, 44, 49, 49, 49, 49, 44],
    ), spacer(10)]
    s += [callout("Compression rule", "When time is short, reduce breadth and say what is deferred. Never silently skip requirements, a source of truth, the primary bottleneck, or failure handling.")]
    end_page(s)

    s += page_heading(
        "Design worksheet",
        "Show what each assumption caused",
        "The three-row decision ledger is the minimum artifact for the roadmap task. Each row must make a design choice revisitable.",
    )
    s += [worksheet_table(
        ["Assumption", "Decision caused", "Cost / trade-off", "What would change it"],
        3,
        [116, 134, 121, 122],
        row_height=60,
    ), spacer(11)]
    s += [worksheet_table(
        ["Design evidence", "Your record"],
        4,
        [145, 348],
        row_height=45,
        prompts=[
            ["Source of truth + data flow", ""],
            ["Primary bottleneck + limit", ""],
            ["Failure / recovery / metric", ""],
            ["Trade-off to revisit", ""],
        ],
    ), spacer(10)]
    s += [callout("Decision test", "If an assumption changes, point to the component, data path, or operating policy that changes with it. If nothing changes, the assumption may not be decision-relevant.")]
    end_page(s)

    s += page_heading(
        "Design evidence",
        "Score the answer and test one pivot",
        "Use the same 0 / 1 / 2 evidence scale. Then introduce one nearby requirement change and observe whether the learner updates only the affected decisions.",
    )
    s += [worksheet_table(
        ["Dimension", "0 / 1 / 2", "Quote, timestamp, diagram, or decision evidence"],
        7,
        [126, 73, 294],
        row_height=42,
        prompts=[
            ["Requirements / non-goals", "", ""],
            ["Scale / capacity", "", ""],
            ["Decision order / data flow", "", ""],
            ["Architecture / bottleneck", "", ""],
            ["Trade-off clarity", "", ""],
            ["Failure / recovery / metrics", "", ""],
            ["Communication / recovery", "", ""],
        ],
    ), spacer(10)]
    s += [p("Worked pivot", H2), grid_table(
        ["Requirement change", "What changes", "What stays stable"],
        [[
            "Delivery may be delayed, but duplicate actions are unacceptable",
            "Idempotency key, deduplication store, retry policy, and success metric become explicit",
            "The product contract, source of truth, and unrelated read path remain unchanged",
        ]],
        [149, 188, 156],
        row_heights=[66],
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
        row_heights=[74, 74],
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

    s += page_heading(
        "Worksheet 1",
        "Assemble a representative loop",
        "Choose segments that reflect the target role and the corrected gap. Each segment needs a capability, evidence cue, time box, and stop condition.",
    )
    s += [worksheet_table(
        ["Segment", "Capability", "Prompt / source", "Evidence cue", "Time / stop"],
        4,
        [76, 99, 134, 104, 80],
        row_height=74,
        prompts=[
            ["Coding", "", "", "", "18 min"],
            ["System design", "", "", "", "18 min"],
            ["Behavioral", "", "", "", "10 min"],
            ["Follow-up pivot", "", "", "", "6 min"],
        ],
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
        row_heights=[38, 47, 43, 50, 43, 47, 47, 43],
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
        row_heights=[66, 66, 58],
    ), spacer(10)]
    s += [p("Transition evidence", H2), worksheet_table(
        ["Reset", "What I released", "First new contract / clarification"],
        2,
        [80, 172, 241],
        row_height=47,
        prompts=[["Coding -> design", "", ""], ["Design -> behavioral", "", ""]],
    )]
    end_page(s)

    s += page_heading(
        "Worksheet 2",
        "Score the full loop with evidence",
        "Use 0 for absent, 1 for prompted or late, and 2 for independent at the correct decision point. Add a quote, timestamp, artifact, or observer note.",
    )
    s += [worksheet_table(
        ["Segment", "Opening contract", "Decision quality", "Boundary / failure", "Communication / recovery", "Close"],
        4,
        [78, 80, 83, 85, 92, 75],
        row_height=55,
        prompts=[
            ["Coding", "", "", "", "", ""],
            ["Design", "", "", "", "", ""],
            ["Behavioral", "", "", "", "", ""],
            ["Follow-up", "", "", "", "", ""],
        ],
    ), spacer(12)]
    s += [worksheet_table(
        ["Transition", "0 / 1 / 2", "Quote, timestamp, or observer evidence"],
        2,
        [123, 78, 292],
        row_height=55,
        prompts=[["Coding -> design", "", ""], ["Design -> behavioral", "", ""]],
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
        row_heights=[79, 79, 79],
    ), spacer(12)]
    s += [two_cards(
        ("Recovery", "The next segment regains its contract, evidence, and decision order without needing a rescue.", "Useful signal"),
        ("Masking", "The learner rushes, apologizes repeatedly, invents evidence, or silently imports the prior answer.", "Risk signal"),
    ), spacer(10)]
    s += [p("Your recovery note", H2), worksheet_table(
        ["Imperfect moment", "Reset action", "Evidence that the next segment recovered"],
        1,
        [144, 155, 194],
        row_height=64,
    )]
    end_page(s)

    s += page_heading(
        "Debrief and taper",
        "Keep three strengths and one remaining risk",
        "Use the final evidence to reduce work. A taper protects retrieval, sleep, and decision clarity; it does not reopen every weak topic.",
    )
    s += [worksheet_table(
        ["Final evidence", "Quote, artifact, or observed moment", "What to carry forward"],
        4,
        [112, 229, 152],
        row_height=58,
        prompts=[
            ["Stable strength 1", "", ""],
            ["Stable strength 2", "", ""],
            ["Stable strength 3", "", ""],
            ["One remaining risk", "", ""],
        ],
    ), spacer(11)]
    s += [grid_table(
        ["Time horizon", "Do", "Avoid"],
        [
            ["48-24 hours", "One short retrieval pass; confirm logistics; normal sleep and meals", "Novel hard problems, whole-plan rewrite, long late-night mock"],
            ["24-2 hours", "Review cue cards and one risk sentence; stop when retrieval is clean", "Adding stories, memorizing scripts, comparing yourself to others"],
            ["Last 2 hours", "Protect energy, equipment, water, quiet, and arrival time", "Score analysis, forum browsing, or another full rehearsal"],
        ],
        [84, 212, 197],
        row_heights=[58, 58, 58],
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
        row_heights=[57, 61, 57, 57, 61],
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
        row_heights=[55, 55, 55],
    ), spacer(12)]
    s += [worksheet_table(
        ["Round", "One fact", "One question", "One adjustment"],
        3,
        [72, 142, 142, 137],
        row_height=52,
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
        row_heights=[42, 42, 42, 48],
    )]
    end_page(s)

    s += page_heading(
        "Printable runbook",
        "Finish the operating sheet",
        "Complete this page in 15 minutes after the rehearsal. Keep a digital backup, but use only the format permitted in the real interview.",
    )
    s += [worksheet_table(
        ["Runbook field", "Your final record"],
        7,
        [143, 350],
        row_height=45,
        prompts=[
            ["Schedule / timezone / links", ""],
            ["Contact / interruption path", ""],
            ["Backup connection / device", ""],
            ["Target role + two evidence cues", ""],
            ["Three story labels", ""],
            ["Technical reset cues", ""],
            ["Two questions to ask", ""],
        ],
    ), spacer(10)]
    s += [grid_table(
        ["Final summary", "Your evidence"],
        [
            ["Three stable strengths", ""],
            ["One remaining risk", ""],
            ["One next action before the loop", ""],
        ],
        [143, 350],
        row_heights=[44, 44, 44],
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
        row_heights=[76, 76],
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
        "Contractor net before tax = invoice revenue - unpaid time - business costs - payment and FX costs",
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
        "Illustrative daily planning rate = annual contract value / planned billable days",
        "Unpaid-time cost = daily planning rate x planned non-billable days",
        "Replacement-cost view = quoted contract value - unpaid time - recurring business costs",
    ]), spacer(9)]
    s += [two_cards(
        ("Avoid double counting", "If your annual contract value already assumes eleven billed months, do not subtract the same leave again.", "Check"),
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
    s += [grid_table(
        ["Scenario", "USD annual cash", "Planning rate", "Gross INR view", "What it tests"],
        [
            ["Stronger INR", "[ ]", "[lower case]", "USD x rate", "How much INR value falls when the rupee strengthens."],
            ["Planning", "[ ]", "[anchor]", "USD x rate", "The common comparison case used for both offers."],
            ["Weaker INR", "[ ]", "[higher case]", "USD x rate", "Upside that should not be treated as guaranteed."],
        ],
        [78, 86, 78, 93, 148],
    ), spacer(10)]
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
    s += [p("Gate worksheet", H2), worksheet_table(
        ["Must-have condition", "Evidence or clause", "A", "B", "Action if unclear"],
        5,
        [142, 151, 42, 42, 106],
        row_height=43,
        prompts=[
            ["Legal engagement and payer are clear", "", "", "", ""],
            ["Minimum guaranteed cash and pay timing", "", "", "", ""],
            ["Sustainable overlap and on-call boundary", "", "", "", ""],
            ["Acceptable termination and downside", "", "", "", ""],
            ["No unresolved IP, restriction, or safety issue", "", "", "", ""],
        ],
    ), spacer(11)]
    s += [p("Preference score", H2), grid_table(
        ["Dimension", "Weight 1-5", "Offer A 1-5", "Offer B 1-5", "Evidence and confidence"],
        [
            ["Guaranteed and probable cash", "[ ]", "[ ]", "[ ]", "[source / high-medium-low]"],
            ["Benefits and replacement costs", "[ ]", "[ ]", "[ ]", "[source / high-medium-low]"],
            ["Operating sustainability", "[ ]", "[ ]", "[ ]", "[source / high-medium-low]"],
            ["Contract and payment risk", "[ ]", "[ ]", "[ ]", "[source / high-medium-low]"],
            ["Role scope and career value", "[ ]", "[ ]", "[ ]", "[source / high-medium-low]"],
        ],
        [132, 70, 70, 70, 141],
        font_size=7.25,
    ), spacer(9)]
    s += [callout("Scoring rule", "Write the evidence before the score. If two offers are within the uncertainty range, call the result close and prioritize the missing facts instead of pretending the decimal total decides.")]
    end_page(s)

    s += page_heading(
        "Worked example",
        "Watch the conclusion change when assumptions change",
        "This fictional comparison teaches the method. The figures are examples only; they are not market benchmarks, forecasts, or personal advice.",
    )
    s += [grid_table(
        ["Input", "Offer A: EOR employee", "Offer B: contractor"],
        [
            ["Written fixed cash", "USD 72,000 equivalent, locally paid", "USD 90,000 invoiced"],
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
    s += [code_block([
        "Offer B planning view before personal tax:",
        "90,000 invoice value - 4,000 benefits - 3,000 business/payment costs",
        "- value of 30 planned non-billable days = comparable planning cash",
        "Then test FX rate, payment delay, and an earlier termination case separately.",
    ]), spacer(9)]
    s += [two_cards(
        ("Base case", "B may lead on normalized cash and architecture scope, but its termination, hours, and manager unknowns remain material.", "Provisional"),
        ("Stress case", "If non-billable time, delayed payment, or early termination rises, A can become the stronger risk-adjusted choice without its headline changing.", "Sensitivity"),
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
    s += [p("Prepare target, rationale, and fallback", H2), worksheet_table(
        ["Priority", "Target", "Evidence-based rationale", "Fallback", "Walk-away boundary"],
        3,
        [80, 82, 160, 82, 79],
        row_height=51,
        prompts=[
            ["1", "", "", "", ""],
            ["2", "", "", "", ""],
            ["3", "", "", "", ""],
        ],
    ), spacer(9)]
    s += [callout("Talk track", "I am excited about [specific role evidence]. After comparing the full package, the main gap is [term] because [verified effect]. Could we move to [target]? If that is constrained, [fallback] would address the same issue.", warm=True)]
    end_page(s)

    s += page_heading(
        "One-page worksheet",
        "Build the comparable record",
        "Complete this page only after collecting the source documents. Use ranges for uncertain values and write unknown rather than filling the cell with a guess.",
    )
    s += [worksheet_table(
        ["Decision input", "Offer A", "Offer B", "Source / confidence / next check"],
        9,
        [146, 92, 92, 153],
        row_height=48,
        prompts=[
            ["Engagement model and signing entity", "", "", ""],
            ["Guaranteed annual cash", "", "", ""],
            ["Variable cash and probability", "", "", ""],
            ["Equity scenario, kept separate", "", "", ""],
            ["Paid time and replacement costs", "", "", ""],
            ["FX and payment-friction cases", "", "", ""],
            ["Termination and contract downside", "", "", ""],
            ["Overlap, on-call, and sustainability", "", "", ""],
            ["Scope, manager, and career evidence", "", "", ""],
        ],
    ), spacer(10)]
    s += [callout("Provisional decision", "I currently prefer [offer] because [three evidence-backed reasons]. This choice assumes [top assumptions]. It would change if [reversal condition]. Before signing, I still need [named verification].")]
    end_page(s)

    s += page_heading(
        "Decision memo",
        "Close with evidence, uncertainty, and action",
        "A useful decision memo is short enough to reread before signing and specific enough to show what you verified, what remains uncertain, and why the choice still makes sense.",
    )
    s += [grid_table(
        ["Memo field", "Write"],
        [
            ["Decision", "I choose [offer] on [date], subject to [written condition]."],
            ["Why", "The strongest evidence is [cash], [operating reality], and [career or risk factor]."],
            ["Trade-off accepted", "I am knowingly accepting [downside] because [reason and control]."],
            ["Uncertainty", "The largest estimate is [input, range, source, confidence]."],
            ["Reversal condition", "I would reopen the decision if [specific clause, fact, or scenario]."],
            ["Next action", "By [date], [owner] will provide or verify [document or answer]."],
        ],
        [126, 357],
        font_size=7.55,
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
    return s


SPECS = [
    PdfSpec(
        filename="remote_compensation-and-offer-decision-workbook.pdf",
        category="Remote career workbook",
        title="Remote Compensation and Offer Decision Workbook",
        subtitle="A practical system for comparing employee, EOR, and contractor offers across cash, benefits, time, currency, contract risk, working reality, and career value.",
        thesis="Normalize what can be compared, keep uncertainty visible, stress-test the assumptions, and negotiate the few gaps that can change the decision.",
        slug="remote / compensation-and-offer-decision",
        build_story=build_remote_compensation_offer_story,
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
        subtitle="A practical guide and printable worksheet for defining the role, level, evidence bar, and first preparation gap.",
        thesis="Turn a broad job goal into a testable target and a preparation sequence grounded in observable evidence.",
        slug="career / target-role-evidence-map",
        build_story=build_target_role_story,
    ),
    PdfSpec(
        filename="operations_technical-baseline-scorecard.pdf",
        category="Operations guide",
        title="Technical Baseline Scorecard",
        subtitle="A controlled starting-point assessment for coding, system design, explanation quality, and the first correction to test.",
        thesis="Measure observable interview behavior under consistent conditions without turning one attempt into a readiness verdict.",
        slug="operations / technical-baseline-scorecard",
        build_story=build_baseline_story,
    ),
    PdfSpec(
        filename="company_interview-loop-gap-map.pdf",
        category="Company research guide",
        title="Company Interview Loop and Gap Map",
        subtitle="An evidence-bounded research guide for mapping likely stages, confidence, preparation themes, and three contextual gaps.",
        thesis="Use current public evidence to focus preparation while keeping uncertainty, ethics, and source quality visible.",
        slug="company / interview-loop-gap-map",
        build_story=build_company_story,
    ),
    PdfSpec(
        filename="operations_evidence-comparison-correction-workbook.pdf",
        category="Operations workbook",
        title="Evidence Comparison and Correction Workbook",
        subtitle="A three-attempt review system for isolating one persistent gap, choosing a correction, and running a comparable re-test.",
        thesis="Find the repeated decision moment behind the score, change one behavior, and require evidence of transfer.",
        slug="operations / evidence-comparison-correction",
        build_story=build_evidence_story,
    ),
    PdfSpec(
        filename="operations_timed-technical-rehearsal-workbook.pdf",
        category="Operations workbook",
        title="Timed Coding and System Design Rehearsal Workbook",
        subtitle="Two controlled, interview-shaped practice blocks with protected decision clocks, evidence rubrics, worksheets, and debriefs.",
        thesis="Use time pressure to test decision order while protecting clarification, invariants, testing, trade-offs, and failure handling.",
        slug="operations / timed-technical-rehearsal",
        build_story=build_timed_rehearsal_story,
    ),
    PdfSpec(
        filename="operations_final-loop-interview-day-runbook.pdf",
        category="Operations workbook",
        title="Final-Loop Rehearsal and Interview-Day Runbook",
        subtitle="A compressed multi-round rehearsal, transition protocol, evidence debrief, taper plan, and printable day-of operating sheet.",
        thesis="Consolidate proven skills, protect recovery between rounds, and remove avoidable interview-day friction.",
        slug="operations / final-loop-interview-day-runbook",
        build_story=build_final_loop_story,
    ),
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "output" / "pdf"
    for spec in SPECS:
        output_path = output_dir / spec.filename
        build_pdf(spec, output_path)
        print(output_path)


if __name__ == "__main__":
    main()
