module.exports = async (req, res) => {
  const shopifyDomain = "job4u.privatejobsdelhi.com";
  const proxyHost = req.headers.host;

  // ─── BLOCK URL SUBMISSION PAGE ────────────────────────────────────────────
  if (req.url.includes("/pages/url-submission-page")) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Page Not Found</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #667eea;">404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/" style="color: #667eea; text-decoration: none; font-weight: bold;">Go to Homepage</a>
      </body>
      </html>
    `);
    return;
  }

  const targetURL = `https://${shopifyDomain}${req.url}`;

  try {
    let bodyBuffer = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      bodyBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });
    }

    let fetchURL = targetURL;
    let response;
    let redirectCount = 0;

    while (redirectCount < 5) {
      response = await fetch(fetchURL, {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(fetchURL).hostname,
          "X-Forwarded-Host": proxyHost,
          "X-Forwarded-Proto": "https",
        },
        body: bodyBuffer || null,
        redirect: "manual",
      });

      if (response.status >= 300 && response.status < 400) {
        let location = response.headers.get("location") || "";

        if (location.includes(shopifyDomain)) {
          location = location
            .replace(`https://${shopifyDomain}`, `https://${proxyHost}`)
            .replace(`http://${shopifyDomain}`, `https://${proxyHost}`);
          res.setHeader("location", location);
          res.status(response.status).end();
          return;
        }

        if (location.includes(proxyHost)) {
          res.setHeader("location", location);
          res.status(response.status).end();
          return;
        }

        fetchURL = location.startsWith("http") ? location : `https://${shopifyDomain}${location}`;
        redirectCount++;
        continue;
      }

      break;
    }

    const skipHeaders = ["content-encoding", "transfer-encoding", "content-length"];
    response.headers.forEach((value, key) => {
      if (skipHeaders.includes(key)) return;
      if (key === "set-cookie") {
        value = value.replace(/Domain=[^;]+;?/gi, "");
      }
      res.setHeader(key, value);
    });

    const contentType = response.headers.get("content-type") || "";

    const rewriteText = (body) =>
      body
        .split(`https://${shopifyDomain}`).join(`https://${proxyHost}`)
        .split(`http://${shopifyDomain}`).join(`https://${proxyHost}`)
        .split("Job4u").join("JobFounder")
        .split("job4u").join("jobfounder")
        .split("privatejobsdelhi.com").join("jobfounder.com");

    // ─── COMPANIES LIST ────────────────────────────────────────────────────────
    const COMPANIES = [
      "Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Tesla",
      "Infosys", "TCS", "Wipro", "HCL", "Accenture", "Deloitte", "PwC",
      "KPMG", "EY", "McKinsey", "Boston Consulting Group", "IBM", "Oracle",
      "SAP", "Salesforce", "Adobe", "Cisco", "Dell", "HP", "Intel", "AMD",
      "Qualcomm", "NVIDIA", "Samsung", "Sony", "LG", "Panasonic", "Toshiba",
      "Toyota", "Honda", "Nissan", "BMW", "Mercedes-Benz", "Ford", "General Motors",
      "Volkswagen", "Audi", "Porsche", "Ferrari", "Lamborghini", "Rolls-Royce",
      "Boeing", "Airbus", "Lockheed Martin", "Northrop Grumman", "Raytheon",
      "SpaceX", "Blue Origin", "Virgin Galactic", "Uber", "Lyft", "Airbnb",
      "Spotify", "Pinterest", "Snapchat", "TikTok", "Twitter", "LinkedIn",
      "PayPal", "Square", "Stripe", "Robinhood", "Coinbase", "Blockchain",
      "Disney", "Warner Bros", "Universal", "Paramount", "Sony Pictures",
      "Amazon Studios", "Netflix Studios", "HBO", "Showtime", "Hulu",
      "Zoom", "Slack", "Teams", "Discord", "Telegram", "WhatsApp",
      "Shopify", "SquareSpace", "Wix", "WordPress", "Webflow", "Figma",
      "Canva", "Adobe Creative Cloud", "Sketch", "InVision", "ProtoPie"
    ];

    // ─── REMOVE DISCLAIMER ───────────────────────────────────────────────────
    function removeDisclaimer(body) {
      body = body.replace(/DISCLAIMER[\s\S]*?Welcome to Job4u\.[^<]*?\.com\.[\s\S]*?jobpostingcustomercare@gmail\.com\./gi, "");
      body = body.replace(/<div[^>]*class="[^"]*disclaimer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<section[^>]*class="[^"]*disclaimer[^"]*"[^>]*>[\s\S]*?<\/section>/gi, "");
      body = body.replace(/<footer[^>]*>[\s\S]*?Disclaimer[\s\S]*?<\/footer>/gi, "");
      body = body.replace(/Disclaimer.*?(?=<|$)/gi, "");
      body = body.replace(/jobpostingcustomercare@gmail\.com/gi, "");
      return body;
    }

    // ─── BLOCK GOOGLE ADS ────────────────────────────────────────────────────
    function blockAds(body) {
      body = body.replace(/ca-pub-5953224202278307/g, "");
      body = body.replace(/<ins[^>]*data-ad-client="ca-pub-5953224202278307"[^>]*>[\s\S]*?<\/ins>/gi, "");
      body = body.replace(/<script[^>]*>.*?ca-pub-5953224202278307.*?<\/script>/gi, "");
      body = body.replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<div[^>]*id="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<div[^>]*class="[^"]*ads[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<div[^>]*class="[^"]*adsense[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<iframe[^>]*src="[^"]*googleadservices[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi, "");
      body = body.replace(/<iframe[^>]*src="[^"]*pagead2[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi, "");
      body = body.replace(/<a[^>]*href="https:\/\/pagead2\.googlesyndication\.com[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "");
      body = body.replace(/<script[^>]*src="[^"]*pagead2\.googlesyndication\.com[^"]*"[^>]*>[\s\S]*?<\/script>/gi, "");
      return body;
    }

    // ─── REMOVE "Other Jobs To Apply" ───────────────────────────────────────
    function removeOtherJobsToApply(body) {
      body = body.replace(/Other Jobs To Apply/gi, "");
      body = body.replace(/<h[1-6][^>]*>[\s]*Other Jobs To Apply[\s]*<\/h[1-6]>/gi, "");
      body = body.replace(/<div[^>]*class="[^"]*"[^>]*>[\s\S]*?Other Jobs To Apply[\s\S]*?<\/div>/gi, "");
      body = body.replace(/<section[^>]*class="[^"]*"[^>]*>[\s\S]*?Other Jobs To Apply[\s\S]*?<\/section>/gi, "");
      body = body.replace(/Other[\s]*Jobs[\s]*To[\s]*Apply/gi, "");
      return body;
    }

    // ─── REMOVE SHARE SYMBOLS ──────────────────────────────────────────────
    function removeShareSymbols(body) {
      // Remove share containers
      body = body.replace(/<[^>]*class="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*social[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*twitter[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*facebook[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*linkedin[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*pinterest[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*whatsapp[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*class="[^"]*telegram[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      body = body.replace(/<[^>]*id="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
      
      // Remove share text
      body = body.replace(/Share/gi, "");
      body = body.replace(/Share[\s]*this/gi, "");
      body = body.replace(/Share[\s]*job/gi, "");
      body = body.replace(/Share[\s]*post/gi, "");
      
      // Remove SVG icons for sharing
      body = body.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, (match) => {
        if (match.includes("share") || match.includes("twitter") || match.includes("facebook") || 
            match.includes("linkedin") || match.includes("social") || match.includes("icon") ||
            match.includes("pinterest") || match.includes("whatsapp") || match.includes("telegram")) {
          return "";
        }
        return match;
      });
      
      // Remove share buttons/links
      body = body.replace(/<a[^>]*href="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "");
      body = body.replace(/<button[^>]*class="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/button>/gi, "");
      
      // Remove icon fonts for social media
      body = body.replace(/<i[^>]*class="[^"]*fa-[^"]*share[^"]*"[^>]*>[\s\S]*?<\/i>/gi, "");
      body = body.replace(/<i[^>]*class="[^"]*fa-[^"]*twitter[^"]*"[^>]*>[\s\S]*?<\/i>/gi, "");
      body = body.replace(/<i[^>]*class="[^"]*fa-[^"]*facebook[^"]*"[^>]*>[\s\S]*?<\/i>/gi, "");
      body = body.replace(/<i[^>]*class="[^"]*fa-[^"]*linkedin[^"]*"[^>]*>[\s\S]*?<\/i>/gi, "");
      
      return body;
    }

    // ─── REMOVE "Close Copy link" ──────────────────────────────────────────
    function removeCloseCopyLink(body) {
      body = body.replace(/Close Copy link/gi, "");
      body = body.replace(/Close[\s]*Copy[\s]*link/gi, "");
      body = body.replace(/<[^>]*>[\s]*Close Copy link[\s]*<\/[^>]*>/gi, "");
      body = body.replace(/Copy link/gi, "");
      body = body.replace(/<[^>]*>[\s]*Copy link[\s]*<\/[^>]*>/gi, "");
      body = body.replace(/Copy[\s]*link/gi, "");
      body = body.replace(/Close/gi, (match) => {
        // Only remove "Close" when it's part of "Close Copy link" context
        return match;
      });
      return body;
    }

    // ─── REMOVE "Back to blog" ─────────────────────────────────────────────
    function removeBackToBlog(body) {
      body = body.replace(/Back to blog/gi, "");
      body = body.replace(/Back[\s]*to[\s]*blog/gi, "");
      body = body.replace(/<[^>]*>[\s]*Back to blog[\s]*<\/[^>]*>/gi, "");
      body = body.replace(/<a[^>]*href="[^"]*blog[^"]*"[^>]*>[\s]*Back to blog[\s]*<\/a>/gi, "");
      body = body.replace(/<a[^>]*>[\s]*Back to blog[\s]*<\/a>/gi, "");
      return body;
    }

    // ─── HTML rewrite ──────────────────────────────────────────────────────
    if (contentType.includes("text/html")) {
      let body = rewriteText(await response.text());

      // Remove disclaimer
      body = removeDisclaimer(body);
      
      // Block ads
      body = blockAds(body);
      
      // Remove "Other Jobs To Apply"
      body = removeOtherJobsToApply(body);
      
      // Remove share symbols
      body = removeShareSymbols(body);
      
      // Remove "Close Copy link"
      body = removeCloseCopyLink(body);
      
      // Remove "Back to blog"
      body = removeBackToBlog(body);

      // ─── COMPLETE HOMEPAGE REDESIGN ─────────────────────────────────────
      if (req.url === "/" || req.url === "") {
        // Extract content for dynamic sections
        const extractContent = () => {
          const titleMatch = body.match(/<title>([^<]*)<\/title>/i);
          const title = titleMatch ? titleMatch[1] : "Job Portal";
          
          let mainContent = "";
          const mainMatch = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
          if (mainMatch) {
            mainContent = mainMatch[1];
          } else {
            const contentMatch = body.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            if (contentMatch) mainContent = contentMatch[1];
          }
          
          let jobListings = "";
          const jobMatch = body.match(/<div[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
          if (jobMatch) {
            jobListings = jobMatch.join("");
          }
          
          let blogPosts = "";
          const blogMatch = body.match(/<article[^>]*>([\s\S]*?)<\/article>/gi);
          if (blogMatch) {
            blogPosts = blogMatch.join("");
          }
          
          return { title, mainContent, jobListings, blogPosts };
        };

        const content = extractContent();

        // Generate company chips
        const companyChips = COMPANIES.slice(0, 30).map(c => 
          `<a href="/company/${encodeURIComponent(c)}" class="company-chip">${c}</a>`
        ).join('');

        body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title} - Find Your Dream Career | JobFounder</title>
  <meta name="google-site-verification" content="C8QwBCGZKs-FSw52IOS7PTs6asCSlNJUXxU-NC482e0" />
  <meta name="google-site-verification" content="XrH9c03tsqCVBwOX4DzHrmE5fqKcvaidkRTE3cD1A2g" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f0f4f8;
      color: #1a202c;
      line-height: 1.6;
    }
    
    /* ── HEADER ────────────────────────────────────────────────────────── */
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 18px 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .logo span { color: #e94560; }
    .nav-links {
      display: flex;
      gap: 25px;
      align-items: center;
      flex-wrap: wrap;
    }
    .nav-links a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
      font-size: 0.95rem;
    }
    .nav-links a:hover { color: #e94560; }
    .nav-links .btn-nav {
      background: #e94560;
      padding: 8px 20px;
      border-radius: 25px;
      color: white;
    }
    .nav-links .btn-nav:hover { background: #c73652; color: white; }
    
    /* ── HERO ────────────────────────────────────────────────────────────── */
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 80px 0 60px;
      text-align: center;
      border-bottom: 4px solid #e94560;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 900;
      margin-bottom: 15px;
      letter-spacing: -1px;
    }
    .hero h1 .highlight { color: #e94560; }
    .hero p {
      font-size: 1.2rem;
      max-width: 650px;
      margin: 0 auto 30px;
      opacity: 0.9;
    }
    .hero-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-primary {
      background: #e94560;
      color: white;
      padding: 14px 40px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 1.1rem;
      text-decoration: none;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
      display: inline-block;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.4);
      background: #c73652;
    }
    .btn-secondary {
      background: transparent;
      color: white;
      padding: 14px 40px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 1.1rem;
      text-decoration: none;
      border: 2px solid rgba(255,255,255,0.3);
      transition: all 0.3s;
      display: inline-block;
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-2px);
    }
    
    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 50px;
      flex-wrap: wrap;
      margin-top: 40px;
    }
    .stat-item { text-align: center; }
    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #e94560;
    }
    .stat-label { font-size: 0.9rem; opacity: 0.8; }
    
    /* ── SEARCH ───────────────────────────────────────────────────────────── */
    .search-section {
      background: white;
      padding: 30px 0;
      border-bottom: 1px solid #e8ecf0;
    }
    .search-box {
      display: flex;
      max-width: 700px;
      margin: 0 auto;
      background: #f8f9fa;
      border-radius: 50px;
      overflow: hidden;
      border: 2px solid #e8ecf0;
      transition: border-color 0.3s;
    }
    .search-box:focus-within { border-color: #e94560; }
    .search-box input {
      flex: 1;
      padding: 16px 25px;
      border: none;
      outline: none;
      font-size: 1rem;
      background: transparent;
    }
    .search-box button {
      padding: 16px 35px;
      background: #e94560;
      border: none;
      color: white;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.3s;
      font-size: 1rem;
    }
    .search-box button:hover { background: #c73652; }
    
    /* ── FEATURED JOBS ───────────────────────────────────────────────────── */
    .featured-section {
      background: white;
      border-radius: 16px;
      padding: 40px;
      margin: 40px 0;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    .section-header h2 {
      font-size: 1.6rem;
      color: #1a1a2e;
      border-left: 4px solid #e94560;
      padding-left: 12px;
    }
    .section-header a {
      color: #e94560;
      font-weight: 600;
      text-decoration: none;
    }
    .section-header a:hover { text-decoration: underline; }
    
    .job-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .job-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 22px;
      transition: all 0.3s;
      border-left: 4px solid #e94560;
      cursor: pointer;
    }
    .job-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.1);
      background: white;
    }
    .job-card .company-tag {
      font-size: 0.78rem;
      background: #e94560;
      color: white;
      padding: 3px 12px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .job-card h3 {
      font-size: 1.05rem;
      margin-bottom: 8px;
      color: #1a1a2e;
    }
    .job-card .company-name {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }
    .job-card .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.82rem;
    }
    .job-card .meta .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 600;
    }
    .job-card .meta .remote { background: #d4edda; color: #155724; }
    .job-card .meta .onsite { background: #d1ecf1; color: #0c5460; }
    .job-card .meta .salary { color: #28a745; font-weight: 700; }
    .job-card .meta .location { color: #666; }
    
    /* ── COMPANIES ────────────────────────────────────────────────────────── */
    .company-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 30px;
    }
    .company-chip {
      background: white;
      border: 1px solid #e94560;
      color: #e94560;
      padding: 8px 18px;
      border-radius: 25px;
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.2s;
      display: inline-block;
    }
    .company-chip:hover {
      background: #e94560;
      color: white;
      transform: translateY(-2px);
    }
    
    /* ── CTA BANNER ──────────────────────────────────────────────────────── */
    .cta-banner {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 16px;
      padding: 50px 30px;
      text-align: center;
      color: white;
      margin-top: 20px;
    }
    .cta-banner h3 { font-size: 2rem; margin-bottom: 10px; }
    .cta-banner h3 span { color: #e94560; }
    .cta-banner p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 20px; }
    .btn-cta {
      background: #e94560;
      color: white;
      padding: 14px 45px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 1.1rem;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s;
    }
    .btn-cta:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.4);
    }
    
    /* ── FOOTER ───────────────────────────────────────────────────────────── */
    .footer {
      background: #1a1a2e;
      color: rgba(255,255,255,0.7);
      padding: 40px 0;
      margin-top: 40px;
      border-top: 4px solid #e94560;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
    }
    .footer h4 {
      color: white;
      margin-bottom: 15px;
    }
    .footer a {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
      transition: color 0.3s;
    }
    .footer a:hover { color: #e94560; }
    .footer-bottom {
      text-align: center;
      padding-top: 30px;
      margin-top: 30px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
    }
    
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .hero-stats { gap: 25px; }
      .stat-number { font-size: 1.4rem; }
      .search-box { flex-direction: column; border-radius: 20px; }
      .search-box button { border-radius: 0 0 20px 20px; }
      .header-content { flex-direction: column; }
      .nav-links { justify-content: center; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container header-content">
      <div class="logo">Job<span>Founder</span></div>
      <nav class="nav-links">
        <a href="/">Home</a>
        <a href="/jobs">Jobs</a>
        <a href="/blogs">Blog</a>
        <a href="/about">About</a>
        <a href="/contact" class="btn-nav">Contact</a>
      </nav>
    </div>
  </header>

  <section class="hero">
    <div class="container">
      <h1>Find Your <span class="highlight">Dream Job</span> Today</h1>
      <p>Discover thousands of opportunities from top companies. Start your career journey with us.</p>
      <div class="hero-buttons">
        <a href="/jobs" class="btn-primary">Browse Jobs →</a>
        <a href="/companies" class="btn-secondary">View Companies</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-number">10K+</span>
          <span class="stat-label">Active Jobs</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">500+</span>
          <span class="stat-label">Companies</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">50K+</span>
          <span class="stat-label">Happy Candidates</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">100%</span>
          <span class="stat-label">Free to Apply</span>
        </div>
      </div>
    </div>
  </section>

  <section class="search-section">
    <div class="container">
      <div class="search-box">
        <input type="text" placeholder="Search jobs, companies, or keywords...">
        <button>Search Jobs</button>
      </div>
    </div>
  </section>

  <div class="container">
    <div class="featured-section">
      <div class="section-header">
        <h2>🔥 Featured Jobs</h2>
        <a href="/jobs">View All →</a>
      </div>
      <div class="job-grid">
        ${content.jobListings || `
          <div class="job-card">
            <span class="company-tag">Google</span>
            <h3>Senior Software Engineer</h3>
            <div class="company-name">Google Inc.</div>
            <div class="meta">
              <span class="badge remote">🏠 Remote</span>
              <span class="badge salary">₹1,20,000 - ₹1,80,000/mo</span>
              <span class="badge location">📍 Bengaluru</span>
            </div>
          </div>
          <div class="job-card">
            <span class="company-tag">Microsoft</span>
            <h3>Product Manager</h3>
            <div class="company-name">Microsoft Corporation</div>
            <div class="meta">
              <span class="badge onsite">🏢 On-site</span>
              <span class="badge salary">₹1,50,000 - ₹2,20,000/mo</span>
              <span class="badge location">📍 Hyderabad</span>
            </div>
          </div>
          <div class="job-card">
            <span class="company-tag">Amazon</span>
            <h3>Data Scientist</h3>
            <div class="company-name">Amazon India</div>
            <div class="meta">
              <span class="badge remote">🏠 Remote</span>
              <span class="badge salary">₹1,00,000 - ₹1,60,000/mo</span>
              <span class="badge location">📍 Remote</span>
            </div>
          </div>
        `}
      </div>
    </div>

    <div class="section-header">
      <h2>🏢 Top Hiring Companies</h2>
      <a href="/companies">View All →</a>
    </div>
    <div class="company-cloud">
      ${companyChips}
    </div>

    <div class="cta-banner">
      <h3>Ready to <span>Start</span> Your Career?</h3>
      <p>Browse thousands of jobs from top companies and apply today!</p>
      <a href="/jobs" class="btn-cta">Explore Jobs →</a>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>JobFounder</h4>
          <p style="color: rgba(255,255,255,0.6);">Your trusted partner in finding the perfect career opportunity.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <a href="/jobs">Browse Jobs</a>
          <a href="/companies">Companies</a>
          <a href="/blogs">Blog</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="/contact">Contact Us</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy-policy">Privacy Policy</a>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 JobFounder. All rights reserved.
      </div>
    </div>
  </footer>
</body>
</html>`;
      }

      // ─── INNER PAGES ─────────────────────────────────────────────────────────
      else {
        const pageTitle = body.match(/<title>([^<]*)<\/title>/i)?.[1] || "Job Details";
        
        // Extract main content
        let mainContent = "";
        const mainMatch = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
        if (mainMatch) {
          mainContent = mainMatch[1];
        } else {
          const contentMatch = body.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (contentMatch) mainContent = contentMatch[1];
        }

        // Remove all unwanted content from mainContent
        mainContent = mainContent.replace(/Other Jobs To Apply/gi, "");
        mainContent = mainContent.replace(/Other[\s]*Jobs[\s]*To[\s]*Apply/gi, "");
        mainContent = mainContent.replace(/Close Copy link/gi, "");
        mainContent = mainContent.replace(/Close[\s]*Copy[\s]*link/gi, "");
        mainContent = mainContent.replace(/Copy link/gi, "");
        mainContent = mainContent.replace(/Copy[\s]*link/gi, "");
        mainContent = mainContent.replace(/Back to blog/gi, "");
        mainContent = mainContent.replace(/Back[\s]*to[\s]*blog/gi, "");
        mainContent = mainContent.replace(/Share/gi, "");
        mainContent = mainContent.replace(/<[^>]*class="[^"]*share[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");
        mainContent = mainContent.replace(/<[^>]*class="[^"]*social[^"]*"[^>]*>[\s\S]*?<\/[^>]*>/gi, "");

        body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | JobFounder</title>
  <meta name="google-site-verification" content="C8QwBCGZKs-FSw52IOS7PTs6asCSlNJUXxU-NC482e0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f0f4f8;
      color: #1a202c;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 15px 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .logo span { color: #e94560; }
    .nav-links {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }
    .nav-links a {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
      font-size: 0.9rem;
    }
    .nav-links a:hover { color: #e94560; }
    
    .breadcrumb {
      background: white;
      padding: 12px 0;
      border-bottom: 1px solid #e8ecf0;
      margin-bottom: 30px;
    }
    .breadcrumb a { color: #e94560; text-decoration: none; }
    .breadcrumb span { color: #666; }
    
    .content-wrapper {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      margin-bottom: 30px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }
    .content-wrapper h1 {
      font-size: 32px;
      color: #1a1a2e;
      margin-bottom: 20px;
    }
    .content-wrapper h2 {
      font-size: 24px;
      color: #2d3748;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .content-wrapper h3 {
      font-size: 20px;
      color: #4a5568;
      margin-top: 20px;
    }
    .content-wrapper p {
      color: #4a5568;
      margin-bottom: 15px;
    }
    .content-wrapper img {
      max-width: 100%;
      border-radius: 10px;
      margin: 20px 0;
    }
    .content-wrapper ul, .content-wrapper ol {
      color: #4a5568;
      margin: 15px 0 15px 25px;
    }
    
    .apply-btn {
      display: inline-block;
      padding: 14px 45px;
      background: #e94560;
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 1rem;
      margin: 20px 0;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
    }
    .apply-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 25px rgba(233, 69, 96, 0.3);
    }
    
    .footer {
      background: #1a1a2e;
      color: rgba(255,255,255,0.7);
      padding: 30px 0;
      margin-top: 40px;
      border-top: 4px solid #e94560;
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    .footer a {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      margin: 0 10px;
      transition: color 0.3s;
    }
    .footer a:hover { color: #e94560; }
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      margin-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
    }
    
    @media (max-width: 768px) {
      .content-wrapper { padding: 20px; }
      .content-wrapper h1 { font-size: 24px; }
      .header-content { flex-direction: column; }
      .nav-links { justify-content: center; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container header-content">
      <div class="logo">Job<span>Founder</span></div>
      <nav class="nav-links">
        <a href="/">Home</a>
        <a href="/jobs">Jobs</a>
        <a href="/blogs">Blog</a>
      </nav>
    </div>
  </header>

  <div class="breadcrumb">
    <div class="container">
      <a href="/">Home</a> / <span>${pageTitle}</span>
    </div>
  </div>

  <div class="container">
    <div class="content-wrapper">
      ${mainContent || '<p>Content not available</p>'}
      <div style="text-align: center; margin-top: 30px; padding-top: 30px; border-top: 2px solid #e8ecf0;">
        <a href="https://ruwmqs-uq.myshopify.com/pages/apply" class="apply-btn" target="_blank">Apply Now →</a>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div>&copy; 2026 JobFounder. All rights reserved.</div>
        <div>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
      <div class="footer-bottom">Helping you find your dream career</div>
    </div>
  </footer>
</body>
</html>`;
      }

      // Update JobPosting schema dates
      body = body.replace(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
        (match, json) => {
          try {
            const schema = JSON.parse(json);
            const update = (obj) => {
              if (!obj || typeof obj !== "object") return obj;
              if (Array.isArray(obj)) return obj.map(update);
              if (obj["@type"] === "JobPosting") {
                obj["datePosted"] = "2026-05-06";
                obj["validThrough"] = "2026-12-31";
              }
              Object.keys(obj).forEach((k) => { obj[k] = update(obj[k]); });
              return obj;
            };
            return `<script type="application/ld+json">${JSON.stringify(update(schema))}</script>`;
          } catch {
            return match;
          }
        }
      );

      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(response.status).send(body);
    }

    // ─── CSS rewrite ──────────────────────────────────────────────────────────
    if (contentType.includes("text/css")) {
      let body = rewriteText(await response.text());
      // Remove ad-related CSS
      body = body.replace(/\.google-ad[\s\S]*?\{[\s\S]*?\}/g, "");
      body = body.replace(/\.ads[\s\S]*?\{[\s\S]*?\}/g, "");
      body = body.replace(/\.ad-container[\s\S]*?\{[\s\S]*?\}/g, "");
      body = body.replace(/\.adsense[\s\S]*?\{[\s\S]*?\}/g, "");
      // Remove share-related CSS
      body = body.replace(/\.share[\s\S]*?\{[\s\S]*?\}/g, "");
      body = body.replace(/\.social[\s\S]*?\{[\s\S]*?\}/g, "");
      res.setHeader("content-type", "text/css");
      return res.status(response.status).send(body);
    }

    // ─── Sitemap & XML rewrite ──────────────────────────────────────────────
    if (req.url.includes("sitemap") || contentType.includes("xml")) {
      const body = rewriteText(await response.text());
      res.setHeader("content-type", "application/xml; charset=utf-8");
      return res.status(response.status).send(body);
    }

    // ─── JS rewrite ──────────────────────────────────────────────────────────
    if (contentType.includes("javascript")) {
      let body = rewriteText(await response.text());
      // Block ad scripts
      body = body.replace(/ca-pub-5953224202278307/g, "");
      body = body.replace(/google_ad_client/g, "blocked_ad_client");
      body = body.replace(/adsbygoogle/g, "blocked_ads");
      body = body.replace(/pagead2\.googlesyndication\.com/g, "blocked.ad.domain");
      // Remove share-related JS
      body = body.replace(/share/g, "blocked_share");
      body = body.replace(/social/g, "blocked_social");
      res.setHeader("content-type", contentType);
      return res.status(response.status).send(body);
    }

    // ─── Binary passthrough ──────────────────────────────────────────────────
    const buffer = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).send("Proxy error: " + error.message);
  }
};
