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
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = import.meta.require;

// node_modules/dotenv/lib/main.js
var require_main = __commonJS((exports, module) => {
  var fs = __require("fs");
  var path = __require("path");
  var os = __require("os");
  var crypto = __require("crypto");
  var TIPS = [
    "\u25C8 encrypted .env [www.dotenvx.com]",
    "\u25C8 secrets for agents [www.dotenvx.com]",
    "\u2301 auth for agents [www.vestauth.com]",
    "\u2318 custom filepath { path: '/custom/path/.env' }",
    "\u2318 enable debugging { debug: true }",
    "\u2318 override existing { override: true }",
    "\u2318 suppress logs { quiet: true }",
    "\u2318 multiple files { path: ['.env.local', '.env'] }"
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
  var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
  function parse(src) {
    const obj = {};
    let lines = src.toString();
    lines = lines.replace(/\r\n?/mg, `
`);
    let match;
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1];
      let value = match[2] || "";
      value = value.trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, `
`);
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
      const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
      err.code = "MISSING_DATA";
      throw err;
    }
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for (let i = 0;i < length; i++) {
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
    console.error(`\u26A0 ${message}`);
  }
  function _debug(message) {
    console.log(`\u2506 ${message}`);
  }
  function _log(message) {
    console.log(`\u25C7 ${message}`);
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
        const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
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
      const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
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
            possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
          }
        }
      } else {
        possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
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
    return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
  }
  function _configVault(options) {
    const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || options && options.debug);
    const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || options && options.quiet);
    if (debug || !quiet) {
      _log("loading env from encrypted .env.vault");
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
    let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || options && options.debug);
    let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || options && options.quiet);
    if (options && options.encoding) {
      encoding = options.encoding;
    } else {
      if (debug) {
        _debug("no encoding is specified (UTF-8 is used by default)");
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
          _debug(`failed to load ${path2} ${e.message}`);
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
            _debug(`failed to load ${filePath} ${e.message}`);
          }
          lastError = e;
        }
      }
      _log(`injected env (${keysCount}) from ${shortPaths.join(",")} ${dim(`// tip: ${_getRandomTip()}`)}`);
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
      _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`);
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
      const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
      if (isRange || invalidKeyLength) {
        const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      } else if (decryptionFailed) {
        const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
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
      const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
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
    populate
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

// src/server/utils/error.ts
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

// src/server/app.ts
import { join as join2 } from "path";

// src/server/utils/paths.ts
import { join } from "path";
var isBundled = !import.meta.path.includes("/src/");
var CLIENT_DIR = isBundled ? join(import.meta.dir, "client") : join(import.meta.dir, "../../client");

// src/server/app.ts
var createApp = () => {
  const middleware = [];
  const routes = {};
  const wrapResponse = (result) => {
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  };
  const htmlWrap = (html) => {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
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
      if (!mw)
        return null;
      const result = await mw(req, res, () => dispatch(i + 1));
      if (result instanceof Response) {
        return result;
      }
      return null;
    };
    return dispatch(0);
  };
  const wrapWithMiddleware = (cb) => {
    return async (req, res) => {
      try {
        const mwResult = await executeMiddleware(req, res);
        if (mwResult) {
          return mwResult;
        }
        const result = await cb(req, res);
        return wrapResponse(result);
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
          headers: { "Content-Type": "application/json" }
        });
      }
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
    if (typeof routes[path] === "object" && Object.keys(routes[path]).length === 0) {
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
      async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        if (!path.startsWith("/public")) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/login"
            }
          });
        }
        try {
          const fileUrl = join2(CLIENT_DIR, path);
          const file = Bun.file(fileUrl);
          if (!await file.exists()) {
            return new Response("Not Found", { status: 404 });
          }
          return new Response(file);
        } catch (e) {
          console.error("Static middleware error:", e);
          return new Response("Internal Server Error", { status: 500 });
        }
      }
    });
    callback?.();
  };
  return {
    methodDelete,
    methodGet,
    methodPost,
    methodPut,
    methodHtml,
    use,
    listen
  };
};

// src/server/db/db.ts
var dotenv = __toESM(require_main(), 1);
var {SQL } = globalThis.Bun;
dotenv.config();
var db = new SQL(process.env.DATABASE_URL);
var db_default = db;
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
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/stringify.js
var byteToHex = [];
for (let i = 0;i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/.pnpm/uuid@13.0.0/node_modules/uuid/dist-node/v4.js
function _v4(options, buf, offset) {
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0;i < 16; ++i) {
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
// src/server/modules/transactions/contoller.ts
class Transaction {
  async getTransaction(filters) {
    try {
      const rows = await db_default`
        SELECT t.*, c.name AS category_name, c.type AS type
        FROM transactions t
        LEFT JOIN categories c ON c.id = t.category_id
        ORDER BY t.date DESC
      `;
      let result = [...rows];
      if (filters?.year) {
        const y = Number(filters.year);
        result = result.filter((t) => new Date(t.date).getFullYear() === y);
      }
      if (filters?.month) {
        const m = Number(filters.month);
        result = result.filter((t) => new Date(t.date).getMonth() + 1 === m);
      }
      if (filters?.categories?.length) {
        result = result.filter((t) => filters.categories.includes(t.category_id));
      }
      return result;
    } catch (error) {
      throw new AppError(error.message || "Failed to fetch transactions");
    }
  }
  async getTransactionYears() {
    try {
      const rows = await db_default`
        SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS year
        FROM transactions
        ORDER BY year DESC
      `;
      return rows.map((r) => r.year);
    } catch (error) {
      throw new AppError(error.message || "Failed to fetch years");
    }
  }
  async createTransaction(data) {
    if (!data) {
      throw new BadRequestError("Transaction data is required");
    }
    const newTransaction = {
      id: v4_default(),
      ...data
    };
    try {
      const transaction = await db_default`INSERT INTO transactions (id, category_id, amount, date, note) VALUES (${newTransaction.id}, ${newTransaction.categoryId}, ${newTransaction.amount}, ${newTransaction.date}, ${newTransaction.note})  RETURNING *`;
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
      const existingTransaction = await db_default`SELECT * FROM transactions WHERE id = ${id}`;
      if (!existingTransaction[0]) {
        throw new AppError("Transaction not found");
      }
      const updatedTransaction = {
        ...existingTransaction[0],
        ...data
      };
      const result = await db_default`UPDATE transactions SET category_id = ${updatedTransaction.categoryId}, amount = ${updatedTransaction.amount}, note = ${updatedTransaction.note} WHERE id = ${id} RETURNING *`;
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
    const result = await db_default`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
    if (!result[0]) {
      throw new AppError("Failed to delete transaction");
    }
    return result[0];
  }
}
var transactionController = new Transaction;

