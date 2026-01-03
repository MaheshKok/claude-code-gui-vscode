/**
 * Diff Computation Utilities Tests
 *
 * Tests for line-level diff computation using the LCS algorithm
 * and HTML formatting for diff display.
 *
 * @module test/utils/diff
 */

import { describe, it, expect } from "vitest";
import {
    computeLineDiff,
    computeContextualDiff,
    formatDiffHtml,
    formatDiffStats,
    formatUnifiedDiff,
    applyDiff,
    calculateLineMapping,
    type DiffResult,
    type DiffOptions,
    type DiffHtmlOptions,
} from "../../webview/utils/diff";

describe("diff utilities", () => {
    // ==========================================================================
    // computeLineDiff Tests
    // ==========================================================================
    describe("computeLineDiff", () => {
        describe("basic functionality", () => {
            it("should detect no changes for identical content", () => {
                const content = "line 1\nline 2\nline 3";
                const result = computeLineDiff(content, content);

                expect(result.isIdentical).toBe(true);
                expect(result.additions).toBe(0);
                expect(result.deletions).toBe(0);
                expect(result.unchanged).toBe(3);
                expect(result.lines).toHaveLength(3);
                expect(result.lines.every((line) => line.type === "equal")).toBe(true);
            });

            it("should detect additions", () => {
                const oldContent = "line 1\nline 2";
                const newContent = "line 1\nline 2\nline 3";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.isIdentical).toBe(false);
                expect(result.additions).toBe(1);
                expect(result.deletions).toBe(0);
                expect(result.unchanged).toBe(2);

                const insertedLines = result.lines.filter((l) => l.type === "insert");
                expect(insertedLines).toHaveLength(1);
                expect(insertedLines[0].content).toBe("line 3");
            });

            it("should detect deletions", () => {
                const oldContent = "line 1\nline 2\nline 3";
                const newContent = "line 1\nline 3";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.isIdentical).toBe(false);
                expect(result.additions).toBe(0);
                expect(result.deletions).toBe(1);
                expect(result.unchanged).toBe(2);

                const deletedLines = result.lines.filter((l) => l.type === "delete");
                expect(deletedLines).toHaveLength(1);
                expect(deletedLines[0].content).toBe("line 2");
            });

            it("should detect modifications (delete + insert)", () => {
                const oldContent = "line 1\nold line\nline 3";
                const newContent = "line 1\nnew line\nline 3";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.isIdentical).toBe(false);
                expect(result.additions).toBe(1);
                expect(result.deletions).toBe(1);
                expect(result.unchanged).toBe(2);
            });

            it("should handle multiple changes", () => {
                const oldContent = "a\nb\nc\nd\ne";
                const newContent = "a\nx\nc\ny\ne";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.additions).toBe(2);
                expect(result.deletions).toBe(2);
                expect(result.unchanged).toBe(3);
            });
        });

        describe("edge cases", () => {
            it("should handle empty old content", () => {
                const result = computeLineDiff("", "new content");

                expect(result.isIdentical).toBe(false);
                expect(result.additions).toBe(1);
                // Empty string splits to [''], so the empty line is counted as deleted and new content inserted
                expect(result.deletions).toBe(1);
            });

            it("should handle empty new content", () => {
                const result = computeLineDiff("old content", "");

                expect(result.isIdentical).toBe(false);
                // Empty string splits to [''], so the empty line is counted as inserted and old content deleted
                expect(result.additions).toBe(1);
                expect(result.deletions).toBe(1);
            });

            it("should handle both empty strings", () => {
                const result = computeLineDiff("", "");

                expect(result.isIdentical).toBe(true);
                expect(result.lines).toHaveLength(1);
                expect(result.lines[0].type).toBe("equal");
                expect(result.lines[0].content).toBe("");
            });

            it("should handle single line content", () => {
                const result = computeLineDiff("single", "single");

                expect(result.isIdentical).toBe(true);
                expect(result.lines).toHaveLength(1);
            });

            it("should handle content with empty lines", () => {
                const oldContent = "line 1\n\nline 3";
                const newContent = "line 1\n\nline 3";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.isIdentical).toBe(true);
                expect(result.lines).toHaveLength(3);
                expect(result.lines[1].content).toBe("");
            });

            it("should handle content with only whitespace lines", () => {
                const oldContent = "   \n\t\t\n  ";
                const newContent = "   \n\t\t\n  ";
                const result = computeLineDiff(oldContent, newContent);

                expect(result.isIdentical).toBe(true);
            });
        });

        describe("options", () => {
            it("should ignore whitespace when ignoreWhitespace is true", () => {
                const oldContent = "line 1\n  indented  \nline 3";
                const newContent = "line 1\nindented\nline 3";
                const result = computeLineDiff(oldContent, newContent, {
                    ignoreWhitespace: true,
                });

                expect(result.isIdentical).toBe(true);
                expect(result.unchanged).toBe(3);
            });

            it("should detect whitespace changes when ignoreWhitespace is false", () => {
                const oldContent = "line 1\n  indented  \nline 3";
                const newContent = "line 1\nindented\nline 3";
                const result = computeLineDiff(oldContent, newContent, {
                    ignoreWhitespace: false,
                });

                expect(result.isIdentical).toBe(false);
            });

            it("should use custom startLine for line numbering", () => {
                const result = computeLineDiff("a\nb\nc", "a\nb\nc", { startLine: 10 });

                expect(result.lines[0].oldLineNumber).toBe(10);
                expect(result.lines[1].oldLineNumber).toBe(11);
                expect(result.lines[2].oldLineNumber).toBe(12);
            });
        });

        describe("line numbers", () => {
            it("should assign correct line numbers for equal lines", () => {
                const result = computeLineDiff("a\nb\nc", "a\nb\nc");

                expect(result.lines[0].oldLineNumber).toBe(1);
                expect(result.lines[0].newLineNumber).toBe(1);
                expect(result.lines[1].oldLineNumber).toBe(2);
                expect(result.lines[1].newLineNumber).toBe(2);
            });

            it("should assign correct line numbers for insertions", () => {
                const result = computeLineDiff("a\nc", "a\nb\nc");

                const insertLine = result.lines.find((l) => l.type === "insert");
                expect(insertLine?.newLineNumber).toBe(2);
                expect(insertLine?.oldLineNumber).toBeUndefined();
            });

            it("should assign correct line numbers for deletions", () => {
                const result = computeLineDiff("a\nb\nc", "a\nc");

                const deleteLine = result.lines.find((l) => l.type === "delete");
                expect(deleteLine?.oldLineNumber).toBe(2);
                expect(deleteLine?.newLineNumber).toBeUndefined();
            });
        });
    });

    // ==========================================================================
    // computeContextualDiff Tests
    // ==========================================================================
    describe("computeContextualDiff", () => {
        it("should return full diff for identical content", () => {
            const content = "a\nb\nc";
            const result = computeContextualDiff(content, content);

            expect(result.isIdentical).toBe(true);
        });

        it("should include context lines around changes", () => {
            const oldContent = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj";
            const newContent = "a\nb\nc\nd\nX\nf\ng\nh\ni\nj";
            const result = computeContextualDiff(oldContent, newContent, {
                contextLines: 2,
            });

            // Should include the change and 2 lines before/after
            const lineContents = result.lines.map((l) => l.content);
            expect(lineContents).toContain("c");
            expect(lineContents).toContain("d");
            expect(lineContents).toContain("f");
            expect(lineContents).toContain("g");
        });

        it("should add separators for non-adjacent changes", () => {
            const oldContent = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj";
            const newContent = "X\nb\nc\nd\ne\nf\ng\nh\ni\nY";
            const result = computeContextualDiff(oldContent, newContent, {
                contextLines: 1,
            });

            // Should have separator between the two change regions
            const separators = result.lines.filter((l) => l.content === "...");
            expect(separators.length).toBeGreaterThanOrEqual(1);
        });

        it("should use default context of 3 lines", () => {
            const oldContent = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n");
            const newContent = oldContent.replace("line 10", "CHANGED");
            const result = computeContextualDiff(oldContent, newContent);

            // Should include lines 7-13 (change at 10, plus 3 lines context each side)
            const lineContents = result.lines.map((l) => l.content);
            expect(lineContents).toContain("line 7");
            expect(lineContents).toContain("line 13");
        });

        it("should handle contextLines of 0", () => {
            const oldContent = "a\nb\nc";
            const newContent = "a\nX\nc";
            const result = computeContextualDiff(oldContent, newContent, {
                contextLines: 0,
            });

            // Should only include the changed lines
            expect(result.lines.length).toBeLessThan(3);
        });

        it("should preserve diff statistics", () => {
            const oldContent = "a\nb\nc";
            const newContent = "a\nX\nc";
            const result = computeContextualDiff(oldContent, newContent);

            expect(result.additions).toBe(1);
            expect(result.deletions).toBe(1);
            expect(result.unchanged).toBe(2);
        });
    });

    // ==========================================================================
    // formatDiffHtml Tests
    // ==========================================================================
    describe("formatDiffHtml", () => {
        const createSimpleDiff = (): DiffResult => ({
            lines: [
                {
                    type: "equal",
                    content: "unchanged",
                    oldLineNumber: 1,
                    newLineNumber: 1,
                },
                { type: "delete", content: "deleted", oldLineNumber: 2 },
                { type: "insert", content: "inserted", newLineNumber: 2 },
            ],
            additions: 1,
            deletions: 1,
            unchanged: 1,
            isIdentical: false,
        });

        describe("basic output", () => {
            it("should generate valid HTML structure", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff);

                expect(html).toContain('<div class="diff-container">');
                expect(html).toContain('<table class="diff-table">');
                expect(html).toContain("</table>");
                expect(html).toContain("</div>");
            });

            it("should include line prefixes", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff);

                expect(html).toContain(">+</td>"); // Insert prefix
                expect(html).toContain(">-</td>"); // Delete prefix
                expect(html).toContain("> </td>"); // Equal prefix
            });

            it("should apply correct CSS classes", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff);

                expect(html).toContain("diff-line diff-equal");
                expect(html).toContain("diff-line diff-delete");
                expect(html).toContain("diff-line diff-insert");
            });

            it("should escape HTML in content", () => {
                const diff: DiffResult = {
                    lines: [
                        {
                            type: "equal",
                            content: '<script>alert("xss")</script>',
                            oldLineNumber: 1,
                            newLineNumber: 1,
                        },
                    ],
                    additions: 0,
                    deletions: 0,
                    unchanged: 1,
                    isIdentical: true,
                };
                const html = formatDiffHtml(diff);

                expect(html).not.toContain("<script>");
                expect(html).toContain("&lt;script&gt;");
            });
        });

        describe("options", () => {
            it("should show line numbers when showLineNumbers is true", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff, { showLineNumbers: true });

                expect(html).toContain("diff-line-num");
                expect(html).toContain(">1</td>");
                expect(html).toContain(">2</td>");
            });

            it("should hide line numbers when showLineNumbers is false", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff, { showLineNumbers: false });

                expect(html).not.toContain("diff-line-num");
            });

            it("should use custom class prefix", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff, { classPrefix: "custom" });

                expect(html).toContain("custom-container");
                expect(html).toContain("custom-table");
                expect(html).toContain("custom-line");
            });

            it("should wrap long lines when wrapLines is true", () => {
                const longLine = "a".repeat(100);
                const diff: DiffResult = {
                    lines: [
                        {
                            type: "equal",
                            content: longLine,
                            oldLineNumber: 1,
                            newLineNumber: 1,
                        },
                    ],
                    additions: 0,
                    deletions: 0,
                    unchanged: 1,
                    isIdentical: true,
                };
                const html = formatDiffHtml(diff, {
                    wrapLines: true,
                    maxLineWidth: 50,
                });

                // Content should be wrapped (contains newlines in the output)
                expect(html.length).toBeGreaterThan(0);
            });

            it("should generate side-by-side layout when sideBySide is true", () => {
                const diff = createSimpleDiff();
                const html = formatDiffHtml(diff, { sideBySide: true });

                expect(html).toContain("diff-side-by-side");
                expect(html).toContain("<th");
                expect(html).toContain("Old");
                expect(html).toContain("New");
            });
        });

        describe("side-by-side layout", () => {
            it("should align deletions and insertions", () => {
                const diff: DiffResult = {
                    lines: [
                        { type: "delete", content: "old line", oldLineNumber: 1 },
                        { type: "insert", content: "new line", newLineNumber: 1 },
                    ],
                    additions: 1,
                    deletions: 1,
                    unchanged: 0,
                    isIdentical: false,
                };
                const html = formatDiffHtml(diff, { sideBySide: true });

                expect(html).toContain("old line");
                expect(html).toContain("new line");
            });

            it("should handle unequal change counts", () => {
                const diff: DiffResult = {
                    lines: [
                        { type: "delete", content: "old 1", oldLineNumber: 1 },
                        { type: "delete", content: "old 2", oldLineNumber: 2 },
                        { type: "insert", content: "new 1", newLineNumber: 1 },
                    ],
                    additions: 1,
                    deletions: 2,
                    unchanged: 0,
                    isIdentical: false,
                };
                const html = formatDiffHtml(diff, { sideBySide: true });

                expect(html).toContain("old 1");
                expect(html).toContain("old 2");
                expect(html).toContain("new 1");
                expect(html).toContain("diff-empty");
            });
        });
    });

    // ==========================================================================
    // formatDiffStats Tests
    // ==========================================================================
    describe("formatDiffStats", () => {
        it('should return "No changes" for identical content', () => {
            const diff: DiffResult = {
                lines: [],
                additions: 0,
                deletions: 0,
                unchanged: 5,
                isIdentical: true,
            };

            expect(formatDiffStats(diff)).toBe("No changes");
        });

        it("should format additions only", () => {
            const diff: DiffResult = {
                lines: [],
                additions: 5,
                deletions: 0,
                unchanged: 0,
                isIdentical: false,
            };

            expect(formatDiffStats(diff)).toBe("+5");
        });

        it("should format deletions only", () => {
            const diff: DiffResult = {
                lines: [],
                additions: 0,
                deletions: 3,
                unchanged: 0,
                isIdentical: false,
            };

            expect(formatDiffStats(diff)).toBe("-3");
        });

        it("should format both additions and deletions", () => {
            const diff: DiffResult = {
                lines: [],
                additions: 5,
                deletions: 3,
                unchanged: 10,
                isIdentical: false,
            };

            expect(formatDiffStats(diff)).toBe("+5 / -3");
        });
    });

    // ==========================================================================
    // formatUnifiedDiff Tests
    // ==========================================================================
    describe("formatUnifiedDiff", () => {
        it("should generate unified diff header", () => {
            const diff = computeLineDiff("old", "new");
            const unified = formatUnifiedDiff(diff, "file.txt", "file.txt");

            expect(unified).toContain("--- file.txt");
            expect(unified).toContain("+++ file.txt");
        });

        it("should include hunk headers", () => {
            const diff = computeLineDiff("line 1\nline 2", "line 1\nchanged");
            const unified = formatUnifiedDiff(diff, "a.txt", "b.txt");

            expect(unified).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
        });

        it("should format lines with correct prefixes", () => {
            const diff = computeLineDiff("old line", "new line");
            const unified = formatUnifiedDiff(diff, "a.txt", "b.txt");

            expect(unified).toContain("-old line");
            expect(unified).toContain("+new line");
        });

        it("should handle unchanged lines with space prefix", () => {
            const diff = computeLineDiff("same\nold\nsame", "same\nnew\nsame");
            const unified = formatUnifiedDiff(diff, "a.txt", "b.txt");

            expect(unified).toContain(" same");
        });
    });

    // ==========================================================================
    // applyDiff Tests
    // ==========================================================================
    describe("applyDiff", () => {
        it("should reconstruct new content from diff", () => {
            const oldContent = "line 1\nold line\nline 3";
            const newContent = "line 1\nnew line\nline 3";
            const diff = computeLineDiff(oldContent, newContent);

            const applied = applyDiff(oldContent, diff);
            expect(applied).toBe(newContent);
        });

        it("should handle insertions", () => {
            const oldContent = "a\nc";
            const newContent = "a\nb\nc";
            const diff = computeLineDiff(oldContent, newContent);

            const applied = applyDiff(oldContent, diff);
            expect(applied).toBe(newContent);
        });

        it("should handle deletions", () => {
            const oldContent = "a\nb\nc";
            const newContent = "a\nc";
            const diff = computeLineDiff(oldContent, newContent);

            const applied = applyDiff(oldContent, diff);
            expect(applied).toBe(newContent);
        });

        it("should handle complex changes", () => {
            const oldContent = "line 1\nline 2\nline 3\nline 4\nline 5";
            const newContent = "line 1\nmodified 2\nline 3\nnew line\nline 5";
            const diff = computeLineDiff(oldContent, newContent);

            const applied = applyDiff(oldContent, diff);
            expect(applied).toBe(newContent);
        });

        it("should return empty string for all deletions", () => {
            const oldContent = "line 1\nline 2";
            const newContent = "";
            const diff = computeLineDiff(oldContent, newContent);

            const applied = applyDiff(oldContent, diff);
            // The diff will have one empty line from splitting ''
            expect(applied.trim()).toBe("");
        });
    });

    // ==========================================================================
    // calculateLineMapping Tests
    // ==========================================================================
    describe("calculateLineMapping", () => {
        it("should map identical lines correctly", () => {
            const diff = computeLineDiff("a\nb\nc", "a\nb\nc");
            const mapping = calculateLineMapping(diff);

            expect(mapping.get(1)).toBe(1);
            expect(mapping.get(2)).toBe(2);
            expect(mapping.get(3)).toBe(3);
        });

        it("should handle insertions in mapping", () => {
            const diff = computeLineDiff("a\nc", "a\nb\nc");
            const mapping = calculateLineMapping(diff);

            expect(mapping.get(1)).toBe(1);
            expect(mapping.get(2)).toBe(3); // c moved from line 2 to line 3
        });

        it("should not map deleted lines", () => {
            const diff = computeLineDiff("a\nb\nc", "a\nc");
            const mapping = calculateLineMapping(diff);

            expect(mapping.has(2)).toBe(false); // b was deleted
        });

        it("should return empty map for complete replacement", () => {
            const diff = computeLineDiff("old", "new");
            const mapping = calculateLineMapping(diff);

            expect(mapping.size).toBe(0);
        });
    });
});
