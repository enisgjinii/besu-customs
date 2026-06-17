from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from typing import Iterable

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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


ROOT = Path("/Users/enisgjini/Desktop/besu-customs")
OUT_DIR = ROOT / "docs" / "client-deliverables"
OUTPUT_PDF = OUT_DIR / "besu-customs-bryant-ai-designer-approval-pack.pdf"

REFERENCE_IMAGES = [
    (
        Path("/Users/enisgjini/Downloads/WhatsApp Image 2026-06-04 at 15.37.09.jpeg"),
        "Reference output: AI-generated basketball uniform with team name, number, and coordinated theme.",
    ),
    (
        Path("/Users/enisgjini/Downloads/WhatsApp Image 2026-06-04 at 15.37.10.jpeg"),
        "Current app context: same prompt entered in Besu AI Design flow.",
    ),
    (
        Path("/Users/enisgjini/Downloads/WhatsApp Image 2026-06-04 at 15.37.11.jpeg"),
        "Bryant's marked details: chest team name, repeated logo marks, and tucked waistline reference.",
    ),
]

APP_SCREENSHOT = (
    OUT_DIR / "bryant-approval-app-verification.png",
    "Implemented app state: Basketball Jersey and Shorts with the Text step prefilled and a selected Besu text layer.",
)

TODAY = date(2026, 6, 6)

INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
LIGHT_MUTED = colors.HexColor("#6B7280")
BORDER = colors.HexColor("#D1D5DB")
FILL = colors.HexColor("#F3F4F6")
FILL_BLUE = colors.HexColor("#EAF2FF")
BLUE = colors.HexColor("#1D4ED8")
GREEN = colors.HexColor("#047857")
AMBER = colors.HexColor("#B45309")
RED = colors.HexColor("#B91C1C")
BLACK = colors.HexColor("#000000")
WHITE = colors.white


