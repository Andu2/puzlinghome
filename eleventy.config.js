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

    eleventyConfig.addCollection("sortedPages", function(collectionApi) {
        return collectionApi.getAll()
        .filter(function(page) {
            return !!page.data.createDate
        })
        .sort(function(a, b) {
            const aDate = a.data.updateDate || a.data.createDate;
            const bDate = b.data.updateDate || b.data.createDate;
            // Configured dates shall be in yyyy-mm-dd format, so a simple text comparison is okay
            if (aDate > bDate) return -1;
            else if (aDate < bDate) return 1;
            else {
                return b.date - a.date;
            }
        });
    });

    // for /epiphanylist
    for (const tier of ["S", "A", "B", "C", "D"]) {
        addEpiphanyTierCollection(eleventyConfig, tier);
    }

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