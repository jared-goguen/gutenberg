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
export function getConfig(): { accountId: string; apiToken: string } {
  const accountId = Bun.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = Bun.env.CLOUDFLARE_API_TOKEN;
  
  if (!accountId) {
    throw new Error(
      "Missing CLOUDFLARE_ACCOUNT_ID environment variable. " +
      "Find it at https://dash.cloudflare.com (Account Settings), then set: " +
      "export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    );
  }
  
  if (!apiToken) {
    throw new Error(
      "Missing CLOUDFLARE_API_TOKEN environment variable. " +
      "Create a token at https://dash.cloudflare.com/profile/api-tokens " +
      "(use 'Edit Cloudflare Workers' template for proper permissions), then set: " +
      "export CLOUDFLARE_API_TOKEN=your-api-token"
    );
  }
  
  return { accountId, apiToken };
}

export async function cfFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiToken } = getConfig();
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(options.headers ?? {}),
    },
  });
  const json = (await res.json()) as {
    success: boolean;
    result: T;
    errors: { message: string }[];
  };
  if (!json.success) {
    const msg = json.errors?.map((e) => e.message).join(", ") ?? "Unknown Cloudflare API error";
    throw new Error(msg);
  }
  return json.result;
}
