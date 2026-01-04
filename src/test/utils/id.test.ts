import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    generateId,
    createIdGenerator,
    ID_PREFIXES,
    idGenerators,
    generateRandomString,
    generateUUID,
} from "../../shared/utils/id";

describe("ID utilities", () => {
    describe("generateId", () => {
        it("should generate ID with correct prefix", () => {
            const id = generateId("test");
            expect(id).toMatch(/^test-\d+-[a-z0-9]+$/);
        });

        it("should include timestamp in ID", () => {
            const before = Date.now();
            const id = generateId("notification");
            const after = Date.now();

            const parts = id.split("-");
            const timestamp = parseInt(parts[1], 10);

            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });

        it("should generate unique IDs", () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(generateId("test"));
            }
            expect(ids.size).toBe(100);
        });

        it("should handle empty prefix", () => {
            const id = generateId("");
            expect(id).toMatch(/^-\d+-[a-z0-9]+$/);
        });

        it("should handle special characters in prefix", () => {
            const id = generateId("my-prefix");
            expect(id.startsWith("my-prefix-")).toBe(true);
        });
    });

    describe("createIdGenerator", () => {
        it("should create a generator with fixed prefix", () => {
            const generator = createIdGenerator("custom");
            const id = generator();
            expect(id).toMatch(/^custom-\d+-[a-z0-9]+$/);
        });

        it("should generate unique IDs from same generator", () => {
            const generator = createIdGenerator("test");
            const id1 = generator();
            const id2 = generator();
            expect(id1).not.toBe(id2);
        });

        it("should maintain prefix across calls", () => {
            const generator = createIdGenerator("myprefix");
            for (let i = 0; i < 10; i++) {
                const id = generator();
                expect(id.startsWith("myprefix-")).toBe(true);
            }
        });
    });

    describe("ID_PREFIXES", () => {
        it("should have NOTIFICATION prefix", () => {
            expect(ID_PREFIXES.NOTIFICATION).toBe("notification");
        });

        it("should have CONVERSATION prefix", () => {
            expect(ID_PREFIXES.CONVERSATION).toBe("conv");
        });

        it("should have MESSAGE prefix", () => {
            expect(ID_PREFIXES.MESSAGE).toBe("msg");
        });

        it("should have TOOL_USE prefix", () => {
            expect(ID_PREFIXES.TOOL_USE).toBe("tool");
        });

        it("should have PERMISSION prefix", () => {
            expect(ID_PREFIXES.PERMISSION).toBe("perm");
        });

        it("should have SESSION prefix", () => {
            expect(ID_PREFIXES.SESSION).toBe("session");
        });

        it("should have ATTACHMENT prefix", () => {
            expect(ID_PREFIXES.ATTACHMENT).toBe("attach");
        });

        it("should have MCP_SERVER prefix", () => {
            expect(ID_PREFIXES.MCP_SERVER).toBe("mcp");
        });
    });

    describe("idGenerators", () => {
        it("should have notification generator", () => {
            const id = idGenerators.notification();
            expect(id).toMatch(/^notification-\d+-[a-z0-9]+$/);
        });

        it("should have conversation generator", () => {
            const id = idGenerators.conversation();
            expect(id).toMatch(/^conv-\d+-[a-z0-9]+$/);
        });

        it("should have message generator", () => {
            const id = idGenerators.message();
            expect(id).toMatch(/^msg-\d+-[a-z0-9]+$/);
        });

        it("should have toolUse generator", () => {
            const id = idGenerators.toolUse();
            expect(id).toMatch(/^tool-\d+-[a-z0-9]+$/);
        });

        it("should have permission generator", () => {
            const id = idGenerators.permission();
            expect(id).toMatch(/^perm-\d+-[a-z0-9]+$/);
        });

        it("should have session generator", () => {
            const id = idGenerators.session();
            expect(id).toMatch(/^session-\d+-[a-z0-9]+$/);
        });

        it("should have attachment generator", () => {
            const id = idGenerators.attachment();
            expect(id).toMatch(/^attach-\d+-[a-z0-9]+$/);
        });

        it("should have mcpServer generator", () => {
            const id = idGenerators.mcpServer();
            expect(id).toMatch(/^mcp-\d+-[a-z0-9]+$/);
        });
    });

    describe("generateRandomString", () => {
        it("should generate string of default length (9)", () => {
            const str = generateRandomString();
            expect(str.length).toBe(9);
        });

        it("should generate string of specified length", () => {
            const str = generateRandomString(16);
            expect(str.length).toBe(16);
        });

        it("should generate alphanumeric string", () => {
            const str = generateRandomString(20);
            expect(str).toMatch(/^[a-z0-9]+$/);
        });

        it("should generate unique strings", () => {
            const strings = new Set<string>();
            for (let i = 0; i < 100; i++) {
                strings.add(generateRandomString());
            }
            expect(strings.size).toBe(100);
        });

        it("should handle length of 1", () => {
            const str = generateRandomString(1);
            expect(str.length).toBe(1);
        });

        it("should handle large length", () => {
            const str = generateRandomString(100);
            expect(str.length).toBe(100);
        });
    });

    describe("generateUUID", () => {
        it("should generate valid UUID v4 format", () => {
            const uuid = generateUUID();
            expect(uuid).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
        });

        it("should generate unique UUIDs", () => {
            const uuids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                uuids.add(generateUUID());
            }
            expect(uuids.size).toBe(100);
        });

        it("should generate valid UUID format consistently", () => {
            // Run multiple times to test consistency
            for (let i = 0; i < 10; i++) {
                const uuid = generateUUID();
                expect(uuid).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                );
            }
        });

        it("should have version 4 in UUID", () => {
            const uuid = generateUUID();
            // The 13th character should be '4' indicating UUID v4
            expect(uuid.charAt(14)).toBe("4");
        });
    });
});
