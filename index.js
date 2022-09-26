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
exports.brewAzureFuncDelete = exports.brewAzureFuncUpdate = exports.brewAzureFuncFindOne = exports.brewAzureFuncFindAll = exports.brewCrudAzureFunc = exports.brewAzureFuncCreate = exports.brewBlankLambdaFunc = exports.brewBlankAzureFunc = exports.brewBlankExpressFunc = exports.responseLambdaFuncError = exports.responseExpressFuncError = exports.responseAzureFuncError = void 0;
const types_1 = require("util/types");
const log_1 = __importDefault(require("./utils/log"));
const query_to_where_1 = __importDefault(require("./utils/query-to-where"));
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
                if ("$project" in options) {
                    const project = options.$project;
                    delete options.$project;
                    data = yield Model.findOne(options, project);
                }
                else {
                    data = yield Model.findOne(options);
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
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        if ("$project" in options) {
                            const project = options.$project;
                            delete options.$project;
                            data = yield Model.find(options, project)
                                .limit(perpage)
                                .skip(offset);
                        }
                        else {
                            data = yield Model.find(options).skip(offset).limit(perpage);
                        }
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
                        const { rows, count } = yield Model.findAndCountAll(options);
                        data = rows;
                        total = count;
                    }
                    else if (connector == "mongoose") {
                        if ("$project" in options) {
                            const project = options.$project;
                            delete options.$project;
                            data = yield Model.find(options, project);
                        }
                        else {
                            data = yield Model.find(options);
                        }
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
            if ("$project" in options) {
                const project = options.$project;
                delete options.$project;
                data = yield Model.findOne(options, project);
            }
            else {
                data = yield Model.findOne(options);
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
            if ("$project" in options) {
                const project = options.$project;
                delete options.$project;
                data = yield Model.findOne(options, project);
            }
            else {
                data = yield Model.findOne(options);
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
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                if ("$project" in options) {
                    const project = options.$project;
                    delete options.$project;
                    data = yield Model.find(options, project).limit(perpage).skip(offset);
                }
                else {
                    data = yield Model.find(options).skip(offset).limit(perpage);
                }
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
                const { rows, count } = yield Model.findAndCountAll(options);
                data = rows;
                total = count;
            }
            else if (connector == "mongoose") {
                if ("$project" in options) {
                    const project = options.$project;
                    delete options.$project;
                    data = yield Model.find(options, project);
                }
                else {
                    data = yield Model.find(options);
                }
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
        if ("$project" in options) {
            const project = options.$project;
            delete options.$project;
            data = yield Model.findOne(options, project);
        }
        else {
            data = yield Model.findOne(options);
        }
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
        if ("$project" in options) {
            const project = options.$project;
            delete options.$project;
            data = yield Model.findOne(options, project);
        }
        else {
            data = yield Model.findOne(options);
        }
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
        if ("$project" in options) {
            const project = options.$project;
            delete options.$project;
            data = yield Model.findOne(options, project);
        }
        else {
            data = yield Model.findOne(options);
        }
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
