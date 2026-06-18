export function hasOnlyOneValueForKey(
  data: Record<string, unknown>[],
  key: string,
): boolean {
  const values = data.filter(
    (item) => item[key] !== undefined && item[key] !== null,
  )
  return values.length === 1
}
