import { config } from "dotenv";
import { join, normalize } from "path";

/**
 * @attention Do not use this class directly
 * 
 * @description Env utility class for comfortable use .env
 * 
 * @example
 * ```ts
 * import { Env } from "fenviee";
 * 
 * const KEYS = <const>["PORT", "CLIENT_URL", "COOKIE_AGE"];
 * const REQUIRED_KEYS = <const>["CLIENT_URL"];
 *
 * const env = new Env<
 *   typeof REQUIRED_KEYS,
 *   typeof KEYS,
 *   false
 * >(
 *   KEYS,
 *   REQUIRED_KEYS,
 *   { PORT: "3000", COOKIE_AGE: "604800" },
 *   false
 * );
 *
 * env.get("CLIENT_URL") // string
 * env.get("PORT") // string | false
 * env.get("COOKIE_AGE", true) // string | "604800"
 * ```
 */
class Env<
  Required extends string[] | readonly string[],
  Keys extends (string|Required[number])[] | readonly (string|Required[number])[],
  GlobalDefaultIncludes extends boolean = false,
  Optional extends Exclude<Keys[number], Required[number]> = Exclude<Keys[number], Required[number]>,
> {
  public readonly env = process.env;
  public readonly keys: (string|Keys[number])[];

  /**
   * @param default_env a default env values
   * @param required_keys required keys in your env 
   * 
   * @param keys (optional) all keys in your env
   * @param ignoreErrors (optional) turn off/on ignoring a errors from this utility. Set "0" to enable full ignore
   */
  public constructor(
    keys: Keys,
    
    public readonly required_keys: Required,
    public readonly default_env: Record<Optional, string>,
    
    public readonly ignoreErrors: boolean | 0 = false
  ) {
    this.keys = Array.from(new Set([...Object.keys(process.env), ...keys]));
    
    this.init();
  }

  /**
   * @param key the key you want to get a env value
   * @param defaultIncludes turn off/on inculuding default env value
   * 
   * @returns string|false
   */
  public readonly get = <
    DefaultIncludes extends boolean = GlobalDefaultIncludes,
    T extends boolean = false,
    Key extends T extends false
      ? DefaultIncludes extends true ? Optional : Keys[number]
      : string = T extends false
        ? DefaultIncludes extends true ? Optional : Keys[number]
        : string
  >(
    key: Key,
    defaultIncludes: DefaultIncludes = false as DefaultIncludes
  ): Key extends Required[number] ? string : DefaultIncludes extends true ? string : string|false => {
    try {
      return (
        this.env[key] || (
          defaultIncludes == true
            ? this.default_env[key as unknown as Optional]
            : false
        )
      ) as any;
    } catch (error) {
      if (this.ignoreErrors === false)
        throw error;
      else if (this.ignoreErrors === true)
        console.warn(error);

      return false as any;
    }
  }

  private init() {
    for (const key of this.required_keys) {
      const keys = []

      if (!this.keys.includes(key)) {
        keys.push(key)
      };

      if (keys.length !== 0) {
        if (this.ignoreErrors === false)
          throw new Error(`keys in your .env are not defined. Define next keys:\n${keys.join(", ")}`);
        else if (this.ignoreErrors === true)
          console.warn(`keys in your .env are not defined. Define next keys:\n${keys.join(", ")}`)
      };
    }
  }
}

/**
 * @description Creates a Env for comfortable use
 * 
 * @example
 * ```ts
 * import CreateEnv from "fenviee"; // or: import { CreateEnv } from "fenviee";
 * 
 * const env = CreateEnv({
 *   requiredKeys: <const>["CLIENT_URL"],
 *   keys: <const>["PORT", "CLIENT_URL", "COOKIE_AGE"],
 *   defaultEnv: <const>{COOKIE_AGE: "604800", PORT: "3000"},
 *   pathToEnv: <const>"./.env"
 * });
 * 
 * env.get("CLIENT_URL"); // string
 * env.get("PORT"); // string | false
 * env.get("COOKIE_AGE", true); // string | "604800"
 * ```
 * 
 * @param keys all keys in your env
 * @param requiredKeys required keys in your env 
 * @param pathToEnv absolute path to your .env
 * @param defaultEnv a default env values
 * @param ignoreErrors turn off/on ignoring a errors from this utility. Set "0" to enable full ignore
 * 
 * @returns Env<RequiredKeys, Keys, Exclude<Keys[number], RequiredKeys[number]>>
 */
const CreateEnv = <
  RequiredKeys extends string[] | readonly string[],
  Keys extends (string|RequiredKeys[number])[] | readonly (string|RequiredKeys[number])[],
>({
  keys, requiredKeys, pathToEnv, defaultEnv, ignoreErrors
}: {
  keys: Keys
  requiredKeys: RequiredKeys,
  defaultEnv: Record<Exclude<Keys[number], RequiredKeys[number]>, string>
  pathToEnv: string,
  ignoreErrors: boolean | 0
}): Env<RequiredKeys, Keys, false, Exclude<Keys[number], RequiredKeys[number]>> => {
  config({path: normalize(join(pathToEnv))});

  const env = new Env<
    RequiredKeys,
    Keys,
    false,
    Exclude<
      Keys[number],
      RequiredKeys[number]
    >
  >(keys, requiredKeys, defaultEnv, ignoreErrors);

  return env;
};

/**
 * @deprecated
 * 
 * @example
 * ```ts
 * import { EnvUtility } from "fenviee";
 * 
 * const { env } = new EnvUtility({
 *   requiredKeys: <const>["CLIENT_URL"],
 *   keys: <const>["PORT", "CLIENT_URL", "COOKIE_AGE"],
 *   defaultEnv: <const>{COOKIE_AGE: "604800", PORT: "3000"},
 *   pathToEnv: <const>"./.env"
 * });
 *
 * env.get("CLIENT_URL"); // string
 * env.get("PORT"); // string | false
 * env.get("COOKIE_AGE", true); // string | "604800"
 * ```
 */
class EnvUtility<
  RequiredKeys extends string[] | readonly string[],
  Keys extends (string|RequiredKeys[number])[] | readonly (string|RequiredKeys[number])[],
> {
  public readonly env: Env<RequiredKeys, Keys, true, Exclude<Keys[number], RequiredKeys[number]>>

  /**
   * @param keys all keys in your env
   * @param requiredKeys required keys in your env 
   * @param pathToEnv absolute path to your .env
   * @param defaultEnv a default env values
   * @param ignoreErrors turn off/on ignoring a errors from this utility. Set "0" to enable full ignore
   */
  public constructor({
    keys, requiredKeys, pathToEnv, defaultEnv, ignoreErrors
  }: {
    keys: Keys
    requiredKeys: RequiredKeys,
    defaultEnv: Record<Exclude<Keys[number], RequiredKeys[number]>, string>
    pathToEnv: string,
    ignoreErrors: boolean | 0
  }) {
    this.env = CreateEnv<
      RequiredKeys, Keys
    >({
      keys,
      requiredKeys,
      pathToEnv,
      defaultEnv,
      ignoreErrors
    });
  }
}

export {
  CreateEnv, Env, EnvUtility
}

export default CreateEnv;
