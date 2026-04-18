/**
 * Get Cloudflare authentication credentials from environment variables.
 *
 * REQUIRED ENVIRONMENT VARIABLES:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID (find at dash.cloudflare.com)
 * - CLOUDFLARE_API_TOKEN: API token with "Account.Pages:Write" permission
 *   (create at https://dash.cloudflare.com/profile/api-tokens)
 *
 * If either variable is missing, this function throws immediately with a clear error.
 * Do NOT proceed without these credentials.
 */
export declare function getConfig(): {
    accountId: string;
    apiToken: string;
};
export declare function cfFetch<T = unknown>(path: string, options?: RequestInit): Promise<T>;
//# sourceMappingURL=cf.d.ts.map