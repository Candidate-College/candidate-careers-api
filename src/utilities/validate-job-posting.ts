import { Job } from '@/models/job-model';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window as unknown as Window;
const DOMPurify = createDOMPurify(window as any);

export function validateJobPosting(input: Partial<Job>, schema: Record<string, any>) {
  const errors: Record<string, string> = {};
  const validatedData: Record<string, any> = {};

  for (const field in schema) {
    const rules = schema[field];
    const value = input[field];

    // Handle missing value
    if (value === undefined || value === null) {
      if (!rules.optional) {
        errors[field] = `${field} is required`;
        continue;
      }
      if ('default' in rules) {
        validatedData[field] = rules.default;
      }
      continue;
    }

    // Type: string
    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors[field] = `${field} must be a string`;
        continue;
      }

      if (rules.min && value.length < rules.min)
        errors[field] = `${field} must be at least ${rules.min} characters`;

      if (rules.max && value.length > rules.max)
        errors[field] = `${field} must be at most ${rules.max} characters`;

      // noHTML: reject if input contains any HTML tags
      if (rules.noHTML) {
        const plain = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        if (plain !== value) {
          errors[field] = `${field} must not contain HTML tags`;
          continue;
        }
      }

      // allowHTML: sanitize and reject if unsafe HTML is present
      if (rules.allowHTML) {
        const sanitized = DOMPurify.sanitize(value);
        if (sanitized !== value) {
          errors[field] = `${field} contains disallowed or unsafe HTML content`;
          continue;
        }
      }

      if (!errors[field]) {
        validatedData[field] = value;
      }

      continue;
    }

    // Type: number
    if (rules.type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        errors[field] = `${field} must be a number`;
        continue;
      }

      if (rules.int && !Number.isInteger(value)) errors[field] = `${field} must be an integer`;

      if (rules.min && value < rules.min) errors[field] = `${field} must be at least ${rules.min}`;

      if (rules.max && value > rules.max) errors[field] = `${field} must be at most ${rules.max}`;

      if (rules.positive && value <= 0) errors[field] = `${field} must be positive`;

      if (!errors[field]) {
        validatedData[field] = value;
      }

      continue;
    }

    // Type: enum
    if (rules.type === 'enum') {
      if (!rules.values.includes(value)) {
        errors[field] = `${field} must be one of ${rules.values.join(', ')}`;
        continue;
      }
      validatedData[field] = value;
      continue;
    }

    // Type: date
    if (rules.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors[field] = `${field} must be a valid date`;
        continue;
      }

      if (rules.futureOnly && date <= new Date()) {
        errors[field] = `${field} must be a future date`;
        continue;
      }

      validatedData[field] = date;
      continue;
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    data: validatedData,
    errors,
  };
}
