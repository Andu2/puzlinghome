export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("**/*.{jpg,png}");
    eleventyConfig.setFrontMatterParsingOptions({
        language: "json",
    });
}