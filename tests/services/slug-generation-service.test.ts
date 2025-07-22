import SlugGenerationService from '../../src/services/slug-generation-service';
import { validateSlug } from '../../src/validators/slug-validator';

describe('SlugGenerationService - Basic Slug Generation', () => {
  it('should generate slug from simple title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Software Engineer');
    expect(slug).toBe('software-engineer');
    expect(isUnique).toBe(true);
  });

  it('should generate slug from title with spaces', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior Frontend Developer');
    expect(slug).toBe('senior-frontend-developer');
  });

  it('should generate slug from title with special characters', async () => {
    const { slug } = await SlugGenerationService.generateSlug('C++ Developer (Remote)');
    expect(slug).toBe('c-developer-remote');
  });

  it('should generate slug from title with numbers', async () => {
    const { slug } = await SlugGenerationService.generateSlug('React Developer 2025');
    expect(slug).toBe('react-developer-2025');
  });

  it('should generate slug from title with mixed case', async () => {
    const { slug } = await SlugGenerationService.generateSlug('JavaScript DEVELOPER');
    expect(slug).toBe('javascript-developer');
  });

  it('should generate slug with unicode characters', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Développeur Frontend');
    // Accept either unicode or ascii equivalent
    expect(slug === 'développeur-frontend' || slug === 'developpeur-frontend').toBe(true);
  });

  it('should generate slug with emoji', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer 🚀');
    expect(slug).toBe('software-engineer');
  });

  it('should generate slug with excessive punctuation', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior!!! Developer???');
    expect(slug).toBe('senior-developer');
  });

  it('should generate slug with multiple spaces', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Software    Engineer');
    expect(slug).toBe('software-engineer');
  });

  it('should generate slug with underscores', async () => {
    const { slug } = await SlugGenerationService.generateSlug('Senior_Frontend_Developer');
    expect(slug).toBe('senior-frontend-developer');
  });

  it('should truncate slug to 100 characters for very long title', async () => {
    const longTitle = 'A'.repeat(120);
    const { slug } = await SlugGenerationService.generateSlug(longTitle);
    expect(slug.length).toBeLessThanOrEqual(100);
  });

  it('should generate slug for short title (min 3 chars)', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Dev');
    expect(slug).toBe('dev');
    expect(isUnique).toBe(true);
  });

  it('should return error for single character title', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('X');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/short/i);
  });

  it('should return error for empty string', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/required/i);
  });

  it('should return error for whitespace only', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('   ');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/required/i);
  });
});

describe('SlugGenerationService - Uniqueness Resolution', () => {
  let existingSlugs: Set<string>;
  const slugExists = async (slug: string) => existingSlugs.has(slug);

  beforeEach(() => {
    existingSlugs = new Set();
  });

  it('should generate slug for duplicate title (first time)', async () => {
    existingSlugs.clear();
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (second time)', async () => {
    existingSlugs = new Set(['software-engineer']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-1');
    existingSlugs.add(uniqueSlug);
  });

  it('should generate slug for duplicate title (third time)', async () => {
    existingSlugs = new Set(['software-engineer', 'software-engineer-1']);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-2');
    existingSlugs.add(uniqueSlug);
  });

  it('should increment counter for existing slug pattern', async () => {
    existingSlugs = new Set([
      'software-engineer',
      'software-engineer-1',
      'software-engineer-2',
      'software-engineer-3',
    ]);
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toBe('software-engineer-4');
  });

  it('should fallback to UUID suffix after 999 conflicts', async () => {
    existingSlugs = new Set(
      Array.from({ length: 1000 }, (_, i) =>
        i === 0 ? 'software-engineer' : `software-engineer-${i}`,
      ),
    );
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(baseSlug, slugExists);
    expect(uniqueSlug).toMatch(/^software-engineer-[a-f0-9]{8}$/);
  });

  it('should not consider current job ID as conflict', async () => {
    existingSlugs = new Set(['software-engineer', 'software-engineer-1']);
    // Simulate excludeJobId logic (here, just ignore for test)
    const slugExistsExclude = async (slug: string, excludeJobId?: number | null) => {
      if (excludeJobId === 123 && slug === 'software-engineer') return false;
      return existingSlugs.has(slug);
    };
    const baseSlug = 'software-engineer';
    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      baseSlug,
      slugExistsExclude,
      123,
    );
    expect(uniqueSlug).toBe('software-engineer');
  });
});

describe('SlugGenerationService - Slug Validation', () => {
  it('should validate properly formatted slug', () => {
    const result = validateSlug('software-engineer');
    expect(result.isValid).toBe(true);
  });

  it('should fail validation for uppercase slug', () => {
    const result = validateSlug('Software-Engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/lowercase/i);
  });

  it('should fail validation for special characters', () => {
    const result = validateSlug('software_engineer!');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/invalid/i);
  });

  it('should fail validation for spaces', () => {
    const result = validateSlug('software engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for too short slug', () => {
    const result = validateSlug('ab');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/short/i);
  });

  it('should fail validation for too long slug', () => {
    const longSlug = 'a'.repeat(101);
    const result = validateSlug(longSlug);
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/long/i);
  });

  it('should fail validation for leading hyphen', () => {
    const result = validateSlug('-software-engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for trailing hyphen', () => {
    const result = validateSlug('software-engineer-');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });

  it('should fail validation for consecutive hyphens', () => {
    const result = validateSlug('software--engineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/format|invalid/i);
  });
});

describe('SlugGenerationService - Reserved Slugs', () => {
  it('should fail or generate alternative for reserved word "admin"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('admin');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

  it('should fail or generate alternative for reserved word "api"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('api');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

  it('should fail or generate alternative for reserved word "jobs"', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('jobs');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/reserved/i);
  });

  it('should fail validation for manual slug against reserved words', () => {
    const result = validateSlug('admin');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/reserved/i);
  });
});
