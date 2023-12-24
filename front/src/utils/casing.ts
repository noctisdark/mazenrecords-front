export const toCamelCase = (s: string | Record<string, any>) => {
  if (typeof s === "string")
    return s.replace(/([_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace("_", "");
    });

  return Object.entries(s)
    .map(([key, value]) => [toCamelCase(key), value])
    .reduce((dict, [key, value]) => ((dict[key] = value), dict), {});
};
