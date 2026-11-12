module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ images: "images" });

  eleventyConfig.addFilter("fmtDate", (value, lang) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    if (lang === "zh") return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  });

  eleventyConfig.addFilter("countCat", (list, key) =>
    (list || []).filter((item) => item.data.category === key).length
  );

  eleventyConfig.addFilter("countHer", (list) =>
    (list || []).filter((item) => item.data.her_game).length
  );

  eleventyConfig.addFilter("findTwin", (list, slug) =>
    (list || []).find(
      (item) => item.page.fileSlug === slug || item.data.slug === slug
    )
  );

  eleventyConfig.addFilter("readingTime", (html) => {
    const text = String(html || "").replace(/<[^>]*>/g, " ");
    const latinWords = (text.match(/[A-Za-z0-9'’-]+/g) || []).length;
    const cjkChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const minutes = latinWords / 220 + cjkChars / 400;
    return Math.max(1, Math.round(minutes));
  });

  const byDateDesc = (a, b) => new Date(b.data.date) - new Date(a.data.date);

  eleventyConfig.addCollection("articlesEn", (api) =>
    api.getFilteredByGlob("src/content/articles/en/*.md").sort(byDateDesc)
  );

  eleventyConfig.addCollection("articlesZh", (api) =>
    api.getFilteredByGlob("src/content/articles/zh/*.md").sort(byDateDesc)
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"]
  };
};
