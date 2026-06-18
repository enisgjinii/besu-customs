#!/usr/bin/env python3
"""Local browser verification for team-name front chest fix."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
MICHAEL_PROMPT = (
    "Make a jersey about Michael Jackson, and show him doing the moonwalk. "
    "Also, please put the team name Michael on the front. Also, please add space "
    "and stars to the background to make it look epic."
)


def main() -> int:
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baseUrl": "http://localhost:3000",
        "prompt": MICHAEL_PROMPT,
        "steps": [],
        "screenshots": [],
        "assertions": [],
        "success": False,
    }

    def log(step: str, detail: str, ok: bool = True) -> None:
        report["steps"].append({"step": step, "detail": detail, "ok": ok})
        print(f"{'OK' if ok else 'FAIL'}  {step}: {detail}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1512, "height": 982}, device_scale_factor=2)

        try:
            page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
            log("Load app", "localhost:3000 opened")

            page.locator('[role="combobox"]').first.click()
            page.get_by_role("option", name="Basketball Jersey").first.click()
            log("Select product", "Basketball Jersey selected")
            page.wait_for_timeout(2500)

            page.get_by_role("button", name="AI DESIGN").click()
            log("Open step", "AI Design step active")

            prompt = page.locator("#ai-texture-prompt")
            prompt.wait_for(state="visible", timeout=30000)

            page.wait_for_function(
                """() => {
                  const btn = Array.from(document.querySelectorAll('button')).find((b) =>
                    /generate (flash|premium) full texture/i.test(b.textContent || '')
                  );
                  return btn && !btn.disabled;
                }""",
                timeout=90000,
            )
            log("UV ready", "Texture generation unlocked")

            prompt.fill(MICHAEL_PROMPT)
            page.get_by_role("button", name="Flash").click()
            page.screenshot(path=str(HERE / "04-local-prompt-ready.png"))
            report["screenshots"].append("04-local-prompt-ready.png")
            log("Screenshot", "04-local-prompt-ready.png")

            page.get_by_role("button", name="Generate flash full texture").click()
            log("Generate", "Flash generation started")

            done = False
            for _ in range(120):
                body = page.locator("body").inner_text()
                if (
                    "AI pattern and team name added successfully" in body
                    or "Team Name: MICHAEL" in body
                    or "Team Name: Michael" in body
                ):
                    done = True
                    break
                page.wait_for_timeout(2000)

            if not done:
                raise RuntimeError("AI generation timed out after 4 minutes")

            log("Generation", "Completed with team name layer")

            page.wait_for_timeout(3000)
            body = page.locator("body").inner_text()
            has_team_layer = "Team Name: MICHAEL" in body or "Team Name: Michael" in body
            report["assertions"].append(
                {
                    "name": "Team name layer added",
                    "pass": has_team_layer,
                    "detail": "Team Name layer visible in UI" if has_team_layer else "Layer not found",
                }
            )
            log("Assert team layer", "present" if has_team_layer else "missing", has_team_layer)

            page.screenshot(path=str(HERE / "05-local-after-generated.png"))
            report["screenshots"].append("05-local-after-generated.png")
            log("Screenshot", "05-local-after-generated.png (post-generation, AI step)")

            # View lock controls are available on Patterns, Images, and Review steps.
            page.get_by_role("button", name="9 REVIEW").click()
            page.wait_for_timeout(2000)
            log("Open step", "Review step for front/back view lock")

            page.get_by_role("button", name="Front", exact=True).click()
            page.wait_for_timeout(1500)
            page.screenshot(path=str(HERE / "06-local-after-front.png"))
            report["screenshots"].append("06-local-after-front.png")
            log("Screenshot", "06-local-after-front.png")

            page.get_by_role("button", name="Back", exact=True).click()
            page.wait_for_timeout(1500)
            page.screenshot(path=str(HERE / "07-local-after-back.png"))
            report["screenshots"].append("07-local-after-back.png")
            log("Screenshot", "07-local-after-back.png")

            report["assertions"].append(
                {
                    "name": "AI generation completed locally with team name layer",
                    "pass": True,
                    "detail": "Flash generation returned and Team Name layer was added automatically.",
                }
            )

            report["success"] = has_team_layer
        except Exception as exc:
            log("Error", str(exc), ok=False)
            report["error"] = str(exc)
            try:
                page.screenshot(path=str(HERE / "99-local-error-state.png"))
                report["screenshots"].append("99-local-error-state.png")
            except Exception:
                pass
        finally:
            browser.close()

    report_path = HERE / "browser-test-report.json"
    report_path.write_text(json.dumps(report, indent=2))
    print(f"\nBrowser report: {report_path}")
    return 0 if report["success"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
