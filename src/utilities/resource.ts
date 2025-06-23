/**
 * Resource JSON serializer.
 * 
 * Reads through schema file and serialize JSON resources.
 */
type ResourceConfig = {
  exclude?: string[];
  only?: string[];
  include?: Record<string, any>;
  extend?: Record<string, string>;
  rename?: Record<string, string>;
  map?: Record<string, (value: any, data?: any, context?: any) => any>;
  relations?: Record<string, ResourceConfig>;
  conditionalInclude?: (data: any, context?: any) => Record<string, any>;
};

// Dynamically import resource configuration from the provided resource name
const importResourceConfig = async (resourceName: string): Promise<ResourceConfig | undefined> => {
  try {
    return await require(`../resources/${resourceName}-resource`);
  } catch (error) {
    return undefined;
  }
};

const applyResource = async (item: any, config: ResourceConfig, context?: any): Promise<any> => {
  const result: Record<string, any> = {};
  const keys = config.only ?? Object.keys(item);

  for (const key of keys) {
    if (config.only || !config.exclude?.includes(key)) {
      const value = item[key];

      const renamedKey = config.rename?.[key] ?? key;
      const transformedValue = config.map?.[key]
        ? config.map[key](value, item, context)
        : value;

      result[renamedKey] = transformedValue;
    }
  }

  // Add static includes
  if (config.include) {
    Object.assign(result, config.include);
  }

  // Add dynamic includes
  if (typeof config.conditionalInclude === 'function') {
    const dynamicFields = config.conditionalInclude(item, context);
    Object.assign(result, dynamicFields);
  }

  // Handle nested relations
  if (config.relations) {
    for (const [relKey, relResource] of Object.entries(config.relations)) {
      const value = item[relKey];

      if (value === undefined || value === null) {
        result[relKey] = value;
      } else if (Array.isArray(value)) {
        result[relKey] = value.map((v) => applyResource(v, relResource, context));
      } else {
        result[relKey] = applyResource(value, relResource, context);
      }
    }
  }

  // Handle resource extension (imports other resource schema)
  if (config.extend) {
    for (const [columnName, resourceName] of Object.entries(config.extend)) {
      try {
        const includedConfig = await importResourceConfig(resourceName);
        if (includedConfig) {
          result[columnName] = await applyResource(item[columnName], includedConfig, context);
        }
      } catch (error) {
        console.error(`Error processing resource for column ${columnName}:`, error);
      }
    }
  }

  return result;
};

const toResource = async (
  data: Record<string, any>[] | Record<string, any> | null,
  resource: ResourceConfig,
  context?: any,
): Promise<any> => {
  if (!data) {
    return null;
  }

  try {
    if (Array.isArray(data)) {
      const results = await Promise.all(data.map(async (item) => {
        return applyResource(item, resource, context);
      }));
      return results;
    }

    return await applyResource(data, resource, context);
  } catch (error) {
    console.error("Error applying resource:", error);
    return null;
  }
};

module.exports = toResource;
