import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Request, Response } from "express";
import { isAsyncFunction } from "util/types";
import {
  AzureFuncHooks,
  AzureCreateHooks,
  AzureDeleteHooks,
  DynamicObject,
  AzureFindHooks,
  ParamsMap,
  AzureUpdateHooks,
  ExpressCreateHooks,
  ExpressFuncHooks,
  ExpressFindHooks,
  ExpressUpdateHooks,
  ExpressDeleteHooks,
} from "./interfaces";
import isJson from "./utils/is-json";
import log from "./utils/log";
import queryToWhere from "./utils/query-to-where";

export const responseAzureFuncError = (context: Context, err: any) => {
  log({
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

export const responseExpressFuncError = (
  req: Request,
  res: Response,
  err: any
) => {
  log({
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
  res.status(err.status || 500).json(
    err.body || {
      code: 500,
      message: err.message,
      stack: err.stack,
    }
  );
};

export const responseLambdaFuncError = (
  event: APIGatewayProxyEvent,
  err: any
): APIGatewayProxyResult => {
  log({
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
    body: JSON.stringify(
      err.body || {
        code: 500,
        message: err.message,
        stack: err.stack,
      }
    ),
  };
};

export const brewBlankExpressFunc = (
  cb: (req: Request, res: Response) => void
) => {
  return async (req: Request, res: Response) => {
    try {
      if (isAsyncFunction(cb) || cb.toString().includes("__awaiter")) {
        await cb(req, res);
      } else {
        cb(req, res);
      }
    } catch (err) {
      responseExpressFuncError(req, res, err);
    }
  };
};

export const brewBlankAzureFunc = (
  cb: (ctx: Context, req: HttpRequest) => void
) => {
  return (async (context: Context, req: HttpRequest): Promise<void> => {
    try {
      if (isAsyncFunction(cb) || cb.toString().includes("__awaiter")) {
        await cb(context, req);
      } else {
        cb(context, req);
      }
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  }) as AzureFunction;
};

export const brewBlankLambdaFunc = (
  cb: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    try {
      if (isAsyncFunction(cb) || cb.toString().includes("__awaiter")) {
        return await cb(event);
      }
      return cb(event);
    } catch (err) {
      return responseLambdaFuncError(event, err);
    }
  };
};

export const brewAzureFuncCreate = (
  Model: any,
  hooks: AzureCreateHooks = {},
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: AzureCreateHooks = {
    beforeCreate: (ctx, req) => {},
    afterCreate: (data, ctx, req) => {},
    beforeResponse: (defaultBody) => defaultBody,
    ...hooks,
  };
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (isAsyncFunction(defaultHooks.beforeCreate)) {
      await defaultHooks.beforeCreate(context, req);
    } else {
      defaultHooks.beforeCreate(context, req);
    }
    let data = null;
    if (connector == "sequelize") {
      data = await Model.create(req.body);
    } else if (connector == "mongoose") {
      data = new Model(req.body);
      await data.save();
    }
    if (isAsyncFunction(defaultHooks.afterCreate)) {
      await defaultHooks.afterCreate(data, context, req);
    } else {
      defaultHooks.afterCreate(data, context, req);
    }

    const defaultBody = {
      code: 201,
      message: "Data created successful.",
      data,
    };

    context.res = {
      status: 201,
      body: isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, context, req)
        : defaultHooks.beforeResponse(defaultBody, context, req),
    };
  });
};

export const brewExpressFuncCreate = (
  Model: any,
  hooks: ExpressCreateHooks = {},
  connector = "sequelize"
) => {
  const defaultHooks: ExpressCreateHooks = {
    beforeCreate: (req, res) => {},
    afterCreate: (data, req, res) => {},
    beforeResponse: (defaultBody) => defaultBody,
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.beforeCreate)) {
      await defaultHooks.beforeCreate(req, res);
    } else {
      defaultHooks.beforeCreate(req, res);
    }
    let data = null;
    if (connector == "sequelize") {
      data = await Model.create(req.body);
    } else if (connector == "mongoose") {
      data = new Model(req.body);
      await data.save();
    }
    if (isAsyncFunction(defaultHooks.afterCreate)) {
      await defaultHooks.afterCreate(data, req, res);
    } else {
      defaultHooks.afterCreate(data, req, res);
    }

    const defaultBody = {
      code: 201,
      message: "Data created successful.",
      data,
    };

    res
      .status(201)
      .json(
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, req, res)
          : defaultHooks.beforeResponse(defaultBody, req, res)
      );
  });
};

