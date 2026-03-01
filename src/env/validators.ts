/**
 * Базовые трансформеры (валидаторы) для unique-переменных окружения.
 * Каждый трансформер принимает значение из process.env (может быть undefined)
 * и возвращает преобразованное значение нужного типа либо выбрасывает ошибку.
 */

/**
 * Возвращает строку без изменений.
 * Требует, чтобы значение было определено.
 * @throws {Error} если value === undefined
 */
export const isString = (value?: string): string => {
  if (value === undefined) {
    throw new Error('value is not defined');
  }
  return value;
};

/**
 * Преобразует строку в число.
 * Допускает целые и дробные числа.
 * @throws {Error} если value не определено или не является числом
 */
export const isNumber = (value?: string): number => {
  if (value === undefined) {
    throw new Error('value is not defined');
  }
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`value "${value}" is not a valid number`);
  }
  return num;
};

/**
 * Преобразует строку в целое число (парсится как десятичное).
 * @throws {Error} если value не определено или не является целым числом
 */
export const isInteger = (value?: string): number => {
  const num = isNumber(value);
  if (!Number.isInteger(num)) {
    throw new Error(`value "${value}" is not an integer`);
  }
  return num;
};

/**
 * Преобразует строку в булево значение.
 * Принимает 'true', 'false', '1', '0' (регистр не важен).
 * @throws {Error} если значение не определено или не является допустимым булевым представлением
 */
export const isBoolean = (value?: string): boolean => {
  if (value === undefined) {
    throw new Error('value is not defined');
  }
  const lower = value.toLowerCase();
  if (lower === 'true' || lower === '1') return true;
  if (lower === 'false' || lower === '0') return false;
  throw new Error(`value "${value}" is not a valid boolean`);
};

/**
 * Проверяет, что строка является валидным URL.
 * @throws {Error} если значение не определено или не является валидным URL
 */
export const isUrl = (value?: string): string => {
  const str = isString(value);
  try {
    new URL(str);
    return str;
  } catch {
    throw new Error(`value "${str}" is not a valid URL`);
  }
};

/**
 * Проверяет, что значение является валидным номером порта (1–65535).
 * Возвращает число.
 * @throws {Error} если значение не определено или не является допустимым портом
 */
export const isPort = (value?: string): number => {
  const num = isInteger(value);
  if (num < 1 || num > 65535) {
    throw new Error(`value "${value}" is not a valid port number (1-65535)`);
  }
  return num;
};

/**
 * Проверяет, что значение является валидным email-адресом (простая проверка).
 * Возвращает строку.
 * @throws {Error} если значение не определено или не является email'ом
 */
export const isEmail = (value?: string): string => {
  const str = isString(value);
  // Простейшая проверка на наличие @ и точки после @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) {
    throw new Error(`value "${str}" is not a valid email`);
  }
  return str;
};

/**
 * Парсит строку как JSON.
 * @throws {Error} если значение не определено или не является валидным JSON
 */
export const isJSON = <T = any>(value?: string): T => {
  const str = isString(value);
  try {
    return JSON.parse(str) as T;
  } catch {
    throw new Error(`value "${str}" is not valid JSON`);
  }
};

/**
 * Разбивает строку по разделителю и возвращает массив строк.
 * По умолчанию разделитель — запятая. Можно задать свой.
 * @param separator - разделитель (по умолчанию ',')
 * @returns массив строк (пустые элементы удаляются)
 */
export const isArray = (separator: string = ',') => (value?: string): string[] => {
  const str = isString(value);
  return str.split(separator).map(s => s.trim()).filter(s => s.length > 0);
};

/**
 * Фабрика для создания валидатора числа с ограничениями.
 * @param min - минимальное значение (включительно)
 * @param max - максимальное значение (включительно)
 * @returns валидатор числа
 */
export const isNumberInRange = (min: number, max: number) => (value?: string): number => {
  const num = isNumber(value);
  if (num < min || num > max) {
    throw new Error(`value "${value}" is not in range [${min}, ${max}]`);
  }
  return num;
};

/**
 * Фабрика для создания валидатора целого числа с ограничениями.
 * @param min - минимальное значение (включительно)
 * @param max - максимальное значение (включительно)
 * @returns валидатор целого числа
 */
export const isIntegerInRange = (min: number, max: number) => (value?: string): number => {
  const num = isInteger(value);
  if (num < min || num > max) {
    throw new Error(`value "${value}" is not in range [${min}, ${max}]`);
  }
  return num;
};
