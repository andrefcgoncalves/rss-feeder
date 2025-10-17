import { NewsletterParser } from '../newsletter-parser';
import { ParseurWebhookRequest } from '../types';

describe('NewsletterParser', () => {
  let parser: NewsletterParser;

  beforeEach(() => {
    parser = new NewsletterParser();
  });

  describe('validateWebhookData', () => {
    it('should validate correct webhook data', () => {
      const validData: ParseurWebhookRequest = {
        subject: 'Test Newsletter',
        html: '<p>Test content</p>',
        from: 'test@example.com',
        title: 'Test Newsletter',
        text: 'Test content'
      };

      expect(parser.validateWebhookData(validData)).toBe(true);
    });

    it('should reject invalid webhook data', () => {
      const invalidData = {
        subject: 'Test Newsletter',
        // missing html/text and from
      };

      expect(parser.validateWebhookData(invalidData)).toBe(false);
    });
  });

  describe('parseNewsletter', () => {
    it('should parse newsletter with HTML content', () => {
      const webhookData: ParseurWebhookRequest = {
        subject: 'Weekly Tech News',
        html: '<div><h1>Tech News</h1><p>This is the content</p></div>',
        from: 'newsletter@tech.com',
        title: 'Weekly Tech News',
        text: 'Tech News This is the content'
      };

      const result = parser.parseNewsletter(webhookData);

      expect(result.title).toBe('Weekly Tech News');
      expect(result.from).toBe('newsletter@tech.com');
      expect(result.content).toContain('Tech News');
    });

    it('should clean HTML content', () => {
      const webhookData: ParseurWebhookRequest = {
        subject: 'Test Newsletter',
        html: '<div><script>alert("test")</script><h1>Title</h1><p>Content</p><div class="footer">Footer</div></div>',
        from: 'test@example.com',
        title: 'Test Newsletter',
        text: 'Title Content Footer'
      };

      const result = parser.parseNewsletter(webhookData);

      expect(result.content).not.toContain('script');
      expect(result.content).not.toContain('footer');
      expect(result.content).toContain('Title');
      expect(result.content).toContain('Content');
    });

    it('should extract title from subject when no title provided', () => {
      const webhookData: ParseurWebhookRequest = {
        subject: '[Newsletter] Weekly Update',
        html: '<p>Content</p>',
        from: 'test@example.com',
        title: '',
        text: 'Content'
      };

      const result = parser.parseNewsletter(webhookData);

      expect(result.title).toBe('Weekly Update');
    });
  });
});