export const brewCrudAzureFunc = (
  map: ParamsMap,
  connector = "sequelize",
  sequelize = null,
  matchKey: string = "model"
) => {
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (!(context.bindingData[matchKey] in map)) {
      const err: any = new Error("Url not found!");
      err.status = 404;
      err.body = {
        code: 404,
        message: err.message,
      };
      throw err;
    }
    const modelOptions = map[context.bindingData[matchKey]];
    const defaultHooks: AzureFuncHooks = {
      afterFunctionStart: (ctx, req) => {},
      beforeCreate: (ctx, req) => {},
      beforeFind: (ctx, req) => {},
      beforeQuery: (defaultOptions, ctx, req) => {},
      afterCreate: (data, ctx, req) => {},
      beforeUpdate: (data: any, ctx, req) => {},
      afterUpdate: (data: any, ctx, req) => {},
      beforeDelete: (data: any, ctx, req) => {},
      afterDelete: (ctx, req) => {},
      beforeResponse: (defaultBody, ctx, req) => defaultBody,
      ...((modelOptions.hooks || {}) as AzureFuncHooks),
    };

    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(context, req);
    } else {
      defaultHooks.afterFunctionStart(context, req);
    }

    const Model = modelOptions.model;

    const method = req.method.toLowerCase();
    if (method == "post") {
      if (isAsyncFunction(defaultHooks.beforeCreate)) {
        await defaultHooks.beforeCreate(context, req);
      } else {
        defaultHooks.beforeCreate(context, req);
      }
      let data: any = null;
      if (connector == "sequelize") {
        data = await Model.create(req.body);
      } else if (connector == "mongoose") {
        data = new Model(req.body);
        await data.save();
      }
      if (isAsyncFunction(defaultHooks.afterCreate)) {
        await defaultHooks.afterCreate(data, context, req);
      } else {
        defaultHooks.afterCreate(data, context, req);
      }

      let defaultBody: DynamicObject = {
        code: 201,
        message: "Data created successful.",
        data,
      };

      context.res = {
        status: 201,
        body: isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, context, req)
          : defaultHooks.beforeResponse(defaultBody, context, req),
      };
    } else if (method == "get") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(context, req);
      } else {
        defaultHooks.beforeFind(context, req);
      }
      if (
        !("page" in req.query) &&
        !("perpage" in req.query) &&
        !("search" in req.query)
      ) {
        let where = queryToWhere(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
          options = {
            where,
          };
        } else if (connector == "mongoose") {
          options = where;
        }

        if (isAsyncFunction(defaultHooks.beforeQuery)) {
          await defaultHooks.beforeQuery(options, context, req);
        } else {
          defaultHooks.beforeQuery(options, context, req);
        }
        let cursor = null;
        if (connector == "mongoose") {
          if ("projection" in req.query) {
            cursor = Model.findOne(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection
            );
          } else {
            cursor = Model.findOne(options);
          }
          if ("sort" in req.query) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort
            );
          }
        } else {
          if ("projection" in req.query) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection;
          }
          if ("sort" in req.query) {
            options["order"] = isJson(req.query.sort)
              ? JSON.parse(req.query.sort)
              : req.query.sort;
          }
          cursor = Model.findOne(options);
        }
        data = await cursor;

        if (!data) {
          const message = modelOptions.message || "Data not found!";
          const error: any = new Error(message);
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
          body: isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, context, req)
            : defaultHooks.beforeResponse(defaultBody, context, req),
        };
      } else {
        let data = null;
        let total = 0;

        let where: DynamicObject = queryToWhere(
          req.query,
          connector,
          sequelize,
          modelOptions.searchColumns || []
        );

        let options = null;
        if (connector == "sequelize") {
          options = {
            where,
          };
        } else if (connector == "mongoose") {
          options = where;
        }

        if (isAsyncFunction(defaultHooks.beforeQuery)) {
          await defaultHooks.beforeQuery(options, context, req);
        } else {
          defaultHooks.beforeQuery(options, context, req);
        }
        let pagination = {};
        if ("page" in req.query && "perpage" in req.query) {
          const page = parseInt(req.query.page);
          const perpage = parseInt(req.query.perpage);
          const offset = (page - 1) * perpage;

          if (connector == "sequelize") {
            options = {
              ...options,
              limit: perpage,
              offset,
            };

            if ("projection" in req.query) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection;
            }
            if ("sort" in req.query) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort;
            }

            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query) {
              cursor = cursor.sort(
                isJson(req.query.sort)
                  ? JSON.parse(req.query.sort)
                  : req.query.sort
              );
            }
            data = await cursor.skip(offset).limit(perpage);
            total = await Model.countDocuments(options);
          }
          pagination = {
            page,
            perpage,
            pagecounts: Math.ceil(total / perpage),
          };
        } else {
          if (connector == "sequelize") {
            if ("projection" in req.query) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection;
            }
            if ("sort" in req.query) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort;
            }

            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query) {
              cursor = cursor.sort(
                isJson(req.query.sort)
                  ? JSON.parse(req.query.sort)
                  : req.query.sort
              );
            }
            data = await cursor;
            total = data.length;
          }
        }
        const defaultBody = {
          code: 200,
          message: "Data fetched successful.",
          data,
          total,
          ...pagination,
        };
        context.res = {
          body: isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, context, req)
            : defaultHooks.beforeResponse(defaultBody, context, req),
        };
      }
    } else if (method == "put") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(context, req);
      } else {
        defaultHooks.beforeFind(context, req);
      }
      let where = queryToWhere(req.query, connector);
      let data = null;
      let options = null;
      if (connector == "sequelize") {
        options = {
          where,
        };
      } else if (connector == "mongoose") {
        options = where;
      }

      if (isAsyncFunction(defaultHooks.beforeQuery)) {
        await defaultHooks.beforeQuery(options, context, req);
      } else {
        defaultHooks.beforeQuery(options, context, req);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if ("projection" in req.query) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort)
            : req.query.sort;
        }
        cursor = Model.findOne(options);
      }
      data = await cursor;

      if (!data) {
        const message = modelOptions.message || "Data not found!";
        const error: any = new Error(message);
        error.body = {
          code: 404,
          message,
        };
        throw error;
      }

      if (isAsyncFunction(defaultHooks.beforeUpdate)) {
        await defaultHooks.beforeUpdate(data, context, req);
      } else {
        defaultHooks.beforeUpdate(data, context, req);
      }

      for (const [k, v] of Object.entries(req.body)) {
        data[k] = v;
      }
      await data.save();

      if (isAsyncFunction(defaultHooks.afterUpdate)) {
        await defaultHooks.afterUpdate(data, context, req);
      } else {
        defaultHooks.afterUpdate(data, context, req);
      }

      const defaultBody = {
        code: 200,
        message: "Data updated successful.",
        data,
      };
      context.res = {
        body: isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, context, req)
          : defaultHooks.beforeResponse(defaultBody, context, req),
      };
    } else if (method == "delete") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(context, req);
      } else {
        defaultHooks.beforeFind(context, req);
      }
      let where = queryToWhere(req.query, connector);
      let data = null;
      let options = null;
      if (connector == "sequelize") {
        options = {
          where,
        };
      } else if (connector == "mongoose") {
        options = where;
      }

      if (isAsyncFunction(defaultHooks.beforeQuery)) {
        await defaultHooks.beforeQuery(options, context, req);
      } else {
        defaultHooks.beforeQuery(options, context, req);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if ("projection" in req.query) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort)
            : req.query.sort;
        }
        cursor = Model.findOne(options);
      }
      data = await cursor;

      if (!data) {
        const message = modelOptions.message || "Data not found!";
        const error: any = new Error(message);
        error.body = {
          code: 404,
          message,
        };
        throw error;
      }

      if (isAsyncFunction(defaultHooks.beforeDelete)) {
        await defaultHooks.beforeDelete(data, context, req);
      } else {
        defaultHooks.beforeDelete(data, context, req);
      }

      if (connector == "sequelize") {
        await data.destroy();
      } else if (connector == "mongoose") {
        await data.remove();
      }
      if (isAsyncFunction(defaultHooks.afterDelete)) {
        await defaultHooks.afterDelete(context, req);
      } else {
        defaultHooks.afterDelete(context, req);
      }

      const defaultBody = {
        code: 204,
        message: "Data deleted successful.",
      };
      context.res = {
        body: isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, context, req)
          : defaultHooks.beforeResponse(defaultBody, context, req),
      };
    } else {
      const err: any = new Error("Url not found!");
      err.status = 404;
      err.body = {
        code: 404,
        message: err.message,
      };
      throw err;
    }
  });
};

