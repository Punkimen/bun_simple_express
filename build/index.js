// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode
      ? (__toESMCache_node ??= new WeakMap())
      : (__toESMCache_esm ??= new WeakMap());
    var cached = cache.get(mod);
    if (cached) return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true,
      });
  if (canCache) cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (
  mod || cb((mod = { exports: {} }).exports, mod),
  mod.exports
);
var __require = import.meta.require;

// node_modules/.pnpm/dotenv@17.3.1/node_modules/dotenv/package.json
var require_package = __commonJS((exports, module) => {
  module.exports = {
    name: "dotenv",
    version: "17.3.1",
    description: "Loads environment variables from .env file",
    main: "lib/main.js",
    types: "lib/main.d.ts",
    exports: {
      ".": {
        types: "./lib/main.d.ts",
        require: "./lib/main.js",
        default: "./lib/main.js",
      },
      "./config": "./config.js",
      "./config.js": "./config.js",
      "./lib/env-options": "./lib/env-options.js",
      "./lib/env-options.js": "./lib/env-options.js",
      "./lib/cli-options": "./lib/cli-options.js",
      "./lib/cli-options.js": "./lib/cli-options.js",
      "./package.json": "./package.json",
    },
    scripts: {
      "dts-check": "tsc --project tests/types/tsconfig.json",
      lint: "standard",
      pretest: "npm run lint && npm run dts-check",
      test: "tap run tests/**/*.js --allow-empty-coverage --disable-coverage --timeout=60000",
      "test:coverage":
        "tap run tests/**/*.js --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
      prerelease: "npm test",
      release: "standard-version",
    },
    repository: {
      type: "git",
      url: "git://github.com/motdotla/dotenv.git",
    },
    homepage: "https://github.com/motdotla/dotenv#readme",
    funding: "https://dotenvx.com",
    keywords: [
      "dotenv",
      "env",
      ".env",
      "environment",
      "variables",
      "config",
      "settings",
    ],
    readmeFilename: "README.md",
    license: "BSD-2-Clause",
    devDependencies: {
      "@types/node": "^18.11.3",
      decache: "^4.6.2",
      sinon: "^14.0.1",
      standard: "^17.0.0",
      "standard-version": "^9.5.0",
      tap: "^19.2.0",
      typescript: "^4.8.4",
    },
    engines: {
      node: ">=12",
    },
    browser: {
      fs: false,
    },
  };
});

