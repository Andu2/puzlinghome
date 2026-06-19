export default function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("**/*.{jpg,png}");
    eleventyConfig.setFrontMatterParsingOptions({
        language: "json",
    });

    eleventyConfig.addCollection("epiphanyS", function(collectionApi) {
        const fullList = collectionApi.getFilteredByTag("epiphanygame");
        return fullList.filter(function(item) {
            return item.data.tier == "S";
        }).sort(function(a, b) {
            return a.data.order - b.data.order;
        });
    });

    eleventyConfig.addCollection("epiphanyA", function(collectionApi) {
        const fullList = collectionApi.getFilteredByTag("epiphanygame");
        return fullList.filter(function(item) {
            return item.data.tier == "A";
        }).sort(function(a, b) {
            return a.data.order - b.data.order;
        });
    });

    eleventyConfig.addCollection("epiphanyB", function(collectionApi) {
        const fullList = collectionApi.getFilteredByTag("epiphanygame");
        return fullList.filter(function(item) {
            return item.data.tier == "B";
        }).sort(function(a, b) {
            return a.data.order - b.data.order;
        });
    });

    eleventyConfig.addCollection("epiphanyC", function(collectionApi) {
        const fullList = collectionApi.getFilteredByTag("epiphanygame");
        return fullList.filter(function(item) {
            return item.data.tier == "C";
        }).sort(function(a, b) {
            return a.data.order - b.data.order;
        });
    });

    return {
        htmlTemplateEngine: "njk",
    };
}