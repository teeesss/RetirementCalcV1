
import puppeteer from 'puppeteer';

/**
 * Zillow Zestimate Scraper
 * Usage: node scripts/fetch_zestimate.js "123 Main St, City, State ZIP"
 */
async function getZestimate(address) {
    if (!address) {
        console.error('❌ Please provide an address.');
        console.error('Usage: node scripts/fetch_zestimate.js "Address"');
        process.exit(1);
    }

    console.log(`🔍 Searching Zillow for: ${address}...`);

    // Launch browser (Headless: false) to see it working and reduce bot detection chance
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        // Go to Zillow
        await page.goto('https://www.zillow.com', { waitUntil: 'domcontentloaded' });

        // Type address
        const searchInputSelector = 'input[placeholder="Enter an address, neighborhood, city, or ZIP code"]';

        // Sometimes ID is specific, try generic approach or ID if known stable
        // Zillow ID is usually #search-box-input or similar.
        const possibleSelectors = ['#search-box-input', 'input[type="text"]'];

        let foundInput = null;
        for (const selector of possibleSelectors) {
            const el = await page.$(selector);
            if (el) {
                foundInput = selector;
                break;
            }
        }

        if (!foundInput) throw new Error("Could not find search box");

        await page.type(foundInput, address, { delay: 100 }); // Human-like typing
        await page.keyboard.press('Enter');

        // Wait for results
        console.log('⏳ Waiting for results...');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => { });

        // Try to find Zestimate
        // Look for text "Zestimate" and extract value nearby
        // Or specific data-testid
        const result = await page.evaluate(() => {
            // Strategy 1: data-testid
            const el = document.querySelector('[data-testid="zestimate-text"]');
            if (el) return el.innerText;

            // Strategy 2: Look for "$..." text near "Zestimate"
            const spans = Array.from(document.querySelectorAll('span'));
            const zLabel = spans.find(s => s.innerText.includes('Zestimate'));
            if (zLabel && zLabel.nextElementSibling) {
                return zLabel.nextElementSibling.innerText;
            }

            return null;
        });

        if (result) {
            console.log(`✅ Found Zestimate: ${result}`);
        } else {
            console.warn('⚠️ Could not automatically locate Zestimate on this page. Please verify manually.');
        }

        // Keep open briefly so user can see
        await new Promise(r => setTimeout(r, 5000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

// Run
const args = process.argv.slice(2);
getZestimate(args[0]);
