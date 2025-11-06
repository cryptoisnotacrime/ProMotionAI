import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-shopify-shop",
};

interface BrandDNARequest {
  storeId: string;
  websiteUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
}

interface ColorExtraction {
  name: string;
  hex: string;
}

interface BrandDNA {
  brand_logo_url?: string;
  brand_colors: ColorExtraction[];
  brand_fonts: { primary?: string; secondary?: string };
  brand_images: string[];
  brand_tagline?: string;
  brand_values: string[];
  brand_aesthetic: string[];
  brand_tone_of_voice: string[];
  business_overview?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const gcpProjectId = Deno.env.get("GCP_PROJECT_ID");
    const gcpServiceAccountJson = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase config");
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!gcpProjectId || !gcpServiceAccountJson) {
      console.error("Missing GCP credentials");
      return new Response(
        JSON.stringify({
          error: "Google Cloud credentials not configured.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData: BrandDNARequest = await req.json();
    const { storeId, websiteUrl, instagramUrl, tiktokUrl } = requestData;

    console.log("Generating Brand DNA for store:", storeId);

    let websiteContent = "";
    let extractedColors: ColorExtraction[] = [];
    let extractedFonts: string[] = [];
    let logoUrl: string | undefined;
    let websiteImages: string[] = [];
    let instagramImages: string[] = [];

    // Try to fetch Instagram images if Instagram URL provided
    if (instagramUrl) {
      try {
        console.log("Attempting to fetch Instagram images from:", instagramUrl);
        // Extract username from Instagram URL
        const instagramMatch = instagramUrl.match(/instagram\.com\/([^\/\?]+)/);
        if (instagramMatch && instagramMatch[1]) {
          const username = instagramMatch[1].replace('@', '');
          console.log(`Fetching Instagram profile for: ${username}`);

          // Method 1: Try to scrape public Instagram page
          try {
            const instagramResponse = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Accept-Language": "en-US,en;q=0.9",
                "Referer": "https://www.instagram.com/",
                "X-Requested-With": "XMLHttpRequest",
              },
            });

            if (instagramResponse.ok) {
              const data = await instagramResponse.json();

              // Try to extract images from response
              let images: string[] = [];

              // Instagram's structure may vary, try multiple paths
              if (data?.graphql?.user?.edge_owner_to_timeline_media?.edges) {
                images = data.graphql.user.edge_owner_to_timeline_media.edges
                  .slice(0, 12)
                  .map((edge: any) => edge.node?.display_url)
                  .filter(Boolean);
              } else if (data?.items) {
                images = data.items
                  .slice(0, 12)
                  .map((item: any) => item.image_versions2?.candidates?.[0]?.url)
                  .filter(Boolean);
              }

              if (images.length > 0) {
                instagramImages = images;
                console.log(`Successfully fetched ${images.length} Instagram images`);
              } else {
                console.log("Instagram response structure unknown, trying alternate method");
              }
            } else {
              console.log(`Instagram fetch failed with status: ${instagramResponse.status}`);
            }
          } catch (scrapeError) {
            console.error("Instagram scraping error:", scrapeError);

            // Fallback: Try fetching the public profile page and parsing HTML
            try {
              const htmlResponse = await fetch(`https://www.instagram.com/${username}/`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                },
              });

              if (htmlResponse.ok) {
                const html = await htmlResponse.text();

                // Try to extract image URLs from embedded JSON in HTML
                const jsonMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
                if (jsonMatch) {
                  try {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    if (jsonData?.mainEntityofPage?.image) {
                      instagramImages = [jsonData.mainEntityofPage.image];
                      console.log("Extracted profile image from HTML");
                    }
                  } catch {}
                }

                // Try to extract from shared data
                const sharedDataMatch = html.match(/window\._sharedData = (.*?);<\/script>/);
                if (sharedDataMatch && instagramImages.length === 0) {
                  try {
                    const sharedData = JSON.parse(sharedDataMatch[1]);
                    const userMedia = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges;
                    if (userMedia) {
                      instagramImages = userMedia
                        .slice(0, 12)
                        .map((edge: any) => edge.node?.display_url)
                        .filter(Boolean);
                      console.log(`Extracted ${instagramImages.length} images from HTML`);
                    }
                  } catch {}
                }
              }
            } catch (htmlError) {
              console.error("HTML parsing error:", htmlError);
            }
          }
        }
      } catch (error) {
        console.error("Instagram fetch error:", error);
      }
    }

    if (websiteUrl) {
      try {
        console.log("Fetching website:", websiteUrl);
        const websiteResponse = await fetch(websiteUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; BrandDNABot/1.0)",
          },
        });

        if (websiteResponse.ok) {
          const html = await websiteResponse.text();
          websiteContent = html;

          const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
          const metaDescription = metaMatch ? metaMatch[1] : "";

          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          const pageTitle = titleMatch ? titleMatch[1] : "";

          const textContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 3000);

          websiteContent = `Title: ${pageTitle}\n\nDescription: ${metaDescription}\n\nContent: ${textContent}`;

          const colorMatches = html.match(/#[0-9A-Fa-f]{6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g) || [];
          const uniqueColors = [...new Set(colorMatches)];

          const filteredColors = uniqueColors
            .map(color => color.startsWith("#") ? color : rgbToHex(color))
            .filter(hex => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);

              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const saturation = max === 0 ? 0 : (max - min) / max;

              return luminance < 0.9 && luminance > 0.1 && saturation > 0.2;
            });

          extractedColors = filteredColors.slice(0, 4).map((hex, i) => ({
            name: `Color ${i + 1}`,
            hex,
          }));

          const fontMatches = html.match(/font-family\s*:\s*([^;}"']+)/gi) || [];
          const fonts = fontMatches
            .map(f => f.replace(/font-family\s*:\s*/i, "").trim().split(",")[0].replace(/["']/g, ""))
            .filter(f => !f.includes("inherit") && !f.includes("initial") && f.length > 0);
          extractedFonts = [...new Set(fonts)].slice(0, 2);

          const logoMatch = html.match(/<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
            html.match(/<img[^>]*src=["']([^"']*logo[^"']+)["']/i) ||
            html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i);

          if (logoMatch && logoMatch[1]) {
            logoUrl = logoMatch[1].startsWith("http")
              ? logoMatch[1]
              : new URL(logoMatch[1], websiteUrl).href;
          }

          const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
          websiteImages = imgMatches
            .slice(0, 10)
            .map(img => {
              const srcMatch = img.match(/src=["']([^"']+)["']/i);
              if (srcMatch) {
                const src = srcMatch[1];
                return src.startsWith("http") ? src : new URL(src, websiteUrl).href;
              }
              return "";
            })
            .filter(url => url.length > 0 && !url.includes("data:image"));

          console.log("Extracted from website:", {
            colors: extractedColors.length,
            fonts: extractedFonts.length,
            images: websiteImages.length,
            hasLogo: !!logoUrl,
          });
        }
      } catch (error) {
        console.error("Failed to fetch website:", error);
      }
    }

    console.log("Analyzing brand with Gemini AI...");

    const serviceAccount = JSON.parse(gcpServiceAccountJson);
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;

    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const jwtClaimSet = btoa(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        exp: expiry,
        iat: now,
      })
    );

    const jwtSignatureInput = `${jwtHeader}.${jwtClaimSet}`;
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBuffer(serviceAccount.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(jwtSignatureInput)
    );
    const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const jwt = `${jwtSignatureInput}.${jwtSignature}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const { access_token } = await tokenResponse.json();

    const analysisPrompt = `Analyze this brand and extract their brand DNA.

Website Content:
${websiteContent}

Instagram URL: ${instagramUrl || "Not provided"}
TikTok URL: ${tiktokUrl || "Not provided"}

Based on this information, provide a JSON response with:
{
  "tagline": "A short, punchy brand tagline (10-15 words max)",
  "brand_values": ["value1", "value2", "value3", "value4"] (4-6 core values),
  "brand_aesthetic": ["aesthetic1", "aesthetic2", "aesthetic3"] (3-6 aesthetic keywords like "modern", "playful", "luxurious"),
  "tone_of_voice": ["tone1", "tone2", "tone3"] (3-5 tone descriptors like "friendly", "professional", "bold"),
  "business_overview": "A 2-3 sentence overview of what the business does and who they serve"
}

Respond ONLY with valid JSON, no other text.`;

    const geminiResponse = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${gcpProjectId}/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: analysisPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiAnalysis = geminiData.candidates[0].content.parts[0].text;

    console.log("AI Analysis:", aiAnalysis);

    let parsedAnalysis;
    try {
      const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);
      parsedAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : aiAnalysis);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      parsedAnalysis = {
        tagline: "Quality products for discerning customers",
        brand_values: ["Quality", "Innovation", "Customer-focused", "Sustainability"],
        brand_aesthetic: ["modern", "clean", "professional"],
        tone_of_voice: ["friendly", "confident", "helpful"],
        business_overview: "A quality-focused business dedicated to serving customers with innovative products and exceptional service.",
      };
    }

    const brandDNA: BrandDNA = {
      brand_logo_url: logoUrl,
      brand_colors: extractedColors.length > 0 ? extractedColors : [
        { name: "Primary", hex: "#2563eb" },
        { name: "Secondary", hex: "#10b981" },
        { name: "Accent", hex: "#f59e0b" },
      ],
      brand_fonts: {
        primary: extractedFonts[0] || "Inter",
        secondary: extractedFonts[1] || "Georgia",
      },
      // Prefer Instagram images if available, otherwise use website images
      brand_images: instagramImages.length > 0 ? instagramImages.slice(0, 12) : websiteImages.slice(0, 12),
      brand_tagline: parsedAnalysis.tagline,
      brand_values: parsedAnalysis.brand_values || [],
      brand_aesthetic: parsedAnalysis.brand_aesthetic || [],
      brand_tone_of_voice: parsedAnalysis.tone_of_voice || [],
      business_overview: parsedAnalysis.business_overview,
    };

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        ...brandDNA,
        onboarding_completed: true,
        brand_dna_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (updateError) {
      throw new Error(`Failed to save brand DNA: ${updateError.message}`);
    }

    console.log("Brand DNA generated and saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        brandDNA,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating brand DNA:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate brand DNA",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "#000000";
  const r = parseInt(match[0]).toString(16).padStart(2, "0");
  const g = parseInt(match[1]).toString(16).padStart(2, "0");
  const b = parseInt(match[2]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}