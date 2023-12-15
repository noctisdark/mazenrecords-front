// Binary search for finding an item in a sorted array
export function binarySearch<T>(
  arr: T[],
  target: T,
  compare: (a: T, b: T) => number,
): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(arr[mid], target);

    if (comparison === 0) {
      return mid;
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

// Binary search for finding the lower bound (highest item lower than the search value)
export function lowerBound<T>(
  arr: T[],
  target: T,
  compare: (a: T, b: T) => number,
): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(arr[mid], target);

    if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left - 1;
}

// Binary search for finding the upper bound (lowest item higher than the search value)
export function upperBound<T>(
  arr: T[],
  target: T,
  compare: (a: T, b: T) => number,
): number {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compare(arr[mid], target);

    if (comparison <= 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}

// For working with integers
export function binarySearchInt(arr: number[], target: number) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

export function lowerBoundInt(arr: number[], target: number) {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left - 1;
}

export function upperBoundInt(arr: number[], target: number) {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] <= target) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return left;
}
