import SlugGenerationService from '../../../src/services/slug-generation-service';
import { validateSlug } from '../../../src/validators/slug-validator';

describe('SlugGenerationService - Profanity Filtering', () => {
  it('should filter or reject slug from inappropriate title', async () => {
    const { isUnique, reason } = await SlugGenerationService.generateSlug('fuck this job');
    expect(isUnique).toBe(false);
    expect(reason).toMatch(/profanity|inappropriate/i);
  });

  it('should fail validation for manual slug with inappropriate content', () => {
    const result = validateSlug('shit-developer');
    expect(result.isValid).toBe(false);
    expect((result.errors || []).join(' ')).toMatch(/profanity|inappropriate/i);
  });
});
