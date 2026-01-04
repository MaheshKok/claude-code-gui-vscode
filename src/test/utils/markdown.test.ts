import { describe, it, expect } from "vitest";
import {
    escapeHtml,
    unescapeHtml,
    extractCodeBlocks,
    detectLanguage,
    extractInlineCode,
    renderInlineCode,
    parseLinks,
    renderLink,
    autoLinkUrls,
    parseMarkdown,
    looksLikeMarkdown,
    stripMarkdown,
    getMarkdownTextLength,
} from "../../webview/utils/markdown";

describe("markdown utils", () => {
    describe("escapeHtml", () => {
        it("should escape ampersand", () => {
            expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
        });

        it("should escape less than", () => {
            expect(escapeHtml("a < b")).toBe("a &lt; b");
        });

        it("should escape greater than", () => {
            expect(escapeHtml("a > b")).toBe("a &gt; b");
        });

        it("should escape double quotes", () => {
            expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
        });

        it("should escape single quotes", () => {
            expect(escapeHtml("it's")).toBe("it&#39;s");
        });

        it("should escape backticks", () => {
            expect(escapeHtml("`code`")).toBe("&#x60;code&#x60;");
        });

        it("should escape forward slash", () => {
            expect(escapeHtml("a/b")).toBe("a&#x2F;b");
        });

        it("should escape equals sign", () => {
            expect(escapeHtml("a=b")).toBe("a&#x3D;b");
        });

        it("should escape multiple characters", () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toContain("&lt;");
            expect(escapeHtml('<script>alert("xss")</script>')).toContain("&gt;");
        });
    });

    describe("unescapeHtml", () => {
        it("should unescape ampersand", () => {
            expect(unescapeHtml("foo &amp; bar")).toBe("foo & bar");
        });

        it("should unescape less than", () => {
            expect(unescapeHtml("a &lt; b")).toBe("a < b");
        });

        it("should unescape greater than", () => {
            expect(unescapeHtml("a &gt; b")).toBe("a > b");
        });

        it("should unescape quotes", () => {
            expect(unescapeHtml("&quot;hello&quot;")).toBe('"hello"');
        });

        it("should be inverse of escapeHtml", () => {
            const original = '<div class="test">Hello & World</div>';
            expect(unescapeHtml(escapeHtml(original))).toBe(original);
        });
    });

    describe("extractCodeBlocks", () => {
        it("should extract a single code block", () => {
            const markdown = "```javascript\nconst x = 1;\n```";
            const blocks = extractCodeBlocks(markdown);
            expect(blocks.length).toBe(1);
            expect(blocks[0].language).toBe("javascript");
            expect(blocks[0].code).toBe("const x = 1;");
        });

        it("should extract multiple code blocks", () => {
            const markdown = "```js\ncode1\n```\n\n```python\ncode2\n```";
            const blocks = extractCodeBlocks(markdown);
            expect(blocks.length).toBe(2);
            expect(blocks[0].language).toBe("js");
            expect(blocks[1].language).toBe("python");
        });

        it("should default to plaintext when no language specified", () => {
            const markdown = "```\nsome code\n```";
            const blocks = extractCodeBlocks(markdown);
            expect(blocks[0].language).toBe("plaintext");
        });

        it("should include indices", () => {
            const markdown = "```js\ncode\n```";
            const blocks = extractCodeBlocks(markdown);
            expect(blocks[0].startIndex).toBe(0);
            expect(blocks[0].endIndex).toBe(markdown.length);
        });
    });

    describe("detectLanguage", () => {
        it("should detect python shebang", () => {
            expect(detectLanguage("#!/usr/bin/python\nprint('hello')")).toBe("python");
        });

        it("should detect node shebang", () => {
            expect(detectLanguage("#!/usr/bin/env node\nconsole.log('hi')")).toBe("javascript");
        });

        it("should detect bash shebang", () => {
            expect(detectLanguage("#!/bin/bash\necho hi")).toBe("shellscript");
        });

        it("should detect ruby shebang", () => {
            expect(detectLanguage("#!/usr/bin/ruby\nputs 'hi'")).toBe("ruby");
        });

        it("should detect perl shebang", () => {
            expect(detectLanguage("#!/usr/bin/perl\nprint 'hi';")).toBe("perl");
        });

        it("should detect python from imports and def", () => {
            expect(detectLanguage("import os\ndef main():\n    pass")).toBe("python");
        });

        it("should detect python from class with colon", () => {
            expect(detectLanguage("import typing\nclass Foo:\n    pass")).toBe("python");
        });

        it("should detect typescript from imports", () => {
            expect(detectLanguage("import React from 'react'")).toBe("typescript");
        });

        it("should detect javascript from const/let/function", () => {
            expect(detectLanguage("const x = 1;")).toBe("javascript");
            expect(detectLanguage("let y = 2;")).toBe("javascript");
            expect(detectLanguage("function foo() {}")).toBe("javascript");
        });

        it("should detect go from package and func", () => {
            expect(detectLanguage("package main\n\nfunc main() {}")).toBe("go");
        });

        it("should detect java from package", () => {
            expect(detectLanguage("package com.example;\n\nclass Main {}")).toBe("java");
        });

        it("should detect rust from use or fn", () => {
            expect(detectLanguage("use std::io;")).toBe("rust");
            expect(detectLanguage("fn main() {}")).toBe("rust");
        });

        it("should detect php", () => {
            expect(detectLanguage("<?php echo 'hello';")).toBe("php");
        });

        it("should detect html", () => {
            expect(detectLanguage("<!DOCTYPE html>")).toBe("html");
            expect(detectLanguage("<html>")).toBe("html");
        });

        it("should detect json", () => {
            expect(detectLanguage('{"key": "value"}')).toBe("json");
        });

        it("should detect shell from $ prefix", () => {
            expect(detectLanguage("$ npm install")).toBe("shellscript");
        });

        it("should return plaintext for unknown", () => {
            expect(detectLanguage("random text here")).toBe("plaintext");
        });
    });

    describe("extractInlineCode", () => {
        it("should extract inline code", () => {
            const segments = extractInlineCode("Use `npm install` to install");
            expect(segments.length).toBe(1);
            expect(segments[0].code).toBe("npm install");
        });

        it("should extract multiple inline codes", () => {
            const segments = extractInlineCode("`foo` and `bar`");
            expect(segments.length).toBe(2);
        });

        it("should not extract preceded by backticks", () => {
            // The function skips inline code preceded by ``
            const segments = extractInlineCode("``` `code`");
            expect(segments.length).toBe(0);
        });
    });

    describe("renderInlineCode", () => {
        it("should render inline code with class", () => {
            const result = renderInlineCode("npm install");
            expect(result).toContain('class="inline-code"');
            expect(result).toContain("npm install");
        });

        it("should escape HTML in code", () => {
            const result = renderInlineCode("<script>");
            expect(result).toContain("&lt;script&gt;");
        });
    });

    describe("parseLinks", () => {
        it("should parse markdown links", () => {
            const links = parseLinks("Click [here](https://example.com) for more");
            expect(links.length).toBe(1);
            expect(links[0].text).toBe("here");
            expect(links[0].url).toBe("https://example.com");
        });

        it("should parse multiple links", () => {
            const links = parseLinks("[a](url1) and [b](url2)");
            expect(links.length).toBe(2);
        });
    });

    describe("renderLink", () => {
        it("should render link with default target", () => {
            const result = renderLink("Click here", "https://example.com");
            expect(result).toContain('target="_blank"');
            expect(result).toContain('rel="noopener noreferrer"');
        });

        it("should render link with _self target", () => {
            const result = renderLink("Click here", "https://example.com", "_self");
            expect(result).toContain('target="_self"');
            expect(result).not.toContain("noopener");
        });

        it("should escape HTML in text and url", () => {
            const result = renderLink("test<script>", "https://example.com?a=1&b=2");
            expect(result).toContain("&lt;script&gt;");
            expect(result).toContain("&amp;");
        });
    });

    describe("autoLinkUrls", () => {
        it("should auto-link URLs", () => {
            const result = autoLinkUrls("Visit https://example.com today");
            expect(result).toContain('href="https:&#x2F;&#x2F;example.com"');
        });

        it("should auto-link bare URLs in markdown links", () => {
            const result = autoLinkUrls("[link](https://example.com)");
            // The URL in the markdown link gets auto-linked too
            expect(result).toContain("example.com");
        });
    });

    describe("parseMarkdown", () => {
        it("should render code blocks", () => {
            const result = parseMarkdown("```js\ncode\n```", { renderFormatting: false });
            expect(result).toContain('class="code-block"');
            expect(result).toContain("code");
        });

        it("should render inline code", () => {
            const result = parseMarkdown("Use `npm`", { escapeHtml: false });
            expect(result).toContain('class="inline-code"');
        });

        it("should render links", () => {
            const result = parseMarkdown("[link](https://example.com)");
            expect(result).toContain('class="markdown-link"');
        });

        it("should render bold text", () => {
            const result = parseMarkdown("This is **bold**");
            expect(result).toContain("<strong>bold</strong>");
        });

        it("should render italic text", () => {
            const result = parseMarkdown("This is *italic*");
            expect(result).toContain("<em>italic</em>");
        });

        it("should render strikethrough", () => {
            const result = parseMarkdown("This is ~~deleted~~");
            expect(result).toContain("<del>deleted</del>");
        });

        it("should render headers", () => {
            const result = parseMarkdown("# Title\n## Subtitle");
            expect(result).toContain("<h1");
            expect(result).toContain("<h2");
        });

        it("should render horizontal rules", () => {
            const result = parseMarkdown("text\n---\nmore text");
            expect(result).toContain('<hr class="markdown-hr"');
        });

        it("should render blockquotes", () => {
            const result = parseMarkdown("> This is a quote", { escapeHtml: false });
            expect(result).toContain('class="markdown-blockquote"');
        });

        it("should render unordered lists", () => {
            const result = parseMarkdown("- item 1\n- item 2");
            expect(result).toContain("<ul");
            expect(result).toContain("<li>item 1</li>");
        });

        it("should render ordered lists", () => {
            const result = parseMarkdown("1. first\n2. second");
            expect(result).toContain("<ol");
            expect(result).toContain("<li>first</li>");
        });

        it("should escape HTML when option is true", () => {
            const result = parseMarkdown("<script>alert('xss')</script>");
            expect(result).not.toContain("<script>");
        });

        it("should respect escapeHtml option", () => {
            const result = parseMarkdown("<b>bold</b>", { escapeHtml: false });
            expect(result).toContain("<b>bold</b>");
        });

        it("should use custom code block renderer", () => {
            const result = parseMarkdown("```js\ncode\n```", {
                escapeHtml: false,
                renderFormatting: false,
                codeBlockRenderer: (block) => `<custom>${block.code}</custom>`,
            });
            expect(result).toContain("<custom>code</custom>");
        });
    });

    describe("looksLikeMarkdown", () => {
        it("should detect headers", () => {
            expect(looksLikeMarkdown("# Title")).toBe(true);
            expect(looksLikeMarkdown("## Subtitle")).toBe(true);
        });

        it("should detect code blocks", () => {
            expect(looksLikeMarkdown("```\ncode\n```")).toBe(true);
        });

        it("should detect inline code", () => {
            expect(looksLikeMarkdown("Use `npm install`")).toBe(true);
        });

        it("should detect bold", () => {
            expect(looksLikeMarkdown("This is **bold**")).toBe(true);
        });

        it("should detect lists", () => {
            expect(looksLikeMarkdown("- item 1\n- item 2")).toBe(true);
            expect(looksLikeMarkdown("1. first\n2. second")).toBe(true);
        });

        it("should detect links", () => {
            expect(looksLikeMarkdown("[link](url)")).toBe(true);
        });

        it("should detect blockquotes", () => {
            expect(looksLikeMarkdown("> quote")).toBe(true);
        });

        it("should return false for plain text", () => {
            expect(looksLikeMarkdown("Just some plain text")).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(looksLikeMarkdown("")).toBe(false);
            expect(looksLikeMarkdown("   ")).toBe(false);
        });
    });

    describe("stripMarkdown", () => {
        it("should remove code blocks", () => {
            expect(stripMarkdown("```\ncode\n```")).toBe("");
        });

        it("should remove inline code", () => {
            expect(stripMarkdown("Use `npm`")).toBe("Use");
        });

        it("should keep link text", () => {
            expect(stripMarkdown("[link text](url)")).toBe("link text");
        });

        it("should remove bold markers", () => {
            expect(stripMarkdown("This is **bold**")).toBe("This is bold");
        });

        it("should remove italic markers", () => {
            expect(stripMarkdown("This is *italic*")).toBe("This is italic");
            expect(stripMarkdown("This is _italic_")).toBe("This is italic");
        });

        it("should remove strikethrough", () => {
            expect(stripMarkdown("This is ~~deleted~~")).toBe("This is deleted");
        });

        it("should remove header markers", () => {
            expect(stripMarkdown("# Title")).toBe("Title");
            expect(stripMarkdown("## Subtitle")).toBe("Subtitle");
        });

        it("should remove blockquote markers", () => {
            expect(stripMarkdown("> Quote")).toBe("Quote");
        });

        it("should remove list markers", () => {
            expect(stripMarkdown("- item")).toBe("item");
            expect(stripMarkdown("* item")).toBe("item");
            expect(stripMarkdown("1. item")).toBe("item");
        });
    });

    describe("getMarkdownTextLength", () => {
        it("should return length of stripped markdown", () => {
            expect(getMarkdownTextLength("# Title")).toBe(5); // "Title"
            expect(getMarkdownTextLength("**bold**")).toBe(4); // "bold"
        });
    });
});
