import RSS from "rss";
import {logger} from "firebase-functions";
import {FeedItem, RSSConfig} from "./types";

/**
 * Service for generating RSS XML feeds
 */
export class RSSGenerator {
  private config: RSSConfig;

  constructor() {
    // Default RSS feed configuration
    this.config = {
      title: "Gemini RSS Feed",
      description: "AI-powered RSS feed generated using Gemini API",
      feed_url: "", // Will be set dynamically
      site_url: "", // Will be set dynamically
      managingEditor: "rss@example.com",
      webMaster: "webmaster@example.com",
      copyright: `${new Date().getFullYear()} Gemini RSS Generator`,
      language: "en",
      categories: ["Technology", "AI", "RSS"],
      pubDate: new Date(),
      ttl: 60, // Cache for 60 minutes
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
      this.config.site_url = feedUrl.replace("/feed.xml", "");

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
  updateConfig(newConfig: Partial<RSSConfig>): void {
    this.config = {...this.config, ...newConfig};
  }

  /**
   * Get current RSS configuration
   * @returns Current RSS configuration
   */
  getConfig(): RSSConfig {
    return {...this.config};
  }
}