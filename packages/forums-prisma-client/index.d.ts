
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Topic
 * 
 */
export type Topic = $Result.DefaultSelection<Prisma.$TopicPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model TopicClosure
 * 
 */
export type TopicClosure = $Result.DefaultSelection<Prisma.$TopicClosurePayload>
/**
 * Model TopicWatch
 * 
 */
export type TopicWatch = $Result.DefaultSelection<Prisma.$TopicWatchPayload>
/**
 * Model TopicReadState
 * 
 */
export type TopicReadState = $Result.DefaultSelection<Prisma.$TopicReadStatePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Topics
 * const topics = await prisma.topic.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Topics
   * const topics = await prisma.topic.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.topic`: Exposes CRUD operations for the **Topic** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Topics
    * const topics = await prisma.topic.findMany()
    * ```
    */
  get topic(): Prisma.TopicDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.topicClosure`: Exposes CRUD operations for the **TopicClosure** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TopicClosures
    * const topicClosures = await prisma.topicClosure.findMany()
    * ```
    */
  get topicClosure(): Prisma.TopicClosureDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.topicWatch`: Exposes CRUD operations for the **TopicWatch** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TopicWatches
    * const topicWatches = await prisma.topicWatch.findMany()
    * ```
    */
  get topicWatch(): Prisma.TopicWatchDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.topicReadState`: Exposes CRUD operations for the **TopicReadState** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TopicReadStates
    * const topicReadStates = await prisma.topicReadState.findMany()
    * ```
    */
  get topicReadState(): Prisma.TopicReadStateDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Topic: 'Topic',
    Post: 'Post',
    TopicClosure: 'TopicClosure',
    TopicWatch: 'TopicWatch',
    TopicReadState: 'TopicReadState'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "topic" | "post" | "topicClosure" | "topicWatch" | "topicReadState"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Topic: {
        payload: Prisma.$TopicPayload<ExtArgs>
        fields: Prisma.TopicFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TopicFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TopicFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          findFirst: {
            args: Prisma.TopicFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TopicFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          findMany: {
            args: Prisma.TopicFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>[]
          }
          create: {
            args: Prisma.TopicCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          createMany: {
            args: Prisma.TopicCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TopicCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>[]
          }
          delete: {
            args: Prisma.TopicDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          update: {
            args: Prisma.TopicUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          deleteMany: {
            args: Prisma.TopicDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TopicUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TopicUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>[]
          }
          upsert: {
            args: Prisma.TopicUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicPayload>
          }
          aggregate: {
            args: Prisma.TopicAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTopic>
          }
          groupBy: {
            args: Prisma.TopicGroupByArgs<ExtArgs>
            result: $Utils.Optional<TopicGroupByOutputType>[]
          }
          count: {
            args: Prisma.TopicCountArgs<ExtArgs>
            result: $Utils.Optional<TopicCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      TopicClosure: {
        payload: Prisma.$TopicClosurePayload<ExtArgs>
        fields: Prisma.TopicClosureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TopicClosureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TopicClosureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          findFirst: {
            args: Prisma.TopicClosureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TopicClosureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          findMany: {
            args: Prisma.TopicClosureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>[]
          }
          create: {
            args: Prisma.TopicClosureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          createMany: {
            args: Prisma.TopicClosureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TopicClosureCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>[]
          }
          delete: {
            args: Prisma.TopicClosureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          update: {
            args: Prisma.TopicClosureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          deleteMany: {
            args: Prisma.TopicClosureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TopicClosureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TopicClosureUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>[]
          }
          upsert: {
            args: Prisma.TopicClosureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicClosurePayload>
          }
          aggregate: {
            args: Prisma.TopicClosureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTopicClosure>
          }
          groupBy: {
            args: Prisma.TopicClosureGroupByArgs<ExtArgs>
            result: $Utils.Optional<TopicClosureGroupByOutputType>[]
          }
          count: {
            args: Prisma.TopicClosureCountArgs<ExtArgs>
            result: $Utils.Optional<TopicClosureCountAggregateOutputType> | number
          }
        }
      }
      TopicWatch: {
        payload: Prisma.$TopicWatchPayload<ExtArgs>
        fields: Prisma.TopicWatchFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TopicWatchFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TopicWatchFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          findFirst: {
            args: Prisma.TopicWatchFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TopicWatchFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          findMany: {
            args: Prisma.TopicWatchFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>[]
          }
          create: {
            args: Prisma.TopicWatchCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          createMany: {
            args: Prisma.TopicWatchCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TopicWatchCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>[]
          }
          delete: {
            args: Prisma.TopicWatchDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          update: {
            args: Prisma.TopicWatchUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          deleteMany: {
            args: Prisma.TopicWatchDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TopicWatchUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TopicWatchUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>[]
          }
          upsert: {
            args: Prisma.TopicWatchUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicWatchPayload>
          }
          aggregate: {
            args: Prisma.TopicWatchAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTopicWatch>
          }
          groupBy: {
            args: Prisma.TopicWatchGroupByArgs<ExtArgs>
            result: $Utils.Optional<TopicWatchGroupByOutputType>[]
          }
          count: {
            args: Prisma.TopicWatchCountArgs<ExtArgs>
            result: $Utils.Optional<TopicWatchCountAggregateOutputType> | number
          }
        }
      }
      TopicReadState: {
        payload: Prisma.$TopicReadStatePayload<ExtArgs>
        fields: Prisma.TopicReadStateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TopicReadStateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TopicReadStateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          findFirst: {
            args: Prisma.TopicReadStateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TopicReadStateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          findMany: {
            args: Prisma.TopicReadStateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>[]
          }
          create: {
            args: Prisma.TopicReadStateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          createMany: {
            args: Prisma.TopicReadStateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TopicReadStateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>[]
          }
          delete: {
            args: Prisma.TopicReadStateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          update: {
            args: Prisma.TopicReadStateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          deleteMany: {
            args: Prisma.TopicReadStateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TopicReadStateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TopicReadStateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>[]
          }
          upsert: {
            args: Prisma.TopicReadStateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TopicReadStatePayload>
          }
          aggregate: {
            args: Prisma.TopicReadStateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTopicReadState>
          }
          groupBy: {
            args: Prisma.TopicReadStateGroupByArgs<ExtArgs>
            result: $Utils.Optional<TopicReadStateGroupByOutputType>[]
          }
          count: {
            args: Prisma.TopicReadStateCountArgs<ExtArgs>
            result: $Utils.Optional<TopicReadStateCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    topic?: TopicOmit
    post?: PostOmit
    topicClosure?: TopicClosureOmit
    topicWatch?: TopicWatchOmit
    topicReadState?: TopicReadStateOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TopicCountOutputType
   */

  export type TopicCountOutputType = {
    childTopics: number
    posts: number
    ancestorClosures: number
    descendantClosures: number
    watches: number
    readStates: number
  }

  export type TopicCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    childTopics?: boolean | TopicCountOutputTypeCountChildTopicsArgs
    posts?: boolean | TopicCountOutputTypeCountPostsArgs
    ancestorClosures?: boolean | TopicCountOutputTypeCountAncestorClosuresArgs
    descendantClosures?: boolean | TopicCountOutputTypeCountDescendantClosuresArgs
    watches?: boolean | TopicCountOutputTypeCountWatchesArgs
    readStates?: boolean | TopicCountOutputTypeCountReadStatesArgs
  }

  // Custom InputTypes
  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicCountOutputType
     */
    select?: TopicCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountChildTopicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWhereInput
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountAncestorClosuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicClosureWhereInput
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountDescendantClosuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicClosureWhereInput
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountWatchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWatchWhereInput
  }

  /**
   * TopicCountOutputType without action
   */
  export type TopicCountOutputTypeCountReadStatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicReadStateWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Topic
   */

  export type AggregateTopic = {
    _count: TopicCountAggregateOutputType | null
    _min: TopicMinAggregateOutputType | null
    _max: TopicMaxAggregateOutputType | null
  }

  export type TopicMinAggregateOutputType = {
    id: string | null
    parentTopicId: string | null
    challengeId: string | null
    roleName: string | null
    title: string | null
    isAnnouncement: boolean | null
    authorMemberId: string | null
    authorHandle: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    deletedByMemberId: string | null
  }

  export type TopicMaxAggregateOutputType = {
    id: string | null
    parentTopicId: string | null
    challengeId: string | null
    roleName: string | null
    title: string | null
    isAnnouncement: boolean | null
    authorMemberId: string | null
    authorHandle: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    deletedByMemberId: string | null
  }

  export type TopicCountAggregateOutputType = {
    id: number
    parentTopicId: number
    challengeId: number
    roleName: number
    title: number
    isAnnouncement: number
    authorMemberId: number
    authorHandle: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    deletedByMemberId: number
    _all: number
  }


  export type TopicMinAggregateInputType = {
    id?: true
    parentTopicId?: true
    challengeId?: true
    roleName?: true
    title?: true
    isAnnouncement?: true
    authorMemberId?: true
    authorHandle?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
  }

  export type TopicMaxAggregateInputType = {
    id?: true
    parentTopicId?: true
    challengeId?: true
    roleName?: true
    title?: true
    isAnnouncement?: true
    authorMemberId?: true
    authorHandle?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
  }

  export type TopicCountAggregateInputType = {
    id?: true
    parentTopicId?: true
    challengeId?: true
    roleName?: true
    title?: true
    isAnnouncement?: true
    authorMemberId?: true
    authorHandle?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
    _all?: true
  }

  export type TopicAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Topic to aggregate.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Topics
    **/
    _count?: true | TopicCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TopicMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TopicMaxAggregateInputType
  }

  export type GetTopicAggregateType<T extends TopicAggregateArgs> = {
        [P in keyof T & keyof AggregateTopic]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTopic[P]>
      : GetScalarType<T[P], AggregateTopic[P]>
  }




  export type TopicGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWhereInput
    orderBy?: TopicOrderByWithAggregationInput | TopicOrderByWithAggregationInput[]
    by: TopicScalarFieldEnum[] | TopicScalarFieldEnum
    having?: TopicScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TopicCountAggregateInputType | true
    _min?: TopicMinAggregateInputType
    _max?: TopicMaxAggregateInputType
  }

  export type TopicGroupByOutputType = {
    id: string
    parentTopicId: string | null
    challengeId: string | null
    roleName: string | null
    title: string
    isAnnouncement: boolean
    authorMemberId: string
    authorHandle: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    deletedByMemberId: string | null
    _count: TopicCountAggregateOutputType | null
    _min: TopicMinAggregateOutputType | null
    _max: TopicMaxAggregateOutputType | null
  }

  type GetTopicGroupByPayload<T extends TopicGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TopicGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TopicGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TopicGroupByOutputType[P]>
            : GetScalarType<T[P], TopicGroupByOutputType[P]>
        }
      >
    >


  export type TopicSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    parentTopicId?: boolean
    challengeId?: boolean
    roleName?: boolean
    title?: boolean
    isAnnouncement?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
    childTopics?: boolean | Topic$childTopicsArgs<ExtArgs>
    posts?: boolean | Topic$postsArgs<ExtArgs>
    ancestorClosures?: boolean | Topic$ancestorClosuresArgs<ExtArgs>
    descendantClosures?: boolean | Topic$descendantClosuresArgs<ExtArgs>
    watches?: boolean | Topic$watchesArgs<ExtArgs>
    readStates?: boolean | Topic$readStatesArgs<ExtArgs>
    _count?: boolean | TopicCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topic"]>

  export type TopicSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    parentTopicId?: boolean
    challengeId?: boolean
    roleName?: boolean
    title?: boolean
    isAnnouncement?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
  }, ExtArgs["result"]["topic"]>

  export type TopicSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    parentTopicId?: boolean
    challengeId?: boolean
    roleName?: boolean
    title?: boolean
    isAnnouncement?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
  }, ExtArgs["result"]["topic"]>

  export type TopicSelectScalar = {
    id?: boolean
    parentTopicId?: boolean
    challengeId?: boolean
    roleName?: boolean
    title?: boolean
    isAnnouncement?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
  }

  export type TopicOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "parentTopicId" | "challengeId" | "roleName" | "title" | "isAnnouncement" | "authorMemberId" | "authorHandle" | "createdAt" | "updatedAt" | "deletedAt" | "deletedByMemberId", ExtArgs["result"]["topic"]>
  export type TopicInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
    childTopics?: boolean | Topic$childTopicsArgs<ExtArgs>
    posts?: boolean | Topic$postsArgs<ExtArgs>
    ancestorClosures?: boolean | Topic$ancestorClosuresArgs<ExtArgs>
    descendantClosures?: boolean | Topic$descendantClosuresArgs<ExtArgs>
    watches?: boolean | Topic$watchesArgs<ExtArgs>
    readStates?: boolean | Topic$readStatesArgs<ExtArgs>
    _count?: boolean | TopicCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TopicIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
  }
  export type TopicIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentTopic?: boolean | Topic$parentTopicArgs<ExtArgs>
  }

  export type $TopicPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Topic"
    objects: {
      parentTopic: Prisma.$TopicPayload<ExtArgs> | null
      childTopics: Prisma.$TopicPayload<ExtArgs>[]
      posts: Prisma.$PostPayload<ExtArgs>[]
      ancestorClosures: Prisma.$TopicClosurePayload<ExtArgs>[]
      descendantClosures: Prisma.$TopicClosurePayload<ExtArgs>[]
      watches: Prisma.$TopicWatchPayload<ExtArgs>[]
      readStates: Prisma.$TopicReadStatePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      parentTopicId: string | null
      challengeId: string | null
      roleName: string | null
      title: string
      isAnnouncement: boolean
      authorMemberId: string
      authorHandle: string
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
      deletedByMemberId: string | null
    }, ExtArgs["result"]["topic"]>
    composites: {}
  }

  type TopicGetPayload<S extends boolean | null | undefined | TopicDefaultArgs> = $Result.GetResult<Prisma.$TopicPayload, S>

  type TopicCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TopicFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TopicCountAggregateInputType | true
    }

  export interface TopicDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Topic'], meta: { name: 'Topic' } }
    /**
     * Find zero or one Topic that matches the filter.
     * @param {TopicFindUniqueArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TopicFindUniqueArgs>(args: SelectSubset<T, TopicFindUniqueArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Topic that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TopicFindUniqueOrThrowArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TopicFindUniqueOrThrowArgs>(args: SelectSubset<T, TopicFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Topic that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindFirstArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TopicFindFirstArgs>(args?: SelectSubset<T, TopicFindFirstArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Topic that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindFirstOrThrowArgs} args - Arguments to find a Topic
     * @example
     * // Get one Topic
     * const topic = await prisma.topic.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TopicFindFirstOrThrowArgs>(args?: SelectSubset<T, TopicFindFirstOrThrowArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Topics that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Topics
     * const topics = await prisma.topic.findMany()
     * 
     * // Get first 10 Topics
     * const topics = await prisma.topic.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const topicWithIdOnly = await prisma.topic.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TopicFindManyArgs>(args?: SelectSubset<T, TopicFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Topic.
     * @param {TopicCreateArgs} args - Arguments to create a Topic.
     * @example
     * // Create one Topic
     * const Topic = await prisma.topic.create({
     *   data: {
     *     // ... data to create a Topic
     *   }
     * })
     * 
     */
    create<T extends TopicCreateArgs>(args: SelectSubset<T, TopicCreateArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Topics.
     * @param {TopicCreateManyArgs} args - Arguments to create many Topics.
     * @example
     * // Create many Topics
     * const topic = await prisma.topic.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TopicCreateManyArgs>(args?: SelectSubset<T, TopicCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Topics and returns the data saved in the database.
     * @param {TopicCreateManyAndReturnArgs} args - Arguments to create many Topics.
     * @example
     * // Create many Topics
     * const topic = await prisma.topic.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Topics and only return the `id`
     * const topicWithIdOnly = await prisma.topic.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TopicCreateManyAndReturnArgs>(args?: SelectSubset<T, TopicCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Topic.
     * @param {TopicDeleteArgs} args - Arguments to delete one Topic.
     * @example
     * // Delete one Topic
     * const Topic = await prisma.topic.delete({
     *   where: {
     *     // ... filter to delete one Topic
     *   }
     * })
     * 
     */
    delete<T extends TopicDeleteArgs>(args: SelectSubset<T, TopicDeleteArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Topic.
     * @param {TopicUpdateArgs} args - Arguments to update one Topic.
     * @example
     * // Update one Topic
     * const topic = await prisma.topic.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TopicUpdateArgs>(args: SelectSubset<T, TopicUpdateArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Topics.
     * @param {TopicDeleteManyArgs} args - Arguments to filter Topics to delete.
     * @example
     * // Delete a few Topics
     * const { count } = await prisma.topic.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TopicDeleteManyArgs>(args?: SelectSubset<T, TopicDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Topics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Topics
     * const topic = await prisma.topic.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TopicUpdateManyArgs>(args: SelectSubset<T, TopicUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Topics and returns the data updated in the database.
     * @param {TopicUpdateManyAndReturnArgs} args - Arguments to update many Topics.
     * @example
     * // Update many Topics
     * const topic = await prisma.topic.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Topics and only return the `id`
     * const topicWithIdOnly = await prisma.topic.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TopicUpdateManyAndReturnArgs>(args: SelectSubset<T, TopicUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Topic.
     * @param {TopicUpsertArgs} args - Arguments to update or create a Topic.
     * @example
     * // Update or create a Topic
     * const topic = await prisma.topic.upsert({
     *   create: {
     *     // ... data to create a Topic
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Topic we want to update
     *   }
     * })
     */
    upsert<T extends TopicUpsertArgs>(args: SelectSubset<T, TopicUpsertArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Topics.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicCountArgs} args - Arguments to filter Topics to count.
     * @example
     * // Count the number of Topics
     * const count = await prisma.topic.count({
     *   where: {
     *     // ... the filter for the Topics we want to count
     *   }
     * })
    **/
    count<T extends TopicCountArgs>(
      args?: Subset<T, TopicCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TopicCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Topic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TopicAggregateArgs>(args: Subset<T, TopicAggregateArgs>): Prisma.PrismaPromise<GetTopicAggregateType<T>>

    /**
     * Group by Topic.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TopicGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TopicGroupByArgs['orderBy'] }
        : { orderBy?: TopicGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TopicGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTopicGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Topic model
   */
  readonly fields: TopicFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Topic.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TopicClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    parentTopic<T extends Topic$parentTopicArgs<ExtArgs> = {}>(args?: Subset<T, Topic$parentTopicArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    childTopics<T extends Topic$childTopicsArgs<ExtArgs> = {}>(args?: Subset<T, Topic$childTopicsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    posts<T extends Topic$postsArgs<ExtArgs> = {}>(args?: Subset<T, Topic$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    ancestorClosures<T extends Topic$ancestorClosuresArgs<ExtArgs> = {}>(args?: Subset<T, Topic$ancestorClosuresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    descendantClosures<T extends Topic$descendantClosuresArgs<ExtArgs> = {}>(args?: Subset<T, Topic$descendantClosuresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    watches<T extends Topic$watchesArgs<ExtArgs> = {}>(args?: Subset<T, Topic$watchesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    readStates<T extends Topic$readStatesArgs<ExtArgs> = {}>(args?: Subset<T, Topic$readStatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Topic model
   */
  interface TopicFieldRefs {
    readonly id: FieldRef<"Topic", 'String'>
    readonly parentTopicId: FieldRef<"Topic", 'String'>
    readonly challengeId: FieldRef<"Topic", 'String'>
    readonly roleName: FieldRef<"Topic", 'String'>
    readonly title: FieldRef<"Topic", 'String'>
    readonly isAnnouncement: FieldRef<"Topic", 'Boolean'>
    readonly authorMemberId: FieldRef<"Topic", 'String'>
    readonly authorHandle: FieldRef<"Topic", 'String'>
    readonly createdAt: FieldRef<"Topic", 'DateTime'>
    readonly updatedAt: FieldRef<"Topic", 'DateTime'>
    readonly deletedAt: FieldRef<"Topic", 'DateTime'>
    readonly deletedByMemberId: FieldRef<"Topic", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Topic findUnique
   */
  export type TopicFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where: TopicWhereUniqueInput
  }

  /**
   * Topic findUniqueOrThrow
   */
  export type TopicFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where: TopicWhereUniqueInput
  }

  /**
   * Topic findFirst
   */
  export type TopicFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Topics.
     */
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }

  /**
   * Topic findFirstOrThrow
   */
  export type TopicFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topic to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Topics.
     */
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }

  /**
   * Topic findMany
   */
  export type TopicFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter, which Topics to fetch.
     */
    where?: TopicWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Topics to fetch.
     */
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Topics.
     */
    cursor?: TopicWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Topics from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Topics.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Topics.
     */
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }

  /**
   * Topic create
   */
  export type TopicCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The data needed to create a Topic.
     */
    data: XOR<TopicCreateInput, TopicUncheckedCreateInput>
  }

  /**
   * Topic createMany
   */
  export type TopicCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Topics.
     */
    data: TopicCreateManyInput | TopicCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Topic createManyAndReturn
   */
  export type TopicCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * The data used to create many Topics.
     */
    data: TopicCreateManyInput | TopicCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Topic update
   */
  export type TopicUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The data needed to update a Topic.
     */
    data: XOR<TopicUpdateInput, TopicUncheckedUpdateInput>
    /**
     * Choose, which Topic to update.
     */
    where: TopicWhereUniqueInput
  }

  /**
   * Topic updateMany
   */
  export type TopicUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Topics.
     */
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyInput>
    /**
     * Filter which Topics to update
     */
    where?: TopicWhereInput
    /**
     * Limit how many Topics to update.
     */
    limit?: number
  }

  /**
   * Topic updateManyAndReturn
   */
  export type TopicUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * The data used to update Topics.
     */
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyInput>
    /**
     * Filter which Topics to update
     */
    where?: TopicWhereInput
    /**
     * Limit how many Topics to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Topic upsert
   */
  export type TopicUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * The filter to search for the Topic to update in case it exists.
     */
    where: TopicWhereUniqueInput
    /**
     * In case the Topic found by the `where` argument doesn't exist, create a new Topic with this data.
     */
    create: XOR<TopicCreateInput, TopicUncheckedCreateInput>
    /**
     * In case the Topic was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TopicUpdateInput, TopicUncheckedUpdateInput>
  }

  /**
   * Topic delete
   */
  export type TopicDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    /**
     * Filter which Topic to delete.
     */
    where: TopicWhereUniqueInput
  }

  /**
   * Topic deleteMany
   */
  export type TopicDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Topics to delete
     */
    where?: TopicWhereInput
    /**
     * Limit how many Topics to delete.
     */
    limit?: number
  }

  /**
   * Topic.parentTopic
   */
  export type Topic$parentTopicArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    where?: TopicWhereInput
  }

  /**
   * Topic.childTopics
   */
  export type Topic$childTopicsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
    where?: TopicWhereInput
    orderBy?: TopicOrderByWithRelationInput | TopicOrderByWithRelationInput[]
    cursor?: TopicWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicScalarFieldEnum | TopicScalarFieldEnum[]
  }

  /**
   * Topic.posts
   */
  export type Topic$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Topic.ancestorClosures
   */
  export type Topic$ancestorClosuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    where?: TopicClosureWhereInput
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    cursor?: TopicClosureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicClosureScalarFieldEnum | TopicClosureScalarFieldEnum[]
  }

  /**
   * Topic.descendantClosures
   */
  export type Topic$descendantClosuresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    where?: TopicClosureWhereInput
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    cursor?: TopicClosureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicClosureScalarFieldEnum | TopicClosureScalarFieldEnum[]
  }

  /**
   * Topic.watches
   */
  export type Topic$watchesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    where?: TopicWatchWhereInput
    orderBy?: TopicWatchOrderByWithRelationInput | TopicWatchOrderByWithRelationInput[]
    cursor?: TopicWatchWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicWatchScalarFieldEnum | TopicWatchScalarFieldEnum[]
  }

  /**
   * Topic.readStates
   */
  export type Topic$readStatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    where?: TopicReadStateWhereInput
    orderBy?: TopicReadStateOrderByWithRelationInput | TopicReadStateOrderByWithRelationInput[]
    cursor?: TopicReadStateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TopicReadStateScalarFieldEnum | TopicReadStateScalarFieldEnum[]
  }

  /**
   * Topic without action
   */
  export type TopicDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Topic
     */
    select?: TopicSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Topic
     */
    omit?: TopicOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicInclude<ExtArgs> | null
  }


  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostMinAggregateOutputType = {
    id: string | null
    topicId: string | null
    parentType: string | null
    parentId: string | null
    authorMemberId: string | null
    authorHandle: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    deletedByMemberId: string | null
  }

  export type PostMaxAggregateOutputType = {
    id: string | null
    topicId: string | null
    parentType: string | null
    parentId: string | null
    authorMemberId: string | null
    authorHandle: string | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    deletedByMemberId: string | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    topicId: number
    parentType: number
    parentId: number
    authorMemberId: number
    authorHandle: number
    content: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    deletedByMemberId: number
    _all: number
  }


  export type PostMinAggregateInputType = {
    id?: true
    topicId?: true
    parentType?: true
    parentId?: true
    authorMemberId?: true
    authorHandle?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    topicId?: true
    parentType?: true
    parentId?: true
    authorMemberId?: true
    authorHandle?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    topicId?: true
    parentType?: true
    parentId?: true
    authorMemberId?: true
    authorHandle?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    deletedByMemberId?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: string
    topicId: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    deletedByMemberId: string | null
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    topicId?: boolean
    parentType?: boolean
    parentId?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    topicId?: boolean
    parentType?: boolean
    parentId?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    topicId?: boolean
    parentType?: boolean
    parentId?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    topicId?: boolean
    parentType?: boolean
    parentId?: boolean
    authorMemberId?: boolean
    authorHandle?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
    deletedByMemberId?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "topicId" | "parentType" | "parentId" | "authorMemberId" | "authorHandle" | "content" | "createdAt" | "updatedAt" | "deletedAt" | "deletedByMemberId", ExtArgs["result"]["post"]>
  export type PostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type PostIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type PostIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {
      topic: Prisma.$TopicPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      topicId: string
      parentType: string
      parentId: string
      authorMemberId: string
      authorHandle: string
      content: string | null
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
      deletedByMemberId: string | null
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Posts and returns the data saved in the database.
     * @param {PostCreateManyAndReturnArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts and returns the data updated in the database.
     * @param {PostUpdateManyAndReturnArgs} args - Arguments to update many Posts.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    topic<T extends TopicDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TopicDefaultArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'String'>
    readonly topicId: FieldRef<"Post", 'String'>
    readonly parentType: FieldRef<"Post", 'String'>
    readonly parentId: FieldRef<"Post", 'String'>
    readonly authorMemberId: FieldRef<"Post", 'String'>
    readonly authorHandle: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
    readonly deletedAt: FieldRef<"Post", 'DateTime'>
    readonly deletedByMemberId: FieldRef<"Post", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post createManyAndReturn
   */
  export type PostCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post updateManyAndReturn
   */
  export type PostUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
  }


  /**
   * Model TopicClosure
   */

  export type AggregateTopicClosure = {
    _count: TopicClosureCountAggregateOutputType | null
    _avg: TopicClosureAvgAggregateOutputType | null
    _sum: TopicClosureSumAggregateOutputType | null
    _min: TopicClosureMinAggregateOutputType | null
    _max: TopicClosureMaxAggregateOutputType | null
  }

  export type TopicClosureAvgAggregateOutputType = {
    depth: number | null
  }

  export type TopicClosureSumAggregateOutputType = {
    depth: number | null
  }

  export type TopicClosureMinAggregateOutputType = {
    ancestorTopicId: string | null
    descendantTopicId: string | null
    depth: number | null
  }

  export type TopicClosureMaxAggregateOutputType = {
    ancestorTopicId: string | null
    descendantTopicId: string | null
    depth: number | null
  }

  export type TopicClosureCountAggregateOutputType = {
    ancestorTopicId: number
    descendantTopicId: number
    depth: number
    _all: number
  }


  export type TopicClosureAvgAggregateInputType = {
    depth?: true
  }

  export type TopicClosureSumAggregateInputType = {
    depth?: true
  }

  export type TopicClosureMinAggregateInputType = {
    ancestorTopicId?: true
    descendantTopicId?: true
    depth?: true
  }

  export type TopicClosureMaxAggregateInputType = {
    ancestorTopicId?: true
    descendantTopicId?: true
    depth?: true
  }

  export type TopicClosureCountAggregateInputType = {
    ancestorTopicId?: true
    descendantTopicId?: true
    depth?: true
    _all?: true
  }

  export type TopicClosureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicClosure to aggregate.
     */
    where?: TopicClosureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicClosures to fetch.
     */
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TopicClosureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicClosures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicClosures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TopicClosures
    **/
    _count?: true | TopicClosureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TopicClosureAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TopicClosureSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TopicClosureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TopicClosureMaxAggregateInputType
  }

  export type GetTopicClosureAggregateType<T extends TopicClosureAggregateArgs> = {
        [P in keyof T & keyof AggregateTopicClosure]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTopicClosure[P]>
      : GetScalarType<T[P], AggregateTopicClosure[P]>
  }




  export type TopicClosureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicClosureWhereInput
    orderBy?: TopicClosureOrderByWithAggregationInput | TopicClosureOrderByWithAggregationInput[]
    by: TopicClosureScalarFieldEnum[] | TopicClosureScalarFieldEnum
    having?: TopicClosureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TopicClosureCountAggregateInputType | true
    _avg?: TopicClosureAvgAggregateInputType
    _sum?: TopicClosureSumAggregateInputType
    _min?: TopicClosureMinAggregateInputType
    _max?: TopicClosureMaxAggregateInputType
  }

  export type TopicClosureGroupByOutputType = {
    ancestorTopicId: string
    descendantTopicId: string
    depth: number
    _count: TopicClosureCountAggregateOutputType | null
    _avg: TopicClosureAvgAggregateOutputType | null
    _sum: TopicClosureSumAggregateOutputType | null
    _min: TopicClosureMinAggregateOutputType | null
    _max: TopicClosureMaxAggregateOutputType | null
  }

  type GetTopicClosureGroupByPayload<T extends TopicClosureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TopicClosureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TopicClosureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TopicClosureGroupByOutputType[P]>
            : GetScalarType<T[P], TopicClosureGroupByOutputType[P]>
        }
      >
    >


  export type TopicClosureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ancestorTopicId?: boolean
    descendantTopicId?: boolean
    depth?: boolean
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicClosure"]>

  export type TopicClosureSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ancestorTopicId?: boolean
    descendantTopicId?: boolean
    depth?: boolean
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicClosure"]>

  export type TopicClosureSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    ancestorTopicId?: boolean
    descendantTopicId?: boolean
    depth?: boolean
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicClosure"]>

  export type TopicClosureSelectScalar = {
    ancestorTopicId?: boolean
    descendantTopicId?: boolean
    depth?: boolean
  }

  export type TopicClosureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"ancestorTopicId" | "descendantTopicId" | "depth", ExtArgs["result"]["topicClosure"]>
  export type TopicClosureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicClosureIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicClosureIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    ancestorTopic?: boolean | TopicDefaultArgs<ExtArgs>
    descendantTopic?: boolean | TopicDefaultArgs<ExtArgs>
  }

  export type $TopicClosurePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TopicClosure"
    objects: {
      ancestorTopic: Prisma.$TopicPayload<ExtArgs>
      descendantTopic: Prisma.$TopicPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      ancestorTopicId: string
      descendantTopicId: string
      depth: number
    }, ExtArgs["result"]["topicClosure"]>
    composites: {}
  }

  type TopicClosureGetPayload<S extends boolean | null | undefined | TopicClosureDefaultArgs> = $Result.GetResult<Prisma.$TopicClosurePayload, S>

  type TopicClosureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TopicClosureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TopicClosureCountAggregateInputType | true
    }

  export interface TopicClosureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TopicClosure'], meta: { name: 'TopicClosure' } }
    /**
     * Find zero or one TopicClosure that matches the filter.
     * @param {TopicClosureFindUniqueArgs} args - Arguments to find a TopicClosure
     * @example
     * // Get one TopicClosure
     * const topicClosure = await prisma.topicClosure.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TopicClosureFindUniqueArgs>(args: SelectSubset<T, TopicClosureFindUniqueArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TopicClosure that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TopicClosureFindUniqueOrThrowArgs} args - Arguments to find a TopicClosure
     * @example
     * // Get one TopicClosure
     * const topicClosure = await prisma.topicClosure.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TopicClosureFindUniqueOrThrowArgs>(args: SelectSubset<T, TopicClosureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicClosure that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureFindFirstArgs} args - Arguments to find a TopicClosure
     * @example
     * // Get one TopicClosure
     * const topicClosure = await prisma.topicClosure.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TopicClosureFindFirstArgs>(args?: SelectSubset<T, TopicClosureFindFirstArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicClosure that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureFindFirstOrThrowArgs} args - Arguments to find a TopicClosure
     * @example
     * // Get one TopicClosure
     * const topicClosure = await prisma.topicClosure.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TopicClosureFindFirstOrThrowArgs>(args?: SelectSubset<T, TopicClosureFindFirstOrThrowArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TopicClosures that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TopicClosures
     * const topicClosures = await prisma.topicClosure.findMany()
     * 
     * // Get first 10 TopicClosures
     * const topicClosures = await prisma.topicClosure.findMany({ take: 10 })
     * 
     * // Only select the `ancestorTopicId`
     * const topicClosureWithAncestorTopicIdOnly = await prisma.topicClosure.findMany({ select: { ancestorTopicId: true } })
     * 
     */
    findMany<T extends TopicClosureFindManyArgs>(args?: SelectSubset<T, TopicClosureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TopicClosure.
     * @param {TopicClosureCreateArgs} args - Arguments to create a TopicClosure.
     * @example
     * // Create one TopicClosure
     * const TopicClosure = await prisma.topicClosure.create({
     *   data: {
     *     // ... data to create a TopicClosure
     *   }
     * })
     * 
     */
    create<T extends TopicClosureCreateArgs>(args: SelectSubset<T, TopicClosureCreateArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TopicClosures.
     * @param {TopicClosureCreateManyArgs} args - Arguments to create many TopicClosures.
     * @example
     * // Create many TopicClosures
     * const topicClosure = await prisma.topicClosure.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TopicClosureCreateManyArgs>(args?: SelectSubset<T, TopicClosureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TopicClosures and returns the data saved in the database.
     * @param {TopicClosureCreateManyAndReturnArgs} args - Arguments to create many TopicClosures.
     * @example
     * // Create many TopicClosures
     * const topicClosure = await prisma.topicClosure.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TopicClosures and only return the `ancestorTopicId`
     * const topicClosureWithAncestorTopicIdOnly = await prisma.topicClosure.createManyAndReturn({
     *   select: { ancestorTopicId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TopicClosureCreateManyAndReturnArgs>(args?: SelectSubset<T, TopicClosureCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TopicClosure.
     * @param {TopicClosureDeleteArgs} args - Arguments to delete one TopicClosure.
     * @example
     * // Delete one TopicClosure
     * const TopicClosure = await prisma.topicClosure.delete({
     *   where: {
     *     // ... filter to delete one TopicClosure
     *   }
     * })
     * 
     */
    delete<T extends TopicClosureDeleteArgs>(args: SelectSubset<T, TopicClosureDeleteArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TopicClosure.
     * @param {TopicClosureUpdateArgs} args - Arguments to update one TopicClosure.
     * @example
     * // Update one TopicClosure
     * const topicClosure = await prisma.topicClosure.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TopicClosureUpdateArgs>(args: SelectSubset<T, TopicClosureUpdateArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TopicClosures.
     * @param {TopicClosureDeleteManyArgs} args - Arguments to filter TopicClosures to delete.
     * @example
     * // Delete a few TopicClosures
     * const { count } = await prisma.topicClosure.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TopicClosureDeleteManyArgs>(args?: SelectSubset<T, TopicClosureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicClosures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TopicClosures
     * const topicClosure = await prisma.topicClosure.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TopicClosureUpdateManyArgs>(args: SelectSubset<T, TopicClosureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicClosures and returns the data updated in the database.
     * @param {TopicClosureUpdateManyAndReturnArgs} args - Arguments to update many TopicClosures.
     * @example
     * // Update many TopicClosures
     * const topicClosure = await prisma.topicClosure.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TopicClosures and only return the `ancestorTopicId`
     * const topicClosureWithAncestorTopicIdOnly = await prisma.topicClosure.updateManyAndReturn({
     *   select: { ancestorTopicId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TopicClosureUpdateManyAndReturnArgs>(args: SelectSubset<T, TopicClosureUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TopicClosure.
     * @param {TopicClosureUpsertArgs} args - Arguments to update or create a TopicClosure.
     * @example
     * // Update or create a TopicClosure
     * const topicClosure = await prisma.topicClosure.upsert({
     *   create: {
     *     // ... data to create a TopicClosure
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TopicClosure we want to update
     *   }
     * })
     */
    upsert<T extends TopicClosureUpsertArgs>(args: SelectSubset<T, TopicClosureUpsertArgs<ExtArgs>>): Prisma__TopicClosureClient<$Result.GetResult<Prisma.$TopicClosurePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TopicClosures.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureCountArgs} args - Arguments to filter TopicClosures to count.
     * @example
     * // Count the number of TopicClosures
     * const count = await prisma.topicClosure.count({
     *   where: {
     *     // ... the filter for the TopicClosures we want to count
     *   }
     * })
    **/
    count<T extends TopicClosureCountArgs>(
      args?: Subset<T, TopicClosureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TopicClosureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TopicClosure.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TopicClosureAggregateArgs>(args: Subset<T, TopicClosureAggregateArgs>): Prisma.PrismaPromise<GetTopicClosureAggregateType<T>>

    /**
     * Group by TopicClosure.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicClosureGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TopicClosureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TopicClosureGroupByArgs['orderBy'] }
        : { orderBy?: TopicClosureGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TopicClosureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTopicClosureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TopicClosure model
   */
  readonly fields: TopicClosureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TopicClosure.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TopicClosureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    ancestorTopic<T extends TopicDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TopicDefaultArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    descendantTopic<T extends TopicDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TopicDefaultArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TopicClosure model
   */
  interface TopicClosureFieldRefs {
    readonly ancestorTopicId: FieldRef<"TopicClosure", 'String'>
    readonly descendantTopicId: FieldRef<"TopicClosure", 'String'>
    readonly depth: FieldRef<"TopicClosure", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * TopicClosure findUnique
   */
  export type TopicClosureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter, which TopicClosure to fetch.
     */
    where: TopicClosureWhereUniqueInput
  }

  /**
   * TopicClosure findUniqueOrThrow
   */
  export type TopicClosureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter, which TopicClosure to fetch.
     */
    where: TopicClosureWhereUniqueInput
  }

  /**
   * TopicClosure findFirst
   */
  export type TopicClosureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter, which TopicClosure to fetch.
     */
    where?: TopicClosureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicClosures to fetch.
     */
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicClosures.
     */
    cursor?: TopicClosureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicClosures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicClosures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicClosures.
     */
    distinct?: TopicClosureScalarFieldEnum | TopicClosureScalarFieldEnum[]
  }

  /**
   * TopicClosure findFirstOrThrow
   */
  export type TopicClosureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter, which TopicClosure to fetch.
     */
    where?: TopicClosureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicClosures to fetch.
     */
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicClosures.
     */
    cursor?: TopicClosureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicClosures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicClosures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicClosures.
     */
    distinct?: TopicClosureScalarFieldEnum | TopicClosureScalarFieldEnum[]
  }

  /**
   * TopicClosure findMany
   */
  export type TopicClosureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter, which TopicClosures to fetch.
     */
    where?: TopicClosureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicClosures to fetch.
     */
    orderBy?: TopicClosureOrderByWithRelationInput | TopicClosureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TopicClosures.
     */
    cursor?: TopicClosureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicClosures from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicClosures.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicClosures.
     */
    distinct?: TopicClosureScalarFieldEnum | TopicClosureScalarFieldEnum[]
  }

  /**
   * TopicClosure create
   */
  export type TopicClosureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * The data needed to create a TopicClosure.
     */
    data: XOR<TopicClosureCreateInput, TopicClosureUncheckedCreateInput>
  }

  /**
   * TopicClosure createMany
   */
  export type TopicClosureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TopicClosures.
     */
    data: TopicClosureCreateManyInput | TopicClosureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TopicClosure createManyAndReturn
   */
  export type TopicClosureCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * The data used to create many TopicClosures.
     */
    data: TopicClosureCreateManyInput | TopicClosureCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicClosure update
   */
  export type TopicClosureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * The data needed to update a TopicClosure.
     */
    data: XOR<TopicClosureUpdateInput, TopicClosureUncheckedUpdateInput>
    /**
     * Choose, which TopicClosure to update.
     */
    where: TopicClosureWhereUniqueInput
  }

  /**
   * TopicClosure updateMany
   */
  export type TopicClosureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TopicClosures.
     */
    data: XOR<TopicClosureUpdateManyMutationInput, TopicClosureUncheckedUpdateManyInput>
    /**
     * Filter which TopicClosures to update
     */
    where?: TopicClosureWhereInput
    /**
     * Limit how many TopicClosures to update.
     */
    limit?: number
  }

  /**
   * TopicClosure updateManyAndReturn
   */
  export type TopicClosureUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * The data used to update TopicClosures.
     */
    data: XOR<TopicClosureUpdateManyMutationInput, TopicClosureUncheckedUpdateManyInput>
    /**
     * Filter which TopicClosures to update
     */
    where?: TopicClosureWhereInput
    /**
     * Limit how many TopicClosures to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicClosure upsert
   */
  export type TopicClosureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * The filter to search for the TopicClosure to update in case it exists.
     */
    where: TopicClosureWhereUniqueInput
    /**
     * In case the TopicClosure found by the `where` argument doesn't exist, create a new TopicClosure with this data.
     */
    create: XOR<TopicClosureCreateInput, TopicClosureUncheckedCreateInput>
    /**
     * In case the TopicClosure was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TopicClosureUpdateInput, TopicClosureUncheckedUpdateInput>
  }

  /**
   * TopicClosure delete
   */
  export type TopicClosureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
    /**
     * Filter which TopicClosure to delete.
     */
    where: TopicClosureWhereUniqueInput
  }

  /**
   * TopicClosure deleteMany
   */
  export type TopicClosureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicClosures to delete
     */
    where?: TopicClosureWhereInput
    /**
     * Limit how many TopicClosures to delete.
     */
    limit?: number
  }

  /**
   * TopicClosure without action
   */
  export type TopicClosureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicClosure
     */
    select?: TopicClosureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicClosure
     */
    omit?: TopicClosureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicClosureInclude<ExtArgs> | null
  }


  /**
   * Model TopicWatch
   */

  export type AggregateTopicWatch = {
    _count: TopicWatchCountAggregateOutputType | null
    _min: TopicWatchMinAggregateOutputType | null
    _max: TopicWatchMaxAggregateOutputType | null
  }

  export type TopicWatchMinAggregateOutputType = {
    topicId: string | null
    memberId: string | null
    createdAt: Date | null
  }

  export type TopicWatchMaxAggregateOutputType = {
    topicId: string | null
    memberId: string | null
    createdAt: Date | null
  }

  export type TopicWatchCountAggregateOutputType = {
    topicId: number
    memberId: number
    createdAt: number
    _all: number
  }


  export type TopicWatchMinAggregateInputType = {
    topicId?: true
    memberId?: true
    createdAt?: true
  }

  export type TopicWatchMaxAggregateInputType = {
    topicId?: true
    memberId?: true
    createdAt?: true
  }

  export type TopicWatchCountAggregateInputType = {
    topicId?: true
    memberId?: true
    createdAt?: true
    _all?: true
  }

  export type TopicWatchAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicWatch to aggregate.
     */
    where?: TopicWatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicWatches to fetch.
     */
    orderBy?: TopicWatchOrderByWithRelationInput | TopicWatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TopicWatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicWatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicWatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TopicWatches
    **/
    _count?: true | TopicWatchCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TopicWatchMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TopicWatchMaxAggregateInputType
  }

  export type GetTopicWatchAggregateType<T extends TopicWatchAggregateArgs> = {
        [P in keyof T & keyof AggregateTopicWatch]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTopicWatch[P]>
      : GetScalarType<T[P], AggregateTopicWatch[P]>
  }




  export type TopicWatchGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicWatchWhereInput
    orderBy?: TopicWatchOrderByWithAggregationInput | TopicWatchOrderByWithAggregationInput[]
    by: TopicWatchScalarFieldEnum[] | TopicWatchScalarFieldEnum
    having?: TopicWatchScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TopicWatchCountAggregateInputType | true
    _min?: TopicWatchMinAggregateInputType
    _max?: TopicWatchMaxAggregateInputType
  }

  export type TopicWatchGroupByOutputType = {
    topicId: string
    memberId: string
    createdAt: Date
    _count: TopicWatchCountAggregateOutputType | null
    _min: TopicWatchMinAggregateOutputType | null
    _max: TopicWatchMaxAggregateOutputType | null
  }

  type GetTopicWatchGroupByPayload<T extends TopicWatchGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TopicWatchGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TopicWatchGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TopicWatchGroupByOutputType[P]>
            : GetScalarType<T[P], TopicWatchGroupByOutputType[P]>
        }
      >
    >


  export type TopicWatchSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    createdAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicWatch"]>

  export type TopicWatchSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    createdAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicWatch"]>

  export type TopicWatchSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    createdAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicWatch"]>

  export type TopicWatchSelectScalar = {
    topicId?: boolean
    memberId?: boolean
    createdAt?: boolean
  }

  export type TopicWatchOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"topicId" | "memberId" | "createdAt", ExtArgs["result"]["topicWatch"]>
  export type TopicWatchInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicWatchIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicWatchIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }

  export type $TopicWatchPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TopicWatch"
    objects: {
      topic: Prisma.$TopicPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      topicId: string
      memberId: string
      createdAt: Date
    }, ExtArgs["result"]["topicWatch"]>
    composites: {}
  }

  type TopicWatchGetPayload<S extends boolean | null | undefined | TopicWatchDefaultArgs> = $Result.GetResult<Prisma.$TopicWatchPayload, S>

  type TopicWatchCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TopicWatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TopicWatchCountAggregateInputType | true
    }

  export interface TopicWatchDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TopicWatch'], meta: { name: 'TopicWatch' } }
    /**
     * Find zero or one TopicWatch that matches the filter.
     * @param {TopicWatchFindUniqueArgs} args - Arguments to find a TopicWatch
     * @example
     * // Get one TopicWatch
     * const topicWatch = await prisma.topicWatch.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TopicWatchFindUniqueArgs>(args: SelectSubset<T, TopicWatchFindUniqueArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TopicWatch that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TopicWatchFindUniqueOrThrowArgs} args - Arguments to find a TopicWatch
     * @example
     * // Get one TopicWatch
     * const topicWatch = await prisma.topicWatch.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TopicWatchFindUniqueOrThrowArgs>(args: SelectSubset<T, TopicWatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicWatch that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchFindFirstArgs} args - Arguments to find a TopicWatch
     * @example
     * // Get one TopicWatch
     * const topicWatch = await prisma.topicWatch.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TopicWatchFindFirstArgs>(args?: SelectSubset<T, TopicWatchFindFirstArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicWatch that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchFindFirstOrThrowArgs} args - Arguments to find a TopicWatch
     * @example
     * // Get one TopicWatch
     * const topicWatch = await prisma.topicWatch.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TopicWatchFindFirstOrThrowArgs>(args?: SelectSubset<T, TopicWatchFindFirstOrThrowArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TopicWatches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TopicWatches
     * const topicWatches = await prisma.topicWatch.findMany()
     * 
     * // Get first 10 TopicWatches
     * const topicWatches = await prisma.topicWatch.findMany({ take: 10 })
     * 
     * // Only select the `topicId`
     * const topicWatchWithTopicIdOnly = await prisma.topicWatch.findMany({ select: { topicId: true } })
     * 
     */
    findMany<T extends TopicWatchFindManyArgs>(args?: SelectSubset<T, TopicWatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TopicWatch.
     * @param {TopicWatchCreateArgs} args - Arguments to create a TopicWatch.
     * @example
     * // Create one TopicWatch
     * const TopicWatch = await prisma.topicWatch.create({
     *   data: {
     *     // ... data to create a TopicWatch
     *   }
     * })
     * 
     */
    create<T extends TopicWatchCreateArgs>(args: SelectSubset<T, TopicWatchCreateArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TopicWatches.
     * @param {TopicWatchCreateManyArgs} args - Arguments to create many TopicWatches.
     * @example
     * // Create many TopicWatches
     * const topicWatch = await prisma.topicWatch.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TopicWatchCreateManyArgs>(args?: SelectSubset<T, TopicWatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TopicWatches and returns the data saved in the database.
     * @param {TopicWatchCreateManyAndReturnArgs} args - Arguments to create many TopicWatches.
     * @example
     * // Create many TopicWatches
     * const topicWatch = await prisma.topicWatch.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TopicWatches and only return the `topicId`
     * const topicWatchWithTopicIdOnly = await prisma.topicWatch.createManyAndReturn({
     *   select: { topicId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TopicWatchCreateManyAndReturnArgs>(args?: SelectSubset<T, TopicWatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TopicWatch.
     * @param {TopicWatchDeleteArgs} args - Arguments to delete one TopicWatch.
     * @example
     * // Delete one TopicWatch
     * const TopicWatch = await prisma.topicWatch.delete({
     *   where: {
     *     // ... filter to delete one TopicWatch
     *   }
     * })
     * 
     */
    delete<T extends TopicWatchDeleteArgs>(args: SelectSubset<T, TopicWatchDeleteArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TopicWatch.
     * @param {TopicWatchUpdateArgs} args - Arguments to update one TopicWatch.
     * @example
     * // Update one TopicWatch
     * const topicWatch = await prisma.topicWatch.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TopicWatchUpdateArgs>(args: SelectSubset<T, TopicWatchUpdateArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TopicWatches.
     * @param {TopicWatchDeleteManyArgs} args - Arguments to filter TopicWatches to delete.
     * @example
     * // Delete a few TopicWatches
     * const { count } = await prisma.topicWatch.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TopicWatchDeleteManyArgs>(args?: SelectSubset<T, TopicWatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicWatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TopicWatches
     * const topicWatch = await prisma.topicWatch.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TopicWatchUpdateManyArgs>(args: SelectSubset<T, TopicWatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicWatches and returns the data updated in the database.
     * @param {TopicWatchUpdateManyAndReturnArgs} args - Arguments to update many TopicWatches.
     * @example
     * // Update many TopicWatches
     * const topicWatch = await prisma.topicWatch.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TopicWatches and only return the `topicId`
     * const topicWatchWithTopicIdOnly = await prisma.topicWatch.updateManyAndReturn({
     *   select: { topicId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TopicWatchUpdateManyAndReturnArgs>(args: SelectSubset<T, TopicWatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TopicWatch.
     * @param {TopicWatchUpsertArgs} args - Arguments to update or create a TopicWatch.
     * @example
     * // Update or create a TopicWatch
     * const topicWatch = await prisma.topicWatch.upsert({
     *   create: {
     *     // ... data to create a TopicWatch
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TopicWatch we want to update
     *   }
     * })
     */
    upsert<T extends TopicWatchUpsertArgs>(args: SelectSubset<T, TopicWatchUpsertArgs<ExtArgs>>): Prisma__TopicWatchClient<$Result.GetResult<Prisma.$TopicWatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TopicWatches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchCountArgs} args - Arguments to filter TopicWatches to count.
     * @example
     * // Count the number of TopicWatches
     * const count = await prisma.topicWatch.count({
     *   where: {
     *     // ... the filter for the TopicWatches we want to count
     *   }
     * })
    **/
    count<T extends TopicWatchCountArgs>(
      args?: Subset<T, TopicWatchCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TopicWatchCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TopicWatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TopicWatchAggregateArgs>(args: Subset<T, TopicWatchAggregateArgs>): Prisma.PrismaPromise<GetTopicWatchAggregateType<T>>

    /**
     * Group by TopicWatch.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicWatchGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TopicWatchGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TopicWatchGroupByArgs['orderBy'] }
        : { orderBy?: TopicWatchGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TopicWatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTopicWatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TopicWatch model
   */
  readonly fields: TopicWatchFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TopicWatch.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TopicWatchClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    topic<T extends TopicDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TopicDefaultArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TopicWatch model
   */
  interface TopicWatchFieldRefs {
    readonly topicId: FieldRef<"TopicWatch", 'String'>
    readonly memberId: FieldRef<"TopicWatch", 'String'>
    readonly createdAt: FieldRef<"TopicWatch", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TopicWatch findUnique
   */
  export type TopicWatchFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter, which TopicWatch to fetch.
     */
    where: TopicWatchWhereUniqueInput
  }

  /**
   * TopicWatch findUniqueOrThrow
   */
  export type TopicWatchFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter, which TopicWatch to fetch.
     */
    where: TopicWatchWhereUniqueInput
  }

  /**
   * TopicWatch findFirst
   */
  export type TopicWatchFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter, which TopicWatch to fetch.
     */
    where?: TopicWatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicWatches to fetch.
     */
    orderBy?: TopicWatchOrderByWithRelationInput | TopicWatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicWatches.
     */
    cursor?: TopicWatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicWatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicWatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicWatches.
     */
    distinct?: TopicWatchScalarFieldEnum | TopicWatchScalarFieldEnum[]
  }

  /**
   * TopicWatch findFirstOrThrow
   */
  export type TopicWatchFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter, which TopicWatch to fetch.
     */
    where?: TopicWatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicWatches to fetch.
     */
    orderBy?: TopicWatchOrderByWithRelationInput | TopicWatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicWatches.
     */
    cursor?: TopicWatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicWatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicWatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicWatches.
     */
    distinct?: TopicWatchScalarFieldEnum | TopicWatchScalarFieldEnum[]
  }

  /**
   * TopicWatch findMany
   */
  export type TopicWatchFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter, which TopicWatches to fetch.
     */
    where?: TopicWatchWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicWatches to fetch.
     */
    orderBy?: TopicWatchOrderByWithRelationInput | TopicWatchOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TopicWatches.
     */
    cursor?: TopicWatchWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicWatches from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicWatches.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicWatches.
     */
    distinct?: TopicWatchScalarFieldEnum | TopicWatchScalarFieldEnum[]
  }

  /**
   * TopicWatch create
   */
  export type TopicWatchCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * The data needed to create a TopicWatch.
     */
    data: XOR<TopicWatchCreateInput, TopicWatchUncheckedCreateInput>
  }

  /**
   * TopicWatch createMany
   */
  export type TopicWatchCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TopicWatches.
     */
    data: TopicWatchCreateManyInput | TopicWatchCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TopicWatch createManyAndReturn
   */
  export type TopicWatchCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * The data used to create many TopicWatches.
     */
    data: TopicWatchCreateManyInput | TopicWatchCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicWatch update
   */
  export type TopicWatchUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * The data needed to update a TopicWatch.
     */
    data: XOR<TopicWatchUpdateInput, TopicWatchUncheckedUpdateInput>
    /**
     * Choose, which TopicWatch to update.
     */
    where: TopicWatchWhereUniqueInput
  }

  /**
   * TopicWatch updateMany
   */
  export type TopicWatchUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TopicWatches.
     */
    data: XOR<TopicWatchUpdateManyMutationInput, TopicWatchUncheckedUpdateManyInput>
    /**
     * Filter which TopicWatches to update
     */
    where?: TopicWatchWhereInput
    /**
     * Limit how many TopicWatches to update.
     */
    limit?: number
  }

  /**
   * TopicWatch updateManyAndReturn
   */
  export type TopicWatchUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * The data used to update TopicWatches.
     */
    data: XOR<TopicWatchUpdateManyMutationInput, TopicWatchUncheckedUpdateManyInput>
    /**
     * Filter which TopicWatches to update
     */
    where?: TopicWatchWhereInput
    /**
     * Limit how many TopicWatches to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicWatch upsert
   */
  export type TopicWatchUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * The filter to search for the TopicWatch to update in case it exists.
     */
    where: TopicWatchWhereUniqueInput
    /**
     * In case the TopicWatch found by the `where` argument doesn't exist, create a new TopicWatch with this data.
     */
    create: XOR<TopicWatchCreateInput, TopicWatchUncheckedCreateInput>
    /**
     * In case the TopicWatch was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TopicWatchUpdateInput, TopicWatchUncheckedUpdateInput>
  }

  /**
   * TopicWatch delete
   */
  export type TopicWatchDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
    /**
     * Filter which TopicWatch to delete.
     */
    where: TopicWatchWhereUniqueInput
  }

  /**
   * TopicWatch deleteMany
   */
  export type TopicWatchDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicWatches to delete
     */
    where?: TopicWatchWhereInput
    /**
     * Limit how many TopicWatches to delete.
     */
    limit?: number
  }

  /**
   * TopicWatch without action
   */
  export type TopicWatchDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicWatch
     */
    select?: TopicWatchSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicWatch
     */
    omit?: TopicWatchOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicWatchInclude<ExtArgs> | null
  }


  /**
   * Model TopicReadState
   */

  export type AggregateTopicReadState = {
    _count: TopicReadStateCountAggregateOutputType | null
    _min: TopicReadStateMinAggregateOutputType | null
    _max: TopicReadStateMaxAggregateOutputType | null
  }

  export type TopicReadStateMinAggregateOutputType = {
    topicId: string | null
    memberId: string | null
    lastReadAt: Date | null
    updatedAt: Date | null
  }

  export type TopicReadStateMaxAggregateOutputType = {
    topicId: string | null
    memberId: string | null
    lastReadAt: Date | null
    updatedAt: Date | null
  }

  export type TopicReadStateCountAggregateOutputType = {
    topicId: number
    memberId: number
    lastReadAt: number
    updatedAt: number
    _all: number
  }


  export type TopicReadStateMinAggregateInputType = {
    topicId?: true
    memberId?: true
    lastReadAt?: true
    updatedAt?: true
  }

  export type TopicReadStateMaxAggregateInputType = {
    topicId?: true
    memberId?: true
    lastReadAt?: true
    updatedAt?: true
  }

  export type TopicReadStateCountAggregateInputType = {
    topicId?: true
    memberId?: true
    lastReadAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TopicReadStateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicReadState to aggregate.
     */
    where?: TopicReadStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicReadStates to fetch.
     */
    orderBy?: TopicReadStateOrderByWithRelationInput | TopicReadStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TopicReadStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicReadStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicReadStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TopicReadStates
    **/
    _count?: true | TopicReadStateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TopicReadStateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TopicReadStateMaxAggregateInputType
  }

  export type GetTopicReadStateAggregateType<T extends TopicReadStateAggregateArgs> = {
        [P in keyof T & keyof AggregateTopicReadState]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTopicReadState[P]>
      : GetScalarType<T[P], AggregateTopicReadState[P]>
  }




  export type TopicReadStateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TopicReadStateWhereInput
    orderBy?: TopicReadStateOrderByWithAggregationInput | TopicReadStateOrderByWithAggregationInput[]
    by: TopicReadStateScalarFieldEnum[] | TopicReadStateScalarFieldEnum
    having?: TopicReadStateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TopicReadStateCountAggregateInputType | true
    _min?: TopicReadStateMinAggregateInputType
    _max?: TopicReadStateMaxAggregateInputType
  }

  export type TopicReadStateGroupByOutputType = {
    topicId: string
    memberId: string
    lastReadAt: Date
    updatedAt: Date
    _count: TopicReadStateCountAggregateOutputType | null
    _min: TopicReadStateMinAggregateOutputType | null
    _max: TopicReadStateMaxAggregateOutputType | null
  }

  type GetTopicReadStateGroupByPayload<T extends TopicReadStateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TopicReadStateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TopicReadStateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TopicReadStateGroupByOutputType[P]>
            : GetScalarType<T[P], TopicReadStateGroupByOutputType[P]>
        }
      >
    >


  export type TopicReadStateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    lastReadAt?: boolean
    updatedAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicReadState"]>

  export type TopicReadStateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    lastReadAt?: boolean
    updatedAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicReadState"]>

  export type TopicReadStateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    topicId?: boolean
    memberId?: boolean
    lastReadAt?: boolean
    updatedAt?: boolean
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["topicReadState"]>

  export type TopicReadStateSelectScalar = {
    topicId?: boolean
    memberId?: boolean
    lastReadAt?: boolean
    updatedAt?: boolean
  }

  export type TopicReadStateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"topicId" | "memberId" | "lastReadAt" | "updatedAt", ExtArgs["result"]["topicReadState"]>
  export type TopicReadStateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicReadStateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }
  export type TopicReadStateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    topic?: boolean | TopicDefaultArgs<ExtArgs>
  }

  export type $TopicReadStatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TopicReadState"
    objects: {
      topic: Prisma.$TopicPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      topicId: string
      memberId: string
      lastReadAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["topicReadState"]>
    composites: {}
  }

  type TopicReadStateGetPayload<S extends boolean | null | undefined | TopicReadStateDefaultArgs> = $Result.GetResult<Prisma.$TopicReadStatePayload, S>

  type TopicReadStateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TopicReadStateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TopicReadStateCountAggregateInputType | true
    }

  export interface TopicReadStateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TopicReadState'], meta: { name: 'TopicReadState' } }
    /**
     * Find zero or one TopicReadState that matches the filter.
     * @param {TopicReadStateFindUniqueArgs} args - Arguments to find a TopicReadState
     * @example
     * // Get one TopicReadState
     * const topicReadState = await prisma.topicReadState.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TopicReadStateFindUniqueArgs>(args: SelectSubset<T, TopicReadStateFindUniqueArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TopicReadState that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TopicReadStateFindUniqueOrThrowArgs} args - Arguments to find a TopicReadState
     * @example
     * // Get one TopicReadState
     * const topicReadState = await prisma.topicReadState.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TopicReadStateFindUniqueOrThrowArgs>(args: SelectSubset<T, TopicReadStateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicReadState that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateFindFirstArgs} args - Arguments to find a TopicReadState
     * @example
     * // Get one TopicReadState
     * const topicReadState = await prisma.topicReadState.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TopicReadStateFindFirstArgs>(args?: SelectSubset<T, TopicReadStateFindFirstArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TopicReadState that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateFindFirstOrThrowArgs} args - Arguments to find a TopicReadState
     * @example
     * // Get one TopicReadState
     * const topicReadState = await prisma.topicReadState.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TopicReadStateFindFirstOrThrowArgs>(args?: SelectSubset<T, TopicReadStateFindFirstOrThrowArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TopicReadStates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TopicReadStates
     * const topicReadStates = await prisma.topicReadState.findMany()
     * 
     * // Get first 10 TopicReadStates
     * const topicReadStates = await prisma.topicReadState.findMany({ take: 10 })
     * 
     * // Only select the `topicId`
     * const topicReadStateWithTopicIdOnly = await prisma.topicReadState.findMany({ select: { topicId: true } })
     * 
     */
    findMany<T extends TopicReadStateFindManyArgs>(args?: SelectSubset<T, TopicReadStateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TopicReadState.
     * @param {TopicReadStateCreateArgs} args - Arguments to create a TopicReadState.
     * @example
     * // Create one TopicReadState
     * const TopicReadState = await prisma.topicReadState.create({
     *   data: {
     *     // ... data to create a TopicReadState
     *   }
     * })
     * 
     */
    create<T extends TopicReadStateCreateArgs>(args: SelectSubset<T, TopicReadStateCreateArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TopicReadStates.
     * @param {TopicReadStateCreateManyArgs} args - Arguments to create many TopicReadStates.
     * @example
     * // Create many TopicReadStates
     * const topicReadState = await prisma.topicReadState.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TopicReadStateCreateManyArgs>(args?: SelectSubset<T, TopicReadStateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TopicReadStates and returns the data saved in the database.
     * @param {TopicReadStateCreateManyAndReturnArgs} args - Arguments to create many TopicReadStates.
     * @example
     * // Create many TopicReadStates
     * const topicReadState = await prisma.topicReadState.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TopicReadStates and only return the `topicId`
     * const topicReadStateWithTopicIdOnly = await prisma.topicReadState.createManyAndReturn({
     *   select: { topicId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TopicReadStateCreateManyAndReturnArgs>(args?: SelectSubset<T, TopicReadStateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TopicReadState.
     * @param {TopicReadStateDeleteArgs} args - Arguments to delete one TopicReadState.
     * @example
     * // Delete one TopicReadState
     * const TopicReadState = await prisma.topicReadState.delete({
     *   where: {
     *     // ... filter to delete one TopicReadState
     *   }
     * })
     * 
     */
    delete<T extends TopicReadStateDeleteArgs>(args: SelectSubset<T, TopicReadStateDeleteArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TopicReadState.
     * @param {TopicReadStateUpdateArgs} args - Arguments to update one TopicReadState.
     * @example
     * // Update one TopicReadState
     * const topicReadState = await prisma.topicReadState.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TopicReadStateUpdateArgs>(args: SelectSubset<T, TopicReadStateUpdateArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TopicReadStates.
     * @param {TopicReadStateDeleteManyArgs} args - Arguments to filter TopicReadStates to delete.
     * @example
     * // Delete a few TopicReadStates
     * const { count } = await prisma.topicReadState.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TopicReadStateDeleteManyArgs>(args?: SelectSubset<T, TopicReadStateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicReadStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TopicReadStates
     * const topicReadState = await prisma.topicReadState.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TopicReadStateUpdateManyArgs>(args: SelectSubset<T, TopicReadStateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TopicReadStates and returns the data updated in the database.
     * @param {TopicReadStateUpdateManyAndReturnArgs} args - Arguments to update many TopicReadStates.
     * @example
     * // Update many TopicReadStates
     * const topicReadState = await prisma.topicReadState.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TopicReadStates and only return the `topicId`
     * const topicReadStateWithTopicIdOnly = await prisma.topicReadState.updateManyAndReturn({
     *   select: { topicId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TopicReadStateUpdateManyAndReturnArgs>(args: SelectSubset<T, TopicReadStateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TopicReadState.
     * @param {TopicReadStateUpsertArgs} args - Arguments to update or create a TopicReadState.
     * @example
     * // Update or create a TopicReadState
     * const topicReadState = await prisma.topicReadState.upsert({
     *   create: {
     *     // ... data to create a TopicReadState
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TopicReadState we want to update
     *   }
     * })
     */
    upsert<T extends TopicReadStateUpsertArgs>(args: SelectSubset<T, TopicReadStateUpsertArgs<ExtArgs>>): Prisma__TopicReadStateClient<$Result.GetResult<Prisma.$TopicReadStatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TopicReadStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateCountArgs} args - Arguments to filter TopicReadStates to count.
     * @example
     * // Count the number of TopicReadStates
     * const count = await prisma.topicReadState.count({
     *   where: {
     *     // ... the filter for the TopicReadStates we want to count
     *   }
     * })
    **/
    count<T extends TopicReadStateCountArgs>(
      args?: Subset<T, TopicReadStateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TopicReadStateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TopicReadState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TopicReadStateAggregateArgs>(args: Subset<T, TopicReadStateAggregateArgs>): Prisma.PrismaPromise<GetTopicReadStateAggregateType<T>>

    /**
     * Group by TopicReadState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TopicReadStateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TopicReadStateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TopicReadStateGroupByArgs['orderBy'] }
        : { orderBy?: TopicReadStateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TopicReadStateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTopicReadStateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TopicReadState model
   */
  readonly fields: TopicReadStateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TopicReadState.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TopicReadStateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    topic<T extends TopicDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TopicDefaultArgs<ExtArgs>>): Prisma__TopicClient<$Result.GetResult<Prisma.$TopicPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TopicReadState model
   */
  interface TopicReadStateFieldRefs {
    readonly topicId: FieldRef<"TopicReadState", 'String'>
    readonly memberId: FieldRef<"TopicReadState", 'String'>
    readonly lastReadAt: FieldRef<"TopicReadState", 'DateTime'>
    readonly updatedAt: FieldRef<"TopicReadState", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TopicReadState findUnique
   */
  export type TopicReadStateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter, which TopicReadState to fetch.
     */
    where: TopicReadStateWhereUniqueInput
  }

  /**
   * TopicReadState findUniqueOrThrow
   */
  export type TopicReadStateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter, which TopicReadState to fetch.
     */
    where: TopicReadStateWhereUniqueInput
  }

  /**
   * TopicReadState findFirst
   */
  export type TopicReadStateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter, which TopicReadState to fetch.
     */
    where?: TopicReadStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicReadStates to fetch.
     */
    orderBy?: TopicReadStateOrderByWithRelationInput | TopicReadStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicReadStates.
     */
    cursor?: TopicReadStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicReadStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicReadStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicReadStates.
     */
    distinct?: TopicReadStateScalarFieldEnum | TopicReadStateScalarFieldEnum[]
  }

  /**
   * TopicReadState findFirstOrThrow
   */
  export type TopicReadStateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter, which TopicReadState to fetch.
     */
    where?: TopicReadStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicReadStates to fetch.
     */
    orderBy?: TopicReadStateOrderByWithRelationInput | TopicReadStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TopicReadStates.
     */
    cursor?: TopicReadStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicReadStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicReadStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicReadStates.
     */
    distinct?: TopicReadStateScalarFieldEnum | TopicReadStateScalarFieldEnum[]
  }

  /**
   * TopicReadState findMany
   */
  export type TopicReadStateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter, which TopicReadStates to fetch.
     */
    where?: TopicReadStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TopicReadStates to fetch.
     */
    orderBy?: TopicReadStateOrderByWithRelationInput | TopicReadStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TopicReadStates.
     */
    cursor?: TopicReadStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TopicReadStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TopicReadStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TopicReadStates.
     */
    distinct?: TopicReadStateScalarFieldEnum | TopicReadStateScalarFieldEnum[]
  }

  /**
   * TopicReadState create
   */
  export type TopicReadStateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * The data needed to create a TopicReadState.
     */
    data: XOR<TopicReadStateCreateInput, TopicReadStateUncheckedCreateInput>
  }

  /**
   * TopicReadState createMany
   */
  export type TopicReadStateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TopicReadStates.
     */
    data: TopicReadStateCreateManyInput | TopicReadStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TopicReadState createManyAndReturn
   */
  export type TopicReadStateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * The data used to create many TopicReadStates.
     */
    data: TopicReadStateCreateManyInput | TopicReadStateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicReadState update
   */
  export type TopicReadStateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * The data needed to update a TopicReadState.
     */
    data: XOR<TopicReadStateUpdateInput, TopicReadStateUncheckedUpdateInput>
    /**
     * Choose, which TopicReadState to update.
     */
    where: TopicReadStateWhereUniqueInput
  }

  /**
   * TopicReadState updateMany
   */
  export type TopicReadStateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TopicReadStates.
     */
    data: XOR<TopicReadStateUpdateManyMutationInput, TopicReadStateUncheckedUpdateManyInput>
    /**
     * Filter which TopicReadStates to update
     */
    where?: TopicReadStateWhereInput
    /**
     * Limit how many TopicReadStates to update.
     */
    limit?: number
  }

  /**
   * TopicReadState updateManyAndReturn
   */
  export type TopicReadStateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * The data used to update TopicReadStates.
     */
    data: XOR<TopicReadStateUpdateManyMutationInput, TopicReadStateUncheckedUpdateManyInput>
    /**
     * Filter which TopicReadStates to update
     */
    where?: TopicReadStateWhereInput
    /**
     * Limit how many TopicReadStates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TopicReadState upsert
   */
  export type TopicReadStateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * The filter to search for the TopicReadState to update in case it exists.
     */
    where: TopicReadStateWhereUniqueInput
    /**
     * In case the TopicReadState found by the `where` argument doesn't exist, create a new TopicReadState with this data.
     */
    create: XOR<TopicReadStateCreateInput, TopicReadStateUncheckedCreateInput>
    /**
     * In case the TopicReadState was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TopicReadStateUpdateInput, TopicReadStateUncheckedUpdateInput>
  }

  /**
   * TopicReadState delete
   */
  export type TopicReadStateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
    /**
     * Filter which TopicReadState to delete.
     */
    where: TopicReadStateWhereUniqueInput
  }

  /**
   * TopicReadState deleteMany
   */
  export type TopicReadStateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TopicReadStates to delete
     */
    where?: TopicReadStateWhereInput
    /**
     * Limit how many TopicReadStates to delete.
     */
    limit?: number
  }

  /**
   * TopicReadState without action
   */
  export type TopicReadStateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TopicReadState
     */
    select?: TopicReadStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TopicReadState
     */
    omit?: TopicReadStateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TopicReadStateInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TopicScalarFieldEnum: {
    id: 'id',
    parentTopicId: 'parentTopicId',
    challengeId: 'challengeId',
    roleName: 'roleName',
    title: 'title',
    isAnnouncement: 'isAnnouncement',
    authorMemberId: 'authorMemberId',
    authorHandle: 'authorHandle',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    deletedByMemberId: 'deletedByMemberId'
  };

  export type TopicScalarFieldEnum = (typeof TopicScalarFieldEnum)[keyof typeof TopicScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    topicId: 'topicId',
    parentType: 'parentType',
    parentId: 'parentId',
    authorMemberId: 'authorMemberId',
    authorHandle: 'authorHandle',
    content: 'content',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
    deletedByMemberId: 'deletedByMemberId'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const TopicClosureScalarFieldEnum: {
    ancestorTopicId: 'ancestorTopicId',
    descendantTopicId: 'descendantTopicId',
    depth: 'depth'
  };

  export type TopicClosureScalarFieldEnum = (typeof TopicClosureScalarFieldEnum)[keyof typeof TopicClosureScalarFieldEnum]


  export const TopicWatchScalarFieldEnum: {
    topicId: 'topicId',
    memberId: 'memberId',
    createdAt: 'createdAt'
  };

  export type TopicWatchScalarFieldEnum = (typeof TopicWatchScalarFieldEnum)[keyof typeof TopicWatchScalarFieldEnum]


  export const TopicReadStateScalarFieldEnum: {
    topicId: 'topicId',
    memberId: 'memberId',
    lastReadAt: 'lastReadAt',
    updatedAt: 'updatedAt'
  };

  export type TopicReadStateScalarFieldEnum = (typeof TopicReadStateScalarFieldEnum)[keyof typeof TopicReadStateScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type TopicWhereInput = {
    AND?: TopicWhereInput | TopicWhereInput[]
    OR?: TopicWhereInput[]
    NOT?: TopicWhereInput | TopicWhereInput[]
    id?: StringFilter<"Topic"> | string
    parentTopicId?: StringNullableFilter<"Topic"> | string | null
    challengeId?: StringNullableFilter<"Topic"> | string | null
    roleName?: StringNullableFilter<"Topic"> | string | null
    title?: StringFilter<"Topic"> | string
    isAnnouncement?: BoolFilter<"Topic"> | boolean
    authorMemberId?: StringFilter<"Topic"> | string
    authorHandle?: StringFilter<"Topic"> | string
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Topic"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Topic"> | string | null
    parentTopic?: XOR<TopicNullableScalarRelationFilter, TopicWhereInput> | null
    childTopics?: TopicListRelationFilter
    posts?: PostListRelationFilter
    ancestorClosures?: TopicClosureListRelationFilter
    descendantClosures?: TopicClosureListRelationFilter
    watches?: TopicWatchListRelationFilter
    readStates?: TopicReadStateListRelationFilter
  }

  export type TopicOrderByWithRelationInput = {
    id?: SortOrder
    parentTopicId?: SortOrderInput | SortOrder
    challengeId?: SortOrderInput | SortOrder
    roleName?: SortOrderInput | SortOrder
    title?: SortOrder
    isAnnouncement?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    deletedByMemberId?: SortOrderInput | SortOrder
    parentTopic?: TopicOrderByWithRelationInput
    childTopics?: TopicOrderByRelationAggregateInput
    posts?: PostOrderByRelationAggregateInput
    ancestorClosures?: TopicClosureOrderByRelationAggregateInput
    descendantClosures?: TopicClosureOrderByRelationAggregateInput
    watches?: TopicWatchOrderByRelationAggregateInput
    readStates?: TopicReadStateOrderByRelationAggregateInput
  }

  export type TopicWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TopicWhereInput | TopicWhereInput[]
    OR?: TopicWhereInput[]
    NOT?: TopicWhereInput | TopicWhereInput[]
    parentTopicId?: StringNullableFilter<"Topic"> | string | null
    challengeId?: StringNullableFilter<"Topic"> | string | null
    roleName?: StringNullableFilter<"Topic"> | string | null
    title?: StringFilter<"Topic"> | string
    isAnnouncement?: BoolFilter<"Topic"> | boolean
    authorMemberId?: StringFilter<"Topic"> | string
    authorHandle?: StringFilter<"Topic"> | string
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Topic"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Topic"> | string | null
    parentTopic?: XOR<TopicNullableScalarRelationFilter, TopicWhereInput> | null
    childTopics?: TopicListRelationFilter
    posts?: PostListRelationFilter
    ancestorClosures?: TopicClosureListRelationFilter
    descendantClosures?: TopicClosureListRelationFilter
    watches?: TopicWatchListRelationFilter
    readStates?: TopicReadStateListRelationFilter
  }, "id">

  export type TopicOrderByWithAggregationInput = {
    id?: SortOrder
    parentTopicId?: SortOrderInput | SortOrder
    challengeId?: SortOrderInput | SortOrder
    roleName?: SortOrderInput | SortOrder
    title?: SortOrder
    isAnnouncement?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    deletedByMemberId?: SortOrderInput | SortOrder
    _count?: TopicCountOrderByAggregateInput
    _max?: TopicMaxOrderByAggregateInput
    _min?: TopicMinOrderByAggregateInput
  }

  export type TopicScalarWhereWithAggregatesInput = {
    AND?: TopicScalarWhereWithAggregatesInput | TopicScalarWhereWithAggregatesInput[]
    OR?: TopicScalarWhereWithAggregatesInput[]
    NOT?: TopicScalarWhereWithAggregatesInput | TopicScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Topic"> | string
    parentTopicId?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    challengeId?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    roleName?: StringNullableWithAggregatesFilter<"Topic"> | string | null
    title?: StringWithAggregatesFilter<"Topic"> | string
    isAnnouncement?: BoolWithAggregatesFilter<"Topic"> | boolean
    authorMemberId?: StringWithAggregatesFilter<"Topic"> | string
    authorHandle?: StringWithAggregatesFilter<"Topic"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Topic"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Topic"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Topic"> | Date | string | null
    deletedByMemberId?: StringNullableWithAggregatesFilter<"Topic"> | string | null
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: StringFilter<"Post"> | string
    topicId?: StringFilter<"Post"> | string
    parentType?: StringFilter<"Post"> | string
    parentId?: StringFilter<"Post"> | string
    authorMemberId?: StringFilter<"Post"> | string
    authorHandle?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Post"> | string | null
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    topicId?: SortOrder
    parentType?: SortOrder
    parentId?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    content?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    deletedByMemberId?: SortOrderInput | SortOrder
    topic?: TopicOrderByWithRelationInput
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    topicId?: StringFilter<"Post"> | string
    parentType?: StringFilter<"Post"> | string
    parentId?: StringFilter<"Post"> | string
    authorMemberId?: StringFilter<"Post"> | string
    authorHandle?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Post"> | string | null
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }, "id">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    topicId?: SortOrder
    parentType?: SortOrder
    parentId?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    content?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    deletedByMemberId?: SortOrderInput | SortOrder
    _count?: PostCountOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Post"> | string
    topicId?: StringWithAggregatesFilter<"Post"> | string
    parentType?: StringWithAggregatesFilter<"Post"> | string
    parentId?: StringWithAggregatesFilter<"Post"> | string
    authorMemberId?: StringWithAggregatesFilter<"Post"> | string
    authorHandle?: StringWithAggregatesFilter<"Post"> | string
    content?: StringNullableWithAggregatesFilter<"Post"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Post"> | Date | string | null
    deletedByMemberId?: StringNullableWithAggregatesFilter<"Post"> | string | null
  }

  export type TopicClosureWhereInput = {
    AND?: TopicClosureWhereInput | TopicClosureWhereInput[]
    OR?: TopicClosureWhereInput[]
    NOT?: TopicClosureWhereInput | TopicClosureWhereInput[]
    ancestorTopicId?: StringFilter<"TopicClosure"> | string
    descendantTopicId?: StringFilter<"TopicClosure"> | string
    depth?: IntFilter<"TopicClosure"> | number
    ancestorTopic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
    descendantTopic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }

  export type TopicClosureOrderByWithRelationInput = {
    ancestorTopicId?: SortOrder
    descendantTopicId?: SortOrder
    depth?: SortOrder
    ancestorTopic?: TopicOrderByWithRelationInput
    descendantTopic?: TopicOrderByWithRelationInput
  }

  export type TopicClosureWhereUniqueInput = Prisma.AtLeast<{
    ancestorTopicId_descendantTopicId?: TopicClosureAncestorTopicIdDescendantTopicIdCompoundUniqueInput
    AND?: TopicClosureWhereInput | TopicClosureWhereInput[]
    OR?: TopicClosureWhereInput[]
    NOT?: TopicClosureWhereInput | TopicClosureWhereInput[]
    ancestorTopicId?: StringFilter<"TopicClosure"> | string
    descendantTopicId?: StringFilter<"TopicClosure"> | string
    depth?: IntFilter<"TopicClosure"> | number
    ancestorTopic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
    descendantTopic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }, "ancestorTopicId_descendantTopicId">

  export type TopicClosureOrderByWithAggregationInput = {
    ancestorTopicId?: SortOrder
    descendantTopicId?: SortOrder
    depth?: SortOrder
    _count?: TopicClosureCountOrderByAggregateInput
    _avg?: TopicClosureAvgOrderByAggregateInput
    _max?: TopicClosureMaxOrderByAggregateInput
    _min?: TopicClosureMinOrderByAggregateInput
    _sum?: TopicClosureSumOrderByAggregateInput
  }

  export type TopicClosureScalarWhereWithAggregatesInput = {
    AND?: TopicClosureScalarWhereWithAggregatesInput | TopicClosureScalarWhereWithAggregatesInput[]
    OR?: TopicClosureScalarWhereWithAggregatesInput[]
    NOT?: TopicClosureScalarWhereWithAggregatesInput | TopicClosureScalarWhereWithAggregatesInput[]
    ancestorTopicId?: StringWithAggregatesFilter<"TopicClosure"> | string
    descendantTopicId?: StringWithAggregatesFilter<"TopicClosure"> | string
    depth?: IntWithAggregatesFilter<"TopicClosure"> | number
  }

  export type TopicWatchWhereInput = {
    AND?: TopicWatchWhereInput | TopicWatchWhereInput[]
    OR?: TopicWatchWhereInput[]
    NOT?: TopicWatchWhereInput | TopicWatchWhereInput[]
    topicId?: StringFilter<"TopicWatch"> | string
    memberId?: StringFilter<"TopicWatch"> | string
    createdAt?: DateTimeFilter<"TopicWatch"> | Date | string
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }

  export type TopicWatchOrderByWithRelationInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    topic?: TopicOrderByWithRelationInput
  }

  export type TopicWatchWhereUniqueInput = Prisma.AtLeast<{
    topicId_memberId?: TopicWatchTopicIdMemberIdCompoundUniqueInput
    AND?: TopicWatchWhereInput | TopicWatchWhereInput[]
    OR?: TopicWatchWhereInput[]
    NOT?: TopicWatchWhereInput | TopicWatchWhereInput[]
    topicId?: StringFilter<"TopicWatch"> | string
    memberId?: StringFilter<"TopicWatch"> | string
    createdAt?: DateTimeFilter<"TopicWatch"> | Date | string
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }, "topicId_memberId">

  export type TopicWatchOrderByWithAggregationInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
    _count?: TopicWatchCountOrderByAggregateInput
    _max?: TopicWatchMaxOrderByAggregateInput
    _min?: TopicWatchMinOrderByAggregateInput
  }

  export type TopicWatchScalarWhereWithAggregatesInput = {
    AND?: TopicWatchScalarWhereWithAggregatesInput | TopicWatchScalarWhereWithAggregatesInput[]
    OR?: TopicWatchScalarWhereWithAggregatesInput[]
    NOT?: TopicWatchScalarWhereWithAggregatesInput | TopicWatchScalarWhereWithAggregatesInput[]
    topicId?: StringWithAggregatesFilter<"TopicWatch"> | string
    memberId?: StringWithAggregatesFilter<"TopicWatch"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TopicWatch"> | Date | string
  }

  export type TopicReadStateWhereInput = {
    AND?: TopicReadStateWhereInput | TopicReadStateWhereInput[]
    OR?: TopicReadStateWhereInput[]
    NOT?: TopicReadStateWhereInput | TopicReadStateWhereInput[]
    topicId?: StringFilter<"TopicReadState"> | string
    memberId?: StringFilter<"TopicReadState"> | string
    lastReadAt?: DateTimeFilter<"TopicReadState"> | Date | string
    updatedAt?: DateTimeFilter<"TopicReadState"> | Date | string
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }

  export type TopicReadStateOrderByWithRelationInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    lastReadAt?: SortOrder
    updatedAt?: SortOrder
    topic?: TopicOrderByWithRelationInput
  }

  export type TopicReadStateWhereUniqueInput = Prisma.AtLeast<{
    topicId_memberId?: TopicReadStateTopicIdMemberIdCompoundUniqueInput
    AND?: TopicReadStateWhereInput | TopicReadStateWhereInput[]
    OR?: TopicReadStateWhereInput[]
    NOT?: TopicReadStateWhereInput | TopicReadStateWhereInput[]
    topicId?: StringFilter<"TopicReadState"> | string
    memberId?: StringFilter<"TopicReadState"> | string
    lastReadAt?: DateTimeFilter<"TopicReadState"> | Date | string
    updatedAt?: DateTimeFilter<"TopicReadState"> | Date | string
    topic?: XOR<TopicScalarRelationFilter, TopicWhereInput>
  }, "topicId_memberId">

  export type TopicReadStateOrderByWithAggregationInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    lastReadAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TopicReadStateCountOrderByAggregateInput
    _max?: TopicReadStateMaxOrderByAggregateInput
    _min?: TopicReadStateMinOrderByAggregateInput
  }

  export type TopicReadStateScalarWhereWithAggregatesInput = {
    AND?: TopicReadStateScalarWhereWithAggregatesInput | TopicReadStateScalarWhereWithAggregatesInput[]
    OR?: TopicReadStateScalarWhereWithAggregatesInput[]
    NOT?: TopicReadStateScalarWhereWithAggregatesInput | TopicReadStateScalarWhereWithAggregatesInput[]
    topicId?: StringWithAggregatesFilter<"TopicReadState"> | string
    memberId?: StringWithAggregatesFilter<"TopicReadState"> | string
    lastReadAt?: DateTimeWithAggregatesFilter<"TopicReadState"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TopicReadState"> | Date | string
  }

  export type TopicCreateInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicCreateManyInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type TopicUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TopicUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostCreateInput = {
    id?: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    topic: TopicCreateNestedOneWithoutPostsInput
  }

  export type PostUncheckedCreateInput = {
    id?: string
    topicId: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type PostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    topic?: TopicUpdateOneRequiredWithoutPostsNestedInput
  }

  export type PostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    topicId?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostCreateManyInput = {
    id?: string
    topicId: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type PostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    topicId?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TopicClosureCreateInput = {
    depth: number
    ancestorTopic: TopicCreateNestedOneWithoutAncestorClosuresInput
    descendantTopic: TopicCreateNestedOneWithoutDescendantClosuresInput
  }

  export type TopicClosureUncheckedCreateInput = {
    ancestorTopicId: string
    descendantTopicId: string
    depth: number
  }

  export type TopicClosureUpdateInput = {
    depth?: IntFieldUpdateOperationsInput | number
    ancestorTopic?: TopicUpdateOneRequiredWithoutAncestorClosuresNestedInput
    descendantTopic?: TopicUpdateOneRequiredWithoutDescendantClosuresNestedInput
  }

  export type TopicClosureUncheckedUpdateInput = {
    ancestorTopicId?: StringFieldUpdateOperationsInput | string
    descendantTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicClosureCreateManyInput = {
    ancestorTopicId: string
    descendantTopicId: string
    depth: number
  }

  export type TopicClosureUpdateManyMutationInput = {
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicClosureUncheckedUpdateManyInput = {
    ancestorTopicId?: StringFieldUpdateOperationsInput | string
    descendantTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicWatchCreateInput = {
    memberId: string
    createdAt?: Date | string
    topic: TopicCreateNestedOneWithoutWatchesInput
  }

  export type TopicWatchUncheckedCreateInput = {
    topicId: string
    memberId: string
    createdAt?: Date | string
  }

  export type TopicWatchUpdateInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    topic?: TopicUpdateOneRequiredWithoutWatchesNestedInput
  }

  export type TopicWatchUncheckedUpdateInput = {
    topicId?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicWatchCreateManyInput = {
    topicId: string
    memberId: string
    createdAt?: Date | string
  }

  export type TopicWatchUpdateManyMutationInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicWatchUncheckedUpdateManyInput = {
    topicId?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateCreateInput = {
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
    topic: TopicCreateNestedOneWithoutReadStatesInput
  }

  export type TopicReadStateUncheckedCreateInput = {
    topicId: string
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicReadStateUpdateInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    topic?: TopicUpdateOneRequiredWithoutReadStatesNestedInput
  }

  export type TopicReadStateUncheckedUpdateInput = {
    topicId?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateCreateManyInput = {
    topicId: string
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicReadStateUpdateManyMutationInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateUncheckedUpdateManyInput = {
    topicId?: StringFieldUpdateOperationsInput | string
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type TopicNullableScalarRelationFilter = {
    is?: TopicWhereInput | null
    isNot?: TopicWhereInput | null
  }

  export type TopicListRelationFilter = {
    every?: TopicWhereInput
    some?: TopicWhereInput
    none?: TopicWhereInput
  }

  export type PostListRelationFilter = {
    every?: PostWhereInput
    some?: PostWhereInput
    none?: PostWhereInput
  }

  export type TopicClosureListRelationFilter = {
    every?: TopicClosureWhereInput
    some?: TopicClosureWhereInput
    none?: TopicClosureWhereInput
  }

  export type TopicWatchListRelationFilter = {
    every?: TopicWatchWhereInput
    some?: TopicWatchWhereInput
    none?: TopicWatchWhereInput
  }

  export type TopicReadStateListRelationFilter = {
    every?: TopicReadStateWhereInput
    some?: TopicReadStateWhereInput
    none?: TopicReadStateWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type TopicOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicClosureOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicWatchOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicReadStateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TopicCountOrderByAggregateInput = {
    id?: SortOrder
    parentTopicId?: SortOrder
    challengeId?: SortOrder
    roleName?: SortOrder
    title?: SortOrder
    isAnnouncement?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type TopicMaxOrderByAggregateInput = {
    id?: SortOrder
    parentTopicId?: SortOrder
    challengeId?: SortOrder
    roleName?: SortOrder
    title?: SortOrder
    isAnnouncement?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type TopicMinOrderByAggregateInput = {
    id?: SortOrder
    parentTopicId?: SortOrder
    challengeId?: SortOrder
    roleName?: SortOrder
    title?: SortOrder
    isAnnouncement?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type TopicScalarRelationFilter = {
    is?: TopicWhereInput
    isNot?: TopicWhereInput
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    topicId?: SortOrder
    parentType?: SortOrder
    parentId?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    topicId?: SortOrder
    parentType?: SortOrder
    parentId?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    topicId?: SortOrder
    parentType?: SortOrder
    parentId?: SortOrder
    authorMemberId?: SortOrder
    authorHandle?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
    deletedByMemberId?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type TopicClosureAncestorTopicIdDescendantTopicIdCompoundUniqueInput = {
    ancestorTopicId: string
    descendantTopicId: string
  }

  export type TopicClosureCountOrderByAggregateInput = {
    ancestorTopicId?: SortOrder
    descendantTopicId?: SortOrder
    depth?: SortOrder
  }

  export type TopicClosureAvgOrderByAggregateInput = {
    depth?: SortOrder
  }

  export type TopicClosureMaxOrderByAggregateInput = {
    ancestorTopicId?: SortOrder
    descendantTopicId?: SortOrder
    depth?: SortOrder
  }

  export type TopicClosureMinOrderByAggregateInput = {
    ancestorTopicId?: SortOrder
    descendantTopicId?: SortOrder
    depth?: SortOrder
  }

  export type TopicClosureSumOrderByAggregateInput = {
    depth?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type TopicWatchTopicIdMemberIdCompoundUniqueInput = {
    topicId: string
    memberId: string
  }

  export type TopicWatchCountOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
  }

  export type TopicWatchMaxOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
  }

  export type TopicWatchMinOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    createdAt?: SortOrder
  }

  export type TopicReadStateTopicIdMemberIdCompoundUniqueInput = {
    topicId: string
    memberId: string
  }

  export type TopicReadStateCountOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    lastReadAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TopicReadStateMaxOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    lastReadAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TopicReadStateMinOrderByAggregateInput = {
    topicId?: SortOrder
    memberId?: SortOrder
    lastReadAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TopicCreateNestedOneWithoutChildTopicsInput = {
    create?: XOR<TopicCreateWithoutChildTopicsInput, TopicUncheckedCreateWithoutChildTopicsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutChildTopicsInput
    connect?: TopicWhereUniqueInput
  }

  export type TopicCreateNestedManyWithoutParentTopicInput = {
    create?: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput> | TopicCreateWithoutParentTopicInput[] | TopicUncheckedCreateWithoutParentTopicInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutParentTopicInput | TopicCreateOrConnectWithoutParentTopicInput[]
    createMany?: TopicCreateManyParentTopicInputEnvelope
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type PostCreateNestedManyWithoutTopicInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type TopicClosureCreateNestedManyWithoutAncestorTopicInput = {
    create?: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput> | TopicClosureCreateWithoutAncestorTopicInput[] | TopicClosureUncheckedCreateWithoutAncestorTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutAncestorTopicInput | TopicClosureCreateOrConnectWithoutAncestorTopicInput[]
    createMany?: TopicClosureCreateManyAncestorTopicInputEnvelope
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
  }

  export type TopicClosureCreateNestedManyWithoutDescendantTopicInput = {
    create?: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput> | TopicClosureCreateWithoutDescendantTopicInput[] | TopicClosureUncheckedCreateWithoutDescendantTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutDescendantTopicInput | TopicClosureCreateOrConnectWithoutDescendantTopicInput[]
    createMany?: TopicClosureCreateManyDescendantTopicInputEnvelope
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
  }

  export type TopicWatchCreateNestedManyWithoutTopicInput = {
    create?: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput> | TopicWatchCreateWithoutTopicInput[] | TopicWatchUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicWatchCreateOrConnectWithoutTopicInput | TopicWatchCreateOrConnectWithoutTopicInput[]
    createMany?: TopicWatchCreateManyTopicInputEnvelope
    connect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
  }

  export type TopicReadStateCreateNestedManyWithoutTopicInput = {
    create?: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput> | TopicReadStateCreateWithoutTopicInput[] | TopicReadStateUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicReadStateCreateOrConnectWithoutTopicInput | TopicReadStateCreateOrConnectWithoutTopicInput[]
    createMany?: TopicReadStateCreateManyTopicInputEnvelope
    connect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
  }

  export type TopicUncheckedCreateNestedManyWithoutParentTopicInput = {
    create?: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput> | TopicCreateWithoutParentTopicInput[] | TopicUncheckedCreateWithoutParentTopicInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutParentTopicInput | TopicCreateOrConnectWithoutParentTopicInput[]
    createMany?: TopicCreateManyParentTopicInputEnvelope
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutTopicInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput = {
    create?: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput> | TopicClosureCreateWithoutAncestorTopicInput[] | TopicClosureUncheckedCreateWithoutAncestorTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutAncestorTopicInput | TopicClosureCreateOrConnectWithoutAncestorTopicInput[]
    createMany?: TopicClosureCreateManyAncestorTopicInputEnvelope
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
  }

  export type TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput = {
    create?: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput> | TopicClosureCreateWithoutDescendantTopicInput[] | TopicClosureUncheckedCreateWithoutDescendantTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutDescendantTopicInput | TopicClosureCreateOrConnectWithoutDescendantTopicInput[]
    createMany?: TopicClosureCreateManyDescendantTopicInputEnvelope
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
  }

  export type TopicWatchUncheckedCreateNestedManyWithoutTopicInput = {
    create?: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput> | TopicWatchCreateWithoutTopicInput[] | TopicWatchUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicWatchCreateOrConnectWithoutTopicInput | TopicWatchCreateOrConnectWithoutTopicInput[]
    createMany?: TopicWatchCreateManyTopicInputEnvelope
    connect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
  }

  export type TopicReadStateUncheckedCreateNestedManyWithoutTopicInput = {
    create?: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput> | TopicReadStateCreateWithoutTopicInput[] | TopicReadStateUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicReadStateCreateOrConnectWithoutTopicInput | TopicReadStateCreateOrConnectWithoutTopicInput[]
    createMany?: TopicReadStateCreateManyTopicInputEnvelope
    connect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type TopicUpdateOneWithoutChildTopicsNestedInput = {
    create?: XOR<TopicCreateWithoutChildTopicsInput, TopicUncheckedCreateWithoutChildTopicsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutChildTopicsInput
    upsert?: TopicUpsertWithoutChildTopicsInput
    disconnect?: TopicWhereInput | boolean
    delete?: TopicWhereInput | boolean
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutChildTopicsInput, TopicUpdateWithoutChildTopicsInput>, TopicUncheckedUpdateWithoutChildTopicsInput>
  }

  export type TopicUpdateManyWithoutParentTopicNestedInput = {
    create?: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput> | TopicCreateWithoutParentTopicInput[] | TopicUncheckedCreateWithoutParentTopicInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutParentTopicInput | TopicCreateOrConnectWithoutParentTopicInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutParentTopicInput | TopicUpsertWithWhereUniqueWithoutParentTopicInput[]
    createMany?: TopicCreateManyParentTopicInputEnvelope
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutParentTopicInput | TopicUpdateWithWhereUniqueWithoutParentTopicInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutParentTopicInput | TopicUpdateManyWithWhereWithoutParentTopicInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type PostUpdateManyWithoutTopicNestedInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutTopicInput | PostUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutTopicInput | PostUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: PostUpdateManyWithWhereWithoutTopicInput | PostUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type TopicClosureUpdateManyWithoutAncestorTopicNestedInput = {
    create?: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput> | TopicClosureCreateWithoutAncestorTopicInput[] | TopicClosureUncheckedCreateWithoutAncestorTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutAncestorTopicInput | TopicClosureCreateOrConnectWithoutAncestorTopicInput[]
    upsert?: TopicClosureUpsertWithWhereUniqueWithoutAncestorTopicInput | TopicClosureUpsertWithWhereUniqueWithoutAncestorTopicInput[]
    createMany?: TopicClosureCreateManyAncestorTopicInputEnvelope
    set?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    disconnect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    delete?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    update?: TopicClosureUpdateWithWhereUniqueWithoutAncestorTopicInput | TopicClosureUpdateWithWhereUniqueWithoutAncestorTopicInput[]
    updateMany?: TopicClosureUpdateManyWithWhereWithoutAncestorTopicInput | TopicClosureUpdateManyWithWhereWithoutAncestorTopicInput[]
    deleteMany?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
  }

  export type TopicClosureUpdateManyWithoutDescendantTopicNestedInput = {
    create?: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput> | TopicClosureCreateWithoutDescendantTopicInput[] | TopicClosureUncheckedCreateWithoutDescendantTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutDescendantTopicInput | TopicClosureCreateOrConnectWithoutDescendantTopicInput[]
    upsert?: TopicClosureUpsertWithWhereUniqueWithoutDescendantTopicInput | TopicClosureUpsertWithWhereUniqueWithoutDescendantTopicInput[]
    createMany?: TopicClosureCreateManyDescendantTopicInputEnvelope
    set?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    disconnect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    delete?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    update?: TopicClosureUpdateWithWhereUniqueWithoutDescendantTopicInput | TopicClosureUpdateWithWhereUniqueWithoutDescendantTopicInput[]
    updateMany?: TopicClosureUpdateManyWithWhereWithoutDescendantTopicInput | TopicClosureUpdateManyWithWhereWithoutDescendantTopicInput[]
    deleteMany?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
  }

  export type TopicWatchUpdateManyWithoutTopicNestedInput = {
    create?: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput> | TopicWatchCreateWithoutTopicInput[] | TopicWatchUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicWatchCreateOrConnectWithoutTopicInput | TopicWatchCreateOrConnectWithoutTopicInput[]
    upsert?: TopicWatchUpsertWithWhereUniqueWithoutTopicInput | TopicWatchUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: TopicWatchCreateManyTopicInputEnvelope
    set?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    disconnect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    delete?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    connect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    update?: TopicWatchUpdateWithWhereUniqueWithoutTopicInput | TopicWatchUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: TopicWatchUpdateManyWithWhereWithoutTopicInput | TopicWatchUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: TopicWatchScalarWhereInput | TopicWatchScalarWhereInput[]
  }

  export type TopicReadStateUpdateManyWithoutTopicNestedInput = {
    create?: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput> | TopicReadStateCreateWithoutTopicInput[] | TopicReadStateUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicReadStateCreateOrConnectWithoutTopicInput | TopicReadStateCreateOrConnectWithoutTopicInput[]
    upsert?: TopicReadStateUpsertWithWhereUniqueWithoutTopicInput | TopicReadStateUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: TopicReadStateCreateManyTopicInputEnvelope
    set?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    disconnect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    delete?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    connect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    update?: TopicReadStateUpdateWithWhereUniqueWithoutTopicInput | TopicReadStateUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: TopicReadStateUpdateManyWithWhereWithoutTopicInput | TopicReadStateUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: TopicReadStateScalarWhereInput | TopicReadStateScalarWhereInput[]
  }

  export type TopicUncheckedUpdateManyWithoutParentTopicNestedInput = {
    create?: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput> | TopicCreateWithoutParentTopicInput[] | TopicUncheckedCreateWithoutParentTopicInput[]
    connectOrCreate?: TopicCreateOrConnectWithoutParentTopicInput | TopicCreateOrConnectWithoutParentTopicInput[]
    upsert?: TopicUpsertWithWhereUniqueWithoutParentTopicInput | TopicUpsertWithWhereUniqueWithoutParentTopicInput[]
    createMany?: TopicCreateManyParentTopicInputEnvelope
    set?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    disconnect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    delete?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    connect?: TopicWhereUniqueInput | TopicWhereUniqueInput[]
    update?: TopicUpdateWithWhereUniqueWithoutParentTopicInput | TopicUpdateWithWhereUniqueWithoutParentTopicInput[]
    updateMany?: TopicUpdateManyWithWhereWithoutParentTopicInput | TopicUpdateManyWithWhereWithoutParentTopicInput[]
    deleteMany?: TopicScalarWhereInput | TopicScalarWhereInput[]
  }

  export type PostUncheckedUpdateManyWithoutTopicNestedInput = {
    create?: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput> | PostCreateWithoutTopicInput[] | PostUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: PostCreateOrConnectWithoutTopicInput | PostCreateOrConnectWithoutTopicInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutTopicInput | PostUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: PostCreateManyTopicInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutTopicInput | PostUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: PostUpdateManyWithWhereWithoutTopicInput | PostUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput = {
    create?: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput> | TopicClosureCreateWithoutAncestorTopicInput[] | TopicClosureUncheckedCreateWithoutAncestorTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutAncestorTopicInput | TopicClosureCreateOrConnectWithoutAncestorTopicInput[]
    upsert?: TopicClosureUpsertWithWhereUniqueWithoutAncestorTopicInput | TopicClosureUpsertWithWhereUniqueWithoutAncestorTopicInput[]
    createMany?: TopicClosureCreateManyAncestorTopicInputEnvelope
    set?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    disconnect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    delete?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    update?: TopicClosureUpdateWithWhereUniqueWithoutAncestorTopicInput | TopicClosureUpdateWithWhereUniqueWithoutAncestorTopicInput[]
    updateMany?: TopicClosureUpdateManyWithWhereWithoutAncestorTopicInput | TopicClosureUpdateManyWithWhereWithoutAncestorTopicInput[]
    deleteMany?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
  }

  export type TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput = {
    create?: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput> | TopicClosureCreateWithoutDescendantTopicInput[] | TopicClosureUncheckedCreateWithoutDescendantTopicInput[]
    connectOrCreate?: TopicClosureCreateOrConnectWithoutDescendantTopicInput | TopicClosureCreateOrConnectWithoutDescendantTopicInput[]
    upsert?: TopicClosureUpsertWithWhereUniqueWithoutDescendantTopicInput | TopicClosureUpsertWithWhereUniqueWithoutDescendantTopicInput[]
    createMany?: TopicClosureCreateManyDescendantTopicInputEnvelope
    set?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    disconnect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    delete?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    connect?: TopicClosureWhereUniqueInput | TopicClosureWhereUniqueInput[]
    update?: TopicClosureUpdateWithWhereUniqueWithoutDescendantTopicInput | TopicClosureUpdateWithWhereUniqueWithoutDescendantTopicInput[]
    updateMany?: TopicClosureUpdateManyWithWhereWithoutDescendantTopicInput | TopicClosureUpdateManyWithWhereWithoutDescendantTopicInput[]
    deleteMany?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
  }

  export type TopicWatchUncheckedUpdateManyWithoutTopicNestedInput = {
    create?: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput> | TopicWatchCreateWithoutTopicInput[] | TopicWatchUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicWatchCreateOrConnectWithoutTopicInput | TopicWatchCreateOrConnectWithoutTopicInput[]
    upsert?: TopicWatchUpsertWithWhereUniqueWithoutTopicInput | TopicWatchUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: TopicWatchCreateManyTopicInputEnvelope
    set?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    disconnect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    delete?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    connect?: TopicWatchWhereUniqueInput | TopicWatchWhereUniqueInput[]
    update?: TopicWatchUpdateWithWhereUniqueWithoutTopicInput | TopicWatchUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: TopicWatchUpdateManyWithWhereWithoutTopicInput | TopicWatchUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: TopicWatchScalarWhereInput | TopicWatchScalarWhereInput[]
  }

  export type TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput = {
    create?: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput> | TopicReadStateCreateWithoutTopicInput[] | TopicReadStateUncheckedCreateWithoutTopicInput[]
    connectOrCreate?: TopicReadStateCreateOrConnectWithoutTopicInput | TopicReadStateCreateOrConnectWithoutTopicInput[]
    upsert?: TopicReadStateUpsertWithWhereUniqueWithoutTopicInput | TopicReadStateUpsertWithWhereUniqueWithoutTopicInput[]
    createMany?: TopicReadStateCreateManyTopicInputEnvelope
    set?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    disconnect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    delete?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    connect?: TopicReadStateWhereUniqueInput | TopicReadStateWhereUniqueInput[]
    update?: TopicReadStateUpdateWithWhereUniqueWithoutTopicInput | TopicReadStateUpdateWithWhereUniqueWithoutTopicInput[]
    updateMany?: TopicReadStateUpdateManyWithWhereWithoutTopicInput | TopicReadStateUpdateManyWithWhereWithoutTopicInput[]
    deleteMany?: TopicReadStateScalarWhereInput | TopicReadStateScalarWhereInput[]
  }

  export type TopicCreateNestedOneWithoutPostsInput = {
    create?: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutPostsInput
    connect?: TopicWhereUniqueInput
  }

  export type TopicUpdateOneRequiredWithoutPostsNestedInput = {
    create?: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    connectOrCreate?: TopicCreateOrConnectWithoutPostsInput
    upsert?: TopicUpsertWithoutPostsInput
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutPostsInput, TopicUpdateWithoutPostsInput>, TopicUncheckedUpdateWithoutPostsInput>
  }

  export type TopicCreateNestedOneWithoutAncestorClosuresInput = {
    create?: XOR<TopicCreateWithoutAncestorClosuresInput, TopicUncheckedCreateWithoutAncestorClosuresInput>
    connectOrCreate?: TopicCreateOrConnectWithoutAncestorClosuresInput
    connect?: TopicWhereUniqueInput
  }

  export type TopicCreateNestedOneWithoutDescendantClosuresInput = {
    create?: XOR<TopicCreateWithoutDescendantClosuresInput, TopicUncheckedCreateWithoutDescendantClosuresInput>
    connectOrCreate?: TopicCreateOrConnectWithoutDescendantClosuresInput
    connect?: TopicWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type TopicUpdateOneRequiredWithoutAncestorClosuresNestedInput = {
    create?: XOR<TopicCreateWithoutAncestorClosuresInput, TopicUncheckedCreateWithoutAncestorClosuresInput>
    connectOrCreate?: TopicCreateOrConnectWithoutAncestorClosuresInput
    upsert?: TopicUpsertWithoutAncestorClosuresInput
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutAncestorClosuresInput, TopicUpdateWithoutAncestorClosuresInput>, TopicUncheckedUpdateWithoutAncestorClosuresInput>
  }

  export type TopicUpdateOneRequiredWithoutDescendantClosuresNestedInput = {
    create?: XOR<TopicCreateWithoutDescendantClosuresInput, TopicUncheckedCreateWithoutDescendantClosuresInput>
    connectOrCreate?: TopicCreateOrConnectWithoutDescendantClosuresInput
    upsert?: TopicUpsertWithoutDescendantClosuresInput
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutDescendantClosuresInput, TopicUpdateWithoutDescendantClosuresInput>, TopicUncheckedUpdateWithoutDescendantClosuresInput>
  }

  export type TopicCreateNestedOneWithoutWatchesInput = {
    create?: XOR<TopicCreateWithoutWatchesInput, TopicUncheckedCreateWithoutWatchesInput>
    connectOrCreate?: TopicCreateOrConnectWithoutWatchesInput
    connect?: TopicWhereUniqueInput
  }

  export type TopicUpdateOneRequiredWithoutWatchesNestedInput = {
    create?: XOR<TopicCreateWithoutWatchesInput, TopicUncheckedCreateWithoutWatchesInput>
    connectOrCreate?: TopicCreateOrConnectWithoutWatchesInput
    upsert?: TopicUpsertWithoutWatchesInput
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutWatchesInput, TopicUpdateWithoutWatchesInput>, TopicUncheckedUpdateWithoutWatchesInput>
  }

  export type TopicCreateNestedOneWithoutReadStatesInput = {
    create?: XOR<TopicCreateWithoutReadStatesInput, TopicUncheckedCreateWithoutReadStatesInput>
    connectOrCreate?: TopicCreateOrConnectWithoutReadStatesInput
    connect?: TopicWhereUniqueInput
  }

  export type TopicUpdateOneRequiredWithoutReadStatesNestedInput = {
    create?: XOR<TopicCreateWithoutReadStatesInput, TopicUncheckedCreateWithoutReadStatesInput>
    connectOrCreate?: TopicCreateOrConnectWithoutReadStatesInput
    upsert?: TopicUpsertWithoutReadStatesInput
    connect?: TopicWhereUniqueInput
    update?: XOR<XOR<TopicUpdateToOneWithWhereWithoutReadStatesInput, TopicUpdateWithoutReadStatesInput>, TopicUncheckedUpdateWithoutReadStatesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type TopicCreateWithoutChildTopicsInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutChildTopicsInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutChildTopicsInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutChildTopicsInput, TopicUncheckedCreateWithoutChildTopicsInput>
  }

  export type TopicCreateWithoutParentTopicInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutParentTopicInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutParentTopicInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput>
  }

  export type TopicCreateManyParentTopicInputEnvelope = {
    data: TopicCreateManyParentTopicInput | TopicCreateManyParentTopicInput[]
    skipDuplicates?: boolean
  }

  export type PostCreateWithoutTopicInput = {
    id?: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type PostUncheckedCreateWithoutTopicInput = {
    id?: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type PostCreateOrConnectWithoutTopicInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput>
  }

  export type PostCreateManyTopicInputEnvelope = {
    data: PostCreateManyTopicInput | PostCreateManyTopicInput[]
    skipDuplicates?: boolean
  }

  export type TopicClosureCreateWithoutAncestorTopicInput = {
    depth: number
    descendantTopic: TopicCreateNestedOneWithoutDescendantClosuresInput
  }

  export type TopicClosureUncheckedCreateWithoutAncestorTopicInput = {
    descendantTopicId: string
    depth: number
  }

  export type TopicClosureCreateOrConnectWithoutAncestorTopicInput = {
    where: TopicClosureWhereUniqueInput
    create: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput>
  }

  export type TopicClosureCreateManyAncestorTopicInputEnvelope = {
    data: TopicClosureCreateManyAncestorTopicInput | TopicClosureCreateManyAncestorTopicInput[]
    skipDuplicates?: boolean
  }

  export type TopicClosureCreateWithoutDescendantTopicInput = {
    depth: number
    ancestorTopic: TopicCreateNestedOneWithoutAncestorClosuresInput
  }

  export type TopicClosureUncheckedCreateWithoutDescendantTopicInput = {
    ancestorTopicId: string
    depth: number
  }

  export type TopicClosureCreateOrConnectWithoutDescendantTopicInput = {
    where: TopicClosureWhereUniqueInput
    create: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput>
  }

  export type TopicClosureCreateManyDescendantTopicInputEnvelope = {
    data: TopicClosureCreateManyDescendantTopicInput | TopicClosureCreateManyDescendantTopicInput[]
    skipDuplicates?: boolean
  }

  export type TopicWatchCreateWithoutTopicInput = {
    memberId: string
    createdAt?: Date | string
  }

  export type TopicWatchUncheckedCreateWithoutTopicInput = {
    memberId: string
    createdAt?: Date | string
  }

  export type TopicWatchCreateOrConnectWithoutTopicInput = {
    where: TopicWatchWhereUniqueInput
    create: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput>
  }

  export type TopicWatchCreateManyTopicInputEnvelope = {
    data: TopicWatchCreateManyTopicInput | TopicWatchCreateManyTopicInput[]
    skipDuplicates?: boolean
  }

  export type TopicReadStateCreateWithoutTopicInput = {
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicReadStateUncheckedCreateWithoutTopicInput = {
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicReadStateCreateOrConnectWithoutTopicInput = {
    where: TopicReadStateWhereUniqueInput
    create: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput>
  }

  export type TopicReadStateCreateManyTopicInputEnvelope = {
    data: TopicReadStateCreateManyTopicInput | TopicReadStateCreateManyTopicInput[]
    skipDuplicates?: boolean
  }

  export type TopicUpsertWithoutChildTopicsInput = {
    update: XOR<TopicUpdateWithoutChildTopicsInput, TopicUncheckedUpdateWithoutChildTopicsInput>
    create: XOR<TopicCreateWithoutChildTopicsInput, TopicUncheckedCreateWithoutChildTopicsInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutChildTopicsInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutChildTopicsInput, TopicUncheckedUpdateWithoutChildTopicsInput>
  }

  export type TopicUpdateWithoutChildTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutChildTopicsInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicUpsertWithWhereUniqueWithoutParentTopicInput = {
    where: TopicWhereUniqueInput
    update: XOR<TopicUpdateWithoutParentTopicInput, TopicUncheckedUpdateWithoutParentTopicInput>
    create: XOR<TopicCreateWithoutParentTopicInput, TopicUncheckedCreateWithoutParentTopicInput>
  }

  export type TopicUpdateWithWhereUniqueWithoutParentTopicInput = {
    where: TopicWhereUniqueInput
    data: XOR<TopicUpdateWithoutParentTopicInput, TopicUncheckedUpdateWithoutParentTopicInput>
  }

  export type TopicUpdateManyWithWhereWithoutParentTopicInput = {
    where: TopicScalarWhereInput
    data: XOR<TopicUpdateManyMutationInput, TopicUncheckedUpdateManyWithoutParentTopicInput>
  }

  export type TopicScalarWhereInput = {
    AND?: TopicScalarWhereInput | TopicScalarWhereInput[]
    OR?: TopicScalarWhereInput[]
    NOT?: TopicScalarWhereInput | TopicScalarWhereInput[]
    id?: StringFilter<"Topic"> | string
    parentTopicId?: StringNullableFilter<"Topic"> | string | null
    challengeId?: StringNullableFilter<"Topic"> | string | null
    roleName?: StringNullableFilter<"Topic"> | string | null
    title?: StringFilter<"Topic"> | string
    isAnnouncement?: BoolFilter<"Topic"> | boolean
    authorMemberId?: StringFilter<"Topic"> | string
    authorHandle?: StringFilter<"Topic"> | string
    createdAt?: DateTimeFilter<"Topic"> | Date | string
    updatedAt?: DateTimeFilter<"Topic"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Topic"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Topic"> | string | null
  }

  export type PostUpsertWithWhereUniqueWithoutTopicInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutTopicInput, PostUncheckedUpdateWithoutTopicInput>
    create: XOR<PostCreateWithoutTopicInput, PostUncheckedCreateWithoutTopicInput>
  }

  export type PostUpdateWithWhereUniqueWithoutTopicInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutTopicInput, PostUncheckedUpdateWithoutTopicInput>
  }

  export type PostUpdateManyWithWhereWithoutTopicInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutTopicInput>
  }

  export type PostScalarWhereInput = {
    AND?: PostScalarWhereInput | PostScalarWhereInput[]
    OR?: PostScalarWhereInput[]
    NOT?: PostScalarWhereInput | PostScalarWhereInput[]
    id?: StringFilter<"Post"> | string
    topicId?: StringFilter<"Post"> | string
    parentType?: StringFilter<"Post"> | string
    parentId?: StringFilter<"Post"> | string
    authorMemberId?: StringFilter<"Post"> | string
    authorHandle?: StringFilter<"Post"> | string
    content?: StringNullableFilter<"Post"> | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    deletedAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    deletedByMemberId?: StringNullableFilter<"Post"> | string | null
  }

  export type TopicClosureUpsertWithWhereUniqueWithoutAncestorTopicInput = {
    where: TopicClosureWhereUniqueInput
    update: XOR<TopicClosureUpdateWithoutAncestorTopicInput, TopicClosureUncheckedUpdateWithoutAncestorTopicInput>
    create: XOR<TopicClosureCreateWithoutAncestorTopicInput, TopicClosureUncheckedCreateWithoutAncestorTopicInput>
  }

  export type TopicClosureUpdateWithWhereUniqueWithoutAncestorTopicInput = {
    where: TopicClosureWhereUniqueInput
    data: XOR<TopicClosureUpdateWithoutAncestorTopicInput, TopicClosureUncheckedUpdateWithoutAncestorTopicInput>
  }

  export type TopicClosureUpdateManyWithWhereWithoutAncestorTopicInput = {
    where: TopicClosureScalarWhereInput
    data: XOR<TopicClosureUpdateManyMutationInput, TopicClosureUncheckedUpdateManyWithoutAncestorTopicInput>
  }

  export type TopicClosureScalarWhereInput = {
    AND?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
    OR?: TopicClosureScalarWhereInput[]
    NOT?: TopicClosureScalarWhereInput | TopicClosureScalarWhereInput[]
    ancestorTopicId?: StringFilter<"TopicClosure"> | string
    descendantTopicId?: StringFilter<"TopicClosure"> | string
    depth?: IntFilter<"TopicClosure"> | number
  }

  export type TopicClosureUpsertWithWhereUniqueWithoutDescendantTopicInput = {
    where: TopicClosureWhereUniqueInput
    update: XOR<TopicClosureUpdateWithoutDescendantTopicInput, TopicClosureUncheckedUpdateWithoutDescendantTopicInput>
    create: XOR<TopicClosureCreateWithoutDescendantTopicInput, TopicClosureUncheckedCreateWithoutDescendantTopicInput>
  }

  export type TopicClosureUpdateWithWhereUniqueWithoutDescendantTopicInput = {
    where: TopicClosureWhereUniqueInput
    data: XOR<TopicClosureUpdateWithoutDescendantTopicInput, TopicClosureUncheckedUpdateWithoutDescendantTopicInput>
  }

  export type TopicClosureUpdateManyWithWhereWithoutDescendantTopicInput = {
    where: TopicClosureScalarWhereInput
    data: XOR<TopicClosureUpdateManyMutationInput, TopicClosureUncheckedUpdateManyWithoutDescendantTopicInput>
  }

  export type TopicWatchUpsertWithWhereUniqueWithoutTopicInput = {
    where: TopicWatchWhereUniqueInput
    update: XOR<TopicWatchUpdateWithoutTopicInput, TopicWatchUncheckedUpdateWithoutTopicInput>
    create: XOR<TopicWatchCreateWithoutTopicInput, TopicWatchUncheckedCreateWithoutTopicInput>
  }

  export type TopicWatchUpdateWithWhereUniqueWithoutTopicInput = {
    where: TopicWatchWhereUniqueInput
    data: XOR<TopicWatchUpdateWithoutTopicInput, TopicWatchUncheckedUpdateWithoutTopicInput>
  }

  export type TopicWatchUpdateManyWithWhereWithoutTopicInput = {
    where: TopicWatchScalarWhereInput
    data: XOR<TopicWatchUpdateManyMutationInput, TopicWatchUncheckedUpdateManyWithoutTopicInput>
  }

  export type TopicWatchScalarWhereInput = {
    AND?: TopicWatchScalarWhereInput | TopicWatchScalarWhereInput[]
    OR?: TopicWatchScalarWhereInput[]
    NOT?: TopicWatchScalarWhereInput | TopicWatchScalarWhereInput[]
    topicId?: StringFilter<"TopicWatch"> | string
    memberId?: StringFilter<"TopicWatch"> | string
    createdAt?: DateTimeFilter<"TopicWatch"> | Date | string
  }

  export type TopicReadStateUpsertWithWhereUniqueWithoutTopicInput = {
    where: TopicReadStateWhereUniqueInput
    update: XOR<TopicReadStateUpdateWithoutTopicInput, TopicReadStateUncheckedUpdateWithoutTopicInput>
    create: XOR<TopicReadStateCreateWithoutTopicInput, TopicReadStateUncheckedCreateWithoutTopicInput>
  }

  export type TopicReadStateUpdateWithWhereUniqueWithoutTopicInput = {
    where: TopicReadStateWhereUniqueInput
    data: XOR<TopicReadStateUpdateWithoutTopicInput, TopicReadStateUncheckedUpdateWithoutTopicInput>
  }

  export type TopicReadStateUpdateManyWithWhereWithoutTopicInput = {
    where: TopicReadStateScalarWhereInput
    data: XOR<TopicReadStateUpdateManyMutationInput, TopicReadStateUncheckedUpdateManyWithoutTopicInput>
  }

  export type TopicReadStateScalarWhereInput = {
    AND?: TopicReadStateScalarWhereInput | TopicReadStateScalarWhereInput[]
    OR?: TopicReadStateScalarWhereInput[]
    NOT?: TopicReadStateScalarWhereInput | TopicReadStateScalarWhereInput[]
    topicId?: StringFilter<"TopicReadState"> | string
    memberId?: StringFilter<"TopicReadState"> | string
    lastReadAt?: DateTimeFilter<"TopicReadState"> | Date | string
    updatedAt?: DateTimeFilter<"TopicReadState"> | Date | string
  }

  export type TopicCreateWithoutPostsInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutPostsInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutPostsInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
  }

  export type TopicUpsertWithoutPostsInput = {
    update: XOR<TopicUpdateWithoutPostsInput, TopicUncheckedUpdateWithoutPostsInput>
    create: XOR<TopicCreateWithoutPostsInput, TopicUncheckedCreateWithoutPostsInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutPostsInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutPostsInput, TopicUncheckedUpdateWithoutPostsInput>
  }

  export type TopicUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutPostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicCreateWithoutAncestorClosuresInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutAncestorClosuresInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutAncestorClosuresInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutAncestorClosuresInput, TopicUncheckedCreateWithoutAncestorClosuresInput>
  }

  export type TopicCreateWithoutDescendantClosuresInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutDescendantClosuresInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutDescendantClosuresInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutDescendantClosuresInput, TopicUncheckedCreateWithoutDescendantClosuresInput>
  }

  export type TopicUpsertWithoutAncestorClosuresInput = {
    update: XOR<TopicUpdateWithoutAncestorClosuresInput, TopicUncheckedUpdateWithoutAncestorClosuresInput>
    create: XOR<TopicCreateWithoutAncestorClosuresInput, TopicUncheckedCreateWithoutAncestorClosuresInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutAncestorClosuresInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutAncestorClosuresInput, TopicUncheckedUpdateWithoutAncestorClosuresInput>
  }

  export type TopicUpdateWithoutAncestorClosuresInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutAncestorClosuresInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicUpsertWithoutDescendantClosuresInput = {
    update: XOR<TopicUpdateWithoutDescendantClosuresInput, TopicUncheckedUpdateWithoutDescendantClosuresInput>
    create: XOR<TopicCreateWithoutDescendantClosuresInput, TopicUncheckedCreateWithoutDescendantClosuresInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutDescendantClosuresInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutDescendantClosuresInput, TopicUncheckedUpdateWithoutDescendantClosuresInput>
  }

  export type TopicUpdateWithoutDescendantClosuresInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutDescendantClosuresInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicCreateWithoutWatchesInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    readStates?: TopicReadStateCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutWatchesInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    readStates?: TopicReadStateUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutWatchesInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutWatchesInput, TopicUncheckedCreateWithoutWatchesInput>
  }

  export type TopicUpsertWithoutWatchesInput = {
    update: XOR<TopicUpdateWithoutWatchesInput, TopicUncheckedUpdateWithoutWatchesInput>
    create: XOR<TopicCreateWithoutWatchesInput, TopicUncheckedCreateWithoutWatchesInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutWatchesInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutWatchesInput, TopicUncheckedUpdateWithoutWatchesInput>
  }

  export type TopicUpdateWithoutWatchesInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutWatchesInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicCreateWithoutReadStatesInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    parentTopic?: TopicCreateNestedOneWithoutChildTopicsInput
    childTopics?: TopicCreateNestedManyWithoutParentTopicInput
    posts?: PostCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchCreateNestedManyWithoutTopicInput
  }

  export type TopicUncheckedCreateWithoutReadStatesInput = {
    id?: string
    parentTopicId?: string | null
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
    childTopics?: TopicUncheckedCreateNestedManyWithoutParentTopicInput
    posts?: PostUncheckedCreateNestedManyWithoutTopicInput
    ancestorClosures?: TopicClosureUncheckedCreateNestedManyWithoutAncestorTopicInput
    descendantClosures?: TopicClosureUncheckedCreateNestedManyWithoutDescendantTopicInput
    watches?: TopicWatchUncheckedCreateNestedManyWithoutTopicInput
  }

  export type TopicCreateOrConnectWithoutReadStatesInput = {
    where: TopicWhereUniqueInput
    create: XOR<TopicCreateWithoutReadStatesInput, TopicUncheckedCreateWithoutReadStatesInput>
  }

  export type TopicUpsertWithoutReadStatesInput = {
    update: XOR<TopicUpdateWithoutReadStatesInput, TopicUncheckedUpdateWithoutReadStatesInput>
    create: XOR<TopicCreateWithoutReadStatesInput, TopicUncheckedCreateWithoutReadStatesInput>
    where?: TopicWhereInput
  }

  export type TopicUpdateToOneWithWhereWithoutReadStatesInput = {
    where?: TopicWhereInput
    data: XOR<TopicUpdateWithoutReadStatesInput, TopicUncheckedUpdateWithoutReadStatesInput>
  }

  export type TopicUpdateWithoutReadStatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    parentTopic?: TopicUpdateOneWithoutChildTopicsNestedInput
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutReadStatesInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentTopicId?: NullableStringFieldUpdateOperationsInput | string | null
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicCreateManyParentTopicInput = {
    id?: string
    challengeId?: string | null
    roleName?: string | null
    title: string
    isAnnouncement?: boolean
    authorMemberId: string
    authorHandle: string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type PostCreateManyTopicInput = {
    id?: string
    parentType: string
    parentId: string
    authorMemberId: string
    authorHandle: string
    content?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
    deletedByMemberId?: string | null
  }

  export type TopicClosureCreateManyAncestorTopicInput = {
    descendantTopicId: string
    depth: number
  }

  export type TopicClosureCreateManyDescendantTopicInput = {
    ancestorTopicId: string
    depth: number
  }

  export type TopicWatchCreateManyTopicInput = {
    memberId: string
    createdAt?: Date | string
  }

  export type TopicReadStateCreateManyTopicInput = {
    memberId: string
    lastReadAt?: Date | string
    updatedAt?: Date | string
  }

  export type TopicUpdateWithoutParentTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUpdateManyWithoutParentTopicNestedInput
    posts?: PostUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateWithoutParentTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
    childTopics?: TopicUncheckedUpdateManyWithoutParentTopicNestedInput
    posts?: PostUncheckedUpdateManyWithoutTopicNestedInput
    ancestorClosures?: TopicClosureUncheckedUpdateManyWithoutAncestorTopicNestedInput
    descendantClosures?: TopicClosureUncheckedUpdateManyWithoutDescendantTopicNestedInput
    watches?: TopicWatchUncheckedUpdateManyWithoutTopicNestedInput
    readStates?: TopicReadStateUncheckedUpdateManyWithoutTopicNestedInput
  }

  export type TopicUncheckedUpdateManyWithoutParentTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    challengeId?: NullableStringFieldUpdateOperationsInput | string | null
    roleName?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    isAnnouncement?: BoolFieldUpdateOperationsInput | boolean
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostUpdateWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostUncheckedUpdateWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PostUncheckedUpdateManyWithoutTopicInput = {
    id?: StringFieldUpdateOperationsInput | string
    parentType?: StringFieldUpdateOperationsInput | string
    parentId?: StringFieldUpdateOperationsInput | string
    authorMemberId?: StringFieldUpdateOperationsInput | string
    authorHandle?: StringFieldUpdateOperationsInput | string
    content?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    deletedByMemberId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TopicClosureUpdateWithoutAncestorTopicInput = {
    depth?: IntFieldUpdateOperationsInput | number
    descendantTopic?: TopicUpdateOneRequiredWithoutDescendantClosuresNestedInput
  }

  export type TopicClosureUncheckedUpdateWithoutAncestorTopicInput = {
    descendantTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicClosureUncheckedUpdateManyWithoutAncestorTopicInput = {
    descendantTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicClosureUpdateWithoutDescendantTopicInput = {
    depth?: IntFieldUpdateOperationsInput | number
    ancestorTopic?: TopicUpdateOneRequiredWithoutAncestorClosuresNestedInput
  }

  export type TopicClosureUncheckedUpdateWithoutDescendantTopicInput = {
    ancestorTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicClosureUncheckedUpdateManyWithoutDescendantTopicInput = {
    ancestorTopicId?: StringFieldUpdateOperationsInput | string
    depth?: IntFieldUpdateOperationsInput | number
  }

  export type TopicWatchUpdateWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicWatchUncheckedUpdateWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicWatchUncheckedUpdateManyWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateUpdateWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateUncheckedUpdateWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TopicReadStateUncheckedUpdateManyWithoutTopicInput = {
    memberId?: StringFieldUpdateOperationsInput | string
    lastReadAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}