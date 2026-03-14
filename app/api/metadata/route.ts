import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

/**
 * Enhanced Programming Keywords Dictionary
 * Categorized for better detection and future extension
 */
const PROGRAMMING_KEYWORDS = [
  // Languages
  "javascript", "typescript", "python", "rust", "go", "golang", "java", "c++", "cpp", "c#", "csharp",
  "ruby", "php", "swift", "kotlin", "dart", "elixir", "haskell", "lua", "perl", "r", "scala",
  // Frontend
  "react", "vue", "angular", "svelte", "nextjs", "next.js", "nuxt", "solidjs", "qwik", "astro",
  "tailwind", "bootstrap", "sass", "css", "html", "webgl", "threejs", "canvas", "wasm",
  // Backend & Runtime
  "node", "nodejs", "deno", "bun", "express", "fastify", "nestjs", "django", "flask", "fastapi",
  "laravel", "spring boot", "rails", "elixir", "phoenix", "fiber", "gin",
  // Database
  "sql", "postgresql", "postgres", "mysql", "mariadb", "sqlite", "mongodb", "redis", "supabase",
  "firebase", "prisma", "orm", "drizzle", "typeorm", "mongoose", "cassandra", "dynamodb",
  // Infrastructure & DevOps
  "git", "github", "gitlab", "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "vercel",
  "terraform", "ansible", "jenkins", "ci/cd", "devops", "linux", "unix", "bash", "shell",
  "nginx", "apache", "cloudflare", "prometheus", "grafana",
  // AI & ML
  "machine learning", "ml", "ai", "artificial intelligence", "deep learning", "nlp", "llm",
  "pytorch", "tensorflow", "keras", "opencv", "openai", "llama", "stable diffusion",
  // Architecture & Tools
  "api", "rest", "graphql", "websocket", "grpc", "microservices", "serverless", "edge",
  "testing", "jest", "cypress", "playwright", "vitest", "security", "auth", "oauth", "jwt",
  "blockchain", "web3", "solidity", "ethereum", "bitcoin", "smart contracts",
  "algorithms", "data structures", "system design", "architecture", "clean code",
]

function extractKeywordsFromText(text: string): string[] {
  if (!text) return []
  const lowerText = text.toLowerCase()
  
  // Use a regex approach for more precise matching (avoid partial matches like "go" in "good")
  return PROGRAMMING_KEYWORDS.filter(keyword => {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match word boundaries for short keywords
    if (keyword.length <= 3) {
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i')
      return regex.test(lowerText)
    }
    return lowerText.includes(keyword.toLowerCase())
  })
}

function resolveUrl(baseUrl: string, relativeUrl: string | undefined): string | null {
  if (!relativeUrl) return null
  try {
    return new URL(relativeUrl, baseUrl).toString()
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 })
  }

  try {
    let normalizedUrl = url.trim()
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`
    }

    const urlObj = new URL(normalizedUrl)
    const defaultFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    
    // Attempt to fetch the page
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json({
        title: urlObj.hostname,
        description: `Resource from ${urlObj.hostname}`,
        favicon: defaultFavicon,
        domain: urlObj.hostname,
        url: normalizedUrl,
        suggestedTags: [],
        fetchFailed: true,
      })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 1. Improved Title Extraction
    let title = $('meta[property="og:title"]').attr("content") ||
                $('meta[name="twitter:title"]').attr("content") ||
                $("title").first().text() ||
                $("h1").first().text() ||
                urlObj.hostname

    title = title.replace(/\s+/g, " ").trim()

    // 2. Improved Description Extraction
    let description = $('meta[property="og:description"]').attr("content") ||
                      $('meta[name="twitter:description"]').attr("content") ||
                      $('meta[name="description"]').attr("content") ||
                      ""

    // Fallback: try to get the first paragraph if no description meta
    if (!description || description.length < 20) {
      const firstPara = $("p").first().text().trim()
      if (firstPara && firstPara.length > 30) {
        description = firstPara
      }
    }
    
    description = description.replace(/\s+/g, " ").trim()

    // 3. Robust Favicon Extraction
    let favicon: string | null = null
    const iconSelectors = [
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'link[rel="icon"][sizes="32x32"]',
      'link[rel="icon"][type="image/png"]',
      'link[rel="shortcut icon"]',
      'link[rel="icon"]',
    ]

    for (const selector of iconSelectors) {
      const href = $(selector).attr("href")
      if (href) {
        favicon = resolveUrl(normalizedUrl, href)
        if (favicon) break
      }
    }
    favicon = favicon || defaultFavicon

    // 4. Image Extraction
    const image = resolveUrl(normalizedUrl, 
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content")
    )

    // 5. Elite Tag Suggestions
    // Extract from meta keywords and specific article tags
    const metaKeywords = $('meta[name="keywords"]').attr("content") || ""
    const articleTags = $('meta[property="article:tag"]').map((_, el) => $(el).attr("content")).get()
    const jsonLdTags: string[] = []
    
    // Try to extract from JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "{}")
        if (data.keywords) {
          if (Array.isArray(data.keywords)) jsonLdTags.push(...data.keywords)
          else if (typeof data.keywords === 'string') jsonLdTags.push(...data.keywords.split(","))
        }
      } catch {}
    })

    const rawTags = [
      ...metaKeywords.split(","),
      ...articleTags,
      ...jsonLdTags,
      // Detect from actual content (title + description + some body text)
      ...extractKeywordsFromText(`${title} ${description} ${$("h1, h2").text().substring(0, 500)}`)
    ]

    const uniqueTags = [...new Set(
      rawTags
        .map(t => t.trim().toLowerCase())
        .filter(t => t && t.length > 1 && t.length < 30)
    )].slice(0, 8)

    return NextResponse.json({
      title: title.substring(0, 300),
      description: description.substring(0, 500),
      favicon,
      domain: urlObj.hostname,
      url: normalizedUrl,
      image,
      suggestedTags: uniqueTags,
      fetchFailed: false,
    })

  } catch (error) {
    console.error("Metadata extraction error:", error)
    return NextResponse.json({
      title: url,
      description: "Could not fetch metadata automatically.",
      favicon: `https://www.google.com/s2/favicons?domain=${url}&sz=64`,
      domain: "",
      url: url,
      suggestedTags: [],
      fetchFailed: true,
    })
  }
}
