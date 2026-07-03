import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { transform as minifyCss } from "lightningcss";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "html-minifier-terser";

// TODO: figure out what the AI was doing with all this crap
const HASH_LENGTH = 10;
const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "_site");
const OUTPUT_ASSETS_DIR = path.join(OUTPUT_DIR, "assets");

let assetManifest = {};

const ASSET_PIPELINE = [
    {
        publicPath: "/assets/puzlstyle.css",
        sourcePath: path.join(PROJECT_ROOT, "assets", "puzlstyle.css"),
        minify: async function(sourcePath) {
            const cssSource = await fs.readFile(sourcePath);
            const cssResult = minifyCss({
                filename: sourcePath,
                code: cssSource,
                minify: true,
                sourceMap: false,
            });
            return {
                code: cssResult.code,
                encoding: null,
            };
        },
    },
    {
        publicPath: "/assets/puzleffects.js",
        sourcePath: path.join(PROJECT_ROOT, "assets", "puzleffects.js"),
        minify: async function(sourcePath) {
            const jsSource = await fs.readFile(sourcePath, "utf8");
            const jsResult = await minifyJs(jsSource, {
                compress: true,
                mangle: true,
                format: { comments: false },
            });
            return {
                code: jsResult.code || jsSource,
                encoding: "utf8",
            };
        },
    },
];

function buildHashedFileName(fileName, hash) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    return `${base}.${hash}${ext}`;
}

function buildHash(contents) {
    return createHash("sha256").update(contents).digest("hex").slice(0, HASH_LENGTH);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDate(value) {
    if (!value) {
        return null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed;
}

function formatDate(value) {
    const normalized = normalizeDate(value);
    if (!normalized) {
        return "";
    }

    const year = normalized.getUTCFullYear();
    const month = String(normalized.getUTCMonth() + 1).padStart(2, "0");
    const day = String(normalized.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getMostRecentDate(dateValue, updateDateValue) {
    const date = normalizeDate(dateValue);
    const updateDate = normalizeDate(updateDateValue);

    if (!date && !updateDate) {
        return null;
    }
    if (!date) {
        return updateDate;
    }
    if (!updateDate) {
        return date;
    }
    return date >= updateDate ? date : updateDate;
}

async function getNunjucksContentFiles(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "_includes") {
                continue;
            }
            files.push(...(await getNunjucksContentFiles(fullPath)));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith(".njk")) {
            files.push(fullPath);
        }
    }

    return files;
}

function getFrontMatterData(fileContents) {
    const frontMatterMatch = fileContents.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!frontMatterMatch) {
        return null;
    }

    const frontMatterRaw = frontMatterMatch[1].trim();
    if (!frontMatterRaw) {
        return null;
    }

    try {
        return JSON.parse(frontMatterRaw);
    } catch {
        return null;
    }
}

function buildUrlFromContentPath(filePath) {
    const relativePath = path.relative(CONTENT_DIR, filePath);
    const withoutExt = relativePath.replace(/\.njk$/, "");
    const segments = withoutExt.split(path.sep);

    if (segments.length === 1 && segments[0] === "index") {
        return "/";
    }
    if (segments[segments.length - 1] === "index") {
        return `/${segments.slice(0, -1).join("/")}/`;
    }
    if (segments.length > 1 && segments[segments.length - 1] === segments[segments.length - 2]) {
        return `/${segments.slice(0, -1).join("/")}/`;
    }
    return `/${segments.join("/")}/`;
}

