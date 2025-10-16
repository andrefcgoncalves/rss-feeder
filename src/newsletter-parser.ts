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
      logger.info('Parsing newsletter from Parseur webhook', {
        subject: webhookData.subject,
        from: webhookData.from
      });

      // Extract title from subject or use provided title
      const title = this.extractTitle(webhookData.subject, webhookData.title);
      
      // Clean and process HTML content
      const cleanedHtml = this.cleanHtmlContent(webhookData.html);
      
      // Extract plain text content
      const textContent = this.extractTextContent(webhookData.text || webhookData.html);
      
      // Extract main content from HTML (remove headers, footers, etc.)
      const mainContent = this.extractMainContent(cleanedHtml);

      const newsletterItem: Omit<NewsletterItem, 'id'> = {
        title,
        content: mainContent,
        textContent,
        from: webhookData.from,
        subject: webhookData.subject,
        pubDate: Timestamp.now(),
        parseurData: webhookData
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
   * Extract title from subject line or use provided title
   */
  private extractTitle(subject: string, providedTitle?: string): string {
    if (providedTitle && providedTitle.trim()) {
      return providedTitle.trim();
    }

    // Clean up subject line
    let title = subject.trim();
    
    // Remove common newsletter prefixes
    const prefixes = [
      /^\[.*?\]\s*/g,  // [Newsletter Name]
      /^Newsletter:\s*/gi,
      /^Weekly\s+/gi,
      /^Daily\s+/gi,
      /^Monthly\s+/gi,
      /^Update:\s*/gi,
      /^Alert:\s*/gi
    ];

    prefixes.forEach(prefix => {
      title = title.replace(prefix, '');
    });

    return title || 'Newsletter';
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
      '.sponsor'
    ];

    unwantedClasses.forEach(className => {
      $(className).remove();
    });

    // Clean up attributes but keep essential ones
    $('*').each((_, element) => {
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
   * Extract plain text content from HTML
   */
  private extractTextContent(html: string): string {
    if (!html) return '';

    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content and clean it up
    let text = ($ as any).text() || '';
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
      .trim();

    return text;
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
      typeof data.subject === 'string' &&
      (typeof data.html === 'string' || typeof data.text === 'string') &&
      typeof data.from === 'string'
    );
  }
}