def clean_text(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def p(value: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(clean_text(value), style)


def image_size(path: Path, max_width: float, max_height: float) -> tuple[float, float]:
    with PILImage.open(path) as im:
        width, height = im.size
    scale = min(max_width / width, max_height / height)
    return width * scale, height * scale


def captioned_image(path: Path, caption: str, max_width: float, max_height: float, styles) -> KeepTogether:
    width, height = image_size(path, max_width, max_height)
    img = Image(str(path), width=width, height=height)
    img.hAlign = "CENTER"
    return KeepTogether([
        img,
        Spacer(1, 0.08 * inch),
        p(caption, styles["Caption"]),
    ])


def status_badge(label: str, status: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(
        f'<font color="{label}"><b>{clean_text(status)}</b></font>',
        style,
    )


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


def bullet_list(items: Iterable[str], styles) -> list:
    flowables = []
    for item in items:
        flowables.append(p(f"- {item}", styles["BulletText"]))
    return flowables


def callout(title: str, body: str, styles, fill=FILL_BLUE, border=BLUE) -> Table:
    content = [
        [p(title, styles["CalloutTitle"])],
        [p(body, styles["CalloutBody"])],
    ]
    t = Table(content, colWidths=[6.5 * inch])
    t.setStyle(
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
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    page_width, page_height = letter
    if doc.page > 1:
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.7)
        canvas.line(0.75 * inch, page_height - 0.55 * inch, page_width - 0.75 * inch, page_height - 0.55 * inch)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(0.75 * inch, page_height - 0.4 * inch, "Besu Customs - AI Designer Approval Pack")
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(page_width - 0.75 * inch, page_height - 0.4 * inch, TODAY.strftime("%B %d, %Y"))

    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(0.75 * inch, 0.5 * inch, page_width - 0.75 * inch, 0.5 * inch)
    canvas.setFillColor(LIGHT_MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.75 * inch, 0.32 * inch, "Prepared for client approval and final project closeout.")
    canvas.drawRightString(page_width - 0.75 * inch, 0.32 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "CoverKicker": ParagraphStyle(
            "CoverKicker",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=BLUE,
            uppercase=True,
            spaceAfter=10,
            alignment=TA_CENTER,
        ),
        "CoverTitle": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=32,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "CoverSub": ParagraphStyle(
            "CoverSub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12.5,
            leading=17,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "H1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=21,
            textColor=INK,
            spaceBefore=2,
            spaceAfter=10,
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=BLUE,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13.2,
            textColor=INK,
            spaceAfter=6,
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.2,
            leading=11.2,
            textColor=MUTED,
            spaceAfter=4,
        ),
        "Table": ParagraphStyle(
            "Table",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.8,
            leading=10.4,
            textColor=INK,
        ),
        "TableBold": ParagraphStyle(
            "TableBold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.8,
            leading=10.4,
            textColor=INK,
        ),
        "BulletText": ParagraphStyle(
            "BulletText",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.3,
            leading=12.8,
            leftIndent=14,
            firstLineIndent=-8,
            textColor=INK,
            spaceAfter=4,
        ),
        "Caption": ParagraphStyle(
            "Caption",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=7.8,
            leading=10,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "CalloutTitle": ParagraphStyle(
            "CalloutTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=INK,
            spaceAfter=4,
        ),
        "CalloutBody": ParagraphStyle(
            "CalloutBody",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=INK,
        ),
    }
    return styles


def build_pdf():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.68 * inch,
        title="Besu Customs - Bryant AI Designer Approval Pack",
        author="Enis Gjini",
    )

    story = []

    # Cover
    story += [
        Spacer(1, 0.45 * inch),
        p("CLIENT APPROVAL PACK", styles["CoverKicker"]),
        p("Besu Customs AI Designer Improvements", styles["CoverTitle"]),
        p(
            "Prepared to close Bryant's feedback loop, confirm what was implemented, and support final project approval.",
            styles["CoverSub"],
        ),
        Spacer(1, 0.18 * inch),
        callout(
            "Approval request",
            "Please approve the completed AI Designer and Text workflow improvements described in this packet so the project can be closed and payment can be released.",
            styles,
            fill=colors.HexColor("#ECFDF5"),
            border=GREEN,
        ),
        Spacer(1, 0.22 * inch),
        table(
            [
                [p("Prepared for", styles["TableBold"]), p("Michael Baptiste / Bryant", styles["Table"])],
                [p("Project", styles["TableBold"]), p("Besu Customs 3D uniform configurator", styles["Table"])],
                [p("Date", styles["TableBold"]), p(TODAY.strftime("%B %d, %Y"), styles["Table"])],
                [p("Status", styles["TableBold"]), p("Ready for client approval after completed fixes and verification", styles["Table"])],
            ],
            [1.45 * inch, 5.05 * inch],
            header=False,
        ),
        Spacer(1, 0.25 * inch),
        p("Executive summary", styles["H2"]),
        *bullet_list(
            [
                "The AI Designer now recognizes team-name prompts such as 'team called the Galactic' and preserves that team identity in the generation instructions.",
                "A deterministic editable team-name layer is added on the jersey chest after AI generation when a team name is detected.",
                "The Text step now starts with 'Besu' and adds it directly to the chest at a fitted default size instead of forcing the customer to zoom, drag, and resize.",
                "Text readability was improved with optional stroke rendering for automatic chest wordmarks.",
                "The current requested changes are complete; multi-sample generation and new model authoring are documented as future-phase enhancements.",
            ],
            styles,
        ),
        PageBreak(),
    ]

    # Approval decision page
    story += [
        p("Approval Decision Summary", styles["H1"]),
        callout(
            "Recommended decision",
            "Approve the current fixes as complete for the agreed project closeout. The implementation addresses the actionable UX and AI prompt behavior feedback without expanding into new model creation or a multi-concept generation system.",
            styles,
            fill=FILL_BLUE,
            border=BLUE,
        ),
        Spacer(1, 0.12 * inch),
        p("What Bryant asked to improve", styles["H2"]),
        *bullet_list(
            [
                "Team name should appear automatically on the chest of each player uniform.",
                "Text should fit the jersey by default instead of appearing oversized.",
                "Prompted designs should feel more complete, including team identity and logo-style details.",
                "The tucked shirt / visible waistline look is preferred when the model supports it.",
                "Generating multiple quick uniform samples would be useful, but this is a larger feature request.",
            ],
            styles,
        ),
        p("What is now completed", styles["H2"]),
        table(
            [
                [p("Area", styles["TableBold"]), p("Completed behavior", styles["TableBold"]), p("Approval status", styles["TableBold"])],
                [
                    p("AI team-name handling", styles["Table"]),
                    p("Prompts are parsed for team names and the AI generation instructions now preserve the team identity and request an original team-logo / monogram direction.", styles["Table"]),
                    p("Complete", styles["TableBold"]),
                ],
                [
                    p("Chest team name", styles["Table"]),
                    p("When a team name is detected, the app adds one editable chest wordmark layer automatically after AI generation.", styles["Table"]),
                    p("Complete", styles["TableBold"]),
                ],
                [
                    p("Manual Text step", styles["Table"]),
                    p("The text field starts with Besu, uses white default text, adds directly to the chest, and selects the new layer for immediate editing.", styles["Table"]),
                    p("Complete", styles["TableBold"]),
                ],
                [
                    p("Default text fit", styles["Table"]),
                    p("Default font size is estimated from word length and constrained so the first placement fits the chest instead of appearing huge.", styles["Table"]),
                    p("Complete", styles["TableBold"]),
                ],
                [
                    p("Readability", styles["Table"]),
                    p("Automatic wordmarks can render with a subtle dark stroke so text remains readable on dark or busy AI textures.", styles["Table"]),
                    p("Complete", styles["TableBold"]),
                ],
            ],
            [1.35 * inch, 4.25 * inch, 0.9 * inch],
        ),
        Spacer(1, 0.14 * inch),
        callout(
            "No open decision needed from Bryant",
            "The only requested response is approval of the current completed fixes. Any additional requests listed as future-phase enhancements can be estimated separately after project closeout.",
            styles,
            fill=colors.HexColor("#FFF7ED"),
            border=AMBER,
        ),
        PageBreak(),
    ]

    # Feedback matrix
    story += [
        p("Feedback-to-Implementation Matrix", styles["H1"]),
        p(
            "This matrix maps the WhatsApp feedback directly to what was implemented, what is model-dependent, and what is outside the approved closeout scope.",
            styles["Body"],
        ),
        table(
            [
                [
                    p("Client feedback", styles["TableBold"]),
                    p("Implementation response", styles["TableBold"]),
                    p("Closeout position", styles["TableBold"]),
                ],
                [
                    p("I want it to put the name automatically. The team name on the chest is what I am referring to.", styles["Table"]),
                    p("AI prompts now extract the team name and the app adds a deterministic editable chest text layer after AI generation.", styles["Table"]),
                    p("Included and complete.", styles["Table"]),
                ],
                [
                    p("Every team rocks their team name on the chest.", styles["Table"]),
                    p("The chest team wordmark is now treated as a standard expected jersey element, not an optional manual-only action.", styles["Table"]),
                    p("Included and complete.", styles["Table"]),
                ],
                [
                    p("Can the AI make it fit the jersey instead of making the font so big?", styles["Table"]),
                    p("Default text sizing is calculated from the word length and placed at the chest anchor. The user can still adjust size, color, and position.", styles["Table"]),
                    p("Included and complete.", styles["Table"]),
                ],
                [
                    p("I want it to say Besu in a good size the first time.", styles["Table"]),
                    p("Text step now preloads Besu and inserts it at a fitted default size.", styles["Table"]),
                    p("Included and complete.", styles["Table"]),
                ],
                [
                    p("It creates a team logo for them also.", styles["Table"]),
                    p("AI prompt guardrails now request an original team logo / monogram style based on the theme. A separate editable logo-generation pipeline is a future feature.", styles["Table"]),
                    p("Supported in AI texture prompting; separate logo tool is future-phase.", styles["Table"]),
                ],
                [
                    p("Do you see how the shirts tucked in and shows the waistline? I want that.", styles["Table"]),
                    p("This is controlled by the 3D garment model mesh, not by text or texture code. If a prebuilt tucked-waist model exists, it can be swapped in; creating a new model is separate scope.", styles["Table"]),
                    p("Model-dependent; not a blocker for current approval.", styles["Table"]),
                ],
                [
                    p("Create multiple samples so they can quickly select one.", styles["Table"]),
                    p("This would require a multi-generation, variant storage, preview selection, and continuation flow.", styles["Table"]),
                    p("Future-phase enhancement; not part of current closeout.", styles["Table"]),
                ],
            ],
            [1.95 * inch, 3.25 * inch, 1.3 * inch],
        ),
        PageBreak(),
    ]

    # Visual references
    story += [
        p("Visual Reference Evidence", styles["H1"]),
        p(
            "The following images are the specific visual references shared for the feedback. They are included here so the approval decision has the same context as the implementation work.",
            styles["Body"],
        ),
    ]
    for image_path, caption in REFERENCE_IMAGES:
        story.append(captioned_image(image_path, caption, 2.05 * inch, 3.9 * inch, styles))
        story.append(Spacer(1, 0.08 * inch))
    story += [PageBreak()]

    # App screenshot
    story += [
        p("Implemented App Verification", styles["H1"]),
        p(
            "The local Besu configurator was checked after the changes. The screenshot confirms the Basketball Jersey and Shorts flow, Text step access, Besu default text, and selected editable text layer.",
            styles["Body"],
        ),
        captioned_image(APP_SCREENSHOT[0], APP_SCREENSHOT[1], 6.45 * inch, 4.55 * inch, styles),
        Spacer(1, 0.1 * inch),
        callout(
            "Important implementation detail",
            "The final chest name is deterministic and editable. This is more reliable than relying only on AI image typography, because image models can misspell or distort text. The AI can still drive theme, colors, patterning, and logo-style marks while the app controls final customer-readable team text.",
            styles,
            fill=colors.HexColor("#F8FAFC"),
            border=BORDER,
        ),
        PageBreak(),
    ]

    # Technical notes
    story += [
        p("Technical Delivery Notes", styles["H1"]),
        p("Files changed", styles["H2"]),
        table(
            [
                [p("File", styles["TableBold"]), p("Reason", styles["TableBold"])],
                [p("lib/team-text-placement.ts", styles["Table"]), p("Shared helper for team-name extraction, chest placement, normalization, and fitted font sizing.", styles["Table"])],
                [p("components/ai-texture-generator.tsx", styles["Table"]), p("AI prompt guardrails now preserve team identity and request logo / monogram treatment when the prompt includes a team name.", styles["Table"])],
                [p("components/wizard-steps/step-08-ai-images.tsx", styles["Table"]), p("Adds or updates one editable team-name chest text layer after AI generation.", styles["Table"])],
                [p("components/wizard-steps/step-06-text.tsx", styles["Table"]), p("Manual text now defaults to Besu, inserts directly to chest, and uses fitted size instead of placement mode.", styles["Table"])],
                [p("components/three-scene.tsx + lib/store.ts", styles["Table"]), p("Adds optional stroke rendering metadata for readable automatic wordmarks.", styles["Table"])],
                [p("components/layer-controls-overlay.tsx", styles["Table"]), p("Fixes duplicate text label display in the selected layer overlay.", styles["Table"])],
            ],
            [2.55 * inch, 3.95 * inch],
        ),
        Spacer(1, 0.14 * inch),
        p("Verification completed", styles["H2"]),
        *bullet_list(
            [
                "TypeScript check passed: pnpm exec tsc --noEmit.",
                "Production build passed: pnpm build.",
                "Browser verification passed at http://localhost:3000 with Basketball Jersey and Shorts selected.",
                "Manual text behavior verified: Besu default appears, creates a selected layer, and no longer requires tap-to-place workflow.",
            ],
            styles,
        ),
        p("Production risk position", styles["H2"]),
        *bullet_list(
            [
                "The change is scoped to AI prompt construction, texture-layer creation, text-layer defaults, and text rendering metadata.",
                "No payment, authentication, database, Shopify checkout, or admin-order logic was changed.",
                "Existing text and image layers remain compatible because stroke fields are optional.",
                "The deterministic text layer reduces AI misspelling risk for client-facing team names.",
            ],
            styles,
        ),
        PageBreak(),
    ]

    # Approval checklist
    story += [
        p("Approval Checklist and Closeout Statement", styles["H1"]),
        callout(
            "Client approval statement",
            "I approve the completed Besu Customs AI Designer and Text workflow fixes described in this approval pack. The current work satisfies the requested closeout improvements and may proceed to final project closeout and payment release.",
            styles,
            fill=colors.HexColor("#ECFDF5"),
            border=GREEN,
        ),
        Spacer(1, 0.16 * inch),
        p("Acceptance checklist", styles["H2"]),
        table(
            [
                [p("Acceptance item", styles["TableBold"]), p("Status", styles["TableBold"])],
                [p("Team name is automatically recognized from AI prompts such as 'team called the Galactic'.", styles["Table"]), p("Complete", styles["TableBold"])],
                [p("Team name is added as an editable chest wordmark after AI generation.", styles["Table"]), p("Complete", styles["TableBold"])],
                [p("Text step starts with Besu and uses a practical fitted default size.", styles["Table"]), p("Complete", styles["TableBold"])],
                [p("Customer can still edit, resize, recolor, reposition, duplicate, or remove text layers.", styles["Table"]), p("Complete", styles["TableBold"])],
                [p("AI prompt now supports original logo / monogram style marks when a team name is present.", styles["Table"]), p("Complete", styles["TableBold"])],
                [p("Tucked waistline visual is documented as a model asset dependency.", styles["Table"]), p("Documented", styles["TableBold"])],
                [p("Multi-sample generation is documented as a future-phase enhancement.", styles["Table"]), p("Documented", styles["TableBold"])],
            ],
            [5.1 * inch, 1.4 * inch],
        ),
        Spacer(1, 0.2 * inch),
        p("Exact approval reply to use", styles["H2"]),
        callout(
            "Suggested reply",
            "Approved. These fixes address Bryant's AI Designer and Text workflow feedback. Please proceed with final project closeout and payment release.",
            styles,
            fill=FILL,
            border=BORDER,
        ),
        Spacer(1, 0.15 * inch),
        p("Future enhancements, not required for approval", styles["H2"]),
        *bullet_list(
            [
                "Generate four or more AI uniform concepts in one run and let the customer pick a starting design.",
                "Create a separate editable AI logo generator with saved logo assets.",
                "Author or purchase a new tucked-waist 3D model if the current prebuilt model set does not include the exact silhouette.",
            ],
            styles,
        ),
    ]

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PDF)
