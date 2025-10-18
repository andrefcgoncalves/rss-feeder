import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {logger} from "firebase-functions";
import {Timestamp} from "firebase-admin/firestore";
import {Request} from "firebase-functions/v2/https";
import {db, FEED_ITEMS_COLLECTION, NEWSLETTER_ITEMS_COLLECTION} from "./firebase";
import {GeminiService, geminiApiKey} from "./gemini-service";
import {RSSGenerator} from "./rss-generator";
import {RSSService} from "./rss-service";
import {NewsletterParser} from "./newsletter-parser";
import {IngestionRequest, IngestionResponse, NewsletterItem, ParseurWebhookRequest} from "./types";

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
  const xApiKey = request.get("x-api-key");
  const bodyToken = request.body?.token;
  const expectedToken = apiToken.value();

  // Check Authorization header (Bearer token) or token in body
  const providedToken = authHeader?.replace("Bearer ", "") || xApiKey || bodyToken;
  
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
      const rssService = new RSSService(rssGenerator);

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

      // Update RSS feed using service
      const {itemCount} = await rssService.rebuildAndUpload();

      logger.info("RSS feed updated successfully", {
        itemCount,
        newItemId: docRef.id,
      });

      // Return success response
      const response: IngestionResponse = {
        success: true,
        message: "URL processed and feed updated successfully",
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

/**
 * Serve RSS feed from Cloud Storage
 */
// export const serveRSS = onRequest(
//   {
//     cors: true,
//     memory: "256MiB",
//     timeoutSeconds: 60,
//   },
//   async (req, res) => {
//     try {
//       logger.info("RSS feed requested");

//       // Get the RSS feed from Cloud Storage
//       const bucket = storage.bucket();
//       const feedFile = bucket.file("rss-feed.xml");
      
//       // Check if the feed exists
//       const [exists] = await feedFile.exists();
//       if (!exists) {
//         logger.warn("RSS feed not found in Cloud Storage");
//         res.status(404).json({
//           success: false,
//           message: "RSS feed not found"
//         });
//         return;
//       }

//       // Download the RSS feed from Cloud Storage
//       const [rssXml] = await feedFile.download();
//       const rssContent = rssXml.toString('utf-8');

//       logger.info("Serving RSS feed from Cloud Storage");

//       // Set proper headers for RSS feed
//       res.set('Content-Type', 'application/rss+xml; charset=utf-8');
//       res.set('Cache-Control', 'private');
//       // res.set('Cache-Control', 'public, max-age=900'); // Cache for 15 minutes
      
//       res.status(200).send(rssContent);

//     } catch (error) {
//       logger.error("Error serving RSS feed", {error});
//       res.status(500).json({
//         success: false,
//         message: `Internal server error: ${error}`,
//       });
//     }
//   }
// );

/**
 * Regenerate RSS feed from existing Firestore data
 */
export const regenerateRSS = onRequest(
  {
    secrets: [geminiApiKey, apiToken],
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({success: false, message: "Method not allowed"});
      return;
    }

    // Validate authentication (no URL validation needed)
    if (!validateAuth(req)) {
      res.status(401).json({success: false, message: "Unauthorized"});
      return;
    }

    try {
      logger.info("Starting RSS regeneration from existing data");

      const rssService = new RSSService(new RSSGenerator());
      const {itemCount} = await rssService.rebuildAndUpload();

      logger.info("RSS feed regenerated successfully", {
        itemCount,
      });

      // Return success response
      const response: IngestionResponse = {
        success: true,
        message: `RSS feed regenerated successfully with ${itemCount} items`,
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error("Error regenerating RSS feed", {error});
      
      const response: IngestionResponse = {
        success: false,
        message: `Internal server error: ${error}`,
      };
      
      res.status(500).json(response);
    }
  }
);

/**
 * Parseur webhook endpoint for email newsletters
 */
export const parseurWebhook = onRequest(
  {
    secrets: [geminiApiKey, apiToken],
    cors: true,
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (req, res) => {
    logger.info("Parseur webhook called", {
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

      // Validate authentication (no URL validation needed)
      if (!validateAuth(req)) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Parse request body
      const webhookData: ParseurWebhookRequest = req.body;
      
      // Validate webhook data
      const newsletterParser = new NewsletterParser();
      if (!newsletterParser.validateWebhookData(webhookData)) {
        res.status(400).json({
          success: false,
          message: "Invalid webhook data. Missing required fields: subject, htmlDocument",
        });
        return;
      }

      logger.info(`Processing newsletter from: ${webhookData.from}`);

      // Parse newsletter content
      const newsletterItem = newsletterParser.parseNewsletter(webhookData);

      // Save to Firestore
      const newsletterItemsRef = db.collection(NEWSLETTER_ITEMS_COLLECTION);
      const docRef = await newsletterItemsRef.add(newsletterItem);

      logger.info(`Saved newsletter item with ID: ${docRef.id}`);

      // Add to RSS feed as well
      const feedItemsRef = db.collection(FEED_ITEMS_COLLECTION);
      await feedItemsRef.add({
        url: `https://smartfeed-f3b51.web.app/newsletter?id=${docRef.id}`, // Link to newsletter page
        title: newsletterItem.title,
        description: `By ${newsletterItem.newsletterName}`,
        pubDate: Timestamp.now(),
      });

      // Regenerate RSS feed using service (public read for newsletter path)
      const rssService = new RSSService(new RSSGenerator());
      const {itemCount} = await rssService.rebuildAndUpload();

      logger.info("Newsletter processed and RSS feed updated successfully", {
        newsletterId: docRef.id,
        itemCount,
      });

      // Return success response
      const response = {
        success: true,
        message: "Newsletter processed successfully",
        newsletterId: docRef.id,
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error("Error processing Parseur webhook", {error});
      
      const response = {
        success: false,
        message: `Internal server error: ${error}`,
      };
      
      res.status(500).json(response);
    }
  }
);

/**
 * API endpoint to get a specific newsletter by ID
 */
export const getNewsletter = onRequest(
  {
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      // Only allow GET requests
      if (req.method !== "GET") {
        res.status(405).json({success: false, message: "Method not allowed"});
        return;
      }

      // Get newsletter ID from URL path
      const newsletterId = req.path.split('/').pop();
      
      if (!newsletterId) {
        res.status(400).json({
          success: false,
          message: "Newsletter ID is required",
        });
        return;
      }

      logger.info(`Fetching newsletter: ${newsletterId}`);

      // Get newsletter from Firestore
      const newsletterDoc = await db
        .collection(NEWSLETTER_ITEMS_COLLECTION)
        .doc(newsletterId)
        .get();

      if (!newsletterDoc.exists) {
        res.status(404).json({
          success: false,
          message: "Newsletter not found",
        });
        return;
      }

      const newsletter = {
        id: newsletterDoc.id,
        ...newsletterDoc.data(),
      } as Omit<NewsletterItem, 'pubDate'>;

      (newsletter as any).pubDate = newsletterDoc.data()?.pubDate?.toDate() || new Date();
      logger.info(`Found newsletter: ${newsletter.title || 'Untitled'}`);

      res.status(200).json(newsletter);

    } catch (error) {
      logger.error("Error fetching newsletter", {error});
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error}`,
      });
    }
  }
);
