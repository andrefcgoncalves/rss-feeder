import {RSSGenerator} from "../rss-generator";
import {FeedItem} from "../types";
import {Timestamp} from "firebase-admin/firestore";

describe("RSSGenerator", () => {
  let rssGenerator: RSSGenerator;

  beforeEach(() => {
    rssGenerator = new RSSGenerator();
  });

  describe("generateRSSXML", () => {
    it("should generate valid RSS XML", () => {
      const feedItems: FeedItem[] = [
        {
          id: "test-id-1",
          url: "https://example.com/article1",
          title: "Test Article 1",
          description: "This is the first test article.",
          pubDate: Timestamp.fromDate(new Date("2023-10-01")),
        },
        {
          id: "test-id-2",
          url: "https://example.com/article2",
          title: "Test Article 2",
          description: "This is the second test article.",
          pubDate: Timestamp.fromDate(new Date("2023-10-02")),
        },
      ];

      const feedUrl = "https://storage.googleapis.com/test-bucket/feed.xml";
      const rssXml = rssGenerator.generateRSSXML(feedItems, feedUrl);

      // Basic XML structure validation
      expect(rssXml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      expect(rssXml).toContain("<rss");
      expect(rssXml).toContain("<channel>");
      expect(rssXml).toContain("</channel>");
      expect(rssXml).toContain("</rss>");

      // Feed metadata validation
      expect(rssXml).toContain("<title>Gemini RSS Feed</title>");
      expect(rssXml).toContain("<link>" + feedUrl.replace("/feed.xml", "") + "</link>");

      // Items validation
      expect(rssXml).toContain("<title>Test Article 1</title>");
      expect(rssXml).toContain("<title>Test Article 2</title>");
      expect(rssXml).toContain("https://example.com/article1");
      expect(rssXml).toContain("https://example.com/article2");
      expect(rssXml).toContain("This is the first test article.");
      expect(rssXml).toContain("This is the second test article.");
    });

    it("should handle empty feed items array", () => {
      const feedItems: FeedItem[] = [];
      const feedUrl = "https://storage.googleapis.com/test-bucket/feed.xml";
      
      const rssXml = rssGenerator.generateRSSXML(feedItems, feedUrl);

      expect(rssXml).toContain("<channel>");
      expect(rssXml).toContain("</channel>");
      expect(rssXml).not.toContain("<item>");
    });

    it("should include GUID for each item", () => {
      const feedItems: FeedItem[] = [
        {
          id: "unique-guid-123",
          url: "https://example.com/article",
          title: "Test Article",
          description: "Test description",
          pubDate: Timestamp.fromDate(new Date()),
        },
      ];

      const feedUrl = "https://storage.googleapis.com/test-bucket/feed.xml";
      const rssXml = rssGenerator.generateRSSXML(feedItems, feedUrl);

      expect(rssXml).toContain("<guid>unique-guid-123</guid>");
    });
  });

  describe("updateConfig", () => {
    it("should update RSS configuration", () => {
      const newConfig = {
        title: "Custom RSS Feed",
        description: "Custom description",
      };

      rssGenerator.updateConfig(newConfig);
      const config = rssGenerator.getConfig();

      expect(config.title).toBe("Custom RSS Feed");
      expect(config.description).toBe("Custom description");
    });
  });
});