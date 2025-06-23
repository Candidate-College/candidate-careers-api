/**
 * Request validation engine
 * Validates request using layer of abstraction.
 * Built on top of express and express-validator.
 * 
 * Takes input from schema-based file:
 * {
 *   field_name: {
 *      type: string | text | email | number | timestamp | date | image | boolean,
 *      in: body | query | param,
 *      optional: boolean,
 *      mime: { only | except: string[] },
 *      min: number,
 *      max: number,
 *   },
 * }
 * 
 * where:
 *   - type: Datatype
 *   - in: Request location
 *   - optional: Toggle whether the field is required or not
 *   - mime: Mime types for image datatype
 *   - min: Minimum range
 *      > Minimum value: number, timestamp, date
 *      > Minimum length: string
 *      > Minimum size: image 
 *   - max: Maximum range
 *      > Maximum value: number, timestamp, date
 *      > Maximum length: string
 *      > Maximum size: image
 * 
 * If there is a failed validation, it returns a JSON response with an array of errors:
 * {
 *    statusCode: 400,
 *    message: "Validation failed",
 *    errors: {
 *      field_name: [
 *        "error message #1",
 *        "error message #n",
 *      ],
 *    },
 * }
 * 
 * Use this on routes:
 * ```
 * const validate = require('@/middlewares/request-validation-middleware');
 * const fields = require('@/validators/resourcename-validator');
 * router.post('/', validate(fields));
 * ```
 */
import {
  body,
  query,
  param,
  ValidationChain,
  validationResult,
} from 'express-validator';
import { Request, NextFunction } from 'express';
import { JsonResponse } from '@/types/express-extension';

type FieldType = // primitives
                 'string' | 'number' | 'bigint' | 'boolean' |
                 // string derivatives
                 'text' | 'email' |
                 // date & time
                 'timestamp' | 'date' |
                 // blobs
                 'image' | 'audio' | 'video' | 'document' |
                 // semi-structured
                 'json' | 'xml';

type RequestLocation = 'body' | 'query' | 'param';

type ValidationSchema = Record<string, ValidationConfig>;

interface ValidationConfig {
  type: FieldType;
  in?: RequestLocation;
  min?: number;
  max?: number;
  optional?: boolean;
  mime?: {
    only?: string[];
    except?: string[];
  };
  nested?: ValidationSchema;
  value?: {
    only?: string | string[];
    except?: string | string[];
  };
}

interface ValidationOption {
  optional?: boolean;
  only?: string | string[];
  without?: string | string[];
}

const locationMap = { body, query, param };