export const brewCrudExpressFunc = (
  map: ParamsMap,
  connector = "sequelize",
  sequelize = null,
  matchKey: string = "model"
) => {
  return brewBlankExpressFunc(async (req, res) => {
    if (!(req.params[matchKey] in map)) {
      const err: any = new Error("Url not found!");
      err.status = 404;
      err.body = {
        code: 404,
        message: err.message,
      };
      throw err;
    }
    const modelOptions = map[req.params[matchKey]];
    const defaultHooks: ExpressFuncHooks = {
      afterFunctionStart: (req, res) => {},
      beforeCreate: (req, res) => {},
      beforeFind: (req, res) => {},
      beforeQuery: (defaultOptions, req, res) => {},
      afterCreate: (data, req, res) => {},
      beforeUpdate: (data: any, req, res) => {},
      afterUpdate: (data: any, req, res) => {},
      beforeDelete: (data: any, req, res) => {},
      afterDelete: (req, res) => {},
      beforeResponse: (defaultBody, req, res) => defaultBody,
      ...((modelOptions.hooks || {}) as ExpressFuncHooks),
    };

    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(req, res);
    } else {
      defaultHooks.afterFunctionStart(req, res);
    }

    const Model = modelOptions.model;

    const method = req.method.toLowerCase();
    if (method == "post") {
      if (isAsyncFunction(defaultHooks.beforeCreate)) {
        await defaultHooks.beforeCreate(req, res);
      } else {
        defaultHooks.beforeCreate(req, res);
      }
      let data: any = null;
      if (connector == "sequelize") {
        data = await Model.create(req.body);
      } else if (connector == "mongoose") {
        data = new Model(req.body);
        await data.save();
      }
      if (isAsyncFunction(defaultHooks.afterCreate)) {
        await defaultHooks.afterCreate(data, req, res);
      } else {
        defaultHooks.afterCreate(data, req, res);
      }

      let defaultBody: DynamicObject = {
        code: 201,
        message: "Data created successful.",
        data,
      };

      res
        .status(201)
        .json(
          isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res)
        );
    } else if (method == "get") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(req, res);
      } else {
        defaultHooks.beforeFind(req, res);
      }
      if (
        !("page" in req.query) &&
        !("perpage" in req.query) &&
        !("search" in req.query)
      ) {
        let where = queryToWhere(req.query, connector);
        let data = null;
        let options = null;
        if (connector == "sequelize") {
          options = {
            where,
          };
        } else if (connector == "mongoose") {
          options = where;
        }

        if (isAsyncFunction(defaultHooks.beforeQuery)) {
          await defaultHooks.beforeQuery(options, req, res);
        } else {
          defaultHooks.beforeQuery(options, req, res);
        }
        let cursor = null;
        if (connector == "mongoose") {
          if ("projection" in req.query) {
            cursor = Model.findOne(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection
            );
          } else {
            cursor = Model.findOne(options);
          }
          if ("sort" in req.query) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort
            );
          }
        } else {
          if ("projection" in req.query) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection;
          }
          if ("sort" in req.query) {
            options["order"] = isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort;
          }
          cursor = Model.findOne(options);
        }

        if (!data) {
          const message = modelOptions.message || "Data not found!";
          const error: any = new Error(message);
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

        res.json(
          isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res)
        );
      } else {
        let data = null;
        let total = 0;

        let where: DynamicObject = queryToWhere(
          req.query,
          connector,
          sequelize,
          modelOptions.searchColumns || []
        );

        let options = null;
        if (connector == "sequelize") {
          options = {
            where,
          };
        } else if (connector == "mongoose") {
          options = where;
        }

        if (isAsyncFunction(defaultHooks.beforeQuery)) {
          await defaultHooks.beforeQuery(options, req, res);
        } else {
          defaultHooks.beforeQuery(options, req, res);
        }
        let pagination = {};
        if ("page" in req.query && "perpage" in req.query) {
          const page = parseInt(req.query.page as string);
          const perpage = parseInt(req.query.perpage as string);
          const offset = (page - 1) * perpage;

          if (connector == "sequelize") {
            options = {
              ...options,
              limit: perpage,
              offset,
            };
            if ("projection" in req.query) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection;
            }
            if ("sort" in req.query) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection as string)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query) {
              cursor = cursor.sort(
                isJson(req.query.sort)
                  ? JSON.parse(req.query.sort as string)
                  : req.query.sort
              );
            }
            data = await cursor.skip(offset).limit(perpage);

            total = await Model.countDocuments(options);
          }
          pagination = {
            page,
            perpage,
            pagecounts: Math.ceil(total / perpage),
          };
        } else {
          if (connector == "sequelize") {
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            if ("$project" in options) {
              const project = options.$project;
              delete options.$project;
              data = await Model.find(options, project);
            } else {
              data = await Model.find(options);
            }
            total = data.length;
          }
        }
        const defaultBody = {
          code: 200,
          message: "Data fetched successful.",
          data,
          total,
          ...pagination,
        };

        res.json(
          isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, req, res)
            : defaultHooks.beforeResponse(defaultBody, req, res)
        );
      }
    } else if (method == "put") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(req, res);
      } else {
        defaultHooks.beforeFind(req, res);
      }
      let where = queryToWhere(req.query, connector);
      let data = null;
      let options = null;
      if (connector == "sequelize") {
        options = {
          where,
        };
      } else if (connector == "mongoose") {
        options = where;
      }

      if (isAsyncFunction(defaultHooks.beforeQuery)) {
        await defaultHooks.beforeQuery(options, req, res);
      } else {
        defaultHooks.beforeQuery(options, req, res);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if ("projection" in req.query) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort;
        }
        cursor = Model.findOne(options);
      }
      data = await cursor;

      if (!data) {
        const message = modelOptions.message || "Data not found!";
        const error: any = new Error(message);
        error.body = {
          code: 404,
          message,
        };
        throw error;
      }

      if (isAsyncFunction(defaultHooks.beforeUpdate)) {
        await defaultHooks.beforeUpdate(data, req, res);
      } else {
        defaultHooks.beforeUpdate(data, req, res);
      }

      for (const [k, v] of Object.entries(req.body)) {
        data[k] = v;
      }
      await data.save();

      if (isAsyncFunction(defaultHooks.afterUpdate)) {
        await defaultHooks.afterUpdate(data, req, res);
      } else {
        defaultHooks.afterUpdate(data, req, res);
      }

      const defaultBody = {
        code: 200,
        message: "Data updated successful.",
        data,
      };

      res.json(
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, req, res)
          : defaultHooks.beforeResponse(defaultBody, req, res)
      );
    } else if (method == "delete") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(req, res);
      } else {
        defaultHooks.beforeFind(req, res);
      }
      let where = queryToWhere(req.query, connector);
      let data = null;
      let options = null;
      if (connector == "sequelize") {
        options = {
          where,
        };
      } else if (connector == "mongoose") {
        options = where;
      }

      if (isAsyncFunction(defaultHooks.beforeQuery)) {
        await defaultHooks.beforeQuery(options, req, res);
      } else {
        defaultHooks.beforeQuery(options, req, res);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if ("projection" in req.query) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort;
        }
        cursor = Model.findOne(options);
      }
      data = await cursor;

      if (!data) {
        const message = modelOptions.message || "Data not found!";
        const error: any = new Error(message);
        error.body = {
          code: 404,
          message,
        };
        throw error;
      }

      if (isAsyncFunction(defaultHooks.beforeDelete)) {
        await defaultHooks.beforeDelete(data, req, res);
      } else {
        defaultHooks.beforeDelete(data, req, res);
      }

      if (connector == "sequelize") {
        await data.destroy();
      } else if (connector == "mongoose") {
        await data.remove();
      }
      if (isAsyncFunction(defaultHooks.afterDelete)) {
        await defaultHooks.afterDelete(req, res);
      } else {
        defaultHooks.afterDelete(req, res);
      }

      const defaultBody = {
        code: 204,
        message: "Data deleted successful.",
      };

      res.json(
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, req, res)
          : defaultHooks.beforeResponse(defaultBody, req, res)
      );
    } else {
      const err: any = new Error("Url not found!");
      err.status = 404;
      err.body = {
        code: 404,
        message: err.message,
      };
      throw err;
    }
  });
};

