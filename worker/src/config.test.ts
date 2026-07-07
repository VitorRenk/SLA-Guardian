import { describe, expect, it } from "vitest";
import { parseTargetUrls } from "./config";

describe("parseTargetUrls", () => {
  it("parses TARGET_URLS, trims values and removes duplicates", () => {
    expect(
      parseTargetUrls({
        TARGET_URLS: " https://a.com,https://b.com, https://a.com ,,",
      }),
    ).toEqual(["https://a.com", "https://b.com"]);
  });

  it("falls back to TARGET_URL", () => {
    expect(parseTargetUrls({ TARGET_URL: "https://single.com" })).toEqual([
      "https://single.com",
    ]);
  });

  it("uses google as default when no target is configured", () => {
    expect(parseTargetUrls({})).toEqual(["https://google.com"]);
  });
});