// node_modules/.pnpm/dotenv@17.3.1/node_modules/dotenv/lib/main.js
var require_main = __commonJS((exports, module) => {
  var fs = __require("fs");
  var path = __require("path");
  var os = __require("os");
  var crypto = __require("crypto");
  var packageJson = require_package();
  var version = packageJson.version;
  var TIPS = [
    "\uD83D\uDD10 encrypt with Dotenvx: https://dotenvx.com",
    "\uD83D\uDD10 prevent committing .env to code: https://dotenvx.com/precommit",
    "\uD83D\uDD10 prevent building .env in docker: https://dotenvx.com/prebuild",
    "\uD83E\uDD16 agentic secret storage: https://dotenvx.com/as2",
    "\u26A1\uFE0F secrets for agents: https://dotenvx.com/as2",
    "\uD83D\uDEE1\uFE0F auth for agents: https://vestauth.com",
    "\uD83D\uDEE0\uFE0F  run anywhere with `dotenvx run -- yourcommand`",
    "\u2699\uFE0F  specify custom .env file path with { path: '/custom/path/.env' }",
    "\u2699\uFE0F  enable debug logging with { debug: true }",
    "\u2699\uFE0F  override existing env vars with { override: true }",
    "\u2699\uFE0F  suppress all logs with { quiet: true }",
    "\u2699\uFE0F  write to custom object with { processEnv: myObject }",
    "\u2699\uFE0F  load multiple .env files with { path: ['.env.local', '.env'] }",
  ];
  function _getRandomTip() {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }
  function parseBoolean(value) {
    if (typeof value === "string") {
      return !["false", "0", "no", "off", ""].includes(value.toLowerCase());
    }
    return Boolean(value);
  }
  function supportsAnsi() {
    return process.stdout.isTTY;
  }
  function dim(text) {
    return supportsAnsi() ? `\x1B[2m${text}\x1B[0m` : text;
  }
  var LINE =
    /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
  function parse(src) {
    const obj = {};
    let lines = src.toString();
    lines = lines.replace(
      /\r\n?/gm,
      `
`,
    );
    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
      if (maybeQuote === '"') {
        value = value.replace(
          /\\n/g,
          `
`,
        );
        value = value.replace(/\\r/g, "\r");
      }
      obj[key] = value;
    }
    return obj;
  }
  function _parseVault(options) {
    options = options || {};
    const vaultPath = _vaultPath(options);
    options.path = vaultPath;
    const result = DotenvModule.configDotenv(options);
    if (!result.parsed) {
      const err = new Error(
        `MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`,
      );
      err.code = "MISSING_DATA";
      throw err;
    }
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for (let i = 0; i < length; i++) {
      try {
        const key = keys[i].trim();
        const attrs = _instructions(result, key);
        decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
        break;
      } catch (error) {
        if (i + 1 >= length) {
          throw error;
        }
      }
    }
    return DotenvModule.parse(decrypted);
  }
  function _warn(message) {
    console.error(`[dotenv@${version}][WARN] ${message}`);
  }
  function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`);
  }
  function _log(message) {
    console.log(`[dotenv@${version}] ${message}`);
  }
  function _dotenvKey(options) {
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
      return options.DOTENV_KEY;
    }
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
      return process.env.DOTENV_KEY;
    }
    return "";
  }
  function _instructions(result, dotenvKey) {
    let uri;
    try {
      uri = new URL(dotenvKey);
    } catch (error) {
      if (error.code === "ERR_INVALID_URL") {
        const err = new Error(
          "INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development",
        );
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      throw error;
    }
    const key = uri.password;
    if (!key) {
      const err = new Error("INVALID_DOTENV_KEY: Missing key part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environment = uri.searchParams.get("environment");
    if (!environment) {
      const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey];
    if (!ciphertext) {
      const err = new Error(
        `NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`,
      );
      err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
      throw err;
    }
    return { ciphertext, key };
  }
  function _vaultPath(options) {
    let possibleVaultPath = null;
    if (options && options.path && options.path.length > 0) {
      if (Array.isArray(options.path)) {
        for (const filepath of options.path) {
          if (fs.existsSync(filepath)) {
            possibleVaultPath = filepath.endsWith(".vault")
              ? filepath
              : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault")
          ? options.path
          : `${options.path}.vault`;
      }
    } else {
      possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
    }
    if (fs.existsSync(possibleVaultPath)) {
      return possibleVaultPath;
    }
    return null;
  }
  function _resolveHome(envPath) {
    return envPath[0] === "~"
      ? path.join(os.homedir(), envPath.slice(1))
      : envPath;
  }
  function _configVault(options) {
    const debug = parseBoolean(
      process.env.DOTENV_CONFIG_DEBUG || (options && options.debug),
    );
    const quiet = parseBoolean(
      process.env.DOTENV_CONFIG_QUIET || (options && options.quiet),
    );
    if (debug || !quiet) {
      _log("Loading env from encrypted .env.vault");
    }
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return { parsed };
  }
  function configDotenv(options) {
    const dotenvPath = path.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    let processEnv = process.env;
    if (options && options.processEnv != null) {
      processEnv = options.processEnv;
    }
    let debug = parseBoolean(
      processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug),
    );
    let quiet = parseBoolean(
      processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet),
    );
    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("No encoding is specified. UTF-8 is used by default");
      }
    }
    let optionPaths = [dotenvPath];
    if (options && options.path) {
      if (!Array.isArray(options.path)) {
        optionPaths = [_resolveHome(options.path)];
      } else {
        optionPaths = [];
        for (const filepath of options.path) {
          optionPaths.push(_resolveHome(filepath));
        }
      }
    }
    let lastError;
    const parsedAll = {};
    for (const path2 of optionPaths) {
      try {
        const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
        DotenvModule.populate(parsedAll, parsed, options);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${path2} ${e.message}`);
        }
        lastError = e;
      }
    }
    const populated = DotenvModule.populate(processEnv, parsedAll, options);
    debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug);
    quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet);
    if (debug || !quiet) {
      const keysCount = Object.keys(populated).length;
      const shortPaths = [];
      for (const filePath of optionPaths) {
        try {
          const relative = path.relative(process.cwd(), filePath);
          shortPaths.push(relative);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${filePath} ${e.message}`);
          }
          lastError = e;
        }
      }
      _log(
        `injecting env (${keysCount}) from ${shortPaths.join(",")} ${dim(`-- tip: ${_getRandomTip()}`)}`,
      );
    }
    if (lastError) {
      return { parsed: parsedAll, error: lastError };
    } else {
      return { parsed: parsedAll };
    }
  }
  function config(options) {
    if (_dotenvKey(options).length === 0) {
      return DotenvModule.configDotenv(options);
    }
    const vaultPath = _vaultPath(options);
    if (!vaultPath) {
      _warn(
        `You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`,
      );
      return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
  }
  function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");
    const nonce = ciphertext.subarray(0, 12);
    const authTag = ciphertext.subarray(-16);
    ciphertext = ciphertext.subarray(12, -16);
    try {
      const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
      aesgcm.setAuthTag(authTag);
      return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
      const isRange = error instanceof RangeError;
      const invalidKeyLength = error.message === "Invalid key length";
      const decryptionFailed =
        error.message === "Unsupported state or unable to authenticate data";
      if (isRange || invalidKeyLength) {
        const err = new Error(
          "INVALID_DOTENV_KEY: It must be 64 characters long (or more)",
        );
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error(
          "DECRYPTION_FAILED: Please check your DOTENV_KEY",
        );
        err.code = "DECRYPTION_FAILED";
        throw err;
      } else {
        throw error;
      }
    }
  }
  function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    const populated = {};
    if (typeof parsed !== "object") {
      const err = new Error(
        "OBJECT_REQUIRED: Please check the processEnv argument being passed to populate",
      );
      err.code = "OBJECT_REQUIRED";
      throw err;
    }
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (override === true) {
          processEnv[key] = parsed[key];
          populated[key] = parsed[key];
        }
        if (debug) {
          if (override === true) {
            _debug(`"${key}" is already defined and WAS overwritten`);
          } else {
            _debug(`"${key}" is already defined and was NOT overwritten`);
          }
        }
      } else {
        processEnv[key] = parsed[key];
        populated[key] = parsed[key];
      }
    }
    return populated;
  }
  var DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate,
  };
  exports.configDotenv = DotenvModule.configDotenv;
  exports._configVault = DotenvModule._configVault;
  exports._parseVault = DotenvModule._parseVault;
  exports.config = DotenvModule.config;
  exports.decrypt = DotenvModule.decrypt;
  exports.parse = DotenvModule.parse;
  exports.populate = DotenvModule.populate;
  module.exports = DotenvModule;
});

// app.ts
var createApp = () => {
  const middleware = [];
  const routes = {};
  const wrapResponse = (result) => {
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  };
  const htmlWrap = (html) => {
    console.log("Wrapping HTML response");
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  };
  const executeMiddleware = async (req, res) => {
    let index = -1;
    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      const mw = middleware[i];
      if (!mw) return null;
      const result = await mw(req, res, () => dispatch(i + 1));
      if (result instanceof Response) {
        console.log("Middleware returned Response", result);
        return result;
      }
      return null;
    };
    return dispatch(0);
  };
  const wrapWithMiddleware = (cb) => {
    return async (req, res) => {
      const mwResult = await executeMiddleware(req, res);
      console.log({ mwResult });
      if (mwResult) {
        console.log("retrun mwResult", { mwResult });
        return mwResult;
      }
      const result = await cb(req, res);
      return wrapResponse(result);
    };
  };
  const createMethodHandler = (path, method, cb) => {
    if (!path || !path.trim()) {
      throw new Error("Path cannot be empty");
    }
    const wrappedCallback = wrapWithMiddleware(cb);
    if (!routes[path]) {
      routes[path] = {};
    }
    if (typeof routes[path] === "object" && routes[path][method]) {
      throw new Error(`Method ${method} already exists for path ${path}`);
    }
    if (
      typeof routes[path] === "object" &&
      Object.keys(routes[path]).length === 0
    ) {
      routes[path] = { [method]: wrappedCallback };
    } else if (typeof routes[path] === "object") {
      routes[path][method] = wrappedCallback;
    } else {
      routes[path] = { [method]: wrappedCallback };
    }
  };
  const methodGet = (path, cb) => {
    createMethodHandler(path, "GET", cb);
  };
  const methodPost = (path, cb) => {
    createMethodHandler(path, "POST", cb);
  };
  const methodDelete = (path, cb) => {
    createMethodHandler(path, "DELETE", cb);
  };
  const methodPut = (path, cb) => {
    createMethodHandler(path, "PUT", cb);
  };
  const methodHtml = (path, cb) => {
    createMethodHandler(path, "GET", async (req, res) => {
      const html = await cb(req, res);
      return htmlWrap(html);
    });
  };
  const use = (cb) => {
    middleware.push(cb);
  };
  const listen = (port, callback) => {
    const server = Bun.serve({
      port,
      routes,
      fetch() {
        return new Response("Not Found", { status: 404 });
      },
    });
    console.log(`Server running at ${server.url}`);
    callback?.();
  };
  return {
    methodDelete,
    methodGet,
    methodPost,
    methodPut,
    methodHtml,
    use,
    listen,
  };
};

// db/db.ts
var dotenv = __toESM(require_main(), 1);
var { SQL } = globalThis.Bun;
dotenv.config();
var db = new SQL(process.env.DATABASE_URL);
var db_default = db;

// utils/error.ts
class AppError extends Error {
  status;
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}
// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/native.js
import { randomUUID } from "crypto";
var native_default = { randomUUID };

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/rng.js
import { randomFillSync } from "crypto";
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, (poolPtr += 16));
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (
    byteToHex[arr[offset + 0]] +
    byteToHex[arr[offset + 1]] +
    byteToHex[arr[offset + 2]] +
    byteToHex[arr[offset + 3]] +
    "-" +
    byteToHex[arr[offset + 4]] +
    byteToHex[arr[offset + 5]] +
    "-" +
    byteToHex[arr[offset + 6]] +
    byteToHex[arr[offset + 7]] +
    "-" +
    byteToHex[arr[offset + 8]] +
    byteToHex[arr[offset + 9]] +
    "-" +
    byteToHex[arr[offset + 10]] +
    byteToHex[arr[offset + 11]] +
    byteToHex[arr[offset + 12]] +
    byteToHex[arr[offset + 13]] +
    byteToHex[arr[offset + 14]] +
    byteToHex[arr[offset + 15]]
  ).toLowerCase();
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = (rnds[6] & 15) | 64;
  rnds[8] = (rnds[8] & 63) | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(
        `UUID byte range ${offset}:${offset + 15} is out of buffer bounds`,
      );
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  return _v4(options, buf, offset);
}
var v4_default = v4;
// modules/transactions/contoller.ts
class Transaction {
  async getTransaction() {
    try {
      const transactions = await db_default`SELECT * FROM transactions`;
      return transactions;
    } catch (error) {
      throw new AppError(error.message || "Failed to fetch transactions");
    }
  }
  async createTransaction(data) {
    if (!data) {
      throw new BadRequestError("Transaction data is required");
    }
    const newTransaction = {
      id: v4_default(),
      ...data,
    };
    try {
      const transaction =
        await db_default`INSERT INTO transactions (id, category_id, amount, date, note) VALUES (${newTransaction.id}, ${newTransaction.categoryId}, ${newTransaction.amount}, ${newTransaction.date}, ${newTransaction.note})  RETURNING *`;
      if (!transaction[0]) {
        throw new AppError("Failed to create transaction");
      }
      return transaction[0];
    } catch (error) {
      throw new AppError(error.message || "Failed to create transaction");
    }
  }
  async updateTransaction(data, id) {
    if (!id) {
      throw new BadRequestError("Transaction ID is required for update");
    }
    const { amount } = data;
    if (amount && amount < 0) {
      throw new BadRequestError("Amount can`t be is negative");
    }
    try {
      const existingTransaction =
        await db_default`SELECT * FROM transactions WHERE id = ${id}`;
      if (!existingTransaction[0]) {
        throw new AppError("Transaction not found");
      }
      const updatedTransaction = {
        ...existingTransaction[0],
        ...data,
      };
      const result =
        await db_default`UPDATE transactions SET category_id = ${updatedTransaction.categoryId}, amount = ${updatedTransaction.amount}, note = ${updatedTransaction.note} WHERE id = ${id} RETURNING *`;
      if (!result[0]) {
        throw new AppError("Failed to update transaction");
      }
      return result[0];
    } catch (error) {
      throw new AppError(error.message || "Failed to update transaction");
    }
  }
  async deleteTransaction(id) {
    if (!id) {
      throw new BadRequestError("Id is not found");
    }
    const result =
      await db_default`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
    if (!result[0]) {
      throw new AppError("Failed to delete transaction");
    }
    return result[0];
  }
}
var transactionController = new Transaction();

// modules/transactions/routes.ts
var initTransactionsRoutes = (app) => {
  app.methodGet("/transaction", transactionController.getTransaction);
  app.methodPost("/api/transaction", async (req) => {
    const newTransaction = await req.json();
    return transactionController.createTransaction(newTransaction);
  });
  app.methodPut("/api/transaction/:id", async (req) => {
    const { id } = req.params;
    const updateData = await req.json();
    return transactionController.updateTransaction(updateData, id);
  });
};

// modules/users/controller.ts
class Users {
  async createUser(name) {
    try {
      const newUser =
        await db_default`INSERT INTO users (name) VALUES (${name}) RETURNING *`;
      if (!newUser[0]) {
        throw new AppError("Failed to create user", 500);
      }
      return newUser;
    } catch (error) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
  async getUsers() {
    try {
      const users = await db_default`SELECT * FROM users`;
      return users;
    } catch (error) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
  async getUserById(id) {
    if (!id) {
      throw new BadRequestError("Id is not provide");
    }
    try {
      const user = await db_default`SELECT * FROM users WHERE id = ${id}`;
      if (!user[0]) {
        throw new AppError("User not found", 404);
      }
      return user[0];
    } catch (error) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
  async deleteAllUsers() {
    try {
      await db_default`DELETE FROM users`;
      const result = await db_default`DELETE FROM users`;
      return {
        success: true,
        deletedCount: result.count,
      };
    } catch (error) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
}
var userController = new Users();

// modules/users/routes.ts
var initUsersRoutes = (app) => {
  app.methodGet("/users/:id", (req) => {
    const { id } = req.params;
    return userController.getUserById(id);
  });
  app.methodGet("/users", (req) => {
    return userController.getUsers();
  });
  app.methodPost("/createUser", async (req) => {
    const { name } = await req.json();
    return userController.createUser(name);
  });
  app.methodDelete("/deleteUsers", () => {
    return userController.deleteAllUsers();
  });
};

// modules/category/contoller.ts
class Categories {
  async getAllCategories() {
    try {
      const categories = await db_default`SELECT * FROM categories`;
      return categories;
    } catch (error) {
      throw new AppError(error.message || "Failed to fetch categories");
    }
  }
  async createCategory(data) {
    const newCategory = {
      id: v4_default(),
      ...data,
    };
    try {
      const category =
        await db_default`INSERT INTO categories (id, name, type) VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.type})  RETURNING *`;
      if (!category[0]) {
        throw new AppError("Failed to create category");
      }
      return category[0];
    } catch (error) {
      throw new AppError(error.message || "Failed to create category");
    }
  }
  async deleteCategory(categoryId) {
    if (!categoryId) {
      throw new AppError("Category ID is required");
    }
    try {
      const result =
        await db_default`DELETE FROM categories WHERE id = ${categoryId} RETURNING *`;
      if (!result[0]) {
        throw new AppError("Category not found");
      }
      return { message: "Category deleted successfully" };
    } catch (error) {
      throw new AppError(error.message || "Failed to delete category");
    }
  }
  async updateNameCategory(categoryId, newName) {
    if (!categoryId || !newName) {
      throw new AppError("Category ID and new name are required");
    }
    try {
      const result =
        await db_default`UPDATE categories SET name = ${newName} WHERE id = ${categoryId} RETURNING *`;
      if (!result[0]) {
        throw new AppError("Category not found");
      }
      return result[0];
    } catch (error) {
      throw new AppError(error.message || "Failed to update category");
    }
  }
}
var categoryController = new Categories();

// modules/category/routes.ts
var initCategoryRoutes = (app) => {
  app.methodGet("/api/category", async (req) => {
    return categoryController.getAllCategories();
  });
  app.methodPost("/api/category", async (req) => {
    const newCategory = await req.json();
    console.log({ newCategory });
    return categoryController.createCategory(newCategory);
  });
  app.methodDelete("/api/category/:id", async (req) => {
    const { id } = req.params;
    return categoryController.deleteCategory(id);
  });
  app.methodPut("/api/category/:id", async (req) => {
    const { id } = req.params;
    const { name } = await req.json();
    return categoryController.updateNameCategory(id, name);
  });
};

// modules/login/controller.ts
class LoginController {
  login(cookies, login, password) {
    if (
      login === process.env.ADMIN_LOGIN &&
      password === process.env.ADMIN_PASSWORD
    ) {
      cookies.set("auth", process.env.AUTH_COOKIE_KEY || "", {
        httpOnly: true,
        path: "/",
      });
      return new Response(null, {
        headers: {
          "HX-Redirect": "/home",
        },
      });
    } else {
      throw new UnauthorizedError();
    }
  }
}
var loginController = new LoginController();

// modules/login/routes.ts
var initLoginRoutes = (app) => {
  app.methodPost("/api/login", async (req, res) => {
    const cookies = req.cookies;
    const body = await req.formData();
    const login = body.get("login");
    const password = body.get("password");
    loginController.login(cookies, login, password);
  });
};

// utils/isAuth.ts
class Auth {
  isAuth(req) {
    const cookies = req.cookies;
    const key = cookies.get("auth");
    const path = new URL(req.url).pathname;
    console.log({ path });
    if (key !== process.env.AUTH_COOKIE_KEY) {
      return false;
    }
    return true;
  }
}
var authController = new Auth();

// middlewares/authMiddleware.ts
var authMiddleware = async (req, res, next) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const isAuth = authController.isAuth(req);
  const isPublicRoute =
    path === "/login" || path === "/api/login" || path.startsWith("/public");
  if (!isAuth && !isPublicRoute) {
    if (path.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }
  if (isAuth && path === "/login") {
    const isHx = req.headers.get("HX-Request") === "true";
    if (isHx) {
      return new Response(null, {
        status: 200,
        headers: {
          "HX-Redirect": "/home",
        },
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/home",
      },
    });
  }
  return await next?.();
};

// middlewares/errorHandlerMiddleware.ts
var errorHandlerMiddleware = async (req, res, next) => {
  try {
    return await next?.();
  } catch (error) {
    let status = 500;
    let message = "Internal Server Error";
    if (error instanceof AppError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// index.ts
var app = createApp();
app.use(errorHandlerMiddleware);
app.use(authMiddleware);
initLoginRoutes(app);
initUsersRoutes(app);
initTransactionsRoutes(app);
initCategoryRoutes(app);
app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
