import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

// Programming keywords for auto-tagging
const PROGRAMMING_KEYWORDS = [
  "javascript", "typescript", "python", "rust", "go", "golang", "java", "c++", "c#",
  "ruby", "php", "swift", "kotlin", "sql", "postgresql", "mysql", "mongodb", "redis",
  "react", "vue", "angular", "svelte", "nextjs", "next.js", "node", "nodejs", "deno", "bun",
  "git", "github", "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "vercel",
  "api", "rest", "graphql", "websocket", "http", "css", "html", "tailwind",
  "machine learning", "ml", "ai", "artificial intelligence", "deep learning",
  "frontend", "backend", "fullstack", "devops", "linux", "unix", "bash", "shell",
  "algorithm", "data structure", "database", "testing", "security", "authentication",
  "blockchain", "web3", "crypto", "nft", "solidity", "ethereum",
]

function extractKeywordsFromText(text: string): string[] {
  if (!text) return []
  const lowerText = text.toLowerCase()
  return PROGRAMMING_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 })
  }

  try {
    // Normalize URL
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const urlObj = new URL(normalizedUrl)
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    
    // Realistic browser headers
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    })

    if (!response.ok) {
      console.log("[v0] Fetch failed with status:", response.status)
      return NextResponse.json({
        title: urlObj.hostname,
        description: "",
        favicon: defaultFavicon,
        domain: urlObj.hostname,
        url: normalizedUrl,
        suggestedTags: [],
        fetchFailed: true,
      })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract title - comprehensive approach
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim()
    const twitterTitle = $('meta[name="twitter:title"]').attr("content")?.trim()
    const htmlTitle = $("title").first().text()?.trim()
    const h1Title = $("h1").first().text()?.trim()
    
    let title = ogTitle || twitterTitle || htmlTitle || h1Title || urlObj.hostname
    // Clean up title
    title = title.replace(/\s+/g, " ").trim()

    // Extract description - comprehensive approach
    const ogDescription = $('meta[property="og:description"]').attr("content")?.trim()
    const twitterDescription = $('meta[name="twitter:description"]').attr("content")?.trim()
    const metaDescription = $('meta[name="description"]').attr("content")?.trim()
    
    let description = ogDescription || twitterDescription || metaDescription || ""
    description = description.replace(/\s+/g, " ").trim()

    // Extract favicon - multiple sources
    let favicon = defaultFavicon
    const iconSelectors = [
      'link[rel="icon"][type="image/png"]',
      'link[rel="icon"][type="image/x-icon"]', 
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
    ]
    
    for (const selector of iconSelectors) {
      const iconHref = $(selector).attr("href")
      if (iconHref) {
        if (iconHref.startsWith("//")) {
          favicon = `https:${iconHref}`
        } else if (iconHref.startsWith("/")) {
          favicon = `${urlObj.origin}${iconHref}`
        } else if (iconHref.startsWith("http")) {
          favicon = iconHref
        } else {
          favicon = `${urlObj.origin}/${iconHref}`
        }
        break
      }
    }

    // Extract og:image
    const ogImage = $('meta[property="og:image"]').attr("content") ||
                    $('meta[name="twitter:image"]').attr("content") ||
                    $('meta[name="twitter:image:src"]').attr("content")

    // Extract tags from meta tags
    const metaKeywords = $('meta[name="keywords"]').attr("content") || ""
    const articleTags = $('meta[property="article:tag"]').map((_, el) => $(el).attr("content")).get()
    const newsKeywords = $('meta[name="news_keywords"]').attr("content") || ""
    
    // Combine meta tags
    const metaTags = [
      ...metaKeywords.split(",").map((t: string) => t.trim().toLowerCase()),
      ...articleTags.map((t: string) => t.trim().toLowerCase()),
      ...newsKeywords.split(",").map((t: string) => t.trim().toLowerCase()),
    ].filter((t: string) => t && t.length > 1 && t.length < 50)

    // Extract programming keywords from title and description (Ego Logic)
    const contentKeywords = extractKeywordsFromText(`${title} ${description}`)
    
    // Combine all tags
    const allTags = [...new Set([...metaTags, ...contentKeywords])]
      .filter((t: string) => t && t.length > 1)
      .slice(0, 10)

    return NextResponse.json({
      title: title.substring(0, 500),
      description: description.substring(0, 1000),
      favicon,
      domain: urlObj.hostname,
      url: normalizedUrl,
      image: ogImage || null,
      suggestedTags: allTags,
      fetchFailed: false,
    })
  } catch (error) {
    console.log("[v0] Metadata error:", error instanceof Error ? error.message : error)
    
    // Return minimal data allowing manual edit
    try {
      let normalizedUrl = url.trim()
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = `https://${normalizedUrl}`
      }
      const urlObj = new URL(normalizedUrl)
      return NextResponse.json({
        title: urlObj.hostname,
        description: "",
        favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`,
        domain: urlObj.hostname,
        url: normalizedUrl,
        suggestedTags: [],
        fetchFailed: true,
      })
    } catch {
      return NextResponse.json({
        title: url,
        description: "",
        favicon: "",
        domain: "",
        url: url,
        suggestedTags: [],
        fetchFailed: true,
      })
    }
  }
}
