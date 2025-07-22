# Slug Generation Service Documentation

## Overview

The Slug Generation Service provides robust, SEO-friendly, and unique slug generation for job postings. It handles slug creation, uniqueness validation, conflict resolution, regeneration on title updates, and integrates with reserved/profanity filters.

---

## Architecture & Responsibilities

- **Single Responsibility:** Focuses solely on slug creation, validation, and uniqueness.
- **Extensible:** Accepts options for stop word removal, max length, and custom patterns.
- **Integration:** Designed to work with repository/database layers for uniqueness checks.
- **Validation:** Integrates with reserved slugs and profanity lists for compliance.

---

## Public Methods

### 1. `generateSlug(title: string, options?: SlugGenerationOptions): Promise<SlugGenerationResult>`

**Purpose:** Generate an SEO-friendly slug from a job title, applying validation and filtering.

#### Parameters

- `title` (string): The job title to convert to a slug.
- `options` (object, optional):
  - `maxLength` (number): Maximum slug length (default: 100)
  - `removeStopWords` (boolean): Remove common stop words (default: false)
  - `customPattern` (RegExp): Custom pattern for allowed characters
  - `excludeJobId` (number|null): Exclude a job ID from uniqueness checks (not used here)

#### Returns

- `{ slug: string, isUnique: boolean, reason?: string }`

#### Example

```ts
const { slug, isUnique, reason } = await SlugGenerationService.generateSlug(
  'Senior Frontend Developer',
);
if (!isUnique) throw new Error(reason);
```

#### Edge Cases

- Empty or too-short title returns `isUnique: false` and a reason.
- Reserved/profane slugs are rejected.

---

### 2. `ensureUniqueness(baseSlug: string, slugExists: (slug: string, excludeJobId?: number|null) => Promise<boolean>, excludeJobId?: number|null): Promise<string>`

**Purpose:** Ensure a slug is unique, resolving conflicts by appending a counter or UUID.

#### Parameters

- `baseSlug` (string): The base slug to check.
- `slugExists` (function): Async function to check if a slug exists in the DB.
- `excludeJobId` (number|null): Exclude a job ID from conflict checks (for updates).

#### Returns

- `string`: A unique slug.

#### Example

```ts
const uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
```

#### Edge Cases

- If 999+ conflicts, falls back to UUID suffix.

---

### 3. `regenerateSlug(jobId: number, newTitle: string, slugExists: (slug: string, excludeJobId?: number|null) => Promise<boolean>, trackSlugChange: (jobId: number, oldSlug: string, newSlug: string, reason: string) => Promise<void>, oldSlug: string): Promise<string>`

**Purpose:** Regenerate a slug when a job title changes, with history tracking.

#### Parameters

- `jobId` (number): The job posting ID.
- `newTitle` (string): The new job title.
- `slugExists` (function): Async function to check uniqueness.
- `trackSlugChange` (function): Async function to record slug history.
- `oldSlug` (string): The previous slug.

#### Returns

- `string`: The new unique slug.

#### Example

```ts
const newSlug = await SlugGenerationService.regenerateSlug(
  job.id,
  'New Job Title',
  slugExists,
  trackSlugChange,
  job.slug,
);
```

#### Edge Cases

- If the new slug is the same as the old, no history is recorded.
- If validation fails, throws an error.

---

## Error Handling

- All methods throw or return errors with clear reasons (e.g., invalid title, reserved word, profanity, not unique).
- Winston logger is used for error logging.

---

## Integration Points

- **Job Creation:** Use `generateSlug` and `ensureUniqueness` before saving a new job.
- **Job Update:** Use `regenerateSlug` when the title changes.
- **Manual Slug Entry:** Use `validateSlug` from the validator before accepting a custom slug.

---

## Extensibility & Best Practices

- Always validate and ensure uniqueness before saving a slug.
- Keep reserved/profanity lists up to date.
- Use dependency injection for DB/repository functions for testability.
- Handle all error cases and log with Winston.

---

## Related Files

- `src/services/slug-generation-service.ts`
- `src/validators/slug-validator.ts`
- `src/constants/reserved-slugs.ts`, `src/constants/profanity-list.ts`
- `src/interfaces/slug/slug-generation.ts`
