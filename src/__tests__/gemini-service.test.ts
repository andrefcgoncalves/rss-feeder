import {GeminiService} from "../gemini-service";

// Mock the Gemini API
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe("GeminiService", () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    geminiService = new GeminiService("test-api-key");
    jest.clearAllMocks();
  });

  describe("parseUrl", () => {
    it("should parse URL and return structured response", async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            title: "Test Article",
            description: "This is a test article description.",
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.parseUrl("https://example.com/article");

      expect(result).toEqual({
        title: "Test Article",
        description: "This is a test article description.",
      });
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining("https://example.com/article"));
    });

    it("should truncate description if longer than 160 characters", async () => {
      const longDescription = "A".repeat(170);
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            title: "Test Article",
            description: longDescription,
          }),
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.parseUrl("https://example.com/article");

      expect(result.description).toHaveLength(160);
      expect(result.description.endsWith("...")).toBe(true);
    });

    it("should handle malformed JSON response gracefully", async () => {
      const mockResponse = {
        response: {
          text: () => "Invalid JSON response",
        },
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.parseUrl("https://example.com/article");

      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(typeof result.title).toBe("string");
      expect(typeof result.description).toBe("string");
    });

    it("should handle API errors gracefully", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await geminiService.parseUrl("https://example.com/article");

      expect(result.title).toBeDefined();
      expect(result.description).toBe("Content from example.com");
    });

    it("should generate fallback title from URL", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const result = await geminiService.parseUrl("https://example.com/blog/my-awesome-post");

      expect(result.title).toContain("my awesome post");
      expect(result.title).toContain("example.com");
    });
  });
});