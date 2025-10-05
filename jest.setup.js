// Mock Firebase Admin SDK for testing
const mockFirestore = {
  collection: jest.fn(() => ({
    add: jest.fn(),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  })),
};

const mockStorage = {
  bucket: jest.fn(() => ({
    file: jest.fn(() => ({
      save: jest.fn(),
    })),
    name: "test-bucket",
  })),
};

jest.mock("firebase-admin/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => mockFirestore),
  Timestamp: {
    now: jest.fn(() => ({toDate: () => new Date()})),
  },
}));

jest.mock("firebase-admin/storage", () => ({
  getStorage: jest.fn(() => mockStorage),
}));

jest.mock("firebase-functions", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("firebase-functions/params", () => ({
  defineSecret: jest.fn(() => ({
    value: () => "test-secret",
  })),
}));