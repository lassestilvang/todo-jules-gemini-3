from playwright.sync_api import Page, expect, sync_playwright

def test_upcoming_tasks(page: Page):
    # 1. Arrange: Go to the Upcoming page.
    page.goto("http://localhost:3000/upcoming")

    # 2. Act: Wait for content to load.
    # We expect tasks to be listed.
    # Based on seed data:
    # - Task Tomorrow
    # - Task Next Week
    # - Task Yesterday (Should NOT be here)
    # - Task Today (Should NOT be here)

    # 3. Assert: Check visibility.
    expect(page.get_by_text("Task Tomorrow")).to_be_visible()
    expect(page.get_by_text("Task Next Week")).to_be_visible()

    # Assert NOT visible
    expect(page.get_by_text("Task Yesterday")).not_to_be_visible()
    expect(page.get_by_text("Task Today")).not_to_be_visible()

    # 4. Screenshot: Capture the final result.
    page.screenshot(path="verification/upcoming_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_upcoming_tasks(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()
