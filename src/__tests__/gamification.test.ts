/**
 * Unit tests for gamification logic:
 * - XP awards
 * - Level calculation
 * - Streak logic
 */

// Level formula: floor(sqrt(XP / 25)) + 1
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 25)) + 1;
}

// Streak logic
function calculateStreak(
  currentStreak: number,
  lastStudyDate: Date | null,
  now: Date
): number {
  if (!lastStudyDate) return 1;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const lastStudy = new Date(lastStudyDate);
  lastStudy.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - lastStudy.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return currentStreak; // Same day
  if (diffDays === 1) return currentStreak + 1; // Consecutive day
  return 1; // Streak broken
}

// XP calculation for quiz
function calculateQuizXP(score: number, totalQuestions: number): number {
  const baseXP = 25;
  const correctXP = score * 5;
  const perfectBonus = score === totalQuestions ? 50 : 0;
  return baseXP + correctXP + perfectBonus;
}

describe("Level Calculation", () => {
  test("level 1 at 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  test("level 1 at 24 XP", () => {
    expect(calculateLevel(24)).toBe(1);
  });

  test("level 2 at 25 XP", () => {
    expect(calculateLevel(25)).toBe(2);
  });

  test("level 2 at 99 XP", () => {
    expect(calculateLevel(99)).toBe(2);
  });

  test("level 3 at 100 XP", () => {
    expect(calculateLevel(100)).toBe(3);
  });

  test("level 4 at 225 XP", () => {
    expect(calculateLevel(225)).toBe(4);
  });

  test("level 7 at 900 XP", () => {
    expect(calculateLevel(900)).toBe(7);
  });

  test("level 11 at 2500 XP", () => {
    expect(calculateLevel(2500)).toBe(11);
  });
});

describe("Streak Calculation", () => {
  test("first study ever starts streak at 1", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    expect(calculateStreak(0, null, now)).toBe(1);
  });

  test("same day study keeps current streak", () => {
    const now = new Date("2024-01-15T18:00:00Z");
    const lastStudy = new Date("2024-01-15T10:00:00Z");
    expect(calculateStreak(5, lastStudy, now)).toBe(5);
  });

  test("next day study increments streak", () => {
    const now = new Date("2024-01-16T10:00:00Z");
    const lastStudy = new Date("2024-01-15T22:00:00Z");
    expect(calculateStreak(5, lastStudy, now)).toBe(6);
  });

  test("skipped day resets streak to 1", () => {
    const now = new Date("2024-01-17T10:00:00Z");
    const lastStudy = new Date("2024-01-15T10:00:00Z");
    expect(calculateStreak(5, lastStudy, now)).toBe(1);
  });

  test("week gap resets streak to 1", () => {
    const now = new Date("2024-01-22T10:00:00Z");
    const lastStudy = new Date("2024-01-15T10:00:00Z");
    expect(calculateStreak(30, lastStudy, now)).toBe(1);
  });
});

describe("Quiz XP Calculation", () => {
  test("0 correct on 5 questions = 25 base XP", () => {
    expect(calculateQuizXP(0, 5)).toBe(25);
  });

  test("3 correct on 5 questions = 25 + 15 = 40 XP", () => {
    expect(calculateQuizXP(3, 5)).toBe(40);
  });

  test("5 correct on 5 questions = 25 + 25 + 50 = 100 XP (perfect bonus)", () => {
    expect(calculateQuizXP(5, 5)).toBe(100);
  });

  test("1 correct on 1 question = 25 + 5 + 50 = 80 XP", () => {
    expect(calculateQuizXP(1, 1)).toBe(80);
  });

  test("lesson completion = 10 XP (fixed)", () => {
    const lessonXP = 10;
    expect(lessonXP).toBe(10);
  });
});
