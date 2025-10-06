import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {logger} from "firebase-functions";
import {Timestamp} from "firebase-admin/firestore";
import {Request} from "firebase-functions/v2/https";
import {db, storage, FEED_ITEMS_COLLECTION} from "./firebase";
import {GeminiService, geminiApiKey} from "./gemini-service";
import {RSSGenerator} from "./rss-generator";
import {FeedItem, IngestionRequest, IngestionResponse} from "./types";

// Define the secret for API access token
const apiToken = defineSecret("API_TOKEN");

/**
 * Validates the request authorization
 */
function validateAuth(request: Request): boolean {
  // Check if this is a request from our own PWA (via Firebase Hosting rewrite)
  const referer = request.get("Referer");
  const userAgent = request.get("User-Agent");
  
  // Allow requests from our own domain (PWA share target)
  if (referer && (referer.includes(".web.app") || referer.includes(".firebaseapp.com"))) {
    return true;
  }

  // For external requests, require API token
  const authHeader = request.get("Authorization");
  const bodyToken = request.body?.token;
  const expectedToken = apiToken.value();

  // Check Authorization header (Bearer token) or token in body
  const providedToken = authHeader?.replace("Bearer ", "") || bodyToken;
  
  return providedToken === expectedToken;
}

/**
 * Main Cloud Function for RSS feed ingestion
 */
export const ingestUrl = onRequest(
  {
    secrets: [geminiApiKey, apiToken],
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (req, res) => {
    logger.info("Ingestion endpoint called", {
      method: req.method,
      url: req.url,
      headers: req.headers,
    });

    try {
      // Validate HTTP method
      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          message: "Method not allowed. Use POST.",
        });
        return;
      }

      // Validate authentication
      if (!validateAuth(req)) {
        logger.warn("Unauthorized access attempt", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
        res.status(401).json({
          success: false,
          message: "Unauthorized. Valid API token required.",
        });
        return;
      }

      // Parse request body
      const requestBody: IngestionRequest = req.body;
      
      if (!requestBody.url) {
        res.status(400).json({
          success: false,
          message: "Missing required field: url",
        });
        return;
      }

      // Validate URL format
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(requestBody.url);
        if (!parsedUrl.protocol.startsWith("http")) {
          throw new Error("Invalid protocol");
        }
      } catch (urlError) {
        res.status(400).json({
          success: false,
          message: "Invalid URL format",
        });
        return;
      }

      logger.info(`Processing URL: ${requestBody.url}`);

      // Initialize services
      const geminiService = new GeminiService(geminiApiKey.value());
      const rssGenerator = new RSSGenerator();

      // Step 1: Parse URL with Gemini
      const parsedContent = await geminiService.parseUrl(requestBody.url);
      
      // Step 2: Save to Firestore
      const feedItemsRef = db.collection(FEED_ITEMS_COLLECTION);
      const docRef = await feedItemsRef.add({
        url: requestBody.url,
        title: parsedContent.title,
        description: parsedContent.description,
        pubDate: Timestamp.now(),
      });

      logger.info(`Saved feed item with ID: ${docRef.id}`);

      // Step 3: Generate RSS feed
      const feedItemsQuery = await feedItemsRef
        .orderBy("pubDate", "desc")
        .limit(100)
        .get();

      const feedItems: FeedItem[] = feedItemsQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedItem[];

      // Step 4: Generate RSS XML
      const bucket = storage.bucket();
      const feedFile = bucket.file("feed.xml");

      // Get the public URL for the feed
      const feedUrl = `https://storage.googleapis.com/${bucket.name}/feed.xml`;
      
      const rssXml = rssGenerator.generateRSSXML(feedItems, feedUrl);

      // Step 5: Upload to Cloud Storage
      await feedFile.save(rssXml, {
        metadata: {
          contentType: "application/rss+xml",
          cacheControl: "private", // Cache for 15 minutes
        },
        public: true,
      });

      logger.info("RSS feed updated successfully", {
        feedUrl,
        itemCount: feedItems.length,
        newItemId: docRef.id,
      });

      // Return success response
      const response: IngestionResponse = {
        success: true,
        message: "URL processed and feed updated successfully",
        feedUrl,
        itemId: docRef.id,
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error("Error processing ingestion request", {error});
      
      const response: IngestionResponse = {
        success: false,
        message: `Internal server error: ${error}`,
      };
      
      res.status(500).json(response);
    }
  }
);