from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(500)

    # Focus the document body to start
    page.keyboard.press('Tab')
    page.wait_for_timeout(500)

    # Take screenshot of the visible skip link
    page.screenshot(path="verification/screenshots/skip_link.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
