import {logger} from "firebase-functions";
import {db, storage, FEED_ITEMS_COLLECTION} from "./firebase";
import {FeedItem} from "./types";
import {RSSGenerator} from "./rss-generator";

/**
 * Service encapsulating the Firestore → RSS XML → Cloud Storage flow
 */
export class RSSService {
  private rssGenerator: RSSGenerator;

  constructor(rssGenerator?: RSSGenerator) {
    this.rssGenerator = rssGenerator ?? new RSSGenerator();
  }

  /**
   * Fetch recent feed items from Firestore
   */
  async fetchFeedItems(): Promise<FeedItem[]> {
    const snapshot = await db
      .collection(FEED_ITEMS_COLLECTION)
      .orderBy("pubDate", "desc")
      .limit(100)
      .get();

    const items: FeedItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      url: doc.data().url,
      title: doc.data().title,
      description: doc.data().description,
      pubDate: doc.data().pubDate,
    }));

    logger.info(`Fetched ${items.length} feed items from Firestore`);
    return items;
  }

  /**
   * Generate RSS XML string for given items and feed URL
   */
  generateXml(items: FeedItem[]): string {
    const bucket = storage.bucket();
    const feedUrl = `https://storage.googleapis.com/${bucket.name}/rss-feed.xml`;
    // const feedUrl = "https://smartfeed-f3b51.web.app/feed.xml";

    return this.rssGenerator.generateRSSXML(items, feedUrl);
  }

  /**
   * Upload XML content to Cloud Storage at path "rss-feed.xml"
   * @param xml RSS XML
   */
  async uploadXml(xml: string): Promise<{bucketName: string; filePath: string}> {
    const bucket = storage.bucket();
    const file = bucket.file("rss-feed.xml");

    await file.save(xml, {
      metadata: {
        contentType: "application/rss+xml",
        cacheControl: "private",
      },
      public: true,
    });

    logger.info("RSS XML uploaded to Cloud Storage", {bucket: bucket.name, path: "rss-feed.xml"});
    return {bucketName: bucket.name, filePath: "rss-feed.xml"};
  }

  /**
   * End-to-end: fetch items, build XML, upload to GCS
   * @param feedUrl Public URL where the feed will be accessible (embedded in XML)
   */
  async rebuildAndUpload(): Promise<{itemCount: number; bucketName: string; filePath: string}> {
    const items = await this.fetchFeedItems();

    if (items.length === 0) {
      logger.warn("No feed items found when rebuilding RSS");
    }

    const xml = this.generateXml(items);
    const {bucketName, filePath} = await this.uploadXml(xml);

    return {itemCount: items.length, bucketName, filePath};
  }
}


