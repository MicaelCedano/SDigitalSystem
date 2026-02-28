const cheerio = require('cheerio');

async function testBingSearch(query) {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
    console.log("Fetching Bing:", url);

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    let count = 0;

    $("a.iusc").each((_, el) => {
        try {
            const m = $(el).attr("m");
            if (m) {
                const data = JSON.parse(m);
                if (data.murl) {
                    console.log("Found murl:", data.murl.substring(0, 50) + "...");
                    count++;
                }
            }
        } catch (e) {
            // ignore
        }
    });
    console.log("Total valid images found on Bing:", count);
}

testBingSearch("iPhone 13 Pro Max Sierra Blue official png");