// src/server/utils/renderPage.ts
import ejs from "ejs";
import { join as join3 } from "path";
async function renderPage(page, data = {}) {
  const pagePath = join3(CLIENT_DIR, "views/pages", `${page}.ejs`);
  const layoutPath = join3(CLIENT_DIR, "views/layout/layout.ejs");
  const content = await ejs.renderFile(pagePath, data);
  return await ejs.renderFile(layoutPath, { content });
}
async function renderHtmlPart(htmlPath, data = {}) {
  const html = join3(CLIENT_DIR, htmlPath.clientPath, `${htmlPath.name}.ejs`);
  return await ejs.renderFile(html, data);
}

// src/server/modules/category/contoller.ts
class Categories {
  async getAllCategories(type) {
    try {
      if (type) {
        const categories2 = await db_default`SELECT * FROM categories WHERE type = ${type}`;
        return categories2;
      }
      const categories = await db_default`SELECT * FROM categories`;
      return categories;
    } catch (error) {
      throw new AppError(error.message || "Failed to fetch categories");
    }
  }
  async renderOptions(type) {
    const data = await this.getAllCategories(type);
    return await renderHtmlPart({ clientPath: "views/partials/common/", name: "optionsList" }, { data });
  }
  async createCategory(data) {
    const newCategory = {
      id: v4_default(),
      ...data
    };
    try {
      const category = await db_default`INSERT INTO categories (id, name, type) VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.type})  RETURNING *`;
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
      const result = await db_default`DELETE FROM categories WHERE id = ${categoryId} RETURNING *`;
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
      const result = await db_default`UPDATE categories SET name = ${newName} WHERE id = ${categoryId} RETURNING *`;
      if (!result[0]) {
        throw new AppError("Category not found");
      }
      return result[0];
    } catch (error) {
      throw new AppError(error.message || "Failed to update category");
    }
  }
}
var categoryController = new Categories;

