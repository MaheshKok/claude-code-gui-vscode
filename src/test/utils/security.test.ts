import { describe, it, expect } from "vitest";
import { sanitizeShellPath, validateProcessId } from "@shared/utils/security";

describe("Security: Command Injection Prevention", () => {
    describe("sanitizeShellPath", () => {
        it("should reject paths with shell metacharacters", () => {
            const maliciousPath = "/usr/bin/node; rm -rf / #";
            expect(() => sanitizeShellPath(maliciousPath)).toThrow("Invalid characters in path");
        });

        it("should accept valid Unix paths", () => {
            const validPath = "/usr/local/bin/node";
            expect(sanitizeShellPath(validPath)).toBe(validPath);
        });

        it("should reject paths with pipe characters", () => {
            const maliciousPath = "/usr/bin/node | cat /etc/passwd";
            expect(() => sanitizeShellPath(maliciousPath)).toThrow("Invalid characters in path");
        });

        it("should reject paths with backticks", () => {
            const maliciousPath = "/usr/bin/`whoami`";
            expect(() => sanitizeShellPath(maliciousPath)).toThrow("Invalid characters in path");
        });

        it("should reject paths with command substitution", () => {
            const maliciousPath = "/usr/bin/$(rm -rf /)";
            expect(() => sanitizeShellPath(maliciousPath)).toThrow("Invalid characters in path");
        });

        it("should accept valid Windows paths", () => {
            const validPath = "C:\\Program Files\\nodejs\\node.exe";
            expect(sanitizeShellPath(validPath)).toBe(validPath);
        });
    });

    describe("validateProcessId", () => {
        it("should reject negative PIDs", () => {
            expect(() => validateProcessId(-1)).toThrow("Invalid process ID");
        });

        it("should reject zero PID", () => {
            expect(() => validateProcessId(0)).toThrow("Invalid process ID");
        });

        it("should reject non-integer PIDs", () => {
            expect(() => validateProcessId(12.34)).toThrow("Invalid process ID");
        });

        it("should accept valid PIDs", () => {
            expect(validateProcessId(1234)).toBe(1234);
        });

        it("should accept valid large PIDs", () => {
            expect(validateProcessId(99999)).toBe(99999);
        });
    });
});
