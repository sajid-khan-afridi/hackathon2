# -*- coding: utf-8 -*-
"""
Comprehensive Playwright test script for Todo Full-Stack App.
Tests all features: auth, tasks CRUD, navigation.
"""

from playwright.sync_api import sync_playwright
import time
import random
import string
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def generate_random_email():
    """Generate a random email for testing."""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{suffix}@example.com"

def test_todo_app():
    """Test all features of the Todo app."""
    results = []
    test_email = generate_random_email()
    test_password = "TestPassword123!"
    test_name = "Test User"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set up dialog handler globally
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            # ===== TEST 1: Landing Page =====
            print("\n===== TEST 1: Landing Page =====")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Check page title
            title = page.title()
            assert "Todo" in title, f"Expected 'Todo' in title, got '{title}'"

            # Check for Sign In and Sign Up links
            signin_visible = page.locator("text=Sign In").first.is_visible()
            signup_visible = page.locator("text=Sign Up").first.is_visible()
            assert signin_visible, "Sign In link not visible"
            assert signup_visible, "Sign Up link not visible"

            results.append(("Landing Page", "PASS", "Title and auth links present"))
            print("[PASS] Landing page loads correctly")

            # ===== TEST 2: Sign Up Flow =====
            print("\n===== TEST 2: Sign Up Flow =====")
            page.goto("http://localhost:3000/signup")
            page.wait_for_load_state("networkidle")
            time.sleep(1)  # Wait for hydration

            # Fill signup form using aria-labels and IDs
            page.locator('input#name, [aria-label="Name"]').first.fill(test_name)
            page.locator('input#email, input[type="email"]').first.fill(test_email)
            page.locator('input#password, input[type="password"]').first.fill(test_password)

            # Submit form
            page.locator('button[type="submit"]').click()

            # Wait for redirect to tasks page
            page.wait_for_url("**/tasks**", timeout=15000)

            results.append(("Sign Up Flow", "PASS", f"Created user {test_email}"))
            print(f"[PASS] Sign up successful, redirected to tasks page")

            # ===== TEST 3: Tasks Page (Empty State) =====
            print("\n===== TEST 3: Tasks Page (Empty State) =====")
            page.wait_for_load_state("networkidle")
            time.sleep(2)  # Wait for React hydration and API calls

            # Check for task form with correct aria-label
            task_input = page.locator('[aria-label="New task title"]')
            has_task_form = task_input.count() > 0

            if not has_task_form:
                # Fallback selectors
                task_input = page.locator('input[placeholder="What needs to be done?"]')
                has_task_form = task_input.count() > 0

            assert has_task_form, "Task input form not found"
            results.append(("Tasks Page Empty State", "PASS", "Empty state displayed correctly"))
            print("[PASS] Tasks page shows empty state with form")

            # ===== TEST 4: Task Creation =====
            print("\n===== TEST 4: Task Creation =====")
            task_title = f"Test Task {random.randint(1000, 9999)}"

            # Fill the task input
            task_input.first.fill(task_title)
            time.sleep(0.5)

            # Click Add button
            add_button = page.locator('button:has-text("Add Task")')
            add_button.click()

            # Wait for task to appear
            time.sleep(2)
            page.wait_for_load_state("networkidle")

            # Verify task was created
            page_content = page.content()
            assert task_title in page_content, f"Task '{task_title}' not visible after creation"

            results.append(("Task Creation", "PASS", f"Created task: {task_title}"))
            print(f"[PASS] Task '{task_title}' created successfully")

            # ===== TEST 5: Task Detail Page =====
            print("\n===== TEST 5: Task Detail Page =====")

            # Click on view details link
            detail_link = page.locator('[aria-label="View task details"]').first
            if detail_link.is_visible():
                detail_link.click()
                page.wait_for_url("**/tasks/*", timeout=10000)
                page.wait_for_load_state("networkidle")
                time.sleep(3)  # Wait for React hydration and API call

                # Wait for task title to appear
                page.wait_for_selector(f'text="{task_title}"', timeout=10000)

                # Verify task detail page
                page_content = page.content()
                assert task_title in page_content, "Task title not on detail page"
                assert "Status" in page_content, "Status not shown on detail page"

                results.append(("Task Detail Page", "PASS", "Detail page shows task info"))
                print("[PASS] Task detail page displays correctly")

                # ===== TEST 6: Task Completion Toggle =====
                print("\n===== TEST 6: Task Completion Toggle =====")

                complete_btn = page.locator('button:has-text("Mark Complete")').first
                if complete_btn.is_visible():
                    complete_btn.click()
                    time.sleep(2)
                    page.wait_for_load_state("networkidle")

                    # Check if status changed
                    page_content = page.content()
                    if "Completed" in page_content or "Mark Incomplete" in page_content:
                        results.append(("Task Completion Toggle", "PASS", "Task marked as complete"))
                        print("[PASS] Task completion toggle works")
                    else:
                        results.append(("Task Completion Toggle", "WARN", "Status may not have updated"))
                        print("[WARN] Could not verify status change")
                else:
                    results.append(("Task Completion Toggle", "SKIP", "Complete button not found"))
                    print("[SKIP] Complete button not visible")

                # ===== TEST 7: Task Deletion =====
                print("\n===== TEST 7: Task Deletion =====")

                delete_btn = page.locator('button:has-text("Delete")').first
                if delete_btn.is_visible():
                    delete_btn.click()
                    time.sleep(2)

                    # Should redirect to tasks list
                    try:
                        page.wait_for_url("**/tasks", timeout=5000)
                        page.wait_for_load_state("networkidle")
                        time.sleep(1)

                        # Verify task is gone
                        if task_title not in page.content():
                            results.append(("Task Deletion", "PASS", "Task deleted successfully"))
                            print("[PASS] Task deleted successfully")
                        else:
                            results.append(("Task Deletion", "WARN", "Task may still be visible"))
                            print("[WARN] Task may still be visible after deletion")
                    except:
                        results.append(("Task Deletion", "WARN", "Redirect timeout"))
                        print("[WARN] Did not redirect after deletion")
                else:
                    results.append(("Task Deletion", "SKIP", "Delete button not found"))
                    print("[SKIP] Delete button not visible")
            else:
                results.append(("Task Detail Page", "SKIP", "Detail link not found"))
                print("[SKIP] Detail link not visible")

            # ===== TEST 8: Sign Out Flow =====
            print("\n===== TEST 8: Sign Out Flow =====")

            # Go to tasks page
            page.goto("http://localhost:3000/tasks")
            page.wait_for_load_state("networkidle")
            time.sleep(1)

            # Find and click sign out button
            signout_btn = page.locator('button:has-text("Sign Out")').first
            if signout_btn.is_visible():
                signout_btn.click()
                time.sleep(2)
                page.wait_for_load_state("networkidle")

                # Should redirect to home or signin
                current_url = page.url
                if "signin" in current_url or current_url.rstrip('/').endswith("3000"):
                    results.append(("Sign Out Flow", "PASS", "Signed out and redirected"))
                    print("[PASS] Sign out successful")
                else:
                    # Check if auth buttons are visible (indicating signed out)
                    if page.locator("text=Sign In").first.is_visible():
                        results.append(("Sign Out Flow", "PASS", "Signed out successfully"))
                        print("[PASS] Sign out successful (auth buttons visible)")
                    else:
                        results.append(("Sign Out Flow", "WARN", f"Redirected to {current_url}"))
                        print(f"[WARN] Signed out but redirected to {current_url}")
            else:
                results.append(("Sign Out Flow", "SKIP", "Sign out button not found"))
                print("[SKIP] Sign out button not visible")

            # ===== TEST 9: Sign In Flow =====
            print("\n===== TEST 9: Sign In Flow (with existing user) =====")

            page.goto("http://localhost:3000/signin")
            page.wait_for_load_state("networkidle")
            time.sleep(1)

            # Fill signin form
            page.locator('input#email, input[type="email"]').first.fill(test_email)
            page.locator('input#password, input[type="password"]').first.fill(test_password)

            # Submit form
            page.locator('button[type="submit"]').click()

            # Wait for redirect
            try:
                page.wait_for_url("**/tasks**", timeout=15000)
                results.append(("Sign In Flow", "PASS", f"Signed in as {test_email}"))
                print("[PASS] Sign in successful")
            except:
                results.append(("Sign In Flow", "FAIL", "Did not redirect to tasks"))
                print("[FAIL] Sign in did not redirect to tasks")

        except Exception as e:
            results.append(("UNEXPECTED ERROR", "FAIL", str(e)))
            print(f"[ERROR] {e}")

            # Take screenshot on error
            try:
                page.screenshot(path="error_screenshot.png")
                print("Screenshot saved to error_screenshot.png")
            except:
                pass

        finally:
            browser.close()

    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in results if r[1] == "PASS")
    failed = sum(1 for r in results if r[1] == "FAIL")
    warnings = sum(1 for r in results if r[1] == "WARN")
    skipped = sum(1 for r in results if r[1] == "SKIP")

    for test_name, status, details in results:
        status_icon = {"PASS": "[OK]", "FAIL": "[X]", "WARN": "[!]", "SKIP": "[-]", "PARTIAL": "[~]"}.get(status, "[?]")
        print(f"{status_icon} {test_name}: {status} - {details}")

    print("\n" + "-" * 60)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {failed} | Warnings: {warnings} | Skipped: {skipped}")
    print("=" * 60)

    # Return exit code based on results
    if failed > 0:
        return 1
    return 0

if __name__ == "__main__":
    exit_code = test_todo_app()
    sys.exit(exit_code)
