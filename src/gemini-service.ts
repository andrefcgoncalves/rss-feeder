import {GoogleGenerativeAI} from "@google/generative-ai";
import {defineSecret} from "firebase-functions/params";
import {logger} from "firebase-functions";
import {GeminiParseResponse} from "./types";

// Define the secret for Gemini API key
export const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Service class for interacting with the Gemini API
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  /**
   * Parse a URL using Gemini API to extract title and description
   * @param url The URL to parse
   * @returns Promise with parsed title and description
   */
  async parseUrl(url: string): Promise<GeminiParseResponse> {
    try {
      logger.info(`Parsing URL with Gemini: ${url}`);

      const prompt = `
Please analyze the content at this URL and provide a JSON response with the following structure:
{
  "title": "A concise, human-readable title for this content",
  "description": "A brief summary of the content (maximum 160 characters)"
}

Requirements:
- The title should be the HTML title tag, or any other that that seem it's the actual article title, if available. If not create an informative and engaging title
- The description should be a concise summary that captures the essence of the content
- Keep the description under 160 characters for RSS compatibility
- Return ONLY the JSON object, no additional text or formatting

URL to analyze: ${url}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info(`Gemini raw response: ${text}`);

      // Try to parse the JSON response
      let parsedResponse: GeminiParseResponse;
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }

        parsedResponse = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        if (!parsedResponse.title || !parsedResponse.description) {
          throw new Error("Invalid response structure");
        }

        // Ensure description is within character limit
        if (parsedResponse.description.length > 160) {
          parsedResponse.description = parsedResponse.description.substring(0, 157) + "...";
        }

      } catch (parseError) {
        logger.error("Failed to parse Gemini response as JSON", {parseError, rawResponse: text});
        
        // Fallback: try to extract meaningful content from the text
        parsedResponse = {
          title: this.extractFallbackTitle(url, text),
          description: this.extractFallbackDescription(text),
        };
      }

      logger.info(`Parsed content:`, parsedResponse);
      return parsedResponse;

    } catch (error) {
      logger.error("Error calling Gemini API", {error, url});
      
      // Return fallback response
      return {
        title: this.generateFallbackTitle(url),
        description: `Content from ${new URL(url).hostname}`,
      };
    }
  }

  /**
   * Generate a fallback title from URL when Gemini fails
   */
  private generateFallbackTitle(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      const pathname = urlObj.pathname.replace(/^\/|\/$/g, "");
      
      if (pathname) {
        const segments = pathname.split("/");
        const lastSegment = segments[segments.length - 1];
        const title = lastSegment.replace(/[-_]/g, " ").replace(/\.[^.]*$/, "");
        return `${title.charAt(0).toUpperCase() + title.slice(1)} - ${hostname}`;
      }
      
      return `Content from ${hostname}`;
    } catch {
      return "RSS Feed Item";
    }
  }

  /**
   * Extract a fallback title from Gemini response text
   */
  private extractFallbackTitle(url: string, text: string): string {
    // Try to find title-like content in the response
    const titlePattern = /title["\s:]+([^"\n]+)/i;
    const match = text.match(titlePattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return this.generateFallbackTitle(url);
  }

  /**
   * Extract a fallback description from Gemini response text
   */
  private extractFallbackDescription(text: string): string {
    // Try to find description-like content
    const descPattern = /description["\s:]+([^"\n]+)/i;
    const match = text.match(descPattern);
    
    if (match && match[1]) {
      let desc = match[1].trim();
      if (desc.length > 160) {
        desc = desc.substring(0, 157) + "...";
      }
      return desc;
    }
    
    // If no description found, use a generic one
    return "Content parsed via RSS feed generator";
  }
}