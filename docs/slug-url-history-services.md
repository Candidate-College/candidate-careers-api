# Slug, URL, and Slug History Services Documentation

This document explains how to use the Slug Generation Service, URL Construction Service, and Slug History Service in the CC Career platform. It covers all integration points, usage patterns, and best practices for ensuring unique, SEO-friendly, and maintainable job posting URLs.

---

## 1. Slug Generation Service

### Import

```ts
import SlugGenerationService from '@/services/slug-generation-service';
```

### Generate a Slug for Job Creation

```ts
const { slug, isUnique, reason } = await SlugGenerationService.generateSlug(jobData.title);
if (!isUnique) {
  throw new Error(reason);
}
jobData.slug = slug;
```

### Ensure Slug Uniqueness

```ts
// slugExists is a function that checks if a slug exists in the DB
const uniqueSlug = await SlugGenerationService.ensureUniqueness(slug, slugExists);
```

### Validate a Slug (Manual Entry)

```ts
import { validateSlug } from '@/validators/slug-validator';
const validation = validateSlug(slug);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

### Regenerate Slug on Job Title Update

```ts
const newSlug = await SlugGenerationService.regenerateSlug(
  currentJob.id,
  updates.title,
  slugExists, // function to check uniqueness
  trackSlugChange, // function to record slug history
  currentJob.slug,
);
updates.slug = newSlug;
```

---

## 2. URL Construction Service

### Import

```ts
import URLConstructionService from '@/services/url-construction-service';
```

### Generate Public URL

```ts
const publicUrl = URLConstructionService.generatePublicURL({ slug: job.slug });
```

### Generate Admin URL

```ts
const adminUrl = URLConstructionService.generateAdminURL({ uuid: job.uuid });
```

### Generate Shareable URL with Tracking

```ts
const shareableUrl = URLConstructionService.generateShareableURL({
  slug: job.slug,
  trackingParams: { utm_source: 'newsletter', utm_campaign: 'spring2025' },
});
```

---

## 3. Slug History Service

### Import (Factory Pattern)

```ts
import { createSlugHistoryService } from '@/services/slug-history-service';

const slugHistoryService = createSlugHistoryService({
  createHistory: async record => {
    /* insert into DB */
  },
  getHistory: async jobId => {
    /* fetch from DB */
  },
  findBySlug: async slug => {
    /* fetch by slug from DB */
  },
});
```

### Track Slug Change

```ts
await slugHistoryService.trackSlugChange(
  jobId,
  oldSlug,
  newSlug,
  'title_update',
  userId, // optional
);
```

### Retrieve Slug History for a Job

```ts
const history = await slugHistoryService.getSlugHistory(jobId);
```

### Find Job by Historical Slug (for Redirects)

```ts
const result = await slugHistoryService.findJobByHistoricalSlug(slug);
if (result) {
  // Redirect to the current slug
  res.redirect(301, `/jobs/${result.currentSlug}`);
} else {
  res.status(404).json({ error: 'Job not found' });
}
```

---

## 4. Example: Public Job Access with Slug and Redirect

```ts
app.get('/jobs/:slug', async (req, res) => {
  const job = await findJobBySlug(req.params.slug);
  if (!job) {
    // Check historical slugs for redirect
    const redirect = await slugHistoryService.findJobByHistoricalSlug(req.params.slug);
    if (redirect) {
      return res.redirect(301, `/jobs/${redirect.currentSlug}`);
    }
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});
```

---

## 5. Reserved Slugs & Profanity Filtering

- Reserved slugs and profanity lists are centralized in `src/constants/reserved-slugs.ts` and `src/constants/profanity-list.ts`.
- All slug generation and validation automatically checks against these lists.

---

## 6. Best Practices

- Always validate and ensure uniqueness of slugs before saving.
- Track all slug changes for SEO and analytics.
- Use the factory pattern for SlugHistoryService to inject DB dependencies once.
- Use URLConstructionService for all URL generation to ensure consistency.
- Keep reserved/profanity lists up to date for compliance and brand safety.

---

For more details, see the service source files and interface definitions in `src/services/` and `src/interfaces/slug/`.
