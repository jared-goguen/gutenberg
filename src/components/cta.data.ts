export interface CtaData {
  variant: "centered" | "split" | "banner";
  overline?: string;
  heading: string;
  description?: string;
  ctas: Array<{ text: string; href: string }>;
}

export function extractCtaData(section: any): CtaData {
  const variant = section.variant || "centered";
  const ctas = Array.isArray(section.cta) ? section.cta : section.cta ? [section.cta] : [];
  return { 
    variant,
    overline: section.overline,
    heading: section.heading, 
    description: section.description, 
    ctas 
  };
}
