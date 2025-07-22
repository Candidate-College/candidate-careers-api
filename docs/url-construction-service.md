# URL Construction Service Documentation

## Overview

The URL Construction Service provides a consistent, SEO-friendly, and environment-aware way to generate URLs for job postings. It supports public, admin, and shareable URLs with tracking parameters.

---

## Architecture & Responsibilities

- **Single Responsibility:** Focuses solely on URL construction for job postings.
- **Environment-Aware:** Uses environment variables for base URLs.
- **Validation:** Validates input parameters and logs errors with Winston.
- **Extensible:** Easily supports new URL patterns or environments.

---

## Public Methods

### 1. `generatePublicURL({ slug }: PublicUrlParams): string`

**Purpose:** Generate the public-facing URL for a job posting by slug.

#### Parameters

- `slug` (string): The job posting slug.

#### Returns

- `string`: The full public URL.

#### Example

```ts
const publicUrl = URLConstructionService.generatePublicURL({ slug: job.slug });
```

#### Edge Cases

- Throws error if slug is missing or invalid.

---

### 2. `generateAdminURL({ uuid }: AdminUrlParams): string`

**Purpose:** Generate the admin panel URL for a job posting by UUID.

#### Parameters

- `uuid` (string): The job posting UUID.

#### Returns

- `string`: The full admin URL.

#### Example

```ts
const adminUrl = URLConstructionService.generateAdminURL({ uuid: job.uuid });
```

#### Edge Cases

- Throws error if uuid is missing or invalid.

---

### 3. `generateShareableURL({ slug, trackingParams }: ShareableUrlParams): string`

**Purpose:** Generate a shareable public URL with optional tracking parameters.

#### Parameters

- `slug` (string): The job posting slug.
- `trackingParams` (object, optional): Key-value pairs for UTM or other tracking.

#### Returns

- `string`: The full shareable URL with query parameters if provided.

#### Example

```ts
const shareableUrl = URLConstructionService.generateShareableURL({
  slug: job.slug,
  trackingParams: { utm_source: 'newsletter', utm_campaign: 'spring2025' },
});
```

#### Edge Cases

- Throws error if slug is missing or invalid.
- Handles empty or missing trackingParams gracefully.

---

## Error Handling

- All methods throw errors for invalid input (missing/invalid slug or uuid).
- Winston logger is used for warning and error logging.

---

## Integration Points

- **API Responses:** Use for generating URLs in API responses, emails, and admin panels.
- **Sharing:** Use shareable URLs for social media, newsletters, and referral tracking.
- **Admin Workflows:** Use admin URLs for internal management and moderation.

---

## Extensibility & Best Practices

- Centralize all URL construction in this service for consistency.
- Use environment variables for base URLs to support multiple deployments.
- Always validate input parameters and handle errors gracefully.
- Add new URL patterns as needed for future features.

---

## Related Files

- `src/services/url-construction-service.ts`
- `src/interfaces/slug/url-construction.ts`
