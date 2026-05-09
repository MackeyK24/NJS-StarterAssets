import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { fromIni } from "@aws-sdk/credential-providers";
import { lookup as lookupMime } from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gzipMatchers = [/\.gzip$/i, /\.gz\.gltf$/i, /\.gz\.glb$/i];

async function main() {
	const config = await loadConfig();
	await ensureDistExists(config.distPath);

	const credentials = config.aws.profile ? fromIni({ profile: config.aws.profile }) : undefined;
	const s3Client = new S3Client({ region: config.aws.region, credentials });
	const cloudFrontClient = config.aws.cloudFrontDistributionId
		? new CloudFrontClient({ region: config.aws.region, credentials })
		: null;

	const files = await collectFiles(config.distPath);
	if (files.length === 0) {
		console.warn(`No files found in ${config.distPath}. Nothing to upload.`);
		return;
	}

	console.log(
		`Uploading ${files.length} file(s) from ${config.distPath} to s3://${config.aws.s3Bucket}${
			config.aws.s3Prefix ? `/${config.aws.s3Prefix}` : ""
		}`
	);

	let index = 0;
	for (const filePath of files) {
		index += 1;
		const key = buildS3Key(filePath, config.distPath, config.aws.s3Prefix);
		await uploadFile({ filePath, key, config, s3Client });
		console.log(`[${index}/${files.length}] Uploaded ${key}`);
	}

	if (cloudFrontClient) {
		await invalidateDistribution({ client: cloudFrontClient, config });
	} else {
		console.log("CloudFront distribution id not configured. Skipping invalidation.");
	}
}

async function loadConfig() {
	const configPath = path.resolve(__dirname, "deploy.json");
	let raw;
	try {
		raw = await fs.readFile(configPath, "utf8");
	} catch (error) {
		throw new Error(`Unable to read configuration ${configPath}: ${error.message}`);
	}

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(`Invalid JSON in ${configPath}: ${error.message}`);
	}

	const awsConfig = parsed.aws ?? {};
	if (!awsConfig.region) {
		throw new Error(`Missing aws.region in ${configPath}`);
	}
	if (!awsConfig.s3Bucket) {
		throw new Error(`Missing aws.s3Bucket in ${configPath}`);
	}

	const rawPrefix = typeof awsConfig.s3Prefix === "string" ? awsConfig.s3Prefix : "";
	const normalizedPrefix = normalizePrefix(rawPrefix);
	const invalidatePaths = Array.isArray(awsConfig.invalidatePaths) && awsConfig.invalidatePaths.length > 0
		? awsConfig.invalidatePaths
		: ["/*"];

	const distConfig = parsed.dist ?? {};
	const folder = typeof distConfig.folder === "string" && distConfig.folder.trim().length > 0
		? distConfig.folder
		: "dist";
	const distPath = path.isAbsolute(folder) ? folder : path.resolve(__dirname, "..", folder);

	return {
		configPath,
		aws: {
			profile: typeof awsConfig.profile === "string" && awsConfig.profile.trim().length > 0 ? awsConfig.profile : undefined,
			region: awsConfig.region,
			s3Bucket: awsConfig.s3Bucket,
			s3Prefix: normalizedPrefix,
			cloudFrontDistributionId: typeof awsConfig.cloudFrontDistributionId === "string" && awsConfig.cloudFrontDistributionId.trim().length > 0
				? awsConfig.cloudFrontDistributionId
				: undefined,
			invalidatePaths
		},
		dist: {
			folder,
			cacheControl: distConfig.cacheControl ?? {}
		},
		distPath
	};
}

async function ensureDistExists(distPath) {
	try {
		const stats = await fs.stat(distPath);
		if (!stats.isDirectory()) {
			throw new Error(`${distPath} is not a directory`);
		}
	} catch (error) {
		throw new Error(`Distribution folder missing: ${distPath}. Build the project before deploying. (${error.message})`);
	}
}

async function collectFiles(directory) {
	const entries = await fs.readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return collectFiles(fullPath);
			}
			if (entry.isFile()) {
				return [fullPath];
			}
			return [];
		})
	);
	return files.flat();
}

function buildS3Key(filePath, distPath, prefix) {
	const relativePath = path.relative(distPath, filePath);
	const normalizedPath = relativePath.split(path.sep).join("/");
	if (!prefix) {
		return normalizedPath;
	}
	return `${prefix}/${normalizedPath}`;
}

async function uploadFile({ filePath, key, config, s3Client }) {
	const params = {
		Bucket: config.aws.s3Bucket,
		Key: key,
		Body: createReadStream(filePath)
	};

	const cacheControl = resolveCacheControl(key, config.dist.cacheControl);
	if (cacheControl) {
		params.CacheControl = cacheControl;
	}

	const contentType = resolveContentType(filePath);
	if (contentType) {
		params.ContentType = contentType;
	}

	if (isGzipEncoded(filePath)) {
		params.ContentEncoding = "gzip";
	}

	await s3Client.send(new PutObjectCommand(params));
}

function resolveCacheControl(key, cacheControlConfig) {
	if (!cacheControlConfig) {
		return undefined;
	}
	const byExtension = cacheControlConfig.byExtension ?? {};
	const extension = path.extname(key).toLowerCase();
	if (byExtension[extension]) {
		return byExtension[extension];
	}
	return cacheControlConfig.default ?? undefined;
}

function resolveContentType(filePath) {
	const lower = filePath.toLowerCase();
	if (lower.endsWith(".gz.gltf")) {
		return "model/gltf+json";
	}
	if (lower.endsWith(".gz.glb")) {
		return "model/gltf-binary";
	}
	if (lower.endsWith(".gzip")) {
		const withoutGzip = filePath.replace(/\.gzip$/i, "");
		const derived = lookupMime(withoutGzip);
		return derived || "application/octet-stream";
	}
	const derived = lookupMime(filePath);
	return derived || "application/octet-stream";
}

function isGzipEncoded(filePath) {
	return gzipMatchers.some((matcher) => matcher.test(filePath));
}

async function invalidateDistribution({ client, config }) {
	const paths = config.aws.invalidatePaths;
	const command = new CreateInvalidationCommand({
		DistributionId: config.aws.cloudFrontDistributionId,
		InvalidationBatch: {
			CallerReference: `deploy-${Date.now()}`,
			Paths: {
				Quantity: paths.length,
				Items: paths
			}
		}
	});

	const response = await client.send(command);
	console.log(
		`Created CloudFront invalidation ${response.Invalidation?.Id || "unknown"} for distribution ${config.aws.cloudFrontDistributionId}`
	);
}

function normalizePrefix(prefix) {
	const trimmed = prefix.trim();
	if (!trimmed) {
		return "";
	}
	return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
}

main().catch((error) => {
	console.error(error.message || error);
	process.exitCode = 1;
});
