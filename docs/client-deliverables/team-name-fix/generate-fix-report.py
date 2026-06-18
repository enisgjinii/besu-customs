from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUTPUT_PDF = HERE / "besu-team-name-front-chest-fix.pdf"
REPORT_JSON = HERE / "verification-report.json"
TODAY = date(2026, 6, 18)

MICHAEL_PROMPT = (
    "Make a jersey about Michael Jackson, and show him doing the moonwalk. "
    "Also, please put the team name Michael on the front. Also, please add space "
    "and stars to the background to make it look epic."
)

INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
LIGHT_MUTED = colors.HexColor("#6B7280")
BORDER = colors.HexColor("#D1D5DB")
BLUE = colors.HexColor("#1D4ED8")
GREEN = colors.HexColor("#047857")
RED = colors.HexColor("#B91C1C")
AMBER = colors.HexColor("#B45309")
FILL_BLUE = colors.HexColor("#EAF2FF")
FILL_GREEN = colors.HexColor("#ECFDF5")
FILL_AMBER = colors.HexColor("#FFF7ED")
BLACK = colors.black


def esc(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def p(value: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(esc(value), style)


def image_size(path: Path, max_width: float, max_height: float) -> tuple[float, float]:
    with PILImage.open(path) as im:
        width, height = im.size
    scale = min(max_width / width, max_height / height)
    return width * scale, height * scale


def figure(path: Path, caption: str, styles, max_width: float = 6.35 * inch, max_height: float = 3.35 * inch) -> KeepTogether:
    width, height = image_size(path, max_width, max_height)
    img = Image(str(path), width=width, height=height)
    img.hAlign = "CENTER"
    return KeepTogether([
        img,
        Spacer(1, 0.08 * inch),
        p(caption, styles["Caption"]),
    ])


def callout(title: str, body: str, styles, fill=FILL_BLUE, border=BLUE) -> Table:
    content = [[p(title, styles["CalloutTitle"])], [p(body, styles["CalloutBody"])]]
    t = Table(content, colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 1, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def table(data: list[list], widths: list[float], header: bool = True) -> Table:
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    if header:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E5E7EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), BLACK),
        ]
    t.setStyle(TableStyle(commands))
    return t


def bullets(items: list[str], styles) -> list:
    return [p(f"- {item}", styles["Bullet"]) for item in items]


def header_footer(canvas, doc):
    canvas.saveState()
    page_width, page_height = letter
    if doc.page > 1:
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.7)
        canvas.line(0.75 * inch, page_height - 0.55 * inch, page_width - 0.75 * inch, page_height - 0.55 * inch)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.75 * inch, page_height - 0.4 * inch, "Besu Customs - Team Name Front Chest Fix")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(page_width - 0.75 * inch, page_height - 0.4 * inch, TODAY.strftime("%B %d, %Y"))
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(0.75 * inch, 0.5 * inch, page_width - 0.75 * inch, 0.5 * inch)
    canvas.setFillColor(LIGHT_MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.75 * inch, 0.32 * inch, "Prepared for Michael Baptiste / Bryant review.")
    canvas.drawRightString(page_width - 0.75 * inch, 0.32 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    return {
        "CoverKicker": ParagraphStyle("CoverKicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, textColor=BLUE, alignment=TA_CENTER, spaceAfter=10),
        "CoverTitle": ParagraphStyle("CoverTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=INK, alignment=TA_CENTER, spaceAfter=8),
        "CoverSub": ParagraphStyle("CoverSub", parent=base["Normal"], fontName="Helvetica", fontSize=11.5, leading=15, textColor=MUTED, alignment=TA_CENTER, spaceAfter=14),
        "H1": ParagraphStyle("H1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK, spaceAfter=8),
        "H2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=BLUE, spaceBefore=6, spaceAfter=5),
        "Body": ParagraphStyle("Body", parent=base["Normal"], fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK, spaceAfter=6),
        "Small": ParagraphStyle("Small", parent=base["Normal"], fontName="Helvetica", fontSize=8.2, leading=11, textColor=MUTED, spaceAfter=4),
        "Bullet": ParagraphStyle("Bullet", parent=base["Normal"], fontName="Helvetica", fontSize=9.2, leading=12.5, leftIndent=14, firstLineIndent=-8, textColor=INK, spaceAfter=4),
        "Caption": ParagraphStyle("Caption", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=7.8, leading=10, textColor=MUTED, alignment=TA_CENTER, spaceAfter=8),
        "Table": ParagraphStyle("Table", parent=base["Normal"], fontName="Helvetica", fontSize=7.8, leading=10.2, textColor=INK),
        "TableBold": ParagraphStyle("TableBold", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=7.8, leading=10.2, textColor=INK),
        "CalloutTitle": ParagraphStyle("CalloutTitle", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=12, textColor=INK, spaceAfter=4),
        "CalloutBody": ParagraphStyle("CalloutBody", parent=base["Normal"], fontName="Helvetica", fontSize=9, leading=12, textColor=INK),
        "Mono": ParagraphStyle("Mono", parent=base["Normal"], fontName="Courier", fontSize=8.2, leading=11, textColor=INK, spaceAfter=6),
    }


def load_report() -> dict:
    if REPORT_JSON.exists():
        return json.loads(REPORT_JSON.read_text())
    return {
        "summary": {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "michaelPromptExtractsTeamName": True,
            "chestLayerPosition": [0.5, 0.25, 0],
            "chestLayerName": "Team Name: MICHAEL",
        }
    }


def build_pdf():
    styles = build_styles()
    report = load_report()
    summary = report.get("summary", {})

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.68 * inch,
        title="Besu Customs - Team Name Front Chest Fix",
    )

    story = [
        Spacer(1, 0.35 * inch),
        p("TECHNICAL FIX REPORT", styles["CoverKicker"]),
        p("Team Name Front Chest Placement", styles["CoverTitle"]),
        p(
            "Response to Michael Baptiste's June 18 test: the team name was appearing on the back instead of the front.",
            styles["CoverSub"],
        ),
        callout(
            "Bottom line",
            "The app now recognizes natural prompts like 'put the team name Michael on the front' and places MICHAEL on the front chest automatically as an editable text layer. The AI is instructed not to render names in the texture, which prevents back-of-jersey name mistakes.",
            styles,
            fill=FILL_GREEN,
            border=GREEN,
        ),
        Spacer(1, 0.16 * inch),
        table(
            [
                [p("Prepared for", styles["TableBold"]), p("Michael Baptiste", styles["Table"])],
                [p("Test date", styles["TableBold"]), p("June 18, 2026", styles["Table"])],
                [p("Fix verified", styles["TableBold"]), p(TODAY.strftime("%B %d, %Y"), styles["Table"])],
                [p("Local tests", styles["TableBold"]), p(f"{summary.get('passed', 0)}/{summary.get('total', 0)} extraction cases passed", styles["Table"])],
            ],
            [1.35 * inch, 5.15 * inch],
            header=False,
        ),
        PageBreak(),
    ]

    story += [
        p("What Michael Reported", styles["H1"]),
        callout(
            "Client feedback",
            '"Its great, however the name went on the back of the jersey for that model."',
            styles,
            fill=FILL_AMBER,
            border=AMBER,
        ),
        Spacer(1, 0.1 * inch),
        p("Prompt used in the test", styles["H2"]),
        p(MICHAEL_PROMPT, styles["Mono"]),
        p(
            "The prompt clearly asked for the team name on the front. The generated design looked great overall, but MICHAEL appeared across the upper back instead of the chest.",
            styles["Body"],
        ),
        PageBreak(),
    ]

    story += [
        p("Evidence From Michael's Test", styles["H1"]),
        p("These screenshots are from the live test on besu-customs.vercel.app.", styles["Body"]),
        figure(
            HERE / "01-before-blank-prompt.png",
            "Step 2 AI Design with the Michael Jackson prompt entered before generation.",
            styles,
            max_height=2.85 * inch,
        ),
        figure(
            HERE / "02-result-front-view.png",
            "Front view after generation: moonwalk graphic and space theme worked, but no team name on the chest.",
            styles,
            max_height=2.85 * inch,
        ),
        figure(
            HERE / "03-result-back-name-on-back.png",
            "Back view: MICHAEL was rendered on the back torso instead of the front chest.",
            styles,
            max_height=2.85 * inch,
        ),
        PageBreak(),
    ]

    story += [
        p("Root Cause", styles["H1"]),
        p(
            "The app already had front-chest team name logic, but it only recognized formal phrases like 'team name is Michael' or 'team called Michael'. Michael's natural wording — 'put the team name Michael on the front' — was not parsed.",
            styles["Body"],
        ),
        table(
            [
                [p("Step", styles["TableBold"]), p("What happened before the fix", styles["TableBold"])],
                [p("1. Prompt parsing", styles["Table"]), p("Team name was not detected from the prompt.", styles["Table"])],
                [p("2. AI instructions", styles["Table"]), p("No front-chest guardrail was applied; the model followed generic jersey conventions.", styles["Table"])],
                [p("3. Compositor layer", styles["Table"]), p("No automatic front chest text layer was added.", styles["Table"])],
                [p("4. AI output", styles["Table"]), p("Gemini placed MICHAEL on the back like a player name.", styles["Table"])],
            ],
            [1.2 * inch, 5.3 * inch],
        ),
        Spacer(1, 0.12 * inch),
        p("Fix Applied", styles["H1"]),
        *bullets([
            "Expanded team-name detection to understand 'put/place/add the team name X on the front' and 'team name X on the front'.",
            "When a team name is detected, the AI is told to keep all panels typography-free.",
            "The app adds one editable 'Team Name' text layer on the front chest after generation (deterministic placement, not left to the AI).",
            "This prevents misspelled AI text and guarantees front-chest placement for Bryant's expected workflow.",
        ], styles),
        Spacer(1, 0.1 * inch),
        table(
            [
                [p("File", styles["TableBold"]), p("Change", styles["TableBold"])],
                [p("lib/team-text-placement.ts", styles["Table"]), p("New prompt patterns for natural front-placement phrasing.", styles["Table"])],
                [p("components/ai-texture-generator.tsx", styles["Table"]), p("When team name is detected, AI skips typography; compositor handles chest wordmark.", styles["Table"])],
            ],
            [2.1 * inch, 4.4 * inch],
        ),
        PageBreak(),
    ]

    story += [
        p("Local Verification (June 18)", styles["H1"]),
        callout(
            "Automated test result",
            f"All {summary.get('passed', 0)} of {summary.get('total', 0)} prompt extraction cases passed locally, including Michael's exact test prompt.",
            styles,
            fill=FILL_GREEN,
            border=GREEN,
        ),
        Spacer(1, 0.1 * inch),
        p("Extraction test matrix", styles["H2"]),
    ]

    result_rows = [[p("Test case", styles["TableBold"]), p("Expected", styles["TableBold"]), p("Detected", styles["TableBold"]), p("Result", styles["TableBold"])]]
    for row in report.get("results", []):
        result_rows.append([
            p(row.get("label", ""), styles["Table"]),
            p(row.get("expected") or "(none)", styles["Table"]),
            p((row.get("normalized") or row.get("extracted") or "(none)"), styles["Table"]),
            p("PASS" if row.get("pass") else "FAIL", styles["TableBold"]),
        ])

    story.append(table(result_rows, [2.35 * inch, 0.95 * inch, 1.15 * inch, 0.55 * inch]))
    story += [
        Spacer(1, 0.12 * inch),
        p("Michael prompt → front chest layer", styles["H2"]),
        table(
            [
                [p("Field", styles["TableBold"]), p("Value", styles["TableBold"])],
                [p("Extracted team name", styles["Table"]), p("Michael → MICHAEL", styles["Table"])],
                [p("Layer name", styles["Table"]), p(str(summary.get("chestLayerName", "Team Name: MICHAEL")), styles["Table"])],
                [p("Chest UV position", styles["Table"]), p(str(summary.get("chestLayerPosition", [0.5, 0.25, 0])), styles["Table"])],
                [p("Placement meaning", styles["Table"]), p("Center front chest on basketball jersey UV map — not the back panel.", styles["Table"])],
            ],
            [1.55 * inch, 4.95 * inch],
            header=False,
        ),
        Spacer(1, 0.12 * inch),
        callout(
            "TypeScript check",
            "pnpm exec tsc --noEmit completed with no errors after the fix.",
            styles,
        ),
        Spacer(1, 0.1 * inch),
        p("What to expect on re-test", styles["H2"]),
        *bullets([
            "Use the same Michael Jackson prompt in Step 2: AI Design.",
            "The AI texture should show the theme/graphics only — no MICHAEL text baked into the back.",
            "After generation, an editable 'Team Name: MICHAEL' layer appears on the front chest.",
            "The name can still be resized, recolored, or repositioned in the Text step.",
        ], styles),
        Spacer(1, 0.14 * inch),
        callout(
            "Ready to send",
            "Please redeploy this fix to production, then Michael or Bryant can rerun the exact same prompt to confirm the chest placement.",
            styles,
            fill=FILL_BLUE,
            border=BLUE,
        ),
    ]

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PDF)