async function buildDatedPagesList() {
    const files = await getNunjucksContentFiles(CONTENT_DIR);
    const pages = [];

    for (const filePath of files) {
        const source = await fs.readFile(filePath, "utf8");
        const frontMatterData = getFrontMatterData(source);
        if (!frontMatterData) {
            continue;
        }

        const date = normalizeDate(frontMatterData.date);
        const updateDate = normalizeDate(frontMatterData.updateDate);
        const sortDate = getMostRecentDate(date, updateDate);
        if (!sortDate) {
            continue;
        }

        const primaryDate = date || updateDate;
        pages.push({
            title: frontMatterData.title || buildUrlFromContentPath(filePath),
            url: buildUrlFromContentPath(filePath),
            formattedDate: formatDate(primaryDate),
            formattedUpdateDate: formatDate(updateDate),
            sortTime: sortDate.getTime(),
            primaryTime: primaryDate.getTime(),
        });
    }

    pages.sort(function(a, b) {
        if (b.sortTime !== a.sortTime) {
            return b.sortTime - a.sortTime;
        }
        if (b.primaryTime !== a.primaryTime) {
            return b.primaryTime - a.primaryTime;
        }
        return a.title.localeCompare(b.title);
    });

    return pages;
}

async function removeOldFingerprintedFiles(assetsDir, fileName, keepName) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    const fingerprintedName = new RegExp(`^${escapeRegex(base)}\\.[a-f0-9]{${HASH_LENGTH}}${escapeRegex(ext)}$`);

    const entries = await fs.readdir(assetsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile() && fingerprintedName.test(entry.name) && entry.name !== keepName) {
            await fs.unlink(path.join(assetsDir, entry.name));
        }
    }
}

async function buildAssetManifest() {
    await fs.mkdir(OUTPUT_ASSETS_DIR, { recursive: true });

    const nextManifest = {};

    for (const asset of ASSET_PIPELINE) {
        const sourceFileName = path.basename(asset.sourcePath);
        const minified = await asset.minify(asset.sourcePath);
        const hash = buildHash(minified.code);
        const hashedFileName = buildHashedFileName(sourceFileName, hash);

        await fs.writeFile(path.join(OUTPUT_ASSETS_DIR, hashedFileName), minified.code, minified.encoding || undefined);
        await removeOldFingerprintedFiles(OUTPUT_ASSETS_DIR, sourceFileName, hashedFileName);

        nextManifest[asset.publicPath] = `/assets/${hashedFileName}`;
    }

    return nextManifest;
}

function addEpiphanyTierCollection(eleventyConfig, tier) {
    const collectionName = `epiphany${tier}`;
    eleventyConfig.addCollection(collectionName, function(collectionApi) {
        const fullList = collectionApi.getFilteredByTag("epiphanygame");
        return fullList.filter(function(item) {
            return item.data.tier == tier;
        }).sort(function(a, b) {
            return a.data.order - b.data.order;
        });
    });
}

export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("**/*.{jpg,png,svg}");
    eleventyConfig.setFrontMatterParsingOptions({
        language: "json",
    });

    for (const tier of ["S", "A", "B", "C", "D"]) {
        addEpiphanyTierCollection(eleventyConfig, tier);
    }

    eleventyConfig.addGlobalData("datedPages", async function() {
        return buildDatedPagesList();
    });

    eleventyConfig.addGlobalData("assetManifest", async function() {
        assetManifest = await buildAssetManifest();
        return assetManifest;
    });

    eleventyConfig.addFilter("assetUrl", function(assetPath) {
        return assetManifest[assetPath] || assetPath;
    });

    eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
        if (outputPath && outputPath.endsWith(".html")) {
            return await minifyHtml(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true,
                conservativeCollapse: true, // Would be nice to not have to do this, but for things like "text <span>hi</span> text"
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                minifyJS: true,
                minifyCSS: true,
            });
        }
        return content;
    });

    eleventyConfig.on("eleventy.after", async ({ dir }) => {
        const assetsDir = path.join(dir.output, "assets");
        for (const asset of ASSET_PIPELINE) {
            const unhashedOutputPath = path.join(assetsDir, path.basename(asset.sourcePath));
            try {
                await fs.unlink(unhashedOutputPath);
            } catch (err) {
                if (err.code !== "ENOENT") {
                    throw err;
                }
            }
        }
    });

    return {
        htmlTemplateEngine: "njk",
    };
}