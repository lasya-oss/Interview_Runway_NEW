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
        "First repeat the original lowest-score scenario under the same conditions. Only then use a nearby prompt to test whether the behavior transfers.",
    )
    s += [grid_table(
        ["Re-test setup", "Your plan"],
        [
            ["Phase 1: original lowest-score scenario", ""],
            ["Same date conditions / time box / tools", ""],
            ["Correction cue", ""],
            ["Where the behavior must appear", ""],
            ["Primary success evidence", ""],
            ["Phase 2: adjacent transfer prompt", ""],
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
            ["Phase 2: transfer check", "", "Stable / prompt-specific / unclear"],
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


SPECS = [
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
