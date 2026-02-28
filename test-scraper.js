const cheerio = require('cheerio');

async function testSearch(query) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&gbv=1`;
    console.log("Fetching:", url);

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
    });

    const html = await response.text();
    // console.log("HTML length:", html.length);
    const $ = cheerio.load(html);
    let count = 0;

    $("img").each((_, el) => {
        const src = $(el).attr("src");
        // console.log("Found img src:", src ? src.substring(0, 50) + "..." : "null");
        if (src && src.startsWith("http")) {
            console.log("VALID HTTP IMAGE:", src);
            count++;
        }
    });
    console.log("Total valid images found:", count);
}

testSearch("iPhone 13 Pro Max Sierra Blue official png");
