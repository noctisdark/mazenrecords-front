import { binarySearch, upperBound } from "./binary";
import { Update } from "./types";

export const defaultSorting = <T extends { id: number }>(itemA: T, itemB: T) =>
  itemA.id - itemB.id;

export const findById = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  searchId: Key,
) => array.find(({ id }) => id === searchId);

// makes no difference, its always O(n)
export const replaceById = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  newItem: T,
) => array.map((item) => (item.id === newItem.id ? newItem : item));

export const moveId = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  oldItemId: Key,
  newItem: T,
) => append(removeById(array, oldItemId), newItem);

export const upsertById = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  newItem: T,
) => {
  try {
    return append(array, newItem);
  } catch (err) {
    return replaceById(array, newItem);
  }
};

export const append = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  newItem: T,
) => {
  if (findById(array, newItem.id))
    throw new Error("array.append error: Object found\n> " + JSON.stringify(newItem));

  return [...array, newItem];
};

// always O(n)
export const removeById = <Key extends number | string, T extends { id: Key }>(
  array: T[],
  removedId: Key,
) => {
  if (!findById(array, removedId))
    throw new Error("array.removeById error: Object not found\n> id = " + removedId);
  return array.filter(({ id }) => removedId != id);
};

// Operations that keep the original array sorted

// O(log n)
export const findByIdSorted = <T extends { id: number }>(array: T[], searchId: number) =>
  binarySearch(array, { id: searchId }, defaultSorting);

export const upsertByIdSorted = <T extends { id: number }>(array: T[], newItem: T) => {
  try {
    return appendSorted(array, newItem);
  } catch (err) {
    return replaceById(array, newItem);
  }
};

export const moveIdSorted = <T extends { id: number }>(
  array: T[],
  oldItemId: number,
  newItem: T,
) => appendSorted(removeById(array, oldItemId), newItem);

// O(n) but keeps the array sorted
export const appendSorted = <T extends { id: number }>(array: T[], newItem: T) => {
  if (findByIdSorted(array, newItem.id) >= 0)
    throw new Error("array.append error: Object found\n> " + JSON.stringify(newItem));

  const insertionIndex = upperBound(array, newItem, defaultSorting);

  return [...array.slice(0, insertionIndex), newItem, ...array.slice(insertionIndex)];
};

export const mergeUpdates = <
  Key extends number | string,
  T extends { id: Key; updatedAt: number },
>(
  epoch: number,
  localUpdates: Update<Key, T>[],
  upstreamUpdates: Update<Key, T>[],
): {
  newEpoch: number;
  upstreamUpserts: T[];
  upstreamDeletes: (number | string)[];
  localUpserts: T[];
  localDeletes: (number | string)[];
} => {
  const reverseMap: { [key: number | string]: Update<Key, T> } = {};
  for (const localUpdate of localUpdates) reverseMap[localUpdate.id] = localUpdate;

  let newEpoch: number = epoch;
  const upstreamUpserts: T[] = [],
    upstreamDeletes: (number | string)[] = [],
    localUpserts: T[] = [],
    localDeletes: (number | string)[] = [];

  for (const upstreamUpdate of upstreamUpdates) {
    const localUpdate = reverseMap[upstreamUpdate.id] as T | undefined;
    const newestUpdate =
      localUpdate && localUpdate.updatedAt > upstreamUpdate.updatedAt
        ? localUpdate
        : upstreamUpdate;

    if (newestUpdate === upstreamUpdate) {
      if ("deleted" in newestUpdate) localDeletes.push(newestUpdate.id);
      else localUpserts.push(newestUpdate);
      newEpoch = newestUpdate.updatedAt > epoch ? newestUpdate.updatedAt : epoch;
    } else {
      if ("deleted" in newestUpdate) upstreamDeletes.push(newestUpdate.id);
      else upstreamUpserts.push(newestUpdate);
    }

    delete reverseMap[newestUpdate.id];
  }

  const remainingUpstreamUpdates = [...Object.values(reverseMap)];
  for (const update of remainingUpstreamUpdates)
    if ("deleted" in update) upstreamDeletes.push(update.id);
    else upstreamUpserts.push(update);

  return {
    newEpoch,
    upstreamUpserts,
    upstreamDeletes,
    localUpserts,
    localDeletes,
  };
};