// src/server/modules/transactions/routes.ts
var initTransactionsRoutes = (app) => {
  app.methodHtml("/api/renderTransactions", async (req) => {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const categories = url.searchParams.getAll("categories");
    const filters = { year, month, categories };
    const [data, years, allCategories] = await Promise.all([
      transactionController.getTransaction(filters),
      transactionController.getTransactionYears(),
      categoryController.getAllCategories()
    ]);
    return renderHtmlPart({ clientPath: "views/partials/transaction/", name: "transactionsList" }, { data, filters, years, allCategories });
  });
  app.methodGet("/transaction", transactionController.getTransaction);
  app.methodPost("/api/transaction", async (req) => {
    const newTransaction = await req.json();
    const result = await transactionController.createTransaction(newTransaction);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated"
      }
    });
  });
  app.methodDelete("/api/transaction/:id", async (req) => {
    const { id } = req.params;
    const result = await transactionController.deleteTransaction(id);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "transactionCreated"
      }
    });
  });
  app.methodPut("/api/transaction/:id", async (req) => {
    const { id } = req.params;
    const updateData = await req.json();
    return transactionController.updateTransaction(updateData, id);
  });
};

// src/server/modules/users/controller.ts
class Users {
  async createUser(name) {
    try {
      const newUser = await db_default`INSERT INTO users (name) VALUES (${name}) RETURNING *`;
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
}
var userController = new Users;

// src/server/modules/users/routes.ts
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

// src/server/modules/category/routes.ts
var initCategoryRoutes = (app) => {
  app.methodGet("/api/category", async () => {
    return categoryController.getAllCategories();
  });
  app.methodHtml("/api/renderOptions", (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    return categoryController.renderOptions(type);
  });
  app.methodHtml("/api/renderCategoryList", async (req) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const data = await categoryController.getAllCategories(type);
    return renderHtmlPart({ clientPath: "views/partials/category/", name: "categoryList" }, { data });
  });
  app.methodPost("/api/category", async (req) => {
    const result = await req.json();
    const category = await categoryController.createCategory(result);
    return new Response(JSON.stringify(category), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "categoryChanged"
      }
    });
  });
  app.methodDelete("/api/category/:id", async (req) => {
    const { id } = req.params;
    const result = await categoryController.deleteCategory(id);
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "HX-Trigger": "categoryChanged"
      }
    });
  });
  app.methodPut("/api/category/:id", async (req) => {
    const { id } = req.params;
    const { name } = await req.json();
    return categoryController.updateNameCategory(id, name);
  });
};

// src/server/modules/login/controller.ts
class LoginController {
  login(cookies, login, password) {
    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
      cookies.set("auth", process.env.AUTH_COOKIE_KEY || "", {
        httpOnly: true,
        path: "/"
      });
      return new Response(null, {
        headers: {
          "HX-Redirect": "/home"
        }
      });
    } else {
      throw new UnauthorizedError;
    }
  }
}
var loginController = new LoginController;

// src/server/modules/login/routes.ts
var initLoginRoutes = (app) => {
  app.methodPost("/api/login", async (req, res) => {
    const cookies = req.cookies;
    const body = await req.formData();
    const login = body.get("login");
    const password = body.get("password");
    return loginController.login(cookies, login, password);
  });
};

// src/server/utils/isAuth.ts
class Auth {
  isAuth(req) {
    const cookies = req.cookies;
    const key = cookies.get("auth");
    if (key !== process.env.AUTH_COOKIE_KEY) {
      return false;
    }
    return true;
  }
}
var authController = new Auth;

// src/server/middlewares/authMiddleware.ts
var authMiddleware = async (req, res, next) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const isAuth = authController.isAuth(req);
  const isPublicRoute = path === "/login" || path === "/api/login" || path.startsWith("/public");
  if (!isAuth && !isPublicRoute) {
    if (path.startsWith("/api")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login"
      }
    });
  }
  if (isAuth && path === "/login") {
    const isHx = req.headers.get("HX-Request") === "true";
    if (isHx) {
      return new Response(null, {
        status: 200,
        headers: {
          "HX-Redirect": "/home"
        }
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/home"
      }
    });
  }
  return await next?.();
};

// src/server/modules/html/renderHtml.ts
var renderHtml = async (app) => {
  app.methodHtml("/login", () => {
    return renderPage("login");
  });
  app.methodHtml("/home", () => {
    return renderPage("index");
  });
};

// src/server/index.ts
var app = createApp();
app.use(authMiddleware);
initLoginRoutes(app);
initUsersRoutes(app);
initTransactionsRoutes(app);
initCategoryRoutes(app);
renderHtml(app);
app.listen(3000, () => {
  console.log("Server is running on port 3000 on http://localhost:3000");
});
