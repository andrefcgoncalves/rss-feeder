import RSS from "rss";
import {logger} from "firebase-functions";
import {FeedItem} from "./types";

/**
 * Service for generating RSS XML feeds
 */
export class RSSGenerator {
  private config: RSS.FeedOptions;
  private baseUrl: string;

  constructor() {
    this.baseUrl = "https://smartfeed-f3b51.web.app/";
    // Default RSS feed configuration
    this.config = {
      title: "SmartFeed",
      description: "AI-powered RSS feed generated using Gemini API",
      feed_url: "", // Will be set dynamically
      site_url: this.baseUrl, // Will be set dynamically
      managingEditor: process.env.RSS_MANAGING_EDITOR || "rss@example.com",
      webMaster: process.env.RSS_WEBMASTER || "webmaster@example.com",
      copyright: `${new Date().getFullYear()} SmartFeed`,
      language: "en",
      categories: ["Technology", "AI", "RSS"],
      pubDate: new Date(),
      ttl: 15, // Cache for 15 minutes
      image_url: `${this.baseUrl}favicon.png`,
      custom_namespaces: {
        'atom': 'http://www.w3.org/2005/Atom'
      }
    };
  }

  /**
   * Generate RSS XML from feed items
   * @param feedItems Array of feed items to include in the RSS
   * @param feedUrl Public URL where the feed will be accessible
   * @returns RSS XML string
   */
  generateRSSXML(feedItems: FeedItem[], feedUrl: string): string {
    try {
      logger.info(`Generating RSS XML for ${feedItems.length} items`);

      // Update dynamic URLs
      this.config.feed_url = feedUrl;

      // Create RSS feed
      const feed = new RSS(this.config);

      // Add each feed item to the RSS
      feedItems.forEach((item) => {
        feed.item({
          title: item.title,
          description: item.description,
          url: item.url,
          guid: item.id,
          date: item.pubDate.toDate(),
        });
      });

      const xmlString = feed.xml({indent: true});
      logger.info("RSS XML generated successfully");
      
      return xmlString;

    } catch (error) {
      logger.error("Error generating RSS XML", {error});
      throw new Error(`Failed to generate RSS XML: ${error}`);
    }
  }

  /**
   * Update RSS configuration
   * @param newConfig Partial configuration to update
   */
  updateConfig(newConfig: Partial<RSS.FeedOptions>): void {
    this.config = {...this.config, ...newConfig};
  }

  /**
   * Get current RSS configuration
   * @returns Current RSS configuration
   */
  getConfig(): RSS.FeedOptions {
    return {...this.config};
  }
}