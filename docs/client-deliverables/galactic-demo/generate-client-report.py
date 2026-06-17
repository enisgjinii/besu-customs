from __future__ import annotations

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
OUTPUT = HERE / "besu-galactic-technical-verification.pdf"
TODAY = date(2026, 6, 17)

INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
BLUE = colors.HexColor("#1D4ED8")
GREEN = colors.HexColor("#047857")
BORDER = colors.HexColor("#D1D5DB")
PALE_BLUE = colors.HexColor("#EFF6FF")
PALE_GREEN = colors.HexColor("#ECFDF5")
PROMPT = (
    "Create a basketball uniform that includes a jersey and shorts for a team "
    "called the Galactic using outer space themes, like the moon,, comets"
)


def esc(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def para(value: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(esc(value), style)


def scaled_image(path: Path, max_width: float, max_height: float) -> Image:
    with PILImage.open(path) as source:
        width, height = source.size
    scale = min(max_width / width, max_height / height)
    result = Image(str(path), width=width * scale, height=height * scale)
    result.hAlign = "CENTER"
    return result


def figure(path: str, caption: str, styles, max_height: float = 5.6 * inch) -> KeepTogether:
    return KeepTogether(
        [
            scaled_image(HERE / path, 6.45 * inch, max_height),
            Spacer(1, 0.08 * inch),
            para(caption, styles["Caption"]),
        ]
    )


def styled_table(rows: list[list], widths: list[float], header: bool = True) -> Table:
    table = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]
    if header:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E5E7EB")),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
            ]
        )
    table.setStyle(TableStyle(commands))
    return table


def callout(title: str, body: str, styles, fill=PALE_BLUE, border=BLUE) -> Table:
    result = Table(
        [[para(title, styles["CalloutTitle"])], [para(body, styles["CalloutBody"])]],
        colWidths=[6.5 * inch],
    )
    result.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 1, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return result


