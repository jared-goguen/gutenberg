import { createHash } from "crypto";
import { promises as fs } from "fs";
import { join } from "path";
import { getConfig, cfFetch } from "../../src/cf.js";
import { parseProjectConfig, getRenderedDir } from "../../src/project.js";
function mimeType(path) {
    if (path.endsWith(".css"))
        return "text/css";
    if (path.endsWith(".js"))
        return "application/javascript";
    if (path.endsWith(".json"))
        return "application/json";
    if (path.endsWith(".png"))
        return "image/png";
    if (path.endsWith(".svg"))
        return "image/svg+xml";
    return "text/html";
}
async function readDirectory(dirPath) {
    const files = {};
    async function walkDir(currentPath, relativePath = "") {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(currentPath, entry.name);
            const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                await walkDir(fullPath, relPath);
            }
            else if (entry.isFile()) {
                const content = await fs.readFile(fullPath, "utf8");
                const normalizedPath = `/${relPath.replace(/\\/g, "/")}`;
                files[normalizedPath] = content;
            }
        }
    }
    await walkDir(dirPath);
    return files;
}
async function cfAssetFetch(path, jwt, options = {}) {
    const url = `https://api.cloudflare.com/client/v4${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${jwt}`,
            ...(options.headers ?? {}),
        },
    });
    const json = (await res.json());
    if (!json.success) {
        const msg = json.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
        throw new Error(msg);
    }
    return json.result;
}
export async function handler(input) {
    const { accountId, apiToken } = getConfig();
    const project_path = input.project_path;
    const branch = input.branch;
    if (!project_path) {
        throw new Error("'project_path' is required - provide an absolute path to gutenberg.yaml");
    }
    // Read project config
    const config = await parseProjectConfig(project_path);
    const project_name = config.project.name;
    // Get rendered directory
    const renderedDir = await getRenderedDir(project_path);
    // Read all files from rendered directory
    const files = await readDirectory(renderedDir);
    if (Object.keys(files).length === 0) {
        throw new Error(`No files found in directory: ${renderedDir}`);
    }
    const fileEntries = Object.entries(files).map(([rawPath, content]) => {
        const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
        const hash = createHash("md5").update(content, "utf8").digest("hex");
        const base64 = Buffer.from(content, "utf8").toString("base64");
        return { path, hash, base64, content };
    });
    // Ensure project exists
    try {
        await cfFetch(`/accounts/${accountId}/pages/projects/${project_name}`);
    }
    catch {
        await cfFetch(`/accounts/${accountId}/pages/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: project_name, production_branch: "main" }),
        });
    }
    const { jwt } = await cfFetch(`/accounts/${accountId}/pages/projects/${project_name}/upload-token`);
    const allHashes = fileEntries.map((f) => f.hash);
    console.error(`[publish] Files to deploy:`);
    for (const f of fileEntries) {
        console.error(`  ${f.path}  hash=${f.hash}`);
    }
    const missingHashes = (await cfAssetFetch(`/pages/assets/check-missing`, jwt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashes: allHashes }),
    }));
    console.error(`[publish] check-missing returned ${missingHashes.length} missing hashes:`, missingHashes);
    if (missingHashes.length > 0) {
        const payload = fileEntries
            .filter((f) => missingHashes.includes(f.hash))
            .map((f) => ({
            key: f.hash,
            value: f.base64,
            metadata: { contentType: mimeType(f.path) },
            base64: true,
        }));
        console.error(`[publish] Uploading ${payload.length} assets...`);
        const uploadResult = await cfAssetFetch(`/pages/assets/upload`, jwt, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        console.error(`[publish] Upload result:`, JSON.stringify(uploadResult));
    }
    else {
        console.error(`[publish] All assets already present in CF store — skipping upload`);
    }
    await cfAssetFetch(`/pages/assets/upsert-hashes`, jwt, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashes: allHashes }),
    });
    const manifest = {};
    for (const { path, hash } of fileEntries) {
        manifest[path] = hash;
    }
    const formData = new FormData();
    formData.append("manifest", JSON.stringify(manifest));
    if (branch)
        formData.append("branch", branch);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project_name}/deployments`;
    const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
        body: formData,
    });
    const json = (await res.json());
    if (!json.success) {
        const msg = json.errors?.map((e) => e.message).join(", ") ?? "Unknown error";
        throw new Error(msg);
    }
    return {
        content: [{ type: "text", text: JSON.stringify({
                    deployment: json.result,
                    debug: {
                        files: fileEntries.map(f => ({ path: f.path, hash: f.hash })),
                        missingHashes,
                        uploadSkipped: missingHashes.length === 0,
                    }
                }, null, 2) }],
    };
}
//# sourceMappingURL=index.js.map