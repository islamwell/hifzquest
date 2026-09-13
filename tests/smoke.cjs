const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173");
  // Initial render does not need to write; navigation persists fresh state.
  await page.evaluate(() => switchTab("revision"));
  const fresh = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hifzquest_state_v1")),
  );
  assert.equal(fresh.streakCount, 0);
  assert.equal(fresh.hasanatXP, 0);
  assert.equal(fresh.masteredSurahs.length, 0);
  assert.ok(
    Object.values(fresh.surahProgress).every(
      (p) => p.lastScore === 0 && p.reviewCount === 0,
    ),
  );
  assert.ok(fresh.weeklyActivity.every((p) => p.count === 0 && p.date));
  const overflows = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of [
      "dashboard",
      "together",
      "revision",
      "matching",
      "more",
      "reciter",
      "canvas",
      "detox",
      "map",
    ]) {
      await page.evaluate((tab) => switchTab(tab), tab);
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        culprits: [...document.querySelectorAll(".app-section.active *")]
          .filter(
            (el) =>
              el.getBoundingClientRect().right > innerWidth + 1 &&
              getComputedStyle(el).position !== "absolute",
          )
          .slice(0, 8)
          .map((e) => e.id || e.className),
      }));
      if (overflow.scroll > width + 1) overflows.push({ tab, ...overflow });
    }
  }
  await page.goto("http://127.0.0.1:4173/#canvas");
  assert.equal(
    await page.locator("#canvas").getAttribute("class"),
    "app-section active",
  );
  await page.evaluate(() => switchTab("together"));
  await page.locator("[name=language]").first().selectOption("Arabic");
  await page.getByRole("button", { name: "Save my preferences" }).click();
  assert.match(
    await page.locator("#session-status").innerText(),
    /Saved on this device/,
  );
  await page.reload();
  assert.equal(
    await page.locator("#session-preferences [name=language]").inputValue(),
    "Arabic",
  );
  await page.evaluate(() => switchTab("matching"));
  await page.locator("[name=cost]").selectOption("Paid lessons");
  assert.match(
    await page.locator("#teacher-empty-message").innerText(),
    /paid lessons/,
  );
  await page.evaluate(() => switchTab("dashboard"));
  const profile = page.getByRole("button", {
    name: "Open your profile",
    exact: true,
  });
  await profile.click();
  await page.waitForTimeout(50);
  assert.equal(
    await page.locator("#profile-modal").getAttribute("aria-hidden"),
    "false",
  );
  await page.locator("#profile-name-input").fill("Amina");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(50);
  const returned = await profile.evaluate(
    (el) => el === document.activeElement,
  );
  // Reload with one dated session and undated demo history, preserving real progress.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("hifzquest_state_v1"));
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    s.userName = "Existing learner";
    s.hasanatXP = 150;
    s.weeklyActivity = [
      { date: key, count: 3 },
      { day: "Today", count: 15, height: 150 },
    ];
    localStorage.setItem("hifzquest_state_v1", JSON.stringify(s));
  });
  await page.reload();
  assert.match(await page.locator(".greeting-name").innerText(), /Existing/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("hifzquest_state_v1")).hasanatXP), 150);
  const counts = await page.locator(".activity-count").allTextContents();
  assert.equal(counts.at(-1), "0");
  assert.equal(counts.at(-2), "3");
  assert.equal(
    await page
      .locator(".activity-fill")
      .last()
      .evaluate((e) => e.style.height),
    "0%",
  );
  await page.evaluate(() => switchTab("reciter"));
  await page.evaluate(() => testRecitationScenario("perfect"));
  await page.waitForTimeout(1100);
  const practiced = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("hifzquest_state_v1")),
  );
  assert.equal(practiced.weeklyActivity.at(-1).count, 1);
  // User-facing identity strings must not become HTML in toast rendering.
  await page.evaluate(() => showToast("<img src=x onerror=alert(1)>"));
  assert.equal(await page.locator("#toast-container img").count(), 0);
  const mediaPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mediaPage.on("pageerror", (e) => errors.push(e.message));
  await mediaPage.addInitScript(() => {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await mediaPage.goto("http://127.0.0.1:4173");
  await mediaPage.evaluate(() => startDailyRevisionQuiz());
  assert.equal(await mediaPage.locator("#reciter .ayah-box").isVisible(), false);
  await mediaPage.getByRole("button", { name: "Exit Quiz", exact: true }).click();
  assert.equal(await mediaPage.locator("#reciter .ayah-box").isVisible(), true);
  await mediaPage.locator("#mic-trigger-btn").click();
  await mediaPage.waitForFunction(() => document.getElementById("recording-status").textContent.includes("Microphone unavailable"));
  assert.equal(await mediaPage.locator("#mic-trigger-btn").getAttribute("class"), "rec-btn-circle");
  assert.equal(await mediaPage.evaluate(() => JSON.parse(localStorage.getItem("hifzquest_state_v1")).weeklyActivity.at(-1).count), 0);
  await mediaPage.close();
  console.log(
    JSON.stringify(
      {
        checkedWidths: [320, 390, 768, 1024, 1440],
        checkedTabs: 9,
        errors,
        overflows,
        modalFocusReturned: returned,
        checks:
          "fresh state; canvas deep link; preference persistence; teacher filters; progress preservation; dated chart; activity increment; toast text safety; recall visibility; microphone denial",
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (errors.length || overflows.length || !returned) process.exitCode = 1;
})();
