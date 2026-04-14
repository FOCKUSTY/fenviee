import type {
  EnvInitializeData,
  EnvProperties,
  FormatterParameters,
  SomeRecord,
  UnionToIntersection,
} from './types';
import { isUrl } from './validators';

/**
 * Преобразователь значения по умолчанию для обязательных переменных.
 * Требует, чтобы значение было определено (не undefined). Пустая строка допускается.
 * @param value - значение из process.env
 * @returns само значение, если оно не undefined
 * @throws {Error} если value === undefined
 */
export const defaultValueTransformer = (value?: string) => {
  if (value === undefined) {
    throw new Error('value is not defined');
  }
  return value;
};

/**
 * Класс для типобезопасной работы с переменными окружения.
 * Позволяет объявить обязательные, необязательные и уникальные (с валидацией) переменные,
 * а затем получить единый объект конфигурации с корректными типами.
 *
 * @template UniqueRecord - запись, описывающая unique-переменные и их типы после валидации.
 * @template RequiredProperties - список обязательных ключей (readonly string[]).
 * @template PartialProperties - список необязательных ключей (readonly string[]).
 * 
 * Примечание: не нужно указывать unique-переменные в required или partial, они относятся именно к уникальным,
 * так что не требуют объявления в каком-то массиве или списке
 */
export class Env<
  const UniqueRecord extends SomeRecord,
  const RequiredProperties extends EnvProperties,
  const PartialProperties extends EnvProperties,
> {
  /**
   * Создаёт функцию-конструктор для конкретного экземпляра Env с привязкой к process.env.
   * @param env - объект окружения (обычно process.env)
   * @returns функция, которая принимает данные инициализации и возвращает экземпляр Env
   */
  public static create(env: NodeJS.ProcessEnv) {
    return <
      const UniqueProperties extends SomeRecord,
      const RequiredProperties extends EnvProperties,
      const PartialProperties extends EnvProperties
    >(
      data: EnvInitializeData<UniqueProperties, RequiredProperties, PartialProperties>
    ) => {
      return new Env<UniqueProperties, RequiredProperties, PartialProperties>(env, data).execute();
    };
  }

  /**
   * Универсальный метод преобразования набора ключей в запись с обработанными значениями.
   * Собирает ошибки отдельно от данных.
   *
   * @param params - параметры преобразования (см. FormatterParameters)
   * @returns объект с массивом ошибок и частичной записью успешно обработанных ключей
   */
  public static transform<
    const Properties extends EnvProperties,
    const Value = string,
    const PropertyTransformerReturn extends string = Properties[number]
  >({
    properties,
    propertyTransformer,
    valueTransformer,
    errorTransformer,
    env
  }: FormatterParameters<Properties, Value, PropertyTransformerReturn>): {
    errors: Error[];
    data: Partial<Record<PropertyTransformerReturn, Value>>;
  } {
    const errors: Error[] = [];
    const data: Partial<Record<PropertyTransformerReturn, Value>> = {};

    for (const property of properties) {
      const key = propertyTransformer(property as Properties[number]);

      try {
        const value = valueTransformer(env[key], key);
        data[key] = value;
      } catch (err) {
        const error = errorTransformer({
          error: err,
          property,
          value: env[key],
        });
        errors.push(error);
      }
    }

    return { errors, data };
  }

  /** Массив всех ключей (обязательных и необязательных) */
  public readonly all: (RequiredProperties[number] | PartialProperties[number])[];

  /** Массив ключей unique-переменных (для внутреннего использования) */
  public readonly unique: (keyof UniqueRecord)[];

  /**
   * Защищённый конструктор. Экземпляры создаются через статический метод `create`.
   * @param env - объект окружения
   * @param data - данные инициализации (required, partial, unique, default)
   */
  protected constructor(
    public readonly env: NodeJS.ProcessEnv,
    public readonly data: EnvInitializeData<UniqueRecord, RequiredProperties, PartialProperties>
  ) {
    this.all = [...data.required, ...data.partial];
    this.unique = Object.keys(data.unique) as (keyof UniqueRecord)[];
  }

  /**
   * Выполняет сбор и валидацию переменных окружения согласно конфигурации.
   * При возникновении любых ошибок выбрасывает исключение с агрегированным сообщением.
   *
   * @returns объект конфигурации, объединяющий значения по умолчанию,
   * обязательные переменные, необязательные переменные и результаты валидации unique.
   */
  public execute(): UnionToIntersection<
    | Record<RequiredProperties[number], string>
    | Record<PartialProperties[number], string>
    | UniqueRecord
  > {
    const requiredResult = this.transformRequired();
    const partialResult = this.transformPartial();
    const uniqueResult = this.transformUnique();

    const allErrors = [
      ...requiredResult.errors,
      ...partialResult.errors,
      ...uniqueResult.errors,
    ];

    if (allErrors.length > 0 && this.data.dangerousIgnoreErrors !== true) {
      const messages = allErrors.map((e) => e.message).join('\n');
      throw new Error(`Environment configuration failed:\n${messages}`);
    }

    const config = {
      ...this.data.default,
      ...requiredResult.data,
      ...partialResult.data,
      ...uniqueResult.data,
    };

    return config as UnionToIntersection<
      | Record<RequiredProperties[number], string>
      | Record<PartialProperties[number], string>
      | UniqueRecord
    >;
  }

  /** Обрабатывает обязательные переменные (должны быть определены в env). */
  private transformRequired() {
    return Env.transform({
      properties: this.data.required,
      propertyTransformer: (p) => p,
      valueTransformer: defaultValueTransformer,
      errorTransformer: ({ property }) => new Error(`Key ${property} is not defined in env`),
      env: this.env,
    });
  }

  /** Обрабатывает необязательные переменные: берёт значение из env или подставляет значение по умолчанию. */
  private transformPartial() {
    const data: Partial<Record<PartialProperties[number], string>> = {};
    const errors: Error[] = [];

    for (const key of this.data.partial) {
      const property = key as PartialProperties[number];
      const value = this.env[property];

      if (value !== undefined) {
        data[property] = value;
      } else if (property in this.data.default) {
        data[property] = this.data.default[property];
      } else {
        errors.push(new Error(`Key ${property} is not defined in env and has no default value`));
      }
    }

    return { errors, data };
  }

  /** Обрабатывает unique-переменные, применяя пользовательские валидаторы. */
  private transformUnique() {
    return Env.transform({
      properties: this.unique as readonly string[],
      propertyTransformer: (p) => p,
      valueTransformer: (value, key) => this.data.unique[key](value),
      errorTransformer: ({ error }) => new Error(String(error)),
      env: this.env
    });
  }
}

export default Env;
