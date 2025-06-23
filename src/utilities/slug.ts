const Model = require('@/config/database/orm');
const string = require('./string');

/**
 * Generates a unique slug by checking if the slug already exists.
 * If the slug exists, appends a random suffix to the slug.
 * 
 * @param baseSlug - The base slug to be used (e.g., blog post title).
 * @returns A unique slug.
 */
exports.generateUniqueSlug = async (baseSlug: string, model: typeof Model): Promise<string> => {
  let slug = baseSlug.toLowerCase().replace(/\s+/g, '-');
  let isUnique = !(await model.query().findOne({ slug }));

  if (!isUnique) {
    // If the slug exists, append a random suffix
    const randomSuffix = string.generateRandomAlphanum(6);
    slug = `${slug}-${randomSuffix}`;
  }

  return slug;
};
