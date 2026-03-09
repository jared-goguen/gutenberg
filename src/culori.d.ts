declare module 'culori' {
  export interface Color {
    [key: string]: any;
    alpha?: number;
  }

  export function oklch(values: { l: number; c: number; h: number }): Color;
  export function parse(colorString: string): Color | null;
  export function formatCss(color: Color): string;
}
