export function validateJobPosting(input: any, schema: Record<string, any>) {
  const errors: Record<string, string> = {};

  for (const field in schema) {
    const rules = schema[field];
    const value = input[field];

    if (value === undefined || value === null) {
      if (!rules.optional) {
        errors[field] = `${field} is required`;
        continue;
      }
      if ('default' in rules) {
        input[field] = rules.default;
      }
      continue;
    }

    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors[field] = `${field} must be a string`;
        continue;
      }
      if (rules.min && value.length < rules.min)
        errors[field] = `${field} must be at least ${rules.min} characters`;
      if (rules.max && value.length > rules.max)
        errors[field] = `${field} must be at most ${rules.max} characters`;

      if (rules.noHTML && /<\/?[a-z][\s\S]*>/i.test(value))
        errors[field] = `${field} must not contain HTML tags`;

      if (rules.allowHTML && /<script.*?>.*?<\/script>/gi.test(value))
        errors[field] = `${field} must not contain script tags`;
    }

    if (rules.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors[field] = `${field} must be a number`;
        continue;
      }
      if (rules.int && !Number.isInteger(value)) errors[field] = `${field} must be an integer`;
      if (rules.min && value < rules.min) errors[field] = `${field} must be at least ${rules.min}`;
      if (rules.max && value > rules.max) errors[field] = `${field} must be at most ${rules.max}`;
      if (rules.positive && value <= 0) errors[field] = `${field} must be positive`;
    }

    if (rules.type === 'enum') {
      if (!rules.values.includes(value)) {
        errors[field] = `${field} must be one of ${rules.values.join(', ')}`;
      }
    }

    if (rules.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors[field] = `${field} must be a valid date`;
        continue;
      }
      if (rules.futureOnly && date <= new Date()) {
        errors[field] = `${field} must be a future date`;
      }
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    data: input,
    errors,
  };
}
