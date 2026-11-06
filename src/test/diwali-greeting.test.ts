import { describe, expect, it } from "vitest";

import {
  createGreetingFilename,
  GREETING_NAME_LIMIT,
  sanitizeGreetingName,
} from "@/lib/diwali-greeting";

describe("personalized Diwali greeting", () => {
  it("preserves Marathi names and trims surrounding spaces", () => {
    expect(sanitizeGreetingName("  स्नेहा पवार  ")).toBe("स्नेहा पवार");
  });

  it("limits a personalized name to 36 Unicode characters", () => {
    expect(Array.from(sanitizeGreetingName("R".repeat(50))).length).toBe(GREETING_NAME_LIMIT);
  });

  it("creates a safe filename while retaining the supplied name", () => {
    expect(createGreetingFilename("Asha / Joshi")).toBe("Praavi-Diwali-Wishes-Asha-Joshi.png");
  });
});