import SlugGenerationService from '../../../src/services/slug-generation-service';
import { validateSlug } from '../../../src/validators/slug-validator';

describe('SlugGenerationService - Edge Cases', () => {
  it('should return error or fallback for title with only special characters', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('!!!');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/short|required|invalid/i);
  });

  it('should generate slug from title with only numbers', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('12345');
    expect(slug).toBe('12345');
    expect(isUnique).toBe(true);
  });

  it('should handle mixed scripts in title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('Hello मुझे');
    // Should not throw, should produce a slug with allowed characters
    expect(slug).toMatch(/^[a-z0-9\-\u0900-\u097F]+$/i); // Allow Devanagari for this test
    expect(isUnique).toBe(true);
  });

  it('should strip HTML tags from title', async () => {
    const { slug, isUnique } = await SlugGenerationService.generateSlug('<b>Developer</b>');
    // Should not contain < or > and should only contain allowed slug characters
    expect(slug).not.toMatch(/[<>]/);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(isUnique).toBe(true);
  });

  it('should return error when updating title to empty string', async () => {
    const slugExists = async (_slug: string) => false;
    const trackSlugChange = async () => {};
    await expect(
      SlugGenerationService.regenerateSlug(1, '', slugExists, trackSlugChange, 'old-slug'),
    ).rejects.toThrow(/required/i);
  });

  it('should handle slug generation during system maintenance (simulate error)', async () => {
    // Simulate maintenance by throwing in slugExists
    const slugExists = async (_slug: string) => {
      throw new Error('System maintenance');
    };
    const { slug } = await SlugGenerationService.generateSlug('Software Engineer');
    await expect(SlugGenerationService.ensureUniqueness(slug, slugExists)).rejects.toThrow(
      'System maintenance',
    );
  });
});