module.exports = function requestValidator(
  schema: ValidationSchema,
  options: ValidationOption,
) {
  return async (req: Request, res: JsonResponse, next: NextFunction) => {
    const chains: ValidationChain[] = [];

    // Determine which locations to apply the validation to
    const applyOnly = options?.only
      ? Array.isArray(options.only)
        ? options.only
        : [options.only]
      : [];
    const applyWithout = options?.without
      ? Array.isArray(options.without)
        ? options.without
        : [options.without]
      : [];

    for (const [field, config] of Object.entries(schema)) {
      const loc = config.in ?? 'body';

      // Applies validation based on options.apply
      if (applyWithout.length) {
        if (applyWithout.includes(loc)) continue;
      }

      if (applyOnly.length) {
        if (!applyOnly.includes(loc)) continue;
      }

      let validator = locationMap[loc](field);

      const isDefaultQuery = loc === 'query' && !config.optional;
      if (config.optional || options?.optional || isDefaultQuery) {
        validator = validator.optional();
      } else {
        validator = validator.exists().withMessage(`${field} is required`);
      }

      switch (config.type) {
        // primitives //
        case 'string':
          const min = config.min || 0;
          const max = config.max || 255;

          validator = validator
            .isString()
            .withMessage(`${field} must be a valid string`,)
            .isLength({ min, max });

          if (config.min) validator = validator
            .withMessage(`${field} must be more than ${min} characters`);

          if (config.max) validator = validator
            .withMessage(`${field} must be less than ${max} characters`);
          break;

        case 'number':
          validator = validator
            .isNumeric()
            .withMessage(`${field} must be a valid number`);

          if (config.min !== undefined) {
            validator = validator
              .isFloat({ min: config.min })
              .withMessage(`${field} must be more than ${config.min}`);
          }

          if (config.max !== undefined) {
            validator = validator
              .isFloat({ max: config.max })
              .withMessage(`${field} must be less than ${config.max}`);
          }
          break;

        case 'bigint':
          break;
        
        case 'boolean':
          validator = validator
            .isBoolean()
            .withMessage(`${field} must be a valid boolean`);
          break;

        // string derivatives //
        case 'text':
          validator = validator
            .isString()
            .withMessage(`${field} must be a valid text`);
          break;

        case 'email':
          validator = validator
            .isEmail()
            .withMessage(`${field} must be a valid email`);
          break;

        // date & time //
        case 'timestamp':
          validator = validator.isISO8601().withMessage(
            `${field} must be a valid timestamp format (Y-m-d H:i:s)`,
          );
          break;

        case 'date':
          validator = validator.matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(
            `${field} must be in date format (Y-m-d)`,
          );
          break;

        // blobs //
        case 'image':
          const fileValidator = validator.custom((value, { req }) => {
            const file = req.file || (req.files && req.files[field]);
            if (!file || !config.mime) return true;
        
            const mime = file.mimetype;
        
            if (config.mime.only && !config.mime.only.includes(mime)) {
              return false;
            }
        
            if (config.mime.except && config.mime.except.includes(mime)) {
              return false;
            }
        
            return true;
          }).withMessage(
            config.mime?.only
              ? `${field} must be of type: ${config.mime.only.join(', ')}`
              : `${field} must not be of type: ${config.mime?.except?.join(', ')}`
          );
        
          chains.push(fileValidator);
        
          if (config.min || config.max) {
            const sizeValidator = locationMap[loc](field).custom((value, { req }) => {
              const file = req.file || (req.files && req.files[field]);
              if (!file) return true;
        
              const size = file.size / 1024; // kb
              const min = config.min || 0; // kb
              const max = config.max || 5120; // kb
        
              return !(size < min || size > max);
            }).withMessage(
              `${field} must be between ${config.min || 0}KB and ${config.max || 5120}KB`
            );
        
            chains.push(sizeValidator);
          }
          break;

        case 'audio':
          break;
        
        case 'video':
          break;

        case 'document':
          break;

        // semi-structured //
        case 'json':
          break;

        case 'xml':
          break;

        default:
          throw new Error(`Unknown type for field: ${field}`);
      }

      chains.push(validator);
    }

    // Run all validation chains
    for (const chain of chains) {
      await chain.run(req);
    }

    // Return validation error response if exists
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, err) => {
        if ('path' in err) {
          const field: any = err.path;
          if (!acc[field]) acc[field] = [];
          acc[field].push(err.msg);
        }
        return acc;
      }, {} as Record<string, string[]>);

      return res.error(400, 'Validation failed', formattedErrors);
    }

    next();
  };
}

// const mimeValidator = (field: string, schema: FieldSchema): CustomValidator => (value, { req }) => {
//   const file = req.file || (req.files && req.files[field]);
//   if (!file || !schema.mime) return true;

//   const mime = file.mimetype;

//   if (schema.mime.only && !schema.mime.only.includes(mime)) {
//     throw new Error(`${field} must be of type: ${schema.mime.only.join(', ')}`);
//   }

//   if (schema.mime.except && schema.mime.except.includes(mime)) {
//     throw new Error(`${field} must not be of type: ${schema.mime.except.join(', ')}`);
//   }

//   return true;
// };