export const brewAzureFuncFindAll = (
  Model: any,
  hooks: AzureFindHooks = {},
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
): AzureFunction => {
  const defaultHooks: AzureFindHooks = {
    beforeFind: (ctx, req) => {},
    beforeResponse: (defaultBody, ctx, req) => defaultBody,
    beforeQuery: (defaultOptions, ctx, req) => {},
    ...hooks,
  };
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(context, req);
    } else {
      defaultHooks.beforeFind(context, req);
    }
    let data: any[] = null;
    let total = 0;

    const where = queryToWhere(req.query, connector, sequelize, searchColumns);

    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, context, req);
    } else {
      defaultHooks.beforeQuery(options, context, req);
    }
    let pagination = {};
    if ("page" in req.query && "perpage" in req.query) {
      const page = parseInt(req.query.page);
      const perpage = parseInt(req.query.perpage);
      const offset = (page - 1) * perpage;

      if (connector == "sequelize") {
        options = {
          ...options,
          limit: perpage,
          offset,
        };
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort)
            : req.query.sort;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
          );
        }
        data = await cursor.skip(offset).limit(perpage);

        total = await Model.countDocuments(options);
      }
      pagination = {
        page,
        perpage,
        pagecounts: Math.ceil(total / perpage),
      };
    } else {
      if (connector == "sequelize") {
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        if ("$project" in options) {
          const project = options.$project;
          delete options.$project;
          data = await Model.find(options, project);
        } else {
          data = await Model.find(options);
        }
        total = data.length;
      }
    }
    const defaultBody = {
      code: 200,
      message: "Data fetched successful.",
      data,
      total,
      ...pagination,
    };
    context.res = {
      body: isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, context, req)
        : defaultHooks.beforeResponse(defaultBody, context, req),
    };
  });
};

export const brewExpressFuncFindAll = (
  Model: any,
  hooks: ExpressFindHooks = {},
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  const defaultHooks: ExpressFindHooks = {
    beforeFind: (req, res) => {},
    beforeResponse: (defaultBody, req, res) => defaultBody,
    beforeQuery: (defaultOptions, req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(req, res);
    } else {
      defaultHooks.beforeFind(req, res);
    }
    let data: any[] = null;
    let total = 0;

    const where = queryToWhere(req.query, connector, sequelize, searchColumns);

    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, req, res);
    } else {
      defaultHooks.beforeQuery(options, req, res);
    }
    let pagination = {};
    if ("page" in req.query && "perpage" in req.query) {
      const page = parseInt(req.query.page as string);
      const perpage = parseInt(req.query.perpage as string);
      const offset = (page - 1) * perpage;

      if (connector == "sequelize") {
        options = {
          ...options,
          limit: perpage,
          offset,
        };
        if ("projection" in req.query) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort
          );
        }
        data = await cursor.skip(offset).limit(perpage);

        total = await Model.countDocuments(options);
      }
      pagination = {
        page,
        perpage,
        pagecounts: Math.ceil(total / perpage),
      };
    } else {
      if (connector == "sequelize") {
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        if ("$project" in options) {
          const project = options.$project;
          delete options.$project;
          data = await Model.find(options, project);
        } else {
          data = await Model.find(options);
        }
        total = data.length;
      }
    }
    const defaultBody = {
      code: 200,
      message: "Data fetched successful.",
      data,
      total,
      ...pagination,
    };

    res.json(
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, req, res)
        : defaultHooks.beforeResponse(defaultBody, req, res)
    );
  });
};

export const brewAzureFuncFindOne = (
  Model: any,
  hooks: AzureFindHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: AzureFindHooks = {
    beforeFind: (ctx, req) => {},
    beforeResponse: (defaultBody, ctx, req) => defaultBody,
    beforeQuery: (defaultOptions, ctx, req) => {},
    ...hooks,
  };
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(context, req);
    } else {
      defaultHooks.beforeFind(context, req);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, context, req);
    } else {
      defaultHooks.beforeQuery(options, context, req);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
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
      body: isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, context, req)
        : defaultHooks.beforeResponse(defaultBody, context, req),
    };
  });
};

export const brewExpressFuncFindOne = (
  Model: any,
  hooks: ExpressFindHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: ExpressFindHooks = {
    beforeFind: (req, res) => {},
    beforeResponse: (defaultBody, req, res) => defaultBody,
    beforeQuery: (defaultOptions, req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(req, res);
    } else {
      defaultHooks.beforeFind(req, res);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, req, res);
    } else {
      defaultHooks.beforeQuery(options, req, res);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort as string)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
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

    res.json(
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, req, res)
        : defaultHooks.beforeResponse(defaultBody, req, res)
    );
  });
};

export const brewAzureFuncUpdate = (
  Model: any,
  hooks: AzureUpdateHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: AzureUpdateHooks = {
    beforeFind: (ctx, req) => {},
    beforeResponse: (defaultBody, ctx, req) => defaultBody,
    beforeQuery: (defaultOptions, ctx, req) => {},
    beforeUpdate: (data: any, ctx, req) => {},
    afterUpdate: (data: any, ctx, req) => {},
    ...hooks,
  };
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(context, req);
    } else {
      defaultHooks.beforeFind(context, req);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, context, req);
    } else {
      defaultHooks.beforeQuery(options, context, req);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
      error.body = {
        code: 404,
        message,
      };
      throw error;
    }

    if (isAsyncFunction(defaultHooks.beforeUpdate)) {
      await defaultHooks.beforeUpdate(data, context, req);
    } else {
      defaultHooks.beforeUpdate(data, context, req);
    }

    for (const [k, v] of Object.entries(req.body)) {
      data[k] = v;
    }
    await data.save();

    if (isAsyncFunction(defaultHooks.afterUpdate)) {
      await defaultHooks.afterUpdate(data, context, req);
    } else {
      defaultHooks.afterUpdate(data, context, req);
    }

    const defaultBody = {
      code: 200,
      message: "Data updated successful.",
      data,
    };
    context.res = {
      body: isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, context, req)
        : defaultHooks.beforeResponse(defaultBody, context, req),
    };
  });
};

export const brewExpressFuncUpdate = (
  Model: any,
  hooks: ExpressUpdateHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: ExpressUpdateHooks = {
    beforeFind: (req, res) => {},
    beforeResponse: (defaultBody, req, res) => defaultBody,
    beforeQuery: (defaultOptions: DynamicObject, req, res) => {},
    beforeUpdate: (data: any, req, res) => {},
    afterUpdate: (data: any, req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(req, res);
    } else {
      defaultHooks.beforeFind(req, res);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, req, res);
    } else {
      defaultHooks.beforeQuery(options, req, res);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort as string)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
      error.body = {
        code: 404,
        message,
      };
      throw error;
    }

    if (isAsyncFunction(defaultHooks.beforeUpdate)) {
      await defaultHooks.beforeUpdate(data, req, res);
    } else {
      defaultHooks.beforeUpdate(data, req, res);
    }

    for (const [k, v] of Object.entries(req.body)) {
      data[k] = v;
    }
    await data.save();

    if (isAsyncFunction(defaultHooks.afterUpdate)) {
      await defaultHooks.afterUpdate(data, req, res);
    } else {
      defaultHooks.afterUpdate(data, req, res);
    }

    const defaultBody = {
      code: 200,
      message: "Data updated successful.",
      data,
    };

    res.json(
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, req, res)
        : defaultHooks.beforeResponse(defaultBody, req, res)
    );
  });
};

export const brewAzureFuncDelete = (
  Model: any,
  hooks: AzureDeleteHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: AzureDeleteHooks = {
    beforeFind: (ctx, req) => {},
    beforeResponse: (defaultBody, ctx, req) => defaultBody,
    beforeQuery: (defaultOptions, ctx, req) => {},
    beforeDelete: (data: any, ctx, req) => {},
    afterDelete: (ctx, req) => {},
    ...hooks,
  };
  return brewBlankAzureFunc(async (context, req) => {
    context.log("HTTP trigger function processed a request.");
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(context, req);
    } else {
      defaultHooks.beforeFind(context, req);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, context, req);
    } else {
      defaultHooks.beforeQuery(options, context, req);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
      error.body = {
        code: 404,
        message,
      };
      throw error;
    }

    if (isAsyncFunction(defaultHooks.beforeDelete)) {
      await defaultHooks.beforeDelete(data, context, req);
    } else {
      defaultHooks.beforeDelete(data, context, req);
    }

    if (connector == "sequelize") {
      await data.destroy();
    } else if (connector == "mongoose") {
      await data.remove();
    }
    if (isAsyncFunction(defaultHooks.afterDelete)) {
      await defaultHooks.afterDelete(context, req);
    } else {
      defaultHooks.afterDelete(context, req);
    }

    const defaultBody = {
      code: 204,
      message: "Data deleted successful.",
    };
    context.res = {
      body: isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, context, req)
        : defaultHooks.beforeResponse(defaultBody, context, req),
    };
  });
};

export const brewExpressFuncDelete = (
  Model: any,
  hooks: ExpressDeleteHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: ExpressDeleteHooks = {
    beforeFind: (req, res) => {},
    beforeResponse: (defaultBody, req, res) => defaultBody,
    beforeQuery: (defaultOptions: DynamicObject, req, res) => {},
    beforeDelete: (data: any, req, res) => {},
    afterDelete: (req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(req, res);
    } else {
      defaultHooks.beforeFind(req, res);
    }
    const where = queryToWhere(req.query, connector);
    let data = null;
    let options = null;
    if (connector == "sequelize") {
      options = {
        where,
      };
    } else if (connector == "mongoose") {
      options = where;
    }

    if (isAsyncFunction(defaultHooks.beforeQuery)) {
      await defaultHooks.beforeQuery(options, req, res);
    } else {
      defaultHooks.beforeQuery(options, req, res);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if ("projection" in req.query) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query) {
        options["order"] = isJson(req.query.sort)
          ? JSON.parse(req.query.sort as string)
          : req.query.sort;
      }
      cursor = Model.findOne(options);
    }
    data = await cursor;

    if (!data) {
      const error: any = new Error(message);
      error.body = {
        code: 404,
        message,
      };
      throw error;
    }

    if (isAsyncFunction(defaultHooks.beforeDelete)) {
      await defaultHooks.beforeDelete(data, req, res);
    } else {
      defaultHooks.beforeDelete(data, req, res);
    }

    if (connector == "sequelize") {
      await data.destroy();
    } else if (connector == "mongoose") {
      await data.remove();
    }
    if (isAsyncFunction(defaultHooks.afterDelete)) {
      await defaultHooks.afterDelete(req, res);
    } else {
      defaultHooks.afterDelete(req, res);
    }

    const defaultBody = {
      code: 204,
      message: "Data deleted successful.",
    };

    res.json(
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, req, res)
        : defaultHooks.beforeResponse(defaultBody, req, res)
    );
  });
};
