/**
 * SVG Icon System for Gutenberg
 * Uses Heroicons-style SVG icons
 */
export interface IconDefinition {
    svg: string;
    viewBox?: string;
}
/**
 * Icon library - Heroicons-compatible 24x24 outline icons
 */
export declare const icons: Record<string, IconDefinition>;
/**
 * Render an icon as inline SVG with proper styling
 */
export declare function renderIcon(name: string, options?: {
    className?: string;
    size?: number;
    strokeWidth?: number;
}): string;
/**
 * Get list of all available icon names
 */
export declare function getIconNames(): string[];
//# sourceMappingURL=icons.d.ts.map