// @ts-expect-error This browser app does not install Node types, but Vitest runs this repository contract in Node.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("security posture", () => {
  it("ships a restrictive browser content security policy", () => {
    const html = readFileSync("index.html", "utf8");

    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("default-src 'self'");
    expect(html).toContain("script-src 'self'");
    expect(html).toContain("worker-src 'self' blob:");
    expect(html).toContain("connect-src 'none'");
    expect(html).not.toMatch(/hubspot|hs-script-loader|js-na2\.hs-scripts\.com/i);
  });

  it("does not depend on the vulnerable xlsx package", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    expect(dependencies).not.toHaveProperty("xlsx");
  });
});
