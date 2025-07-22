import SlugGenerationService from '@/services/slug-generation-service';

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
