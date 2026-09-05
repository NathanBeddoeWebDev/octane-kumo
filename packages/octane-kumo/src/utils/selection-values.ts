type Key = string | number;

export function serializeSelectionValue<T>(
  value: T,
  serialize?: (value: T) => string,
): string {
  if (value == null) return "";
  if (serialize) return serialize(value);
  if (typeof value === "object") {
    if ("value" in value && "label" in value) return String(value.value);
    return JSON.stringify(value);
  }
  return String(value);
}

export interface SelectionFilter {
  contains<Item>(
    item: Item,
    query: string,
    itemToString?: (item: Item) => string,
  ): boolean;
  endsWith<Item>(
    item: Item,
    query: string,
    itemToString?: (item: Item) => string,
  ): boolean;
  startsWith<Item>(
    item: Item,
    query: string,
    itemToString?: (item: Item) => string,
  ): boolean;
}

export type SelectionFilterOptions = Intl.CollatorOptions & {
  locale?: Intl.LocalesArgument;
};

const selectionFilterCache = new Map<string, SelectionFilter>();

type ValueWithKey = {
  id?: unknown;
  value?: unknown;
};

function isKey(value: unknown): value is Key {
  return typeof value === "string" || typeof value === "number";
}

function stableHash(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(36);
}

function stableValueKey(value: unknown): Key {
  if (isKey(value)) return value;

  if (value && typeof value === "object") {
    const keyedValue = value as ValueWithKey;
    if (isKey(keyedValue.value)) return keyedValue.value;
    if (isKey(keyedValue.id)) return keyedValue.id;

    try {
      return `kumo-${stableHash(JSON.stringify(value))}`;
    } catch {
      return "kumo-object";
    }
  }

  return `kumo:${String(value)}`;
}

export function textFromSelectionValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const candidate = value as { label?: unknown; value?: unknown };
    if (
      typeof candidate.label === "string" ||
      typeof candidate.label === "number"
    ) {
      return String(candidate.label);
    }
    if (
      typeof candidate.value === "string" ||
      typeof candidate.value === "number"
    ) {
      return String(candidate.value);
    }
  }

  return "";
}

export function getSelectionFilter(
  options: SelectionFilterOptions = {},
): SelectionFilter {
  const { locale, ...collatorOptions } = options;
  const cacheKey = JSON.stringify([locale, collatorOptions]);
  const cached = selectionFilterCache.get(cacheKey);
  if (cached) return cached;

  const collator = new Intl.Collator(locale, {
    usage: "search",
    sensitivity: "base",
    ignorePunctuation: true,
    ...collatorOptions,
  });
  const text = <Item>(item: Item, itemToString?: (item: Item) => string) =>
    itemToString?.(item) ?? textFromSelectionValue(item);
  const compare = <Item>(
    item: Item,
    query: string,
    itemToString: ((item: Item) => string) | undefined,
    position: "contains" | "endsWith" | "startsWith",
  ) => {
    if (!query) return true;
    const value = text(item, itemToString).normalize("NFC");
    const substring = query.normalize("NFC");
    if (position === "startsWith") {
      return (
        collator.compare(value.slice(0, substring.length), substring) === 0
      );
    }
    if (position === "endsWith") {
      return (
        value.length >= substring.length &&
        collator.compare(value.slice(-substring.length), substring) === 0
      );
    }
    for (let index = 0; index <= value.length - substring.length; index += 1) {
      if (
        collator.compare(
          value.slice(index, index + substring.length),
          substring,
        ) === 0
      ) {
        return true;
      }
    }
    return false;
  };

  const filter: SelectionFilter = {
    contains: (item, query, itemToString) =>
      compare(item, query, itemToString, "contains"),
    endsWith: (item, query, itemToString) =>
      compare(item, query, itemToString, "endsWith"),
    startsWith: (item, query, itemToString) =>
      compare(item, query, itemToString, "startsWith"),
  };
  selectionFilterCache.set(cacheKey, filter);
  return filter;
}

export class SelectionValueRegistry<T> {
  #isEqual?: (item: T, value: T) => boolean;
  #keyForValue?: (value: T) => string;
  readonly #textValues = new Map<string, T>();
  readonly #values = new Map<Key, T>();

  constructor(
    values: readonly T[],
    isEqual?: (item: T, value: T) => boolean,
    keyForValue?: (value: T) => string,
  ) {
    this.#isEqual = isEqual;
    this.#keyForValue = keyForValue;
    for (const value of values) this.register(value);
  }

  update(
    isEqual?: (item: T, value: T) => boolean,
    keyForValue?: (value: T) => string,
  ): void {
    this.#isEqual = isEqual;
    this.#keyForValue = keyForValue;
  }

  register(value: T, preferredKey?: Key): Key {
    for (const [key, item] of this.#values) {
      if (Object.is(item, value) || this.#isEqual?.(item, value)) return key;
    }

    const baseKey =
      preferredKey ?? this.#keyForValue?.(value) ?? stableValueKey(value);
    let key = baseKey;
    let duplicate = 1;
    while (this.#values.has(key)) {
      key = `${baseKey}-${duplicate}`;
      duplicate += 1;
    }
    this.#values.set(key, value);
    return key;
  }

  registerText(value: T, text: string): void {
    this.#textValues.set(text, value);
  }

  keyFor(value: T): Key {
    for (const [key, item] of this.#values) {
      if (Object.is(item, value) || this.#isEqual?.(item, value)) return key;
    }
    return this.register(value);
  }

  valueFor(key: Key | null): T | null {
    if (key === null) return null;
    if (!this.#values.has(key))
      throw new Error(`Unknown selection key: ${key}`);
    return this.#values.get(key)!;
  }

  valueForText(text: string): T | undefined {
    return this.#textValues.get(text);
  }
}

export function flattenSelectionItems<T>(items: readonly T[]): T[] {
  const result: T[] = [];

  for (const item of items) {
    if (item && typeof item === "object" && "items" in item) {
      const children = (item as { items?: unknown }).items;
      if (Array.isArray(children)) {
        result.push(...flattenSelectionItems(children as T[]));
        continue;
      }
    }
    result.push(item);
  }

  return result;
}

export function resolvePortalContainer(
  container:
    | Element
    | ShadowRoot
    | { current: HTMLElement | ShadowRoot | null }
    | null
    | undefined,
): Element | undefined {
  const resolved =
    container && "current" in container ? container.current : container;
  return (resolved ?? undefined) as Element | undefined;
}
