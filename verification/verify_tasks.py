from playwright.sync_api import sync_playwright

def verify(page):
    page.goto("http://localhost:3000")
    page.wait_for_selector("text=Inbox")
    page.screenshot(path="verification/tasks.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify(page)
    browser.close()
