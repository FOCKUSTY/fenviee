/**
 * Тип, представляющий список ключей переменных окружения.
 * Используется как набор строк для required, partial свойств.
 */
export type EnvProperties = readonly string[];

export type DefaultEnv = Record<string, string|undefined>;

/**
 * Общий тип для записи, где ключи — строки, значения — неизвестны.
 * Используется как ограничение для UniqueRecord.
 */
export type SomeRecord = Record<string, unknown>;

/**
 * Валидаторы для unique-переменных.
 * Каждому ключу из UniqueRecord сопоставляется функция,
 * принимающая необязательное строковое значение из env и возвращающая типизированное значение.
 */
export type Validators<T extends SomeRecord> = {
  [P in keyof T]: (value?: string) => T[P];
};

/**
 * Данные, необходимые для инициализации экземпляра Env.
 * @template UniqueRecord - запись, описывающая unique-переменные и их типы после валидации.
 * @template RequiredProperties - список обязательных ключей (только строки).
 * @template PartialProperties - список необязательных ключей (только строки).
 */
export type EnvInitializeData<
  UniqueRecord extends SomeRecord,
  RequiredProperties extends EnvProperties,
  PartialProperties extends EnvProperties,
> = {
  /** Список обязательных ключей (должны присутствовать в process.env). */
  required: RequiredProperties;
  /** Список необязательных ключей (могут отсутствовать, но тогда нужно значение по умолчанию). */
  partial: PartialProperties;
  /** Объект с валидаторами для unique-переменных. */
  unique: Validators<UniqueRecord>;
  /** Значения по умолчанию для partial-переменных (используются, если ключ отсутствует в env). */
  default: Record<PartialProperties[number], string>;
  dangerousIgnoreErrors?: boolean;
};

/**
 * Параметры функции ошибки, используемые в errorTransformer.
 * @internal
 */
type ErrorTransformerParameters = {
  /** Ошибка, возникшая при попытке прочитать или преобразовать значение. */
  error: unknown;
  /** Исходное имя свойства (до преобразования через propertyTransformer). */
  property: string;
  /** Значение, полученное из process.env (может быть undefined). */
  value?: string;
};

/**
 * Параметры для статического метода Env.transform.
 * @template Properties - список ключей, которые нужно обработать (readonly string[]).
 * @template Value - тип значения после преобразования (по умолчанию string).
 * @template PropertyTransformerReturn - тип ключа после преобразования (по умолчанию исходный ключ).
 */
export type FormatterParameters<
  Properties extends EnvProperties,
  Value = string,
  PropertyTransformerReturn extends string = Properties[number]
> = {
  /** Массив исходных ключей. */
  properties: Properties;
  /** Стандартный env (proccess.env) */
  env: DefaultEnv;
  /** Функция преобразования исходного ключа в новый ключ (например, добавление префикса). */
  propertyTransformer: (property: Properties[number]) => PropertyTransformerReturn;
  /** Функция преобразования значения из строки (или undefined) в целевой тип. */
  valueTransformer: (value: string | undefined, key: PropertyTransformerReturn) => Value;
  /** Функция, создающая объект ошибки на основе параметров сбоя. */
  errorTransformer: (parameters: ErrorTransformerParameters) => Error;
};

/**
 * Преобразует объединение типов (A | B | ...) в пересечение (A & B & ...).
 * Используется для объединения нескольких Record в один результирующий тип.
 */
export type UnionToIntersection<Type> =
  (Type extends unknown ? (parameter: Type) => void : never) extends (parameter: infer U) => void
    ? U
    : never;
