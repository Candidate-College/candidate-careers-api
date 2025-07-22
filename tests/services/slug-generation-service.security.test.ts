import SlugGenerationService from '../../src/services/slug-generation-service';
import { validateSlug } from '../../src/validators/slug-validator';

describe('SlugGenerationService - Security Testing', () => {
  it('should sanitize SQL injection attempt in title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug(
      "Robert'); DROP TABLE jobs;--",
    );
    // Should only contain lowercase, numbers, and hyphens
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(isUnique).toBe(true);
  });

  it('should sanitize XSS attempt in title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug(
      '<script>alert("xss")</script> Engineer',
    );
    // Should only contain lowercase, numbers, and hyphens
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(isUnique).toBe(true);
  });

  it('should prevent path traversal attempt in slug', () => {
    const result = validateSlug('../etc/passwd');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/invalid|format/i);
  });

  it('should not allow slug manipulation bypass attempts', () => {
    // Try to bypass with encoded characters or tricky input
    const result = validateSlug('software%2Fengineer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/invalid|format/i);
  });
});
