/**
 * Integration Tests for Suggestions Endpoint
 *
 * Tests the /api/suggestions endpoint using supertest
 * and an in-memory MongoDB instance.
 */

const request = require("supertest");
const app = require("../src/index");
const User = require("../src/models/User");
const { connect, closeDatabase, clearDatabase } = require("./utils/testDb");

// Test user and token
let authToken;
let userId;

// Setup and teardown
beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  // Create a test user and get auth token
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "TestPass123",
  };

  const response = await request(app).post("/api/auth/register").send(testUser);

  authToken = response.body.data.token;
  userId = response.body.data.user.id;
});

afterEach(async () => {
  await clearDatabase();
});

describe("POST /api/suggestions", () => {
  describe("Successful Suggestions Generation", () => {
    it("should generate critical suggestions for high sadness (>0.6 for 7+ days)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 7,
        emotionScores: {
          sadness: 0.65,
          anxiety: 0.42,
          anger: 0.28,
          fear: 0.35,
          grief: 0.15,
        },
        percentages: {
          positive: 15.2,
          negative: 68.3,
          neutral: 16.5,
        },
        emotionalVariability: 0.45,
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("userId");
      expect(response.body.data).toHaveProperty("analysis");
      expect(response.body.data).toHaveProperty("suggestions");
      expect(response.body.data).toHaveProperty("warnings");

      // Should have high severity
      expect(response.body.data.analysis.severity).toBe("high");

      // Should generate professional help suggestion
      const professionalHelpSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "professional_help"
      );
      expect(professionalHelpSuggestion).toBeDefined();
      expect(professionalHelpSuggestion.priority).toBe("critical");
      expect(professionalHelpSuggestion.resources).toBeDefined();
      expect(professionalHelpSuggestion.resources.length).toBeGreaterThan(0);

      // Should have warnings
      expect(response.body.data.warnings.length).toBeGreaterThan(0);
      expect(response.body.data.warnings[0].level).toBe("high");
    });

    it("should generate anxiety management suggestions for high anxiety (>0.65 for 5+ days)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 5,
        emotionScores: {
          sadness: 0.3,
          anxiety: 0.7,
          anger: 0.2,
          fear: 0.35,
          grief: 0.1,
        },
        percentages: {
          positive: 25.0,
          negative: 55.0,
          neutral: 20.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find anxiety management suggestion
      const anxietySuggestion = response.body.data.suggestions.find(
        (s) => s.type === "anxiety_management"
      );
      expect(anxietySuggestion).toBeDefined();
      expect(anxietySuggestion.priority).toBe("high");
      expect(anxietySuggestion.techniques).toBeDefined();
      expect(anxietySuggestion.techniques.length).toBeGreaterThan(0);
    });

    it("should generate grief support suggestions for high grief (>0.5)", async () => {
      const emotionStats = {
        daysAnalyzed: 5,
        consecutiveDays: 3,
        emotionScores: {
          sadness: 0.4,
          anxiety: 0.3,
          anger: 0.2,
          fear: 0.25,
          grief: 0.6,
        },
        percentages: {
          positive: 20.0,
          negative: 60.0,
          neutral: 20.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find grief support suggestion
      const griefSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "grief_support"
      );
      expect(griefSuggestion).toBeDefined();
      expect(griefSuggestion.priority).toBe("high");
      expect(griefSuggestion.resources).toBeDefined();
    });

    it("should generate anger management suggestions for elevated anger (>0.6 for 4+ days)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 5,
        emotionScores: {
          sadness: 0.25,
          anxiety: 0.3,
          anger: 0.65,
          fear: 0.2,
          grief: 0.1,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
          neutral: 20.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find anger management suggestion
      const angerSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "anger_management"
      );
      expect(angerSuggestion).toBeDefined();
      expect(angerSuggestion.priority).toBe("medium");
      expect(angerSuggestion.techniques).toBeDefined();
    });

    it("should generate fear/anxiety suggestions for persistent fear (>0.55 for 5+ days)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 6,
        emotionScores: {
          sadness: 0.25,
          anxiety: 0.4,
          anger: 0.2,
          fear: 0.6,
          grief: 0.15,
        },
        percentages: {
          positive: 25.0,
          negative: 55.0,
          neutral: 20.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find fear/anxiety suggestion
      const fearSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "fear_anxiety"
      );
      expect(fearSuggestion).toBeDefined();
      expect(fearSuggestion.priority).toBe("high");
      expect(fearSuggestion.approaches).toBeDefined();
    });

    it("should generate overall mental health suggestions for high negative percentage (>70%)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 5,
        emotionScores: {
          sadness: 0.45,
          anxiety: 0.5,
          anger: 0.4,
          fear: 0.35,
          grief: 0.3,
        },
        percentages: {
          positive: 10.0,
          negative: 75.0,
          neutral: 15.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should have high severity
      expect(response.body.data.analysis.severity).toBe("high");

      // Should find overall mental health suggestion
      const overallSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "overall_mental_health"
      );
      expect(overallSuggestion).toBeDefined();
      expect(overallSuggestion.priority).toBe("high");
      expect(overallSuggestion.nextSteps).toBeDefined();
    });

    it("should generate positive activity suggestions for low positive emotions (<10% for 7+ days)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 7,
        emotionScores: {
          sadness: 0.35,
          anxiety: 0.3,
          anger: 0.25,
          fear: 0.25,
          grief: 0.2,
        },
        percentages: {
          positive: 8.0,
          negative: 62.0,
          neutral: 30.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find positive activities suggestion
      const positiveSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "positive_activities"
      );
      expect(positiveSuggestion).toBeDefined();
      expect(positiveSuggestion.priority).toBe("medium");
      expect(positiveSuggestion.activities).toBeDefined();
    });

    it("should generate emotional regulation suggestions for high variability (>0.7)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 3,
        emotionScores: {
          sadness: 0.35,
          anxiety: 0.4,
          anger: 0.3,
          fear: 0.3,
          grief: 0.2,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
          neutral: 20.0,
        },
        emotionalVariability: 0.75,
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should find emotional regulation suggestion
      const regulationSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "emotional_regulation"
      );
      expect(regulationSuggestion).toBeDefined();
      expect(regulationSuggestion.priority).toBe("medium");
      expect(regulationSuggestion.techniques).toBeDefined();
    });

    it("should generate positive reinforcement for good emotional health (>60% positive)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 5,
        emotionScores: {
          sadness: 0.1,
          anxiety: 0.15,
          anger: 0.1,
          fear: 0.1,
          grief: 0.05,
        },
        percentages: {
          positive: 65.0,
          negative: 20.0,
          neutral: 15.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should have low or none severity (depends on other factors)
      expect(["none", "low", "medium"]).toContain(
        response.body.data.analysis.severity
      );

      // Should find positive reinforcement
      const positiveSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "positive_reinforcement"
      );
      expect(positiveSuggestion).toBeDefined();
      expect(positiveSuggestion.priority).toBe("low");
      expect(positiveSuggestion.encouragement).toBeDefined();
    });

    it("should generate maintenance suggestions for balanced emotions", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 0,
        emotionScores: {
          sadness: 0.15,
          anxiety: 0.2,
          anger: 0.15,
          fear: 0.1,
          grief: 0.05,
        },
        percentages: {
          positive: 40.0,
          negative: 35.0,
          neutral: 25.0,
        },
        emotionalVariability: 0.3,
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Should have none or low severity
      expect(["none", "low"]).toContain(response.body.data.analysis.severity);

      // Should find maintenance suggestion
      const maintenanceSuggestion = response.body.data.suggestions.find(
        (s) => s.type === "maintenance"
      );
      expect(maintenanceSuggestion).toBeDefined();
      expect(maintenanceSuggestion.priority).toBe("low");
      expect(maintenanceSuggestion.tips).toBeDefined();
    });

    it("should calculate critical emotion score correctly", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 5,
        emotionScores: {
          sadness: 0.6, // weight 1.5
          anxiety: 0.5, // weight 1.0
          anger: 0.4, // weight 0.8
          fear: 0.5, // weight 1.2
          grief: 0.4, // weight 1.5
        },
        percentages: {
          positive: 20.0,
          negative: 60.0,
          neutral: 20.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis.criticalEmotionScore).toBeDefined();
      expect(response.body.data.analysis.criticalEmotionScore).toBeGreaterThan(
        0
      );
      expect(
        response.body.data.analysis.criticalEmotionScore
      ).toBeLessThanOrEqual(1);

      // Expected: (0.6*1.5 + 0.4*1.5 + 0.5*1.2 + 0.5*1.0 + 0.4*0.8) / 6.0
      // = (0.9 + 0.6 + 0.6 + 0.5 + 0.32) / 6.0 = 2.92 / 6.0 = 0.487
      expect(response.body.data.analysis.criticalEmotionScore).toBeCloseTo(
        0.487,
        2
      );
    });

    it("should sort suggestions by priority (critical > high > medium > low)", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        consecutiveDays: 7,
        emotionScores: {
          sadness: 0.65, // critical priority
          anxiety: 0.7, // high priority
          anger: 0.65, // medium priority
          fear: 0.6, // high priority
          grief: 0.55, // high priority
        },
        percentages: {
          positive: 10.0,
          negative: 75.0,
          neutral: 15.0,
        },
        emotionalVariability: 0.75, // medium priority
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions.length).toBeGreaterThan(0);

      // Verify sorting: critical should be first
      const priorities = response.body.data.suggestions.map((s) => s.priority);
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(
          priorityOrder[priorities[i + 1]]
        );
      }
    });
  });

  describe("Validation Errors", () => {
    it("should return 400 if daysAnalyzed is missing", async () => {
      const emotionStats = {
        emotionScores: {
          sadness: 0.5,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it("should return 400 if daysAnalyzed is not a positive integer", async () => {
      const emotionStats = {
        daysAnalyzed: -5,
        emotionScores: {},
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 if emotionScores is not an object", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: "invalid",
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 if percentages are missing", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: {
          sadness: 0.5,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 if percentage values are out of range", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: {},
        percentages: {
          positive: 150.0, // invalid: > 100
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 if emotion scores are out of range", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: {
          sadness: 1.5, // invalid: > 1.0
          anxiety: 0.5,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(emotionStats)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Authentication", () => {
    it("should return 401 if no auth token is provided", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: {
          sadness: 0.5,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .send(emotionStats)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should return 401 if auth token is invalid", async () => {
      const emotionStats = {
        daysAnalyzed: 7,
        emotionScores: {
          sadness: 0.5,
        },
        percentages: {
          positive: 30.0,
          negative: 50.0,
        },
      };

      const response = await request(app)
        .post("/api/suggestions")
        .set("Authorization", "Bearer invalid-token")
        .send(emotionStats)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe("GET /api/suggestions/rules", () => {
  it("should return information about the rule engine", async () => {
    const response = await request(app)
      .get("/api/suggestions/rules")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("engineType");
    expect(response.body.data.engineType).toBe("rule-based");
    expect(response.body.data).toHaveProperty("version");
    expect(response.body.data).toHaveProperty("rules");
    expect(response.body.data.rules).toBeInstanceOf(Array);
    expect(response.body.data.rules.length).toBe(10);
    expect(response.body.data).toHaveProperty("severityLevels");
    expect(response.body.data).toHaveProperty("futureEnhancements");
  });

  it("should include TODO note about generative model", async () => {
    const response = await request(app)
      .get("/api/suggestions/rules")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data.implementationNote).toContain("placeholder");
    expect(response.body.data.futureEnhancements).toContain(
      "Integration with FLAN-T5 generative model"
    );
  });

  it("should require authentication", async () => {
    const response = await request(app)
      .get("/api/suggestions/rules")
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
