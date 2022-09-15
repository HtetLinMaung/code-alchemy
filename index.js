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
Object.defineProperty(exports, "__esModule", { value: true });
exports.brewAzureFuncDelete = exports.brewAzureFuncUpdate = exports.brewAzureFuncFindOne = exports.brewAzureFuncFindAll = exports.brewAzureFuncCreate = exports.responseAzureFuncError = void 0;
const types_1 = require("util/types");
const responseAzureFuncError = (context, err) => {
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
const brewAzureFuncCreate = (Model, hooks = {}, connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeCreate: (ctx, req) => { }, afterCreate: (data, ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody }, hooks);
    return (context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
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
            context.res = {
                status: 201,
                body: defaultHooks.beforeResponse({
                    code: 201,
                    message: "Data created successful.",
                    data,
                }),
            };
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    });
};
exports.brewAzureFuncCreate = brewAzureFuncCreate;
const queryToWhere = (query, connector = "sequelize", sequelize = null, searchColumns = []) => {
    let where = null;
    for (const [k, v] of Object.entries(query)) {
        if (k == "search") {
            if (connector == "sequelize" && sequelize) {
                where = {
                    [sequelize.Op.or]: searchColumns.map((column) => ({
                        [column]: {
                            [sequelize.Op.like]: `%${v}%`,
                        },
                    })),
                };
            }
            else if (connector == "mongoose") {
                where = {
                    $text: { $search: v },
                };
            }
        }
        else if (!["page", "perpage"].includes(k)) {
            if (!where) {
                where = {};
            }
            where[k] = v;
        }
    }
    return where;
};
const brewAzureFuncFindAll = (Model, hooks = {}, connector = "sequelize", sequelize = null, searchColumns = []) => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { } }, hooks);
    return (context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            context.log("HTTP trigger function processed a request.");
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            let data = null;
            let total = 0;
            const where = queryToWhere(req.query, connector, sequelize, searchColumns);
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
            context.res = {
                body: defaultHooks.beforeResponse(Object.assign({ code: 200, message: "Data fetched successful.", data,
                    total }, pagination)),
            };
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    });
};
exports.brewAzureFuncFindAll = brewAzureFuncFindAll;
const brewAzureFuncFindOne = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { } }, hooks);
    return (context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            context.log("HTTP trigger function processed a request.");
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            const where = queryToWhere(req.query, connector);
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
            context.res = {
                body: defaultHooks.beforeResponse({
                    code: 200,
                    message: "Data fetched successful.",
                    data,
                }),
            };
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    });
};
exports.brewAzureFuncFindOne = brewAzureFuncFindOne;
const brewAzureFuncUpdate = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { }, beforeUpdate: (data, ctx, req) => { }, afterUpdate: (data, ctx, req) => { } }, hooks);
    return (context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            context.log("HTTP trigger function processed a request.");
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            const where = queryToWhere(req.query, connector);
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
            context.res = {
                body: defaultHooks.beforeResponse({
                    code: 200,
                    message: "Data updated successful.",
                    data,
                }),
            };
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    });
};
exports.brewAzureFuncUpdate = brewAzureFuncUpdate;
const brewAzureFuncDelete = (Model, hooks = {}, message = "Data not found!", connector = "sequelize") => {
    const defaultHooks = Object.assign({ beforeFind: (ctx, req) => { }, beforeResponse: (defaultBody) => defaultBody, beforeQuery: (defaultOptions, ctx, req) => { }, beforeDelete: (data, ctx, req) => { }, afterDelete: (ctx, req) => { } }, hooks);
    return (context, req) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            context.log("HTTP trigger function processed a request.");
            if ((0, types_1.isAsyncFunction)(defaultHooks.beforeFind)) {
                yield defaultHooks.beforeFind(context, req);
            }
            else {
                defaultHooks.beforeFind(context, req);
            }
            const where = queryToWhere(req.query, connector);
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
            context.res = {
                body: defaultHooks.beforeResponse({
                    code: 204,
                    message: "Data deleted successful.",
                }),
            };
        }
        catch (err) {
            (0, exports.responseAzureFuncError)(context, err);
        }
    });
};
exports.brewAzureFuncDelete = brewAzureFuncDelete;
