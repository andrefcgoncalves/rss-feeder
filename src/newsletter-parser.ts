import * as cheerio from 'cheerio';
import { logger } from 'firebase-functions';
import { NewsletterItem, ParseurWebhookRequest } from './types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Service for parsing email newsletters from Parseur webhooks
 */
export class NewsletterParser {
  
  /**
   * Parse newsletter content from Parseur webhook data
   * @param webhookData Data received from Parseur webhook
   * @returns Parsed newsletter item
   */
  parseNewsletter(webhookData: ParseurWebhookRequest): Omit<NewsletterItem, 'id'> {
    try {
      const subject = webhookData.Subject.replace(/^(?:Fwd|FWD|Fw|FW):\s*/i, '');
      logger.info('Parsing newsletter from Parseur webhook', {
        subject,
        from: webhookData.from
      });

      // Clean and process HTML content
      const cleanedHtml = this.cleanHtmlContent(webhookData.HtmlDocument);

      // Extract main content from HTML (remove headers, footers, etc.)
      // const mainContent = this.extractMainContent(cleanedHtml);

      const newsletterItem: Omit<NewsletterItem, 'id'> = {
        title: subject,
        content: cleanedHtml,
        pubDate: Timestamp.now(),
        from: webhookData.fromNameOriginal?.full || '',
        newsletterName: webhookData.newsletterName || 'Unknown',
      };

      logger.info('Newsletter parsed successfully', {
        title: newsletterItem.title,
        contentLength: newsletterItem.content.length
      });

      return newsletterItem;

    } catch (error) {
      logger.error('Error parsing newsletter', { error, webhookData });
      throw new Error(`Failed to parse newsletter: ${error}`);
    }
  }


  /**
   * Clean HTML content by removing unwanted elements
   */
  private cleanHtmlContent(html: string): string {
    if (!html) return '';

    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    const elementsToRemove = [
      'script',
      'style',
      'meta',
      'link',
      'noscript',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'select',
      'textarea'
    ];

    elementsToRemove.forEach(selector => {
      $(selector).remove();
    });

    // Remove elements with common newsletter footer/header classes
    const unwantedClasses = [
      '.footer',
      '.header',
      '.unsubscribe',
      '.social-links',
      '.newsletter-footer',
      '.newsletter-header',
      '.email-footer',
      '.email-header',
      '.promo',
      '.advertisement',
      '.ad',
      '.sponsor',
      '.gmail_signature',
      '.gmail_attr'
    ];

    unwantedClasses.forEach(className => {
      $(className).remove();
    });

    // Clean up attributes but keep essential ones
    $('*').each((_: any, element: any) => {
      const $el = $(element);
      const tagName = (element as any).tagName?.toLowerCase();
      
      // Keep only essential attributes
      const allowedAttributes: { [key: string]: string[] } = {
        'a': ['href'],
        'img': ['src', 'alt', 'width', 'height'],
        'table': ['border', 'cellpadding', 'cellspacing'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan']
      };

      const allowed = allowedAttributes[tagName] || [];
      const attributes = (element as any).attribs || {};
      
      Object.keys(attributes).forEach(attr => {
        if (!allowed.includes(attr)) {
          $el.removeAttr(attr);
        }
      });
    });

    return $.html();
  }

  /**
   * Extract main content from HTML, removing headers and footers
   */
  private extractMainContent(html: string): string {
    if (!html) return '';

    const $ = cheerio.load(html);
    
    // Try to find the main content area
    let mainContent = $('main, .content, .main-content, .newsletter-content, .email-content, .post-content, article');
    
    if (mainContent.length === 0) {
      // If no main content area found, use body but clean it up
      mainContent = $('body');
    }

    // Remove common newsletter elements that might still be present
    const unwantedSelectors = [
      '.unsubscribe',
      '.footer',
      '.header',
      '.social-links',
      '.newsletter-footer',
      '.newsletter-header',
      '.email-footer',
      '.email-header',
      '.promo',
      '.advertisement',
      '.ad',
      '.sponsor',
      '[class*="unsubscribe"]',
      '[class*="footer"]',
      '[class*="header"]'
    ];

    unwantedSelectors.forEach(selector => {
      mainContent.find(selector).remove();
    });

    // Get the cleaned HTML
    let content = mainContent.html() || html;
    
    // Final cleanup
    content = content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/>\s+</g, '><')  // Remove whitespace between tags
      .trim();

    return content;
  }

  /**
   * Validate Parseur webhook data
   */
  validateWebhookData(data: any): data is ParseurWebhookRequest {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.Subject === 'string' &&
      (typeof data.HtmlDocument === 'string')
    );
  }
}
