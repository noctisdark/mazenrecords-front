import { binarySearch, upperBound } from "./binary";

export const defaultSorting = <T extends { id: number }>(itemA: T, itemB: T) =>
  itemA.id - itemB.id;

export const findById = <T extends { id: number }>(
  array: T[],
  searchId: number,
) => array.find(({ id }) => id === searchId);

// O(log n)
export const sortedFindById = <T extends { id: number }>(
  array: T[],
  searchId: number,
) => binarySearch(array, { id: searchId }, defaultSorting);

// makes no difference, its always O(n)
export const replaceById = <T extends { id: number }>(array: T[], newItem: T) =>
  array.map((item) => (item.id === newItem.id ? newItem : item));

export const moveId = <T extends { id: number }>(
  array: T[],
  oldItemId: number,
  newItem: T,
) => appendSorted(removeById(array, oldItemId), newItem);

export const upsertById = <T extends { id: number }>(
  array: T[],
  newItem: T,
  appendMethod = append,
) => {
  try {
    return appendMethod(array, newItem);
  } catch (err) {
    return replaceById(array, newItem);
  }
};

// TODO: maybe not throw errors
export const append = <T extends { id: number }>(array: T[], newItem: T) => {
  if (findById(array, newItem.id))
    throw new Error(
      "array.append error: Object found\n> " + JSON.stringify(newItem),
    );

  return [...array, newItem];
};

// O(n) but keeps the array sorted
export const appendSorted = <T extends { id: number }>(
  array: T[],
  newItem: T,
) => {
  if (sortedFindById(array, newItem.id) >= 0)
    throw new Error(
      "array.append error: Object found\n> " + JSON.stringify(newItem),
    );

  const insertionIndex = upperBound(array, newItem, defaultSorting);

  return [
    ...array.slice(0, insertionIndex),
    newItem,
    ...array.slice(insertionIndex),
  ];
};

// always O(n)
export const removeById = <T extends { id: number }>(
  array: T[],
  removedId: number,
) => {
  if (!findById(array, removedId))
    throw new Error(
      "array.removeById error: Object not found\n> id = " + removedId,
    );
  return array.filter(({ id }) => removedId != id);
};
