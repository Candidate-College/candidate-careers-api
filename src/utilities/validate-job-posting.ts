import { Job } from '@/models/job-model';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window as unknown as Window;
const DOMPurify = createDOMPurify(window as any);

function validateStringField(
  field: string,
  value: any,
  rules: any,
  errors: Record<string, string>,
) {
  if (typeof value !== 'string') {
    errors[field] = `${field} must be a string`;
    return undefined;
  }
  if (rules.min && value.length < rules.min) {
    errors[field] = `${field} must be at least ${rules.min} characters`;
    return undefined;
  }
  if (rules.max && value.length > rules.max) {
    errors[field] = `${field} must be at most ${rules.max} characters`;
    return undefined;
  }
  if (rules.noHTML) {
    const plain = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (plain !== value) {
      errors[field] = `${field} must not contain HTML tags`;
      return undefined;
    }
  }
  if (rules.allowHTML) {
    const sanitized = DOMPurify.sanitize(value);
    if (sanitized !== value) {
      errors[field] = `${field} contains disallowed or unsafe HTML content`;
      return undefined;
    }
  }
  return value;
}

function validateNumberField(
  field: string,
  value: any,
  rules: any,
  errors: Record<string, string>,
) {
  if (typeof value !== 'number' || isNaN(value)) {
    errors[field] = `${field} must be a number`;
    return undefined;
  }
  if (rules.int && !Number.isInteger(value)) {
    errors[field] = `${field} must be an integer`;
    return undefined;
  }
  if (rules.min && value < rules.min) {
    errors[field] = `${field} must be at least ${rules.min}`;
    return undefined;
  }
  if (rules.max && value > rules.max) {
    errors[field] = `${field} must be at most ${rules.max}`;
    return undefined;
  }
  if (rules.positive && value <= 0) {
    errors[field] = `${field} must be positive`;
    return undefined;
  }
  return value;
}

function validateEnumField(field: string, value: any, rules: any, errors: Record<string, string>) {
  if (!rules.values.includes(value)) {
    errors[field] = `${field} must be one of ${rules.values.join(', ')}`;
    return undefined;
  }
  return value;
}

function validateDateField(field: string, value: any, rules: any, errors: Record<string, string>) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors[field] = `${field} must be a valid date`;
    return undefined;
  }
  if (rules.futureOnly && date <= new Date()) {
    errors[field] = `${field} must be a future date`;
    return undefined;
  }
  return date;
}

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
      } else if ('default' in rules) {
        validatedData[field] = rules.default;
      }
      continue;
    }

    let validatedValue;
    switch (rules.type) {
      case 'string':
        validatedValue = validateStringField(field, value, rules, errors);
        break;
      case 'number':
        validatedValue = validateNumberField(field, value, rules, errors);
        break;
      case 'enum':
        validatedValue = validateEnumField(field, value, rules, errors);
        break;
      case 'date':
        validatedValue = validateDateField(field, value, rules, errors);
        break;
      default:
        errors[field] = `${field} has unknown type`;
        break;
    }
    if (validatedValue !== undefined && !errors[field]) {
      validatedData[field] = validatedValue;
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    data: validatedData,
    errors,
  };
}