def header_footer(canvas, doc) -> None:
    canvas.saveState()
    width, height = letter
    if doc.page > 1:
        canvas.setStrokeColor(BORDER)
        canvas.line(0.75 * inch, height - 0.55 * inch, width - 0.75 * inch, height - 0.55 * inch)
        canvas.setFont("Helvetica-Bold", 8.3)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.75 * inch, height - 0.4 * inch, "BESU CUSTOMS / GALACTIC VERIFICATION")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(width - 0.75 * inch, height - 0.4 * inch, TODAY.strftime("%B %d, %Y"))
    canvas.setStrokeColor(BORDER)
    canvas.line(0.75 * inch, 0.5 * inch, width - 0.75 * inch, 0.5 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.75 * inch, 0.32 * inch, "Technical implementation and verification record.")
    canvas.drawRightString(width - 0.75 * inch, 0.32 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Kicker": ParagraphStyle("Kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, textColor=BLUE, alignment=TA_CENTER, spaceAfter=10),
        "Title": ParagraphStyle("Title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=27, leading=31, textColor=INK, alignment=TA_CENTER, spaceAfter=10),
        "Subtitle": ParagraphStyle("Subtitle", parent=base["Normal"], fontSize=12, leading=17, textColor=MUTED, alignment=TA_CENTER, spaceAfter=18),
        "H1": ParagraphStyle("H1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=INK, spaceAfter=10),
        "H2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=BLUE, spaceBefore=8, spaceAfter=5),
        "Body": ParagraphStyle("Body", parent=base["Normal"], fontSize=9.4, leading=13.2, textColor=INK, spaceAfter=6),
        "Small": ParagraphStyle("Small", parent=base["Normal"], fontSize=8.2, leading=11.2, textColor=MUTED, spaceAfter=4),
        "Table": ParagraphStyle("Table", parent=base["Normal"], fontSize=7.6, leading=10.2, textColor=INK),
        "TableBold": ParagraphStyle("TableBold", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=7.6, leading=10.2, textColor=INK),
        "Caption": ParagraphStyle("Caption", parent=base["Normal"], fontSize=7.8, leading=10.5, textColor=MUTED, alignment=TA_CENTER, spaceAfter=8),
        "Prompt": ParagraphStyle("Prompt", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=INK),
        "CalloutTitle": ParagraphStyle("CalloutTitle", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=INK),
        "CalloutBody": ParagraphStyle("CalloutBody", parent=base["Normal"], fontSize=8.8, leading=12.3, textColor=INK),
    }


def build() -> None:
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.68 * inch,
        title="Besu Customs Galactic AI Designer Technical Verification Report",
        author="Besu Customs",
        subject="AI Designer implementation and technical verification evidence",
    )
    story: list = []

    # Cover
    story.extend(
        [
            Spacer(1, 0.55 * inch),
            para("BESU CUSTOMS", styles["Kicker"]),
            para("Galactic AI Designer Technical Verification Report", styles["Title"]),
            para("Implementation evidence, test results, generated artifacts, and technical constraints", styles["Subtitle"]),
            figure("03-galactic-fitted-final.png", "Verified final app state: generated space texture with editable GALACTIC team name fitted to the chest.", styles, 4.2 * inch),
            Spacer(1, 0.08 * inch),
            callout("Verification result", "The tested workflow generated the requested space-themed uniform, extracted and placed the GALACTIC team name, produced coordinated visual marks, and exported a 360-degree video artifact.", styles, PALE_GREEN, GREEN),
            Spacer(1, 0.15 * inch),
            para(f"Prepared {TODAY.strftime('%B %d, %Y')}", styles["Small"]),
        ]
    )

    # Executive summary
    story.extend(
        [
            PageBreak(),
            para("1. Technical Summary", styles["H1"]),
            para("The workflow was tested in the local Besu Customs application using the exact Galactic prompt. The application generated a coordinated space-themed jersey and shorts texture, extracted the team name, created an editable GALACTIC chest layer, fitted it to the garment, and exported a 360-degree video.", styles["Body"]),
            callout("Implementation status: VERIFIED", "Automatic team-name extraction, editable chest placement, improved initial sizing, AI texture generation, generated logo/monogram content, and 360-degree video export are demonstrated in this report.", styles, PALE_GREEN, GREEN),
            Spacer(1, 0.14 * inch),
            para("Exact test prompt", styles["H2"]),
            callout("Prompt used without rewriting", PROMPT, styles),
            Spacer(1, 0.14 * inch),
            para("Generated artifacts", styles["H2"]),
            styled_table(
                [
                    [para("Deliverable", styles["TableBold"]), para("File", styles["TableBold"]), para("Status", styles["TableBold"])],
                    [para("Technical report", styles["Table"]), para("besu-galactic-technical-verification.pdf", styles["Table"]), para("VERIFIED", styles["TableBold"])],
                    [para("360-degree video", styles["Table"]), para("galactic-uniform-technical-demo.mp4", styles["Table"]), para("VERIFIED", styles["TableBold"])],
                ],
                [1.55 * inch, 3.7 * inch, 1.25 * inch],
            ),
            Spacer(1, 0.18 * inch),
            para("Technical boundary", styles["H2"]),
            para("The implemented sizing adjustment resolves the oversized-text behavior shown in the earlier screenshot. Tucked-garment geometry requires a compatible 3D model. Four-concept generation requires additional orchestration, persistence, selection UI, and generation-cost controls.", styles["Body"]),
        ]
    )

    # Proof
    story.extend(
        [
            PageBreak(),
            para("2. Live Prompt & Generation Evidence", styles["H1"]),
            figure("01-prompt-entered.png", "The exact Galactic prompt entered in the Besu AI Design step before generation.", styles, 5.8 * inch),
            PageBreak(),
            para("3. Generated Result", styles["H1"]),
            figure("02-galactic-result-full.png", "Generated cosmic garment texture with Team Name detected as GALACTIC and a dedicated editable team-name layer.", styles, 5.75 * inch),
            PageBreak(),
            para("4. Final Fitted Chest Text", styles["H1"]),
            para("The chest placement logic was tightened so long team names start at a practical scale. GALACTIC is shown as an editable Oswald text layer at 23px, visibly contained within the jersey torso instead of overflowing the garment.", styles["Body"]),
            figure("03-galactic-fitted-final.png", "Final verified state after applying the chest placement preset.", styles, 5.6 * inch),
        ]
    )

    # Scope matrix
    scope_rows = [
        [para("Request", styles["TableBold"]), para("Decision", styles["TableBold"]), para("Verified outcome / boundary", styles["TableBold"])],
        [para("Automatically add team name from prompt", styles["Table"]), para("DONE", styles["TableBold"]), para("GALACTIC was detected and created as a separate editable chest text layer.", styles["Table"])],
        [para("Fit text shoulder-to-shoulder by default", styles["Table"]), para("DONE", styles["TableBold"]), para("Shared placement now uses a narrower target width and smaller bounds; the verified result fits at 23px.", styles["Table"])],
        [para("Create a team logo", styles["Table"]), para("DONE / AI-VARIABLE", styles["TableBold"]), para("This run generated coordinated G marks on the chest/shorts. AI artwork varies. A guaranteed, separately editable vector-logo generator would be a future feature.", styles["Table"])],
        [para("Tucked jersey and visible waistline", styles["Table"]), para("MODEL-DEPENDENT", styles["TableBold"]), para("The silhouette is defined by the selected GLB model, not the prompt. A compatible tucked model can be swapped in; creating one requires modeling, UV work, rigging, and QA.", styles["Table"])],
        [para("Generate four uniform options at once", styles["Table"]), para("ADDITIONAL WORKFLOW", styles["TableBold"]), para("Technically feasible, but requires multi-generation orchestration, cost/rate controls, result persistence, and a selection workflow.", styles["Table"])],
        [para("360-degree video export", styles["Table"]), para("DONE", styles["TableBold"]), para("A five-second H.264 MP4 was exported and is supplied with this report.", styles["Table"])],
    ]
    story.extend(
        [
            PageBreak(),
            para("5. Feasibility & Technical Constraints", styles["H1"]),
            styled_table(scope_rows, [1.65 * inch, 1.25 * inch, 3.6 * inch]),
            Spacer(1, 0.18 * inch),
            callout("Verified behavior and constraints", "Team-name extraction, fitted editable text, generated visual marks, and video export are demonstrated. A tucked silhouette depends on a different 3D asset, while multi-concept generation requires an additional application workflow.", styles, PALE_GREEN, GREEN),
            Spacer(1, 0.16 * inch),
            para("Operational notes", styles["H2"]),
            para("AI texture and logo details are generative, so individual visual output can vary while the editable name-placement behavior remains deterministic. The app retains manual editing so users can reposition or restyle the generated team name after the first-fit default.", styles["Body"]),
        ]
    )

    # Video
    story.extend(
        [
            PageBreak(),
            para("6. 360-Degree Video Verification", styles["H1"]),
            figure("04-video-contact-sheet.png", "Frames sampled from the MP4 show the generated uniform rotating through front, side, back, and opposite-side views.", styles, 4.9 * inch),
            styled_table(
                [
                    [para("Property", styles["TableBold"]), para("Verified value", styles["TableBold"])],
                    [para("File", styles["Table"]), para("galactic-uniform-technical-demo.mp4", styles["Table"])],
                    [para("Format", styles["Table"]), para("H.264 MP4", styles["Table"])],
                    [para("Duration", styles["Table"]), para("5 seconds", styles["Table"])],
                    [para("Resolution", styles["Table"]), para("1920 x 886 at 30 fps", styles["Table"])],
                ],
                [2.0 * inch, 4.5 * inch],
            ),
        ]
    )

    # References
    refs = [
        ("reference-01-marked-chatgpt.png", "Marked ChatGPT reference identifying team-name and logo details."),
        ("reference-02-old-text-issue.png", "Earlier app screenshot documenting the oversized Besu text issue now addressed by the fitted default."),
        ("reference-03-multiple-concepts.png", "Reference for the proposed four-concept selection workflow, classified as future scope."),
        ("reference-04-clean-chatgpt.png", "Clean ChatGPT reference output supplied for visual comparison."),
        ("reference-05-old-app-prompt.png", "Earlier Besu app prompt/result context supplied with the feedback."),
    ]
    story.extend([PageBreak(), para("7. Source Reference Record", styles["H1"]), para("The following source images are included to preserve the visual requirements and comparison context.", styles["Body"])])
    for index, (path, caption) in enumerate(refs):
        story.append(figure(path, caption, styles, 5.3 * inch))
        if index != len(refs) - 1:
            story.append(PageBreak())

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()
