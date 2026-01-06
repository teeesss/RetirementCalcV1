
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors()); // Allow React app (localhost:3000) to call us
app.use(express.json());

// Scraper Endpoint
app.get('/api/zestimate', async (req, res) => {
    const { address } = req.query;
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    console.log(`🔍 Received Request: Scrape Zillow for "${address}"`);

    let browser;
    try {
        // Launch Browser (Visible so it looks "cool" and avoids some bot detection)
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        const page = await browser.newPage();

        // Go for it
        await page.goto('https://www.zillow.com', { waitUntil: 'domcontentloaded' });

        // Enter Address
        const searchSelectors = ['#search-box-input', 'input[placeholder*="Enter an address"]', 'input[type="text"]'];
        let inputFound = false;

        for (const sel of searchSelectors) {
            if (await page.$(sel)) {
                await page.click(sel); // Focus
                await page.type(sel, address, { delay: 50 });
                await page.keyboard.press('Enter');
                inputFound = true;
                break;
            }
        }

        if (!inputFound) throw new Error("Could not populate search box.");

        // Wait for results
        console.log("⏳ Waiting for page load (Please solve any CAPTCHA manually!)...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => console.log("Nav timeout (handling...)"));

        // Extract Zestimate
        const zestimate = await page.evaluate(() => {
            // Strategy 1: Data ID (Most reliable if present)
            const testIdEl = document.querySelector('[data-testid="zestimate-text"]');
            if (testIdEl) return testIdEl.innerText;

            // Strategy 2: "Zestimate" Label Search
            // properties often have a row: "Zestimate: $123,456"
            const allText = document.body.innerText;
            const zMatch = allText.match(/Zestimate®?[:\s]+(\$[0-9,]+)/i);
            if (zMatch) return zMatch[1];

            // Strategy 3: Main Price (If Zestimate missing, use listing price)
            const priceEl = document.querySelector('[data-testid="price"]');
            if (priceEl) return priceEl.innerText;

            // Strategy 4: Fallback to any large price at top
            const h2s = Array.from(document.querySelectorAll('h2, span[class*="Text"]'));
            const priceLike = h2s.find(el => /^\$[0-9,]+$/.test(el.innerText) && parseInt(el.innerText.replace(/\D/g, '')) > 50000);
            if (priceLike) return priceLike.innerText;

            return null;
        });

        if (!zestimate) {
            throw new Error("Zestimate not found on resulting page.");
        }

        console.log(`✅ Success: ${zestimate}`);
        res.json({ success: true, value: zestimate });

        // Close after a brief delay
        setTimeout(() => browser.close(), 5000);

    } catch (error) {
        console.error("❌ Scraping Failed:", error.message);
        res.status(500).json({ error: error.message || 'Scraping failed' });
        if (browser) browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`🤖 Zillow Scraper Server running on http://localhost:${PORT}`);
    console.log(`   (Keep this terminal open for the 'Real Estate' button to work)`);
});
