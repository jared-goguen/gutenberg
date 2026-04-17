export interface ContentData {
  variant: "prose" | "narrow" | "wide";
  markdown?: string;
  html?: string;
}

export function extractContentData(section: any): ContentData {
  const variant = section.variant || "prose";
  return { 
    variant,
    markdown: section.markdown, 
    html: section.html 
  };
}
