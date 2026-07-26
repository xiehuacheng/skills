import asyncio
import json
import re
import sys
from playwright.async_api import async_playwright


def parse_installs(text):
    """Parse install counts like '2.5M', '660.2K', '1,234' into integer."""
    match = re.search(r"([\d.,]+)\s*(K|M|B)?", text, re.IGNORECASE)
    if not match:
        return 0
    value = float(match.group(1).replace(",", ""))
    unit = (match.group(2) or "").upper()
    if unit == "K":
        value *= 1000
    elif unit == "M":
        value *= 1000000
    elif unit == "B":
        value *= 1000000000
    return int(value)


def normalize_row_text(text):
    """Normalize row text that may or may not have spaces."""
    # Insert spaces between: digit->word, word->source, source->installs
    # 1. rank number followed by word
    text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)
    # 2. word followed by owner/repo (contains slash)
    text = re.sub(r"([a-zA-Z0-9-])([a-zA-Z0-9-]+/[a-zA-Z0-9-]+)", r"\1 \2", text)
    # 3. source followed by installs (number possibly with K/M)
    text = re.sub(r"([a-zA-Z0-9-]/[a-zA-Z0-9-])([\d.,]+[KMB]?)", r"\1 \2", text, flags=re.I)
    return text


async def scrape_trending():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        print("Opening https://skills.sh/...", file=sys.stderr)
        await page.goto("https://skills.sh/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)

        # Click the "Trending (24h)" tab
        tab = page.get_by_text("Trending (24h)", exact=False)
        if await tab.count() > 0:
            print("Clicking Trending tab...", file=sys.stderr)
            await tab.first.click()
            await page.wait_for_timeout(3000)

        # Wait for trending content to render.
        # Note: skills.sh uses virtualization; aggressive scrolling unmounts top
        # items. We capture the initial viewport without scrolling.
        print("Capturing trending skills...", file=sys.stderr)
        await page.wait_for_timeout(2000)

        # Extract skill rows
        rows = await page.evaluate('''() => {
            const results = [];
            const links = document.querySelectorAll('a[href^="/"]');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || !href.match(/^\\/[\\w-]+\\/[\\w-]+\\/[\\w-]+$/)) return;

                // Walk up to find a row ancestor that starts with a rank number
                let row = link.parentElement;
                for (let i = 0; i < 5 && row; i++) {
                    const text = (row.innerText || '').trim().replace(/\\s+/g, ' ');
                    if (/^\\d+\\s/.test(text) || /^\\d+[a-zA-Z]/.test(text)) {
                        results.push({ href, text });
                        break;
                    }
                    row = row.parentElement;
                }
            });
            return results;
        }''')

        seen = set()
        parsed = []
        for row in rows:
            text = row["text"]
            # Try spaced format first
            match = re.match(
                r"^(\d+)\s+([\w-]+)\s+([\w-]+/[\w-]+)\s+([\d.,]+\s*[KMB]?)",
                text,
                re.IGNORECASE
            )
            if not match:
                # Fall back to normalizing compact text
                text = normalize_row_text(text)
                match = re.match(
                    r"^(\d+)\s+([\w-]+)\s+([\w-]+/[\w-]+)\s+([\d.,]+\s*[KMB]?)",
                    text,
                    re.IGNORECASE
                )
            if not match:
                continue

            rank = int(match.group(1))
            name = match.group(2)
            source = match.group(3)
            key = f"{source}/{name}"
            if key in seen:
                continue
            seen.add(key)

            parsed.append({
                "rank": rank,
                "skill_id": f"{source}@{name}",
                "name": name,
                "source": source,
                "full_name": source,
                "installs": parse_installs(match.group(4)),
                "url": f"https://skills.sh{row['href']}"
            })

        parsed.sort(key=lambda x: x["rank"])

        print(f"Total unique trending skills: {len(parsed)}", file=sys.stderr)

        await browser.close()
        return parsed


if __name__ == "__main__":
    result = asyncio.run(scrape_trending())
    # Print the full result to stdout so Node.js can consume it.
    print(json.dumps(result, ensure_ascii=False))
