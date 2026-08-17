import { describe, expect, it, afterEach } from "vitest";
import { isPlatformAdminEmail } from "@/lib/admin/is-platform-admin";

const ORIGINAL_ENV = process.env.ADMIN_EMAILS;

afterEach(() => {
  process.env.ADMIN_EMAILS = ORIGINAL_ENV;
});

describe("isPlatformAdminEmail", () => {
  it("returns false when ADMIN_EMAILS is not configured", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isPlatformAdminEmail("adminclickpost@gmail.com")).toBe(false);
  });

  it("returns false for null/undefined/empty email", () => {
    process.env.ADMIN_EMAILS = "adminclickpost@gmail.com";
    expect(isPlatformAdminEmail(null)).toBe(false);
    expect(isPlatformAdminEmail(undefined)).toBe(false);
    expect(isPlatformAdminEmail("")).toBe(false);
  });

  it("recognizes the configured admin email", () => {
    process.env.ADMIN_EMAILS = "adminclickpost@gmail.com";
    expect(isPlatformAdminEmail("adminclickpost@gmail.com")).toBe(true);
  });

  it("is case-insensitive and trims whitespace", () => {
    process.env.ADMIN_EMAILS = "adminclickpost@gmail.com";
    expect(isPlatformAdminEmail("AdminClickpost@GMAIL.com")).toBe(true);
    expect(isPlatformAdminEmail("  adminclickpost@gmail.com  ")).toBe(true);
  });

  it("rejects a normal user email even when close to an admin one", () => {
    process.env.ADMIN_EMAILS = "adminclickpost@gmail.com";
    expect(isPlatformAdminEmail("notadmin@gmail.com")).toBe(false);
    expect(isPlatformAdminEmail("adminclickpost@gmail.com.evil.test")).toBe(false);
  });

  it("supports a comma-separated list, never granting access to an email not in it", () => {
    process.env.ADMIN_EMAILS = "adminclickpost@gmail.com, second-admin@example.com";
    expect(isPlatformAdminEmail("second-admin@example.com")).toBe(true);
    expect(isPlatformAdminEmail("third@example.com")).toBe(false);
  });

  it("never treats an empty ADMIN_EMAILS entry as a wildcard match", () => {
    process.env.ADMIN_EMAILS = "admin@example.com,,";
    expect(isPlatformAdminEmail("")).toBe(false);
    expect(isPlatformAdminEmail("random@example.com")).toBe(false);
  });
});
