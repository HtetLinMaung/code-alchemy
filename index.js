"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.brewExpressFuncFindOneOrUpdateOrDeleteByParam = exports.brewExpressFuncCreateOrFindAll = exports.brewLambdaFuncDelete = exports.brewExpressFuncDelete = exports.brewAzureFuncDelete = exports.brewLambdaFuncUpdate = exports.brewExpressFuncUpdate = exports.brewAzureFuncUpdate = exports.brewLambdaFuncFindOne = exports.brewExpressFuncFindOne = exports.brewAzureFuncFindOne = exports.brewLambdaFuncFindAll = exports.brewExpressFuncFindAll = exports.brewAzureFuncFindAll = exports.brewCrudLambdaFunc = exports.brewCrudExpressFunc = exports.brewCrudAzureFunc = exports.brewLambdaFuncCreate = exports.brewExpressFuncCreate = exports.brewAzureFuncCreate = exports.brewBlankLambdaFunc = exports.brewBlankAzureFunc = exports.brewBlankExpressFunc = exports.responseLambdaFuncError = exports.responseExpressFuncError = exports.responseAzureFuncError = exports.createLambdaResponse = void 0;
const types_1 = require("util/types");
const is_json_1 = __importDefault(require("./utils/is-json"));
const log_1 = __importDefault(require("./utils/log"));
const query_to_where_1 = __importDefault(require("./utils/query-to-where"));
const createLambdaResponse = (statusCode, body = {}, headers = {}) => {
    return {
        statusCode: statusCode,
        headers: Object.assign({ "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "OPTIONS,POST,GET" }, headers),
        body: JSON.stringify(body),
    };
};
exports.createLambdaResponse = createLambdaResponse;
const responseAzureFuncError = (context, err) => {
    (0, log_1.default)({
        appid: process.env.appid || "code-alchemy",
        name: context.executionContext.functionName || "",
        useragent: err.useragent || "",
        userid: err.userid || "",
        code: 500,
        level: "error",
        message: err.message,
        stack: err.stack,
    });
    console.error(err);
    context.res = {
        status: err.status || 500,
        body: err.body || {
            code: 500,
            message: err.message,
            stack: err.stack,
        },
    };
};
exports.responseAzureFuncError = responseAzureFuncError;
const responseExpressFuncError = (req, res, err) => {
    (0, log_1.default)({
        appid: process.env.appid || "code-alchemy",
        name: req.path || "",
        useragent: err.useragent || "",
        userid: err.userid || "",
        code: 500,
        level: "error",
        message: err.message,
        stack: err.stack,
    });
    console.error(err);
    res.status(err.status || 500).json(err.body || {
        code: 500,
        message: err.message,
        stack: err.stack,
    });
};
exports.responseExpressFuncError = responseExpressFuncError;
const responseLambdaFuncError = (event, err) => {
    (0, log_1.default)({
        appid: process.env.appid || "code-alchemy",
        name: event.path || "",
        useragent: err.useragent || "",
        userid: err.userid || "",
        code: 500,
        level: "error",
        message: err.message,
        stack: err.stack,
    });
    console.error(err);
    return {
        statusCode: err.status || 500,
        body: JSON.stringify(err.body || {
            code: 500,
            message: err.message,
            stack: err.stack,
        }),
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
    };
};
exports.responseLambdaFuncError = responseLambdaFuncError;
const brewBlankExpressFunc = (cb) => {
    return (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if ((0, types_1.isAsyncFunction)(cb) || cb.toString().includes("__awaiter")) {
                yield cb(req, res);
            }
            else {
                cb(req, res);
            }
        }
        catch (err) {
            (0, exports.responseExpressFuncError)(req, res, err);
        }
    });
};
exports.brewBlankExpressFunc = brewBlankExpressFunc;
const brewBlankAzureFunc = (cb) => {
    return ((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if ((0, types_1.isAsyncFunction)(cb) || cb.toString().includes("__awaiter")) {
                yield cb(context, req);
            }
            else {
                cb(context, req);
            }
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    }));
};
exports.brewBlankAzureFunc = brewBlankAzureFunc;
const brewBlankLambdaFunc = (cb) => {
    return (event) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if ((0, types_1.isAsyncFunction)(cb) || cb.toString().includes("__awaiter")) {
                return yield cb(event);
            }
            return cb(event);
        }
        catch (err) {
            return (0, exports.responseLambdaFuncError)(event, err);
        }
    });
};
exports.brewBlankLambdaFunc = brewBlankLambdaFunc;
const brewAzureFuncCreate = (Model, hooks = {}, connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeCreate: (ctx, req) => { }, afterCreate: (data, ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody }, hooks);
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
            yield defaultHooks.beforeCreate(context, req);
        }
        else {
            defaultHooks.beforeCreate(context, req);
        }
        let data = null;
        if (connector == "sequelize") {
            data = yield Model.create(req.body);
        }
        else if (connector == "mongoose") {
            data = new Model(req.body);
            yield data.save();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
            yield defaultHooks.afterCreate(data, context, req);
        }
        else {
            defaultHooks.afterCreate(data, context, req);
        }
        const defaultBody = {
            code: 201,
            message: "Data created successful.",
            data,
        };
        context.res = {
            status: 201,
            body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                : defaultHooks.beforeResponse(defaultBody, context, req),
        };
    }));
};
exports.brewAzureFuncCreate = brewAzureFuncCreate;
const brewExpressFuncCreate = (Model, hooks = {}, connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeCreate: (req, res) => { }, afterCreate: (data, req, res) => { }, beforeResponse: (defaultBody) => defaultBody }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
            yield defaultHooks.beforeCreate(req, res);
        }
        else {
            defaultHooks.beforeCreate(req, res);
        }
        let data = null;
        if (connector == "sequelize") {
            data = yield Model.create(req.body);
        }
        else if (connector == "mongoose") {
            data = new Model(req.body);
            yield data.save();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
            yield defaultHooks.afterCreate(data, req, res);
        }
        else {
            defaultHooks.afterCreate(data, req, res);
        }
        const defaultBody = {
            code: 201,
            message: "Data created successful.",
            data,
        };
        res
            .status(201)
            .json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res));
    }));
};
exports.brewExpressFuncCreate = brewExpressFuncCreate;
const brewLambdaFuncCreate = (Model, hooks = {}, connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeCreate: (event) => { }, afterCreate: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody }, hooks);
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
            yield defaultHooks.beforeCreate(event);
        }
        else {
            defaultHooks.beforeCreate(event);
        }
        let data = null;
        if (connector == "sequelize") {
            data = yield Model.create(JSON.parse(event.body));
        }
        else if (connector == "mongoose") {
            data = new Model(JSON.parse(event.body));
            yield data.save();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
            yield defaultHooks.afterCreate(data, event);
        }
        else {
            defaultHooks.afterCreate(data, event);
        }
        const defaultBody = {
            code: 201,
            message: "Data created successful.",
            data,
        };
        return (0, exports.createLambdaResponse)(201, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event));
    }));
};
exports.brewLambdaFuncCreate = brewLambdaFuncCreate;
const brewCrudAzureFunc = (map, connector = "sequelize", sequelize = null, matchKey = "model") => {
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if (!(context.bindingData[matchKey] in map)) {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
        const modelOptions = map[context.bindingData[matchKey]];
        const defaultHooks = Object.assign({ afterFunctionStart: (ctx, req) => { }, beforeCreate: (ctx, req) => { }, beforeFind: (ctx, req) => { }, beforeQuery: (defaultOptions, ctx, req) => { }, afterCreate: (data, ctx, req) => { }, beforeUpdate: (data, ctx, req) => { }, afterUpdate: (data, ctx, req) => { }, beforeDelete: (data, ctx, req) => { }, afterDelete: (ctx, req) => { }, beforeResponse: (defaultBody, ctx, req) => defaultBody }, (modelOptions.hooks || {}));
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterFunctionStart)) {
            yield defaultHooks.afterFunctionStart(context, req);
        }
        else {
            defaultHooks.afterFunctionStart(context, req);
        }
        const Model = modelOptions.model;
        const method = req.method.toLowerCase();
        if (method == "post") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
                yield defaultHooks.beforeCreate(context, req);
            }
            else {
                defaultHooks.beforeCreate(context, req);
            }
            let data = null;
            if (connector == "sequelize") {
                data = yield Model.create(req.body);
            }
            else if (connector == "mongoose") {
                data = new Model(req.body);
                yield data.save();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
                yield defaultHooks.afterCreate(data, context, req);
            }
            else {
                defaultHooks.afterCreate(data, context, req);
            }
            let defaultBody = {
                code: 201,
                message: "Data created successful.",
                data,
            };
            context.res = {
                status: 201,
                body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                    : defaultHooks.beforeResponse(defaultBody, context, req),
            };
        }
        else if (method == "get") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            if (!("page" in req.query) &&
                !("perpage" in req.query) &&
                !("search" in req.query)) {
                let where = (0, query_to_where_1.default)(req.query, connector);
                let data = null;
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, context, req);
                }
                else {
                    defaultHooks.beforeQuery(options, context, req);
                }
                let cursor = null;
                if (connector == "mongoose") {
                    if ("projection" in req.query && req.query.projection) {
                        cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection);
                    }
                    else {
                        cursor = Model.findOne(options);
                    }
                    if ("sort" in req.query && req.query.sort) {
                        cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort);
                    }
                }
                else {
                    if ("projection" in req.query && req.query.projection) {
                        options["attributes"] = (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection;
                    }
                    if ("sort" in req.query && req.query.sort) {
                        options["order"] = (0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort;
                    }
                    cursor = Model.findOne(options);
                }
                data = yield cursor;
                if (!data) {
                    const message = modelOptions.message || "Data not found!";
                    const error = new Error(message);
                    error.body = {
                        code: 404,
                        message,
                    };
                    throw error;
                }
                const defaultBody = {
                    code: 200,
                    message: "Data fetched successful.",
                    data,
                };
                context.res = {
                    body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                        ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                        : defaultHooks.beforeResponse(defaultBody, context, req),
                };
            }
            else {
                let data = null;
                let total = 0;
                let where = (0, query_to_where_1.default)(req.query, connector, sequelize, modelOptions.searchColumns || []);
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, context, req);
                }
                else {
                    defaultHooks.beforeQuery(options, context, req);
                }
                let pagination = {};
                if ("page" in req.query && "perpage" in req.query) {
                    const page = parseInt(req.query.page);
                    const perpage = parseInt(req.query.perpage);
                    const offset = (page - 1) * perpage;
                    if (connector == "sequelize") {
                        options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                        if ("projection" in req.query && req.query.projection) {
                            options["attributes"] = (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection;
                        }
                        if ("sort" in req.query && req.query.sort) {
                            options["order"] = (0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort;
                        }
                        if ("group" in req.query && req.query.group) {
                            options["group"] = (0, is_json_1.default)(req.query.group)
                                ? JSON.parse(req.query.group)
                                : req.query.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in req.query && req.query.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in req.query && req.query.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort);
                        }
                        data = yield cursor.skip(offset).limit(perpage);
                        total = yield Model.countDocuments(options);
                    }
                    pagination = {
                        page,
                        perpage,
                        pagecounts: Math.ceil(total / perpage),
                    };
                }
                else {
                    if (connector == "sequelize") {
                        if ("projection" in req.query && req.query.projection) {
                            options["attributes"] = (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection;
                        }
                        if ("sort" in req.query && req.query.sort) {
                            options["order"] = (0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort;
                        }
                        if ("group" in req.query && req.query.group) {
                            options["group"] = (0, is_json_1.default)(req.query.group)
                                ? JSON.parse(req.query.group)
                                : req.query.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in req.query && req.query.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in req.query && req.query.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort);
                        }
                        data = yield cursor;
                        total = data.length;
                    }
                }
                const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
                    total }, pagination);
                context.res = {
                    body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                        ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                        : defaultHooks.beforeResponse(defaultBody, context, req),
                };
            }
        }
        else if (method == "put") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            let where = (0, query_to_where_1.default)(req.query, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, context, req);
            }
            else {
                defaultHooks.beforeQuery(options, context, req);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
                }
            }
            else {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
                yield defaultHooks.beforeUpdate(data, context, req);
            }
            else {
                defaultHooks.beforeUpdate(data, context, req);
            }
            for (const [k, v] of Object.entries(req.body)) {
                data[k] = v;
            }
            yield data.save();
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
                yield defaultHooks.afterUpdate(data, context, req);
            }
            else {
                defaultHooks.afterUpdate(data, context, req);
            }
            const defaultBody = {
                code: 200,
                message: "Data updated successful.",
                data,
            };
            context.res = {
                body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                    : defaultHooks.beforeResponse(defaultBody, context, req),
            };
        }
        else if (method == "delete") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            let where = (0, query_to_where_1.default)(req.query, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, context, req);
            }
            else {
                defaultHooks.beforeQuery(options, context, req);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
                }
            }
            else {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
                yield defaultHooks.beforeDelete(data, context, req);
            }
            else {
                defaultHooks.beforeDelete(data, context, req);
            }
            if (connector == "sequelize") {
                yield data.destroy();
            }
            else if (connector == "mongoose") {
                yield data.remove();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
                yield defaultHooks.afterDelete(context, req);
            }
            else {
                defaultHooks.afterDelete(context, req);
            }
            const defaultBody = {
                code: 204,
                message: "Data deleted successful.",
            };
            context.res = {
                body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                    : defaultHooks.beforeResponse(defaultBody, context, req),
            };
        }
        else {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
    }));
};
exports.brewCrudAzureFunc = brewCrudAzureFunc;
const brewCrudExpressFunc = (map, connector = "sequelize", sequelize = null, matchKey = "model") => {
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(req.params[matchKey] in map)) {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
        const modelOptions = map[req.params[matchKey]];
        const defaultHooks = Object.assign({ afterFunctionStart: (req, res) => { }, beforeCreate: (req, res) => { }, beforeFind: (req, res) => { }, beforeQuery: (defaultOptions, req, res) => { }, afterCreate: (data, req, res) => { }, beforeUpdate: (data, req, res) => { }, afterUpdate: (data, req, res) => { }, beforeDelete: (data, req, res) => { }, afterDelete: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody }, (modelOptions.hooks || {}));
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterFunctionStart)) {
            yield defaultHooks.afterFunctionStart(req, res);
        }
        else {
            defaultHooks.afterFunctionStart(req, res);
        }
        const Model = modelOptions.model;
        const method = req.method.toLowerCase();
        if (method == "post") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
                yield defaultHooks.beforeCreate(req, res);
            }
            else {
                defaultHooks.beforeCreate(req, res);
            }
            let data = null;
            if (connector == "sequelize") {
                data = yield Model.create(req.body);
            }
            else if (connector == "mongoose") {
                data = new Model(req.body);
                yield data.save();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
                yield defaultHooks.afterCreate(data, req, res);
            }
            else {
                defaultHooks.afterCreate(data, req, res);
            }
            let defaultBody = {
                code: 201,
                message: "Data created successful.",
                data,
            };
            res
                .status(201)
                .json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else if (method == "get") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(req, res);
            }
            else {
                defaultHooks.beforeFind(req, res);
            }
            if (!("page" in req.query) &&
                !("perpage" in req.query) &&
                !("search" in req.query)) {
                let where = (0, query_to_where_1.default)(req.query, connector);
                let data = null;
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, req, res);
                }
                else {
                    defaultHooks.beforeQuery(options, req, res);
                }
                let cursor = null;
                if (connector == "mongoose") {
                    if ("projection" in req.query && req.query.projection) {
                        cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection);
                    }
                    else {
                        cursor = Model.findOne(options);
                    }
                    if ("sort" in req.query && req.query.sort) {
                        cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort);
                    }
                }
                else {
                    if ("projection" in req.query && req.query.projection) {
                        options["attributes"] = (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection;
                    }
                    if ("sort" in req.query && req.query.sort) {
                        options["order"] = (0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort;
                    }
                    cursor = Model.findOne(options);
                }
                if (!data) {
                    const message = modelOptions.message || "Data not found!";
                    const error = new Error(message);
                    error.body = {
                        code: 404,
                        message,
                    };
                    throw error;
                }
                const defaultBody = {
                    code: 200,
                    message: "Data fetched successful.",
                    data,
                };
                res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                    : defaultHooks.beforeResponse(defaultBody, req, res));
            }
            else {
                let data = null;
                let total = 0;
                let where = (0, query_to_where_1.default)(req.query, connector, sequelize, modelOptions.searchColumns || []);
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, req, res);
                }
                else {
                    defaultHooks.beforeQuery(options, req, res);
                }
                let pagination = {};
                if ("page" in req.query && "perpage" in req.query) {
                    const page = parseInt(req.query.page);
                    const perpage = parseInt(req.query.perpage);
                    const offset = (page - 1) * perpage;
                    if (connector == "sequelize") {
                        options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                        if ("projection" in req.query && req.query.projection) {
                            options["attributes"] = (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection;
                        }
                        if ("sort" in req.query && req.query.sort) {
                            options["order"] = (0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort;
                        }
                        if ("group" in req.query && req.query.group) {
                            options["group"] = (0, is_json_1.default)(req.query.group)
                                ? JSON.parse(req.query.group)
                                : req.query.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in req.query && req.query.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in req.query && req.query.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort);
                        }
                        data = yield cursor.skip(offset).limit(perpage);
                        total = yield Model.countDocuments(options);
                    }
                    pagination = {
                        page,
                        perpage,
                        pagecounts: Math.ceil(total / perpage),
                    };
                }
                else {
                    if (connector == "sequelize") {
                        if ("projection" in req.query && req.query.projection) {
                            options["attributes"] = (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection;
                        }
                        if ("sort" in req.query && req.query.sort) {
                            options["order"] = (0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort;
                        }
                        if ("group" in req.query && req.query.group) {
                            options["group"] = (0, is_json_1.default)(req.query.group)
                                ? JSON.parse(req.query.group)
                                : req.query.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in req.query && req.query.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                                ? JSON.parse(req.query.projection)
                                : req.query.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in req.query && req.query.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                                ? JSON.parse(req.query.sort)
                                : req.query.sort);
                        }
                        data = yield cursor;
                        total = data.length;
                    }
                }
                const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
                    total }, pagination);
                res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                    : defaultHooks.beforeResponse(defaultBody, req, res));
            }
        }
        else if (method == "put") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(req, res);
            }
            else {
                defaultHooks.beforeFind(req, res);
            }
            let where = (0, query_to_where_1.default)(req.query, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, req, res);
            }
            else {
                defaultHooks.beforeQuery(options, req, res);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort);
                }
            }
            else {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
                yield defaultHooks.beforeUpdate(data, req, res);
            }
            else {
                defaultHooks.beforeUpdate(data, req, res);
            }
            for (const [k, v] of Object.entries(req.body)) {
                data[k] = v;
            }
            yield data.save();
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
                yield defaultHooks.afterUpdate(data, req, res);
            }
            else {
                defaultHooks.afterUpdate(data, req, res);
            }
            const defaultBody = {
                code: 200,
                message: "Data updated successful.",
                data,
            };
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else if (method == "delete") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(req, res);
            }
            else {
                defaultHooks.beforeFind(req, res);
            }
            let where = (0, query_to_where_1.default)(req.query, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, req, res);
            }
            else {
                defaultHooks.beforeQuery(options, req, res);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort);
                }
            }
            else {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
                yield defaultHooks.beforeDelete(data, req, res);
            }
            else {
                defaultHooks.beforeDelete(data, req, res);
            }
            if (connector == "sequelize") {
                yield data.destroy();
            }
            else if (connector == "mongoose") {
                yield data.remove();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
                yield defaultHooks.afterDelete(req, res);
            }
            else {
                defaultHooks.afterDelete(req, res);
            }
            const defaultBody = {
                code: 204,
                message: "Data deleted successful.",
            };
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
    }));
};
exports.brewCrudExpressFunc = brewCrudExpressFunc;
const brewCrudLambdaFunc = (map, connector = "sequelize", sequelize = null, matchKey = "model") => {
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if (!(event.pathParameters[matchKey] in map)) {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
        const modelOptions = map[event.pathParameters[matchKey]];
        const defaultHooks = Object.assign({ afterFunctionStart: (event) => { }, beforeCreate: (event) => { }, beforeFind: (event) => { }, beforeQuery: (defaultOptions, event) => { }, afterCreate: (data, event) => { }, beforeUpdate: (data, event) => { }, afterUpdate: (data, event) => { }, beforeDelete: (data, event) => { }, afterDelete: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody }, (modelOptions.hooks || {}));
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterFunctionStart)) {
            yield defaultHooks.afterFunctionStart(event);
        }
        else {
            defaultHooks.afterFunctionStart(event);
        }
        const Model = modelOptions.model;
        const method = event.httpMethod.toLowerCase();
        if (method == "post") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
                yield defaultHooks.beforeCreate(event);
            }
            else {
                defaultHooks.beforeCreate(event);
            }
            let data = null;
            if (connector == "sequelize") {
                data = yield Model.create(JSON.parse(event.body));
            }
            else if (connector == "mongoose") {
                data = new Model(JSON.parse(event.body));
                yield data.save();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
                yield defaultHooks.afterCreate(data, event);
            }
            else {
                defaultHooks.afterCreate(data, event);
            }
            let defaultBody = {
                code: 201,
                message: "Data created successful.",
                data,
            };
            return (0, exports.createLambdaResponse)(201, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, event)
                : defaultHooks.beforeResponse(defaultBody, event));
        }
        else if (method == "get") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(event);
            }
            else {
                defaultHooks.beforeFind(event);
            }
            if (!("page" in event.queryStringParameters) &&
                !("perpage" in event.queryStringParameters) &&
                !("search" in event.queryStringParameters)) {
                let where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
                let data = null;
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, event);
                }
                else {
                    defaultHooks.beforeQuery(options, event);
                }
                let cursor = null;
                if (connector == "mongoose") {
                    if ("projection" in event.queryStringParameters &&
                        event.queryStringParameters.projection) {
                        cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                            ? JSON.parse(event.queryStringParameters.projection)
                            : event.queryStringParameters.projection);
                    }
                    else {
                        cursor = Model.findOne(options);
                    }
                    if ("sort" in event.queryStringParameters &&
                        event.queryStringParameters.sort) {
                        cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                            ? JSON.parse(event.queryStringParameters.sort)
                            : event.queryStringParameters.sort);
                    }
                }
                else {
                    if ("projection" in event.queryStringParameters &&
                        event.queryStringParameters.projection) {
                        options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                            ? JSON.parse(event.queryStringParameters.projection)
                            : event.queryStringParameters.projection;
                    }
                    if ("sort" in event.queryStringParameters &&
                        event.queryStringParameters.sort) {
                        options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                            ? JSON.parse(event.queryStringParameters.sort)
                            : event.queryStringParameters.sort;
                    }
                    cursor = Model.findOne(options);
                }
                if (!data) {
                    const message = modelOptions.message || "Data not found!";
                    const error = new Error(message);
                    error.body = {
                        code: 404,
                        message,
                    };
                    throw error;
                }
                const defaultBody = {
                    code: 200,
                    message: "Data fetched successful.",
                    data,
                };
                return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, event)
                    : defaultHooks.beforeResponse(defaultBody, event));
            }
            else {
                let data = null;
                let total = 0;
                let where = (0, query_to_where_1.default)(event.queryStringParameters, connector, sequelize, modelOptions.searchColumns || []);
                let options = null;
                if (connector == "sequelize") {
                    options = {
                        where,
                    };
                }
                else if (connector == "mongoose") {
                    options = where;
                }
                if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                    yield defaultHooks.beforeQuery(options, event);
                }
                else {
                    defaultHooks.beforeQuery(options, event);
                }
                let pagination = {};
                if ("page" in event.queryStringParameters &&
                    "perpage" in event.queryStringParameters) {
                    const page = parseInt(event.queryStringParameters.page);
                    const perpage = parseInt(event.queryStringParameters.perpage);
                    const offset = (page - 1) * perpage;
                    if (connector == "sequelize") {
                        options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                        if ("projection" in event.queryStringParameters &&
                            event.queryStringParameters.projection) {
                            options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                                ? JSON.parse(event.queryStringParameters.projection)
                                : event.queryStringParameters.projection;
                        }
                        if ("sort" in event.queryStringParameters &&
                            event.queryStringParameters.sort) {
                            options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                                ? JSON.parse(event.queryStringParameters.sort)
                                : event.queryStringParameters.sort;
                        }
                        if ("group" in event.queryStringParameters &&
                            event.queryStringParameters.group) {
                            options["group"] = (0, is_json_1.default)(event.queryStringParameters.group)
                                ? JSON.parse(event.queryStringParameters.group)
                                : event.queryStringParameters.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in event.queryStringParameters &&
                            event.queryStringParameters.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                                ? JSON.parse(event.queryStringParameters.projection)
                                : event.queryStringParameters.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in event.queryStringParameters &&
                            event.queryStringParameters.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                                ? JSON.parse(event.queryStringParameters.sort)
                                : event.queryStringParameters.sort);
                        }
                        data = yield cursor.skip(offset).limit(perpage);
                        total = yield Model.countDocuments(options);
                    }
                    pagination = {
                        page,
                        perpage,
                        pagecounts: Math.ceil(total / perpage),
                    };
                }
                else {
                    if (connector == "sequelize") {
                        if ("projection" in event.queryStringParameters &&
                            event.queryStringParameters.projection) {
                            options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                                ? JSON.parse(event.queryStringParameters.projection)
                                : event.queryStringParameters.projection;
                        }
                        if ("sort" in event.queryStringParameters &&
                            event.queryStringParameters.sort) {
                            options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                                ? JSON.parse(event.queryStringParameters.sort)
                                : event.queryStringParameters.sort;
                        }
                        if ("group" in event.queryStringParameters &&
                            event.queryStringParameters.group) {
                            options["group"] = (0, is_json_1.default)(event.queryStringParameters.group)
                                ? JSON.parse(event.queryStringParameters.group)
                                : event.queryStringParameters.group;
                        }
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        let cursor = null;
                        if ("projection" in event.queryStringParameters &&
                            event.queryStringParameters.projection) {
                            cursor = Model.find(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                                ? JSON.parse(event.queryStringParameters.projection)
                                : event.queryStringParameters.projection);
                        }
                        else {
                            cursor = Model.find(options);
                        }
                        if ("sort" in event.queryStringParameters &&
                            event.queryStringParameters.sort) {
                            cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                                ? JSON.parse(event.queryStringParameters.sort)
                                : event.queryStringParameters.sort);
                        }
                        data = yield cursor;
                        total = data.length;
                    }
                }
                const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
                    total }, pagination);
                return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                    ? yield defaultHooks.beforeResponse(defaultBody, event)
                    : defaultHooks.beforeResponse(defaultBody, event));
            }
        }
        else if (method == "put") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(event);
            }
            else {
                defaultHooks.beforeFind(event);
            }
            let where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, event);
            }
            else {
                defaultHooks.beforeQuery(options, event);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort);
                }
            }
            else {
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection;
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
                yield defaultHooks.beforeUpdate(data, event);
            }
            else {
                defaultHooks.beforeUpdate(data, event);
            }
            for (const [k, v] of Object.entries(JSON.parse(event.body))) {
                data[k] = v;
            }
            yield data.save();
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
                yield defaultHooks.afterUpdate(data, event);
            }
            else {
                defaultHooks.afterUpdate(data, event);
            }
            const defaultBody = {
                code: 200,
                message: "Data updated successful.",
                data,
            };
            return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, event)
                : defaultHooks.beforeResponse(defaultBody, event));
        }
        else if (method == "delete") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(event);
            }
            else {
                defaultHooks.beforeFind(event);
            }
            let where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
            let data = null;
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, event);
            }
            else {
                defaultHooks.beforeQuery(options, event);
            }
            let cursor = null;
            if (connector == "mongoose") {
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection);
                }
                else {
                    cursor = Model.findOne(options);
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort);
                }
            }
            else {
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection;
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort;
                }
                cursor = Model.findOne(options);
            }
            data = yield cursor;
            if (!data) {
                const message = modelOptions.message || "Data not found!";
                const error = new Error(message);
                error.body = {
                    code: 404,
                    message,
                };
                throw error;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
                yield defaultHooks.beforeDelete(data, event);
            }
            else {
                defaultHooks.beforeDelete(data, event);
            }
            if (connector == "sequelize") {
                yield data.destroy();
            }
            else if (connector == "mongoose") {
                yield data.remove();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
                yield defaultHooks.afterDelete(event);
            }
            else {
                defaultHooks.afterDelete(event);
            }
            const defaultBody = {
                code: 204,
                message: "Data deleted successful.",
            };
            return (0, exports.createLambdaResponse)(204, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, event)
                : defaultHooks.beforeResponse(defaultBody, event));
        }
        else {
            const err = new Error("Url not found!");
            err.status = 404;
            err.body = {
                code: 404,
                message: err.message,
            };
            throw err;
        }
    }));
};
exports.brewCrudLambdaFunc = brewCrudLambdaFunc;
const brewAzureFuncFindAll = (Model, hooks = {}, connector = "sequelize", sequelize = null, searchColumns = []) => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody, ctx, req) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { } }, hooks);
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(context, req);
        }
        else {
            defaultHooks.beforeFind(context, req);
        }
        let data = null;
        let total = 0;
        const where = (0, query_to_where_1.default)(req.query, connector, sequelize, searchColumns);
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, context, req);
        }
        else {
            defaultHooks.beforeQuery(options, context, req);
        }
        let pagination = {};
        if ("page" in req.query && "perpage" in req.query) {
            const page = parseInt(req.query.page);
            const perpage = parseInt(req.query.perpage);
            const offset = (page - 1) * perpage;
            if (connector == "sequelize") {
                options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                if ("group" in req.query && req.query.group) {
                    options["group"] = (0, is_json_1.default)(req.query.group)
                        ? JSON.parse(req.query.group)
                        : req.query.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
                }
                data = yield cursor.skip(offset).limit(perpage);
                total = yield Model.countDocuments(options);
            }
            pagination = {
                page,
                perpage,
                pagecounts: Math.ceil(total / perpage),
            };
        }
        else {
            if (connector == "sequelize") {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                if ("group" in req.query && req.query.group) {
                    options["group"] = (0, is_json_1.default)(req.query.group)
                        ? JSON.parse(req.query.group)
                        : req.query.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
                }
                data = yield cursor;
                total = data.length;
            }
        }
        const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
            total }, pagination);
        context.res = {
            body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                : defaultHooks.beforeResponse(defaultBody, context, req),
        };
    }));
};
exports.brewAzureFuncFindAll = brewAzureFuncFindAll;
const brewExpressFuncFindAll = (Model, hooks = {}, connector = "sequelize", sequelize = null, searchColumns = []) => {
    const defaultHooks = Object.assign({ beforeFind: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody, beforeQuery: (defaultOptions, req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(req, res);
        }
        else {
            defaultHooks.beforeFind(req, res);
        }
        let data = null;
        let total = 0;
        const where = (0, query_to_where_1.default)(req.query, connector, sequelize, searchColumns);
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, req, res);
        }
        else {
            defaultHooks.beforeQuery(options, req, res);
        }
        let pagination = {};
        if ("page" in req.query && "perpage" in req.query) {
            const page = parseInt(req.query.page);
            const perpage = parseInt(req.query.perpage);
            const offset = (page - 1) * perpage;
            if (connector == "sequelize") {
                options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                if ("group" in req.query && req.query.group) {
                    options["group"] = (0, is_json_1.default)(req.query.group)
                        ? JSON.parse(req.query.group)
                        : req.query.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort);
                }
                data = yield cursor.skip(offset).limit(perpage);
                total = yield Model.countDocuments(options);
            }
            pagination = {
                page,
                perpage,
                pagecounts: Math.ceil(total / perpage),
            };
        }
        else {
            if (connector == "sequelize") {
                if ("projection" in req.query && req.query.projection) {
                    options["attributes"] = (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection;
                }
                if ("sort" in req.query && req.query.sort) {
                    options["order"] = (0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort;
                }
                if ("group" in req.query && req.query.group) {
                    options["group"] = (0, is_json_1.default)(req.query.group)
                        ? JSON.parse(req.query.group)
                        : req.query.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in req.query && req.query.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                        ? JSON.parse(req.query.projection)
                        : req.query.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in req.query && req.query.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                        ? JSON.parse(req.query.sort)
                        : req.query.sort);
                }
                data = yield cursor;
                total = data.length;
            }
        }
        const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
            total }, pagination);
        res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res));
    }));
};
exports.brewExpressFuncFindAll = brewExpressFuncFindAll;
const brewLambdaFuncFindAll = (Model, hooks = {}, connector = "sequelize", sequelize = null, searchColumns = []) => {
    const defaultHooks = Object.assign({ beforeFind: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody, beforeQuery: (defaultOptions, event) => { } }, hooks);
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(event);
        }
        else {
            defaultHooks.beforeFind(event);
        }
        let data = null;
        let total = 0;
        const where = (0, query_to_where_1.default)(event.queryStringParameters, connector, sequelize, searchColumns);
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, event);
        }
        else {
            defaultHooks.beforeQuery(options, event);
        }
        let pagination = {};
        if ("page" in event.queryStringParameters &&
            "perpage" in event.queryStringParameters) {
            const page = parseInt(event.queryStringParameters.page);
            const perpage = parseInt(event.queryStringParameters.perpage);
            const offset = (page - 1) * perpage;
            if (connector == "sequelize") {
                options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection;
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort;
                }
                if ("group" in event.queryStringParameters &&
                    event.queryStringParameters.group) {
                    options["group"] = (0, is_json_1.default)(event.queryStringParameters.group)
                        ? JSON.parse(event.queryStringParameters.group)
                        : event.queryStringParameters.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort);
                }
                data = yield cursor.skip(offset).limit(perpage);
                total = yield Model.countDocuments(options);
            }
            pagination = {
                page,
                perpage,
                pagecounts: Math.ceil(total / perpage),
            };
        }
        else {
            if (connector == "sequelize") {
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection;
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort;
                }
                if ("group" in event.queryStringParameters &&
                    event.queryStringParameters.group) {
                    options["group"] = (0, is_json_1.default)(event.queryStringParameters.group)
                        ? JSON.parse(event.queryStringParameters.group)
                        : event.queryStringParameters.group;
                }
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                let cursor = null;
                if ("projection" in event.queryStringParameters &&
                    event.queryStringParameters.projection) {
                    cursor = Model.find(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                        ? JSON.parse(event.queryStringParameters.projection)
                        : event.queryStringParameters.projection);
                }
                else {
                    cursor = Model.find(options);
                }
                if ("sort" in event.queryStringParameters &&
                    event.queryStringParameters.sort) {
                    cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                        ? JSON.parse(event.queryStringParameters.sort)
                        : event.queryStringParameters.sort);
                }
                data = yield cursor;
                total = data.length;
            }
        }
        const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
            total }, pagination);
        return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event));
    }));
};
exports.brewLambdaFuncFindAll = brewLambdaFuncFindAll;
const brewAzureFuncFindOne = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody, ctx, req) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { } }, hooks);
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(context, req);
        }
        else {
            defaultHooks.beforeFind(context, req);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, context, req);
        }
        else {
            defaultHooks.beforeQuery(options, context, req);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        const defaultBody = {
            code: 200,
            message: "Data fetched successful.",
            data,
        };
        context.res = {
            body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                : defaultHooks.beforeResponse(defaultBody, context, req),
        };
    }));
};
exports.brewAzureFuncFindOne = brewAzureFuncFindOne;
const brewExpressFuncFindOne = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody, beforeQuery: (defaultOptions, req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(req, res);
        }
        else {
            defaultHooks.beforeFind(req, res);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, req, res);
        }
        else {
            defaultHooks.beforeQuery(options, req, res);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        const defaultBody = {
            code: 200,
            message: "Data fetched successful.",
            data,
        };
        res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res));
    }));
};
exports.brewExpressFuncFindOne = brewExpressFuncFindOne;
const brewLambdaFuncFindOne = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody, beforeQuery: (defaultOptions, event) => { } }, hooks);
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(event);
        }
        else {
            defaultHooks.beforeFind(event);
        }
        const where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, event);
        }
        else {
            defaultHooks.beforeQuery(options, event);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort);
            }
        }
        else {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection;
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        const defaultBody = {
            code: 200,
            message: "Data fetched successful.",
            data,
        };
        return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event));
    }));
};
exports.brewLambdaFuncFindOne = brewLambdaFuncFindOne;
const brewAzureFuncUpdate = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody, ctx, req) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { }, beforeUpdate: (data, ctx, req) => { }, afterUpdate: (data, ctx, req) => { } }, hooks);
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(context, req);
        }
        else {
            defaultHooks.beforeFind(context, req);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, context, req);
        }
        else {
            defaultHooks.beforeQuery(options, context, req);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
            yield defaultHooks.beforeUpdate(data, context, req);
        }
        else {
            defaultHooks.beforeUpdate(data, context, req);
        }
        for (const [k, v] of Object.entries(req.body)) {
            data[k] = v;
        }
        yield data.save();
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
            yield defaultHooks.afterUpdate(data, context, req);
        }
        else {
            defaultHooks.afterUpdate(data, context, req);
        }
        const defaultBody = {
            code: 200,
            message: "Data updated successful.",
            data,
        };
        context.res = {
            body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                : defaultHooks.beforeResponse(defaultBody, context, req),
        };
    }));
};
exports.brewAzureFuncUpdate = brewAzureFuncUpdate;
const brewExpressFuncUpdate = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody, beforeQuery: (defaultOptions, req, res) => { }, beforeUpdate: (data, req, res) => { }, afterUpdate: (data, req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(req, res);
        }
        else {
            defaultHooks.beforeFind(req, res);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, req, res);
        }
        else {
            defaultHooks.beforeQuery(options, req, res);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
            yield defaultHooks.beforeUpdate(data, req, res);
        }
        else {
            defaultHooks.beforeUpdate(data, req, res);
        }
        for (const [k, v] of Object.entries(req.body)) {
            data[k] = v;
        }
        yield data.save();
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
            yield defaultHooks.afterUpdate(data, req, res);
        }
        else {
            defaultHooks.afterUpdate(data, req, res);
        }
        const defaultBody = {
            code: 200,
            message: "Data updated successful.",
            data,
        };
        res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res));
    }));
};
exports.brewExpressFuncUpdate = brewExpressFuncUpdate;
const brewLambdaFuncUpdate = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody, beforeQuery: (defaultOptions, event) => { }, beforeUpdate: (data, event) => { }, afterUpdate: (data, event) => { } }, hooks);
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(event);
        }
        else {
            defaultHooks.beforeFind(event);
        }
        const where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, event);
        }
        else {
            defaultHooks.beforeQuery(options, event);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort);
            }
        }
        else {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection;
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
            yield defaultHooks.beforeUpdate(data, event);
        }
        else {
            defaultHooks.beforeUpdate(data, event);
        }
        for (const [k, v] of Object.entries(JSON.parse(event.body))) {
            data[k] = v;
        }
        yield data.save();
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
            yield defaultHooks.afterUpdate(data, event);
        }
        else {
            defaultHooks.afterUpdate(data, event);
        }
        const defaultBody = {
            code: 200,
            message: "Data updated successful.",
            data,
        };
        return (0, exports.createLambdaResponse)(200, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event));
    }));
};
exports.brewLambdaFuncUpdate = brewLambdaFuncUpdate;
const brewAzureFuncDelete = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody, ctx, req) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { }, beforeDelete: (data, ctx, req) => { }, afterDelete: (ctx, req) => { } }, hooks);
    return (0, exports.brewBlankAzureFunc)((context, req) => __awaiter(void 0, void 0, void 0, function* () {
        context.log("HTTP trigger function processed a request.");
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(context, req);
        }
        else {
            defaultHooks.beforeFind(context, req);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, context, req);
        }
        else {
            defaultHooks.beforeQuery(options, context, req);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
            yield defaultHooks.beforeDelete(data, context, req);
        }
        else {
            defaultHooks.beforeDelete(data, context, req);
        }
        if (connector == "sequelize") {
            yield data.destroy();
        }
        else if (connector == "mongoose") {
            yield data.remove();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
            yield defaultHooks.afterDelete(context, req);
        }
        else {
            defaultHooks.afterDelete(context, req);
        }
        const defaultBody = {
            code: 204,
            message: "Data deleted successful.",
        };
        context.res = {
            body: (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, context, req)
                : defaultHooks.beforeResponse(defaultBody, context, req),
        };
    }));
};
exports.brewAzureFuncDelete = brewAzureFuncDelete;
const brewExpressFuncDelete = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody, beforeQuery: (defaultOptions, req, res) => { }, beforeDelete: (data, req, res) => { }, afterDelete: (req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(req, res);
        }
        else {
            defaultHooks.beforeFind(req, res);
        }
        const where = (0, query_to_where_1.default)(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, req, res);
        }
        else {
            defaultHooks.beforeQuery(options, req, res);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
            yield defaultHooks.beforeDelete(data, req, res);
        }
        else {
            defaultHooks.beforeDelete(data, req, res);
        }
        if (connector == "sequelize") {
            yield data.destroy();
        }
        else if (connector == "mongoose") {
            yield data.remove();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
            yield defaultHooks.afterDelete(req, res);
        }
        else {
            defaultHooks.afterDelete(req, res);
        }
        const defaultBody = {
            code: 204,
            message: "Data deleted successful.",
        };
        res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res));
    }));
};
exports.brewExpressFuncDelete = brewExpressFuncDelete;
const brewLambdaFuncDelete = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (event) => { }, beforeResponse: (defaultBody, event) => defaultBody, beforeQuery: (defaultOptions, event) => { }, beforeDelete: (data, event) => { }, afterDelete: (event) => { } }, hooks);
    return (0, exports.brewBlankLambdaFunc)((event) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(event);
        }
        else {
            defaultHooks.beforeFind(event);
        }
        const where = (0, query_to_where_1.default)(event.queryStringParameters, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, event);
        }
        else {
            defaultHooks.beforeQuery(options, event);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                cursor = cursor.sort((0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort);
            }
        }
        else {
            if ("projection" in event.queryStringParameters &&
                event.queryStringParameters.projection) {
                options["attributes"] = (0, is_json_1.default)(event.queryStringParameters.projection)
                    ? JSON.parse(event.queryStringParameters.projection)
                    : event.queryStringParameters.projection;
            }
            if ("sort" in event.queryStringParameters &&
                event.queryStringParameters.sort) {
                options["order"] = (0, is_json_1.default)(event.queryStringParameters.sort)
                    ? JSON.parse(event.queryStringParameters.sort)
                    : event.queryStringParameters.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
            yield defaultHooks.beforeDelete(data, event);
        }
        else {
            defaultHooks.beforeDelete(data, event);
        }
        if (connector == "sequelize") {
            yield data.destroy();
        }
        else if (connector == "mongoose") {
            yield data.remove();
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
            yield defaultHooks.afterDelete(event);
        }
        else {
            defaultHooks.afterDelete(event);
        }
        const defaultBody = {
            code: 204,
            message: "Data deleted successful.",
        };
        return (0, exports.createLambdaResponse)(204, (0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
            ? yield defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event));
    }));
};
exports.brewLambdaFuncDelete = brewLambdaFuncDelete;
const brewExpressFuncCreateOrFindAll = (Model, hooks = {}, connector = "sequelize", sequelize = null, searchColumns = []) => {
    const defaultHooks = Object.assign({ beforeCreate: (req, res) => { }, afterCreate: (data, req, res) => { }, beforeResponse: (defaultBody) => defaultBody, beforeFind: (req, res) => { }, beforeQuery: (defaultOptions, req, res) => { }, afterFunctionStart: (req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterFunctionStart)) {
            yield defaultHooks.afterFunctionStart(req, res);
        }
        else {
            defaultHooks.afterFunctionStart(req, res);
        }
        const method = req.method.toLowerCase();
        if (method == "get") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(req, res);
            }
            else {
                defaultHooks.beforeFind(req, res);
            }
            let data = null;
            let total = 0;
            const where = (0, query_to_where_1.default)(req.query, connector, sequelize, searchColumns);
            let options = null;
            if (connector == "sequelize") {
                options = {
                    where,
                };
            }
            else if (connector == "mongoose") {
                options = where;
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
                yield defaultHooks.beforeQuery(options, req, res);
            }
            else {
                defaultHooks.beforeQuery(options, req, res);
            }
            let pagination = {};
            if ("page" in req.query && "perpage" in req.query) {
                const page = parseInt(req.query.page);
                const perpage = parseInt(req.query.perpage);
                const offset = (page - 1) * perpage;
                if (connector == "sequelize") {
                    options = Object.assign(Object.assign({}, options), { limit: perpage, offset });
                    if ("projection" in req.query && req.query.projection) {
                        options["attributes"] = (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection;
                    }
                    if ("sort" in req.query && req.query.sort) {
                        options["order"] = (0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort;
                    }
                    if ("group" in req.query && req.query.group) {
                        options["group"] = (0, is_json_1.default)(req.query.group)
                            ? JSON.parse(req.query.group)
                            : req.query.group;
                    }
                    const { rows, count } = yield Model.findAndCountAll(options);
                    data = rows;
                    total = count;
                }
                else if (connector == "mongoose") {
                    let cursor = null;
                    if ("projection" in req.query && req.query.projection) {
                        cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection);
                    }
                    else {
                        cursor = Model.find(options);
                    }
                    if ("sort" in req.query && req.query.sort) {
                        cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort);
                    }
                    cursor = cursor.skip(offset).limit(perpage);
                    if ("populate" in req.query && req.query.populate) {
                        const populate = (0, is_json_1.default)(req.query.populate)
                            ? JSON.parse(req.query.populate)
                            : req.query.populate;
                        cursor = cursor.populate(populate);
                    }
                    data = yield cursor.exec();
                    total = yield Model.countDocuments(options);
                }
                pagination = {
                    page,
                    perpage,
                    pagecounts: Math.ceil(total / perpage),
                };
            }
            else {
                if (connector == "sequelize") {
                    if ("projection" in req.query && req.query.projection) {
                        options["attributes"] = (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection;
                    }
                    if ("sort" in req.query && req.query.sort) {
                        options["order"] = (0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort;
                    }
                    if ("group" in req.query && req.query.group) {
                        options["group"] = (0, is_json_1.default)(req.query.group)
                            ? JSON.parse(req.query.group)
                            : req.query.group;
                    }
                    const { rows, count } = yield Model.findAndCountAll(options);
                    data = rows;
                    total = count;
                }
                else if (connector == "mongoose") {
                    let cursor = null;
                    if ("projection" in req.query && req.query.projection) {
                        cursor = Model.find(options, (0, is_json_1.default)(req.query.projection)
                            ? JSON.parse(req.query.projection)
                            : req.query.projection);
                    }
                    else {
                        cursor = Model.find(options);
                    }
                    if ("sort" in req.query && req.query.sort) {
                        cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                            ? JSON.parse(req.query.sort)
                            : req.query.sort);
                    }
                    data = yield cursor;
                    total = data.length;
                }
            }
            const defaultBody = Object.assign({ code: 200, message: "Data fetched successful.", data,
                total }, pagination);
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else if (method == "post") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeCreate)) {
                yield defaultHooks.beforeCreate(req, res);
            }
            else {
                defaultHooks.beforeCreate(req, res);
            }
            let data = null;
            if (connector == "sequelize") {
                data = yield Model.create(req.body);
            }
            else if (connector == "mongoose") {
                data = new Model(req.body);
                yield data.save();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterCreate)) {
                yield defaultHooks.afterCreate(data, req, res);
            }
            else {
                defaultHooks.afterCreate(data, req, res);
            }
            const defaultBody = {
                code: 201,
                message: "Data created successful.",
                data,
            };
            res
                .status(201)
                .json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
    }));
};
exports.brewExpressFuncCreateOrFindAll = brewExpressFuncCreateOrFindAll;
const brewExpressFuncFindOneOrUpdateOrDeleteByParam = (Model, hooks = {}, message = "Data not found!", paramKey = "", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (req, res) => { }, beforeResponse: (defaultBody, req, res) => defaultBody, beforeQuery: (defaultOptions, req, res) => { }, beforeUpdate: (data, req, res) => { }, afterUpdate: (data, req, res) => { }, beforeDelete: (data, req, res) => { }, afterDelete: (req, res) => { }, afterFunctionStart: (req, res) => { } }, hooks);
    return (0, exports.brewBlankExpressFunc)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if ((0, types_1.isAsyncFunction)(defaultHooks.afterFunctionStart)) {
            yield defaultHooks.afterFunctionStart(req, res);
        }
        else {
            defaultHooks.afterFunctionStart(req, res);
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
            yield defaultHooks.beforeFind(req, res);
        }
        else {
            defaultHooks.beforeFind(req, res);
        }
        let pk = connector == "sequelize" ? "id" : "_id";
        if (paramKey) {
            pk = paramKey;
        }
        const where = { [pk]: req.params[pk] };
        let data = null;
        let options = null;
        if (connector == "sequelize") {
            options = {
                where,
            };
        }
        else if (connector == "mongoose") {
            options = where;
        }
        if ((0, types_1.isAsyncFunction)(defaultHooks.beforeQuery)) {
            yield defaultHooks.beforeQuery(options, req, res);
        }
        else {
            defaultHooks.beforeQuery(options, req, res);
        }
        let cursor = null;
        if (connector == "mongoose") {
            if ("projection" in req.query && req.query.projection) {
                cursor = Model.findOne(options, (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection);
            }
            else {
                cursor = Model.findOne(options);
            }
            if ("sort" in req.query && req.query.sort) {
                cursor = cursor.sort((0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort);
            }
        }
        else {
            if ("projection" in req.query && req.query.projection) {
                options["attributes"] = (0, is_json_1.default)(req.query.projection)
                    ? JSON.parse(req.query.projection)
                    : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
                options["order"] = (0, is_json_1.default)(req.query.sort)
                    ? JSON.parse(req.query.sort)
                    : req.query.sort;
            }
            cursor = Model.findOne(options);
        }
        data = yield cursor;
        if (!data) {
            const error = new Error(message);
            error.body = {
                code: 404,
                message,
            };
            throw error;
        }
        const method = req.method.toLowerCase();
        if (method == "get") {
            const defaultBody = {
                code: 200,
                message: "Data fetched successful.",
                data,
            };
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else if (method == "put" || method == "patch") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeUpdate)) {
                yield defaultHooks.beforeUpdate(data, req, res);
            }
            else {
                defaultHooks.beforeUpdate(data, req, res);
            }
            for (const [k, v] of Object.entries(req.body)) {
                data[k] = v;
            }
            yield data.save();
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterUpdate)) {
                yield defaultHooks.afterUpdate(data, req, res);
            }
            else {
                defaultHooks.afterUpdate(data, req, res);
            }
            const defaultBody = {
                code: 200,
                message: "Data updated successful.",
                data,
            };
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
        else if (method == "delete") {
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeDelete)) {
                yield defaultHooks.beforeDelete(data, req, res);
            }
            else {
                defaultHooks.beforeDelete(data, req, res);
            }
            if (connector == "sequelize") {
                yield data.destroy();
            }
            else if (connector == "mongoose") {
                yield data.remove();
            }
            if ((0, types_1.isAsyncFunction)(defaultHooks.afterDelete)) {
                yield defaultHooks.afterDelete(req, res);
            }
            else {
                defaultHooks.afterDelete(req, res);
            }
            const defaultBody = {
                code: 204,
                message: "Data deleted successful.",
            };
            res.json((0, types_1.isAsyncFunction)(defaultHooks.beforeResponse)
                ? yield defaultHooks.beforeResponse(defaultBody, req, res)
                : defaultHooks.beforeResponse(defaultBody, req, res));
        }
    }));
};
exports.brewExpressFuncFindOneOrUpdateOrDeleteByParam = brewExpressFuncFindOneOrUpdateOrDeleteByParam;
