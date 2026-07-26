import asyncio
import json
import re
import sys
from playwright.async_api import async_playwright


def parse_installs(text):
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


async def scrape_leaderboard():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        print("Opening https://skills.sh/...", file=sys.stderr)
        await page.goto("https://skills.sh/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)

        tab = page.get_by_text("All Time", exact=False)
        if await tab.count() > 0:
            print("Clicking All Time tab...", file=sys.stderr)
            await tab.first.click()
            await page.wait_for_timeout(3000)

        seen_skills = set()
        seen_groups = set()
        # Aggregate installs per source (repo). Individual skill rows plus collapsed
        # group totals both contribute to the repo's total install count.
        source_totals = {}
        source_best_rank = {}

        async def extract_rows():
            return await page.evaluate('''() => {
                const results = [];
                const links = document.querySelectorAll('a[href^="/"]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href || !href.match(/^\\/[\\w-]+\\/[\\w-]+\\/[\\w-]+$/)) return;
                    let row = link.parentElement;
                    for (let i = 0; i < 6 && row; i++) {
                        const text = (row.innerText || '').trim().replace(/\\s+/g, ' ');
                        if (/^\\d+\\s/.test(text)) {
                            results.push({ type: 'skill', href, text });
                            break;
                        }
                        row = row.parentElement;
                    }
                });
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    const text = (el.innerText || '').trim().replace(/\\s+/g, ' ');
                    if (/^\\+\\d+\\s+more\\s+from\\s+[/\\w.-]+\\s+\\(/.test(text)) {
                        results.push({ type: 'group', text });
                    }
                });
                return results;
            }''')

        def add_rows(rows):
            added = 0
            for row in rows:
                text = row["text"]
                if row.get("type") == "group":
                    match = re.match(
                        r"^\+(\d+)\s+more\s+from\s+([\w.-]+/[\w.-]+)\s+\(([\d.,]+\s*[KMB]?)\s+total\)",
                        text,
                        re.IGNORECASE,
                    )
                    if not match:
                        continue
                    source = match.group(2)
                    if source in seen_groups:
                        continue
                    seen_groups.add(source)
                    source_totals[source] = source_totals.get(source, 0) + parse_installs(match.group(3))
                    added += 1
                    continue

                match = re.match(
                    r"^(\d+)\s+([\w-]+)\s+([\w.-]+/[\w.-]+)\s+([\d.,]+\s*[KMB]?)",
                    text,
                    re.IGNORECASE,
                )
                if not match:
                    continue
                rank = int(match.group(1))
                name = match.group(2)
                source = match.group(3)
                key = f"{source}/{name}"
                if key in seen_skills:
                    continue
                seen_skills.add(key)
                source_totals[source] = source_totals.get(source, 0) + parse_installs(match.group(4))
                source_best_rank[source] = min(source_best_rank.get(source, rank), rank)
                added += 1
            return added

        # Capture initial viewport
        add_rows(await extract_rows())

        max_no_change = 3
        no_change_count = 0
        max_scrolls = 15
        scroll_count = 0
        while no_change_count < max_no_change and scroll_count < max_scrolls:
            previous_total = len(seen_skills) + len(seen_groups)
            await page.evaluate("() => window.scrollBy(0, 800)")
            await page.wait_for_timeout(800)
            scroll_count += 1

            added = add_rows(await extract_rows())

            if len(seen_skills) + len(seen_groups) > previous_total:
                no_change_count = 0
                print(f"  Loaded {len(seen_skills)} skills + {len(seen_groups)} groups...", file=sys.stderr)
            else:
                no_change_count += 1

        parsed = []
        for source, installs in source_totals.items():
            repo = source.split("/")[-1]
            parsed.append({
                "rank": source_best_rank.get(source),
                "skill_id": f"{source}@{repo}",
                "name": repo,
                "source": source,
                "full_name": source,
                "installs": installs,
                "url": f"https://skills.sh/{source}",
            })

        parsed.sort(key=lambda x: (x["rank"] is None, x["rank"]))
        print(f"Total unique sources from skills.sh leaderboard: {len(parsed)}", file=sys.stderr)

        await browser.close()
        return parsed


if __name__ == "__main__":
    result = asyncio.run(scrape_leaderboard())
    print(json.dumps(result, ensure_ascii=False))
