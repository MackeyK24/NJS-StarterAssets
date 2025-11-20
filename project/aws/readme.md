# Deployment Guide

This document explains how to configure and run the Babylon.js web app deployment script located in `aws/deploy.js`. The script uploads the built `dist` folder to Amazon S3 and optionally invalidates a CloudFront distribution. It also applies `Content-Encoding: gzip` to precompressed artifacts that end with `.gzip`, `.gz.gltf`, or `.gz.glb`.

## Prerequisites

- Node.js 18 or newer
- npm dependencies installed (`npm install`)
- AWS account with permissions for S3 `PutObject`, `ListBucket`, `GetObject`, and CloudFront `CreateInvalidation` (if using invalidations)
- Built application assets (`npm run build`) so the `dist` folder exists

## Quick Start

```bash
npm install
npm run build
npm run deploy
```

Running `npm run deploy` executes `node aws/deploy.js` after building the project. The script reads configuration from `deployment/deploy.json` and resolves credentials via the AWS SDK default chain (profile, environment variables, SSO, etc.).

## `deployment/deploy.json`

```json
{
  "aws": {
    "profile": "default",
    "region": "us-east-1",
    "s3Bucket": "your-s3-bucket-name",
    "s3Prefix": "",
    "cloudFrontDistributionId": "YOUR_CLOUDFRONT_DISTRIBUTION_ID",
    "invalidatePaths": [
      "/*"
    ]
  },
  "dist": {
    "folder": "dist",
    "cacheControl": {
      "default": "public, max-age=31536000, immutable",
      "byExtension": {
        ".html": "public, max-age=300, must-revalidate"
      }
    }
  }
}
```

### AWS Section

- `profile`: (optional) Shared credentials profile name; maps to a profile in `~/.aws/credentials` and `~/.aws/config`. If omitted, the default AWS SDK credential provider chain is used.
- `region`: AWS region for S3 and CloudFront clients.
- `s3Bucket`: Target bucket name. The script uploads all files to this bucket.
- `s3Prefix`: (optional) Prefix prepended to object keys. Set to `""` to place objects at the bucket root.
- `cloudFrontDistributionId`: (optional) If provided, the script issues an invalidation after upload.
- `invalidatePaths`: (optional) Array of CloudFront path patterns. Defaults to `"/*"` when omitted or empty.

### Dist Section

- `folder`: Build output directory. Defaults to `dist`. You can supply an absolute path or a path relative to the project root.
- `cacheControl.default`: Default `Cache-Control` header applied to all objects unless overridden per extension.
- `cacheControl.byExtension`: Map of file extension (including leading dot) to custom `Cache-Control` value.

## Credential Options

The deployment script relies on the AWS SDK v3 default credential provider chain, so you can authenticate through any of the following methods.

### 1. Shared Credentials Files (`~/.aws/credentials` & `~/.aws/config`)

`~/.aws/credentials`:

```
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = <secret>

[deploy-profile]
aws_access_key_id = AKIA...
aws_secret_access_key = <secret>
```

`~/.aws/config`:

```
[default]
region = us-east-1

[profile deploy-profile]
region = us-west-2
```

Set `"profile": "deploy-profile"` in `deploy.json` to use a named profile. Run `aws configure` or `aws configure set profile.deploy-profile.region us-west-2` to manage entries.

### 2. Environment Variables

Export credentials in your shell session:

```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=<secret>
export AWS_REGION=us-east-1
# optional
export AWS_SESSION_TOKEN=<session-token>
export AWS_PROFILE=deploy-profile
```

Environment variables override shared credential profiles for the active shell.

### 3. AWS SSO

Configure with the AWS CLI:

```bash
aws configure sso
aws sso login deploy-profile
```

Then set `"profile": "deploy-profile"` in `deploy.json`. The SDK reads cached SSO tokens automatically.

### 4. Assume Role Chaining

In `~/.aws/config`:

```
[profile deploy-role]
role_arn = arn:aws:iam::123456789012:role/DeployRole
source_profile = default
```

Set `"profile": "deploy-role"` in `deploy.json`. The SDK uses the source profile to obtain temporary credentials for the role.

### 5. Credential Process / External Tools

Profiles can delegate to external commands:

```
[profile custom-process]
credential_process = /usr/local/bin/fetch-aws-creds
```

Tools such as `aws-vault` or `saml2aws` support this approach. The script only needs the profile name.

### 6. Instance / Container Roles

When running on EC2, ECS, or Lambda, instance metadata credentials are picked up automatically. Leave `profile` empty and ensure the IAM role grants S3 and CloudFront permissions.

## Upload Details

- S3 keys mirror the folder structure under `dist`, optionally prefixed with `s3Prefix`.
- Automatic MIME detection uses `mime-types`. `.gz.gltf` resolves to `model/gltf+json`, `.gz.glb` to `model/gltf-binary`, and `.gzip` files inherit the type of their uncompressed file name.
- Files ending with `.gzip`, `.gz.gltf`, or `.gz.glb` receive `Content-Encoding: gzip`.
- `Cache-Control` headers follow the `cacheControl` configuration.

## CloudFront Invalidation

If `cloudFrontDistributionId` is provided, the script submits an invalidation request with the configured paths (default `"/*"`). The invalidation ID is printed on completion. Without a distribution ID, the step is skipped.

## Troubleshooting

- **Missing dist folder**: Run `npm run build` before deploying.
- **Access denied**: Verify IAM permissions and credentials profile. Ensure MFA or session tokens are provided if required.
- **Profile not found**: Confirm the profile section exists in `~/.aws/credentials` or remove `profile` from `deploy.json` to fall back to environment variables.
- **Slow invalidations**: Use more specific paths (e.g., `/index.html`) to reduce invalidation time.

## Best Practices

- Store `deploy.json` values without secrets; rely on AWS credential mechanisms for secret storage.
- Use different profiles/roles for dev and production deployments.
- Version-lock dependencies and review IAM policies regularly.
- Consider enabling S3 versioning and CloudFront logging for auditability.
- Pre-compress assets using your build pipeline to benefit from the automatic gzip metadata handling.
