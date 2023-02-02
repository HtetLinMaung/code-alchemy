import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Request, Response } from "express";
import { asyncEach } from "starless-async";
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
  LambdaCreateHooks,
  LambdaFuncHooks,
  LambdaFindHooks,
  LambdaUpdateHooks,
  LambdaDeleteHooks,
  RawSqlEvents,
  RawSqlHooks,
} from "./interfaces";
import isJson from "./utils/is-json";
import log from "./utils/log";
import queryToWhere from "./utils/query-to-where";

const isAsyncFunction = (func: unknown) => {
  const funcStr = func.toString();
  return funcStr.includes("async") || funcStr.includes("__awaiter");
};

export const throwErrorResponse = (status: number, message: string) => {
  const err: any = new Error(message);
  err.status = status;
  err.body = {
    code: err.status,
    message: err.message,
  };
  throw err;
};

export const createLambdaResponse = (
  statusCode: number,
  body: any = {},
  headers: any = {}
) => {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

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
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
  };
};

export const brewBlankExpressFunc = (
  cb: (req: Request, res: Response) => void
) => {
  return async (req: Request, res: Response) => {
    try {
      if (isAsyncFunction(cb)) {
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
      if (isAsyncFunction(cb)) {
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
      if (isAsyncFunction(cb)) {
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

export const brewLambdaFuncCreate = (
  Model: any,
  hooks: LambdaCreateHooks = {},
  connector = "sequelize"
) => {
  const defaultHooks: LambdaCreateHooks = {
    beforeCreate: (event) => {},
    afterCreate: (event) => {},
    beforeResponse: (defaultBody, event) => defaultBody,
    ...hooks,
  };
  return brewBlankLambdaFunc(async (event) => {
    if (isAsyncFunction(defaultHooks.beforeCreate)) {
      await defaultHooks.beforeCreate(event);
    } else {
      defaultHooks.beforeCreate(event);
    }
    let data = null;
    if (connector == "sequelize") {
      data = await Model.create(JSON.parse(event.body));
    } else if (connector == "mongoose") {
      data = new Model(JSON.parse(event.body));
      await data.save();
    }
    if (isAsyncFunction(defaultHooks.afterCreate)) {
      await defaultHooks.afterCreate(data, event);
    } else {
      defaultHooks.afterCreate(data, event);
    }

    const defaultBody = {
      code: 201,
      message: "Data created successful.",
      data,
    };

    return createLambdaResponse(
      201,
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, event)
        : defaultHooks.beforeResponse(defaultBody, event)
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
          if ("projection" in req.query && req.query.projection) {
            cursor = Model.findOne(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection
            );
          } else {
            cursor = Model.findOne(options);
          }
          if ("sort" in req.query && req.query.sort) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort
            );
          }
        } else {
          if ("projection" in req.query && req.query.projection) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection;
          }
          if ("sort" in req.query && req.query.sort) {
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

            if ("projection" in req.query && req.query.projection) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort;
            }
            if ("group" in req.query && req.query.group) {
              options["group"] = isJson(req.query.group)
                ? JSON.parse(req.query.group)
                : req.query.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query && req.query.projection) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query && req.query.sort) {
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
            if ("projection" in req.query && req.query.projection) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection)
                : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort)
                : req.query.sort;
            }
            if ("group" in req.query && req.query.group) {
              options["group"] = isJson(req.query.group)
                ? JSON.parse(req.query.group)
                : req.query.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query && req.query.projection) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query && req.query.sort) {
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
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
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
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
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
          if ("projection" in req.query && req.query.projection) {
            cursor = Model.findOne(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection
            );
          } else {
            cursor = Model.findOne(options);
          }
          if ("sort" in req.query && req.query.sort) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort
            );
          }
        } else {
          if ("projection" in req.query && req.query.projection) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection;
          }
          if ("sort" in req.query && req.query.sort) {
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
            if ("projection" in req.query && req.query.projection) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort;
            }
            if ("group" in req.query && req.query.group) {
              options["group"] = isJson(req.query.group)
                ? JSON.parse(req.query.group as string)
                : req.query.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query && req.query.projection) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection as string)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query && req.query.sort) {
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
            if ("projection" in req.query && req.query.projection) {
              options["attributes"] = isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection;
            }
            if ("sort" in req.query && req.query.sort) {
              options["order"] = isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort;
            }
            if ("group" in req.query && req.query.group) {
              options["group"] = isJson(req.query.group)
                ? JSON.parse(req.query.group as string)
                : req.query.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if ("projection" in req.query && req.query.projection) {
              cursor = Model.find(
                options,
                isJson(req.query.projection)
                  ? JSON.parse(req.query.projection as string)
                  : req.query.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if ("sort" in req.query && req.query.sort) {
              cursor = cursor.sort(
                isJson(req.query.sort)
                  ? JSON.parse(req.query.sort as string)
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
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
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
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.findOne(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort
          );
        }
      } else {
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
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

export const brewCrudLambdaFunc = (
  map: ParamsMap,
  connector = "sequelize",
  sequelize = null,
  matchKey: string = "model"
) => {
  return brewBlankLambdaFunc(async (event) => {
    if (!(event.pathParameters[matchKey] in map)) {
      const err: any = new Error("Url not found!");
      err.status = 404;
      err.body = {
        code: 404,
        message: err.message,
      };
      throw err;
    }
    const modelOptions = map[event.pathParameters[matchKey]];
    const defaultHooks: LambdaFuncHooks = {
      afterFunctionStart: (event) => {},
      beforeCreate: (event) => {},
      beforeFind: (event) => {},
      beforeQuery: (defaultOptions, event) => {},
      afterCreate: (data, event) => {},
      beforeUpdate: (data: any, event) => {},
      afterUpdate: (data: any, event) => {},
      beforeDelete: (data: any, event) => {},
      afterDelete: (event) => {},
      beforeResponse: (defaultBody, event) => defaultBody,
      ...((modelOptions.hooks || {}) as LambdaFuncHooks),
    };

    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(event);
    } else {
      defaultHooks.afterFunctionStart(event);
    }

    const Model = modelOptions.model;

    const method = event.httpMethod.toLowerCase();
    if (method == "post") {
      if (isAsyncFunction(defaultHooks.beforeCreate)) {
        await defaultHooks.beforeCreate(event);
      } else {
        defaultHooks.beforeCreate(event);
      }
      let data: any = null;
      if (connector == "sequelize") {
        data = await Model.create(JSON.parse(event.body));
      } else if (connector == "mongoose") {
        data = new Model(JSON.parse(event.body));
        await data.save();
      }
      if (isAsyncFunction(defaultHooks.afterCreate)) {
        await defaultHooks.afterCreate(data, event);
      } else {
        defaultHooks.afterCreate(data, event);
      }

      let defaultBody: DynamicObject = {
        code: 201,
        message: "Data created successful.",
        data,
      };

      return createLambdaResponse(
        201,
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, event)
          : defaultHooks.beforeResponse(defaultBody, event)
      );
    } else if (method == "get") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(event);
      } else {
        defaultHooks.beforeFind(event);
      }
      if (
        !("page" in event.queryStringParameters) &&
        !("perpage" in event.queryStringParameters) &&
        !("search" in event.queryStringParameters)
      ) {
        let where = queryToWhere(event.queryStringParameters, connector);
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
          await defaultHooks.beforeQuery(options, event);
        } else {
          defaultHooks.beforeQuery(options, event);
        }
        let cursor = null;
        if (connector == "mongoose") {
          if (
            "projection" in event.queryStringParameters &&
            event.queryStringParameters.projection
          ) {
            cursor = Model.findOne(
              options,
              isJson(event.queryStringParameters.projection)
                ? JSON.parse(event.queryStringParameters.projection as string)
                : event.queryStringParameters.projection
            );
          } else {
            cursor = Model.findOne(options);
          }
          if (
            "sort" in event.queryStringParameters &&
            event.queryStringParameters.sort
          ) {
            cursor = cursor.sort(
              isJson(event.queryStringParameters.sort)
                ? JSON.parse(event.queryStringParameters.sort as string)
                : event.queryStringParameters.sort
            );
          }
        } else {
          if (
            "projection" in event.queryStringParameters &&
            event.queryStringParameters.projection
          ) {
            options["attributes"] = isJson(
              event.queryStringParameters.projection
            )
              ? JSON.parse(event.queryStringParameters.projection as string)
              : event.queryStringParameters.projection;
          }
          if (
            "sort" in event.queryStringParameters &&
            event.queryStringParameters.sort
          ) {
            options["order"] = isJson(event.queryStringParameters.sort)
              ? JSON.parse(event.queryStringParameters.sort as string)
              : event.queryStringParameters.sort;
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

        return createLambdaResponse(
          200,
          isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event)
        );
      } else {
        let data = null;
        let total = 0;

        let where: DynamicObject = queryToWhere(
          event.queryStringParameters,
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
          await defaultHooks.beforeQuery(options, event);
        } else {
          defaultHooks.beforeQuery(options, event);
        }
        let pagination = {};
        if (
          "page" in event.queryStringParameters &&
          "perpage" in event.queryStringParameters
        ) {
          const page = parseInt(event.queryStringParameters.page as string);
          const perpage = parseInt(
            event.queryStringParameters.perpage as string
          );
          const offset = (page - 1) * perpage;

          if (connector == "sequelize") {
            options = {
              ...options,
              limit: perpage,
              offset,
            };
            if (
              "projection" in event.queryStringParameters &&
              event.queryStringParameters.projection
            ) {
              options["attributes"] = isJson(
                event.queryStringParameters.projection
              )
                ? JSON.parse(event.queryStringParameters.projection as string)
                : event.queryStringParameters.projection;
            }
            if (
              "sort" in event.queryStringParameters &&
              event.queryStringParameters.sort
            ) {
              options["order"] = isJson(event.queryStringParameters.sort)
                ? JSON.parse(event.queryStringParameters.sort as string)
                : event.queryStringParameters.sort;
            }
            if (
              "group" in event.queryStringParameters &&
              event.queryStringParameters.group
            ) {
              options["group"] = isJson(event.queryStringParameters.group)
                ? JSON.parse(event.queryStringParameters.group as string)
                : event.queryStringParameters.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if (
              "projection" in event.queryStringParameters &&
              event.queryStringParameters.projection
            ) {
              cursor = Model.find(
                options,
                isJson(event.queryStringParameters.projection)
                  ? JSON.parse(event.queryStringParameters.projection as string)
                  : event.queryStringParameters.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if (
              "sort" in event.queryStringParameters &&
              event.queryStringParameters.sort
            ) {
              cursor = cursor.sort(
                isJson(event.queryStringParameters.sort)
                  ? JSON.parse(event.queryStringParameters.sort as string)
                  : event.queryStringParameters.sort
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
            if (
              "projection" in event.queryStringParameters &&
              event.queryStringParameters.projection
            ) {
              options["attributes"] = isJson(
                event.queryStringParameters.projection
              )
                ? JSON.parse(event.queryStringParameters.projection as string)
                : event.queryStringParameters.projection;
            }
            if (
              "sort" in event.queryStringParameters &&
              event.queryStringParameters.sort
            ) {
              options["order"] = isJson(event.queryStringParameters.sort)
                ? JSON.parse(event.queryStringParameters.sort as string)
                : event.queryStringParameters.sort;
            }
            if (
              "group" in event.queryStringParameters &&
              event.queryStringParameters.group
            ) {
              options["group"] = isJson(event.queryStringParameters.group)
                ? JSON.parse(event.queryStringParameters.group as string)
                : event.queryStringParameters.group;
            }
            const { rows, count } = await Model.findAndCountAll(options);
            data = rows;
            total = count;
          } else if (connector == "mongoose") {
            let cursor = null;
            if (
              "projection" in event.queryStringParameters &&
              event.queryStringParameters.projection
            ) {
              cursor = Model.find(
                options,
                isJson(event.queryStringParameters.projection)
                  ? JSON.parse(event.queryStringParameters.projection as string)
                  : event.queryStringParameters.projection
              );
            } else {
              cursor = Model.find(options);
            }
            if (
              "sort" in event.queryStringParameters &&
              event.queryStringParameters.sort
            ) {
              cursor = cursor.sort(
                isJson(event.queryStringParameters.sort)
                  ? JSON.parse(event.queryStringParameters.sort as string)
                  : event.queryStringParameters.sort
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

        return createLambdaResponse(
          200,
          isAsyncFunction(defaultHooks.beforeResponse)
            ? await defaultHooks.beforeResponse(defaultBody, event)
            : defaultHooks.beforeResponse(defaultBody, event)
        );
      }
    } else if (method == "put") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(event);
      } else {
        defaultHooks.beforeFind(event);
      }
      let where = queryToWhere(event.queryStringParameters, connector);
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
        await defaultHooks.beforeQuery(options, event);
      } else {
        defaultHooks.beforeQuery(options, event);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          cursor = Model.findOne(
            options,
            isJson(event.queryStringParameters.projection)
              ? JSON.parse(event.queryStringParameters.projection as string)
              : event.queryStringParameters.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          cursor = cursor.sort(
            isJson(event.queryStringParameters.sort)
              ? JSON.parse(event.queryStringParameters.sort as string)
              : event.queryStringParameters.sort
          );
        }
      } else {
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          options["attributes"] = isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection;
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          options["order"] = isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort;
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
        await defaultHooks.beforeUpdate(data, event);
      } else {
        defaultHooks.beforeUpdate(data, event);
      }

      for (const [k, v] of Object.entries(JSON.parse(event.body))) {
        data[k] = v;
      }
      await data.save();

      if (isAsyncFunction(defaultHooks.afterUpdate)) {
        await defaultHooks.afterUpdate(data, event);
      } else {
        defaultHooks.afterUpdate(data, event);
      }

      const defaultBody = {
        code: 200,
        message: "Data updated successful.",
        data,
      };

      return createLambdaResponse(
        200,
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, event)
          : defaultHooks.beforeResponse(defaultBody, event)
      );
    } else if (method == "delete") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(event);
      } else {
        defaultHooks.beforeFind(event);
      }
      let where = queryToWhere(event.queryStringParameters, connector);
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
        await defaultHooks.beforeQuery(options, event);
      } else {
        defaultHooks.beforeQuery(options, event);
      }
      let cursor = null;
      if (connector == "mongoose") {
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          cursor = Model.findOne(
            options,
            isJson(event.queryStringParameters.projection)
              ? JSON.parse(event.queryStringParameters.projection as string)
              : event.queryStringParameters.projection
          );
        } else {
          cursor = Model.findOne(options);
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          cursor = cursor.sort(
            isJson(event.queryStringParameters.sort)
              ? JSON.parse(event.queryStringParameters.sort as string)
              : event.queryStringParameters.sort
          );
        }
      } else {
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          options["attributes"] = isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection;
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          options["order"] = isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort;
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
        await defaultHooks.beforeDelete(data, event);
      } else {
        defaultHooks.beforeDelete(data, event);
      }

      if (connector == "sequelize") {
        await data.destroy();
      } else if (connector == "mongoose") {
        await data.remove();
      }
      if (isAsyncFunction(defaultHooks.afterDelete)) {
        await defaultHooks.afterDelete(event);
      } else {
        defaultHooks.afterDelete(event);
      }

      const defaultBody = {
        code: 204,
        message: "Data deleted successful.",
      };

      return createLambdaResponse(
        204,
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, event)
          : defaultHooks.beforeResponse(defaultBody, event)
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
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort)
            : req.query.sort;
        }
        if ("group" in req.query && req.query.group) {
          options["group"] = isJson(req.query.group)
            ? JSON.parse(req.query.group)
            : req.query.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query && req.query.sort) {
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
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort)
            : req.query.sort;
        }
        if ("group" in req.query && req.query.group) {
          options["group"] = isJson(req.query.group)
            ? JSON.parse(req.query.group)
            : req.query.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
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
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
          options["order"] = isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort;
        }
        if ("group" in req.query && req.query.group) {
          options["group"] = isJson(req.query.group)
            ? JSON.parse(req.query.group as string)
            : req.query.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query && req.query.sort) {
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
        if ("projection" in req.query && req.query.projection) {
          options["attributes"] = isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection;
        }
        if ("sort" in req.query && req.query.sort) {
          options["order"] = isJson(req.query.sort as string)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort;
        }
        if ("group" in req.query && req.query.group) {
          options["group"] = isJson(req.query.group)
            ? JSON.parse(req.query.group as string)
            : req.query.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if ("projection" in req.query && req.query.projection) {
          cursor = Model.find(
            options,
            isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if ("sort" in req.query && req.query.sort) {
          cursor = cursor.sort(
            isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
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

    res.json(
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, req, res)
        : defaultHooks.beforeResponse(defaultBody, req, res)
    );
  });
};

export const brewLambdaFuncFindAll = (
  Model: any,
  hooks: LambdaFindHooks = {},
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  const defaultHooks: LambdaFindHooks = {
    beforeFind: (event) => {},
    beforeResponse: (defaultBody, event) => defaultBody,
    beforeQuery: (defaultOptions, event) => {},
    ...hooks,
  };
  return brewBlankLambdaFunc(async (event) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(event);
    } else {
      defaultHooks.beforeFind(event);
    }
    let data: any[] = null;
    let total = 0;

    const where = queryToWhere(
      event.queryStringParameters,
      connector,
      sequelize,
      searchColumns
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
      await defaultHooks.beforeQuery(options, event);
    } else {
      defaultHooks.beforeQuery(options, event);
    }
    let pagination = {};
    if (
      "page" in event.queryStringParameters &&
      "perpage" in event.queryStringParameters
    ) {
      const page = parseInt(event.queryStringParameters.page as string);
      const perpage = parseInt(event.queryStringParameters.perpage as string);
      const offset = (page - 1) * perpage;

      if (connector == "sequelize") {
        options = {
          ...options,
          limit: perpage,
          offset,
        };
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          options["attributes"] = isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection;
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          options["order"] = isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort;
        }
        if (
          "group" in event.queryStringParameters &&
          event.queryStringParameters.group
        ) {
          options["group"] = isJson(event.queryStringParameters.group)
            ? JSON.parse(event.queryStringParameters.group as string)
            : event.queryStringParameters.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          cursor = Model.find(
            options,
            isJson(event.queryStringParameters.projection)
              ? JSON.parse(event.queryStringParameters.projection as string)
              : event.queryStringParameters.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          cursor = cursor.sort(
            isJson(event.queryStringParameters.sort)
              ? JSON.parse(event.queryStringParameters.sort as string)
              : event.queryStringParameters.sort
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
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          options["attributes"] = isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection;
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          options["order"] = isJson(event.queryStringParameters.sort as string)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort;
        }
        if (
          "group" in event.queryStringParameters &&
          event.queryStringParameters.group
        ) {
          options["group"] = isJson(event.queryStringParameters.group)
            ? JSON.parse(event.queryStringParameters.group as string)
            : event.queryStringParameters.group;
        }
        const { rows, count } = await Model.findAndCountAll(options);
        data = rows;
        total = count;
      } else if (connector == "mongoose") {
        let cursor = null;
        if (
          "projection" in event.queryStringParameters &&
          event.queryStringParameters.projection
        ) {
          cursor = Model.find(
            options,
            isJson(event.queryStringParameters.projection)
              ? JSON.parse(event.queryStringParameters.projection as string)
              : event.queryStringParameters.projection
          );
        } else {
          cursor = Model.find(options);
        }
        if (
          "sort" in event.queryStringParameters &&
          event.queryStringParameters.sort
        ) {
          cursor = cursor.sort(
            isJson(event.queryStringParameters.sort)
              ? JSON.parse(event.queryStringParameters.sort as string)
              : event.queryStringParameters.sort
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

    return createLambdaResponse(
      200,
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, event)
        : defaultHooks.beforeResponse(defaultBody, event)
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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

export const brewLambdaFuncFindOne = (
  Model: any,
  hooks: LambdaFindHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: LambdaFindHooks = {
    beforeFind: (event) => {},
    beforeResponse: (defaultBody, event) => defaultBody,
    beforeQuery: (defaultOptions, event) => {},
    ...hooks,
  };
  return brewBlankLambdaFunc(async (event) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(event);
    } else {
      defaultHooks.beforeFind(event);
    }
    const where = queryToWhere(event.queryStringParameters, connector);
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
      await defaultHooks.beforeQuery(options, event);
    } else {
      defaultHooks.beforeQuery(options, event);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        cursor = Model.findOne(
          options,
          isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        cursor = cursor.sort(
          isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort
        );
      }
    } else {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        options["attributes"] = isJson(event.queryStringParameters.projection)
          ? JSON.parse(event.queryStringParameters.projection as string)
          : event.queryStringParameters.projection;
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        options["order"] = isJson(event.queryStringParameters.sort)
          ? JSON.parse(event.queryStringParameters.sort as string)
          : event.queryStringParameters.sort;
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
    return createLambdaResponse(
      200,
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, event)
        : defaultHooks.beforeResponse(defaultBody, event)
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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

export const brewLambdaFuncUpdate = (
  Model: any,
  hooks: LambdaUpdateHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: LambdaUpdateHooks = {
    beforeFind: (event) => {},
    beforeResponse: (defaultBody, event) => defaultBody,
    beforeQuery: (defaultOptions: DynamicObject, event) => {},
    beforeUpdate: (data: any, event) => {},
    afterUpdate: (data: any, event) => {},
    ...hooks,
  };
  return brewBlankLambdaFunc(async (event) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(event);
    } else {
      defaultHooks.beforeFind(event);
    }
    const where = queryToWhere(event.queryStringParameters, connector);
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
      await defaultHooks.beforeQuery(options, event);
    } else {
      defaultHooks.beforeQuery(options, event);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        cursor = Model.findOne(
          options,
          isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        cursor = cursor.sort(
          isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort
        );
      }
    } else {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        options["attributes"] = isJson(event.queryStringParameters.projection)
          ? JSON.parse(event.queryStringParameters.projection as string)
          : event.queryStringParameters.projection;
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        options["order"] = isJson(event.queryStringParameters.sort)
          ? JSON.parse(event.queryStringParameters.sort as string)
          : event.queryStringParameters.sort;
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
      await defaultHooks.beforeUpdate(data, event);
    } else {
      defaultHooks.beforeUpdate(data, event);
    }

    for (const [k, v] of Object.entries(JSON.parse(event.body))) {
      data[k] = v;
    }
    await data.save();

    if (isAsyncFunction(defaultHooks.afterUpdate)) {
      await defaultHooks.afterUpdate(data, event);
    } else {
      defaultHooks.afterUpdate(data, event);
    }

    const defaultBody = {
      code: 200,
      message: "Data updated successful.",
      data,
    };

    return createLambdaResponse(
      200,
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, event)
        : defaultHooks.beforeResponse(defaultBody, event)
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort) ? JSON.parse(req.query.sort) : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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

export const brewLambdaFuncDelete = (
  Model: any,
  hooks: LambdaDeleteHooks = {},
  message = "Data not found!",
  connector = "sequelize"
) => {
  const defaultHooks: LambdaDeleteHooks = {
    beforeFind: (event) => {},
    beforeResponse: (defaultBody, event) => defaultBody,
    beforeQuery: (defaultOptions: DynamicObject, event) => {},
    beforeDelete: (data: any, event) => {},
    afterDelete: (event) => {},
    ...hooks,
  };
  return brewBlankLambdaFunc(async (event) => {
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(event);
    } else {
      defaultHooks.beforeFind(event);
    }
    const where = queryToWhere(event.queryStringParameters, connector);
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
      await defaultHooks.beforeQuery(options, event);
    } else {
      defaultHooks.beforeQuery(options, event);
    }
    let cursor = null;
    if (connector == "mongoose") {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        cursor = Model.findOne(
          options,
          isJson(event.queryStringParameters.projection)
            ? JSON.parse(event.queryStringParameters.projection as string)
            : event.queryStringParameters.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        cursor = cursor.sort(
          isJson(event.queryStringParameters.sort)
            ? JSON.parse(event.queryStringParameters.sort as string)
            : event.queryStringParameters.sort
        );
      }
    } else {
      if (
        "projection" in event.queryStringParameters &&
        event.queryStringParameters.projection
      ) {
        options["attributes"] = isJson(event.queryStringParameters.projection)
          ? JSON.parse(event.queryStringParameters.projection as string)
          : event.queryStringParameters.projection;
      }
      if (
        "sort" in event.queryStringParameters &&
        event.queryStringParameters.sort
      ) {
        options["order"] = isJson(event.queryStringParameters.sort)
          ? JSON.parse(event.queryStringParameters.sort as string)
          : event.queryStringParameters.sort;
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
      await defaultHooks.beforeDelete(data, event);
    } else {
      defaultHooks.beforeDelete(data, event);
    }

    if (connector == "sequelize") {
      await data.destroy();
    } else if (connector == "mongoose") {
      await data.remove();
    }
    if (isAsyncFunction(defaultHooks.afterDelete)) {
      await defaultHooks.afterDelete(event);
    } else {
      defaultHooks.afterDelete(event);
    }

    const defaultBody = {
      code: 204,
      message: "Data deleted successful.",
    };

    return createLambdaResponse(
      204,
      isAsyncFunction(defaultHooks.beforeResponse)
        ? await defaultHooks.beforeResponse(defaultBody, event)
        : defaultHooks.beforeResponse(defaultBody, event)
    );
  });
};

export const brewExpressFuncCreateOrFindAll = (
  Model: any,
  hooks: ExpressFuncHooks = {},
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  const defaultHooks: ExpressFuncHooks = {
    beforeCreate: (req, res) => {},
    afterCreate: (data, req, res) => {},
    beforeResponse: (defaultBody) => defaultBody,
    beforeFind: (req, res) => {},
    beforeQuery: (defaultOptions, req, res) => {},
    afterFunctionStart: (req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(req, res);
    } else {
      defaultHooks.afterFunctionStart(req, res);
    }
    const method = req.method.toLowerCase();
    if (method == "get") {
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(req, res);
      } else {
        defaultHooks.beforeFind(req, res);
      }
      let data: any[] = null;
      let total = 0;

      const where = queryToWhere(
        req.query,
        connector,
        sequelize,
        searchColumns
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
          if ("projection" in req.query && req.query.projection) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection;
          }
          if ("sort" in req.query && req.query.sort) {
            options["order"] = isJson(req.query.sort)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort;
          }
          if ("group" in req.query && req.query.group) {
            options["group"] = isJson(req.query.group)
              ? JSON.parse(req.query.group as string)
              : req.query.group;
          }
          const { rows, count } = await Model.findAndCountAll(options);
          data = rows;
          total = count;
        } else if (connector == "mongoose") {
          let cursor = null;
          if ("projection" in req.query && req.query.projection) {
            cursor = Model.find(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection
            );
          } else {
            cursor = Model.find(options);
          }
          if ("sort" in req.query && req.query.sort) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
                : req.query.sort
            );
          }
          cursor = cursor.skip(offset).limit(perpage);
          if ("populate" in req.query && req.query.populate) {
            const populate = isJson(req.query.populate)
              ? JSON.parse(req.query.populate as string)
              : req.query.populate;
            cursor = cursor.populate(populate);
          }
          data = await cursor.exec();

          total = await Model.countDocuments(options);
        }
        pagination = {
          page,
          perpage,
          pagecounts: Math.ceil(total / perpage),
        };
      } else {
        if (connector == "sequelize") {
          if ("projection" in req.query && req.query.projection) {
            options["attributes"] = isJson(req.query.projection)
              ? JSON.parse(req.query.projection as string)
              : req.query.projection;
          }
          if ("sort" in req.query && req.query.sort) {
            options["order"] = isJson(req.query.sort as string)
              ? JSON.parse(req.query.sort as string)
              : req.query.sort;
          }
          if ("group" in req.query && req.query.group) {
            options["group"] = isJson(req.query.group)
              ? JSON.parse(req.query.group as string)
              : req.query.group;
          }
          const { rows, count } = await Model.findAndCountAll(options);
          data = rows;
          total = count;
        } else if (connector == "mongoose") {
          let cursor = null;
          if ("projection" in req.query && req.query.projection) {
            cursor = Model.find(
              options,
              isJson(req.query.projection)
                ? JSON.parse(req.query.projection as string)
                : req.query.projection
            );
          } else {
            cursor = Model.find(options);
          }
          if ("sort" in req.query && req.query.sort) {
            cursor = cursor.sort(
              isJson(req.query.sort)
                ? JSON.parse(req.query.sort as string)
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

      res.json(
        isAsyncFunction(defaultHooks.beforeResponse)
          ? await defaultHooks.beforeResponse(defaultBody, req, res)
          : defaultHooks.beforeResponse(defaultBody, req, res)
      );
    } else if (method == "post") {
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
    }
  });
};

export const brewExpressFuncFindOneOrUpdateOrDeleteByParam = (
  Model: any,
  hooks: ExpressFuncHooks = {},
  message = "Data not found!",
  paramKey: string = "",
  connector = "sequelize"
) => {
  const defaultHooks: ExpressFuncHooks = {
    beforeFind: (req, res) => {},
    beforeResponse: (defaultBody, req, res) => defaultBody,
    beforeQuery: (defaultOptions, req, res) => {},
    beforeUpdate: (data, req, res) => {},
    afterUpdate: (data, req, res) => {},
    beforeDelete: (data, req, res) => {},
    afterDelete: (req, res) => {},
    afterFunctionStart: (req, res) => {},
    ...hooks,
  };
  return brewBlankExpressFunc(async (req, res) => {
    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(req, res);
    } else {
      defaultHooks.afterFunctionStart(req, res);
    }
    if (isAsyncFunction(defaultHooks.beforeFind)) {
      await defaultHooks.beforeFind(req, res);
    } else {
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
      if ("projection" in req.query && req.query.projection) {
        cursor = Model.findOne(
          options,
          isJson(req.query.projection)
            ? JSON.parse(req.query.projection as string)
            : req.query.projection
        );
      } else {
        cursor = Model.findOne(options);
      }
      if ("sort" in req.query && req.query.sort) {
        cursor = cursor.sort(
          isJson(req.query.sort)
            ? JSON.parse(req.query.sort as string)
            : req.query.sort
        );
      }
    } else {
      if ("projection" in req.query && req.query.projection) {
        options["attributes"] = isJson(req.query.projection)
          ? JSON.parse(req.query.projection as string)
          : req.query.projection;
      }
      if ("sort" in req.query && req.query.sort) {
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
    const method = req.method.toLowerCase();
    if (method == "get") {
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
    } else if (method == "put" || method == "patch") {
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
    }
  });
};

const replaceRawSql = (sql: string, query: any, body: any, state: any) => {
  const bind = {};
  for (const key in query) {
    sql.replace(new RegExp(`$query.${key}`, "g"), `$query_${key}`);
    bind[`query_${key}`] = query[key];
  }
  for (const key in body) {
    sql.replace(new RegExp(`$body.${key}`, "g"), `$body_${key}`);
    bind[`body_${key}`] = body[key];
  }
  for (const key in state) {
    sql.replace(new RegExp(`$state.${key}`, "g"), `$state${key}`);
    bind[`state_${key}`] = state[key];
  }
  return { sql, bind };
};

export const brewLambdaFuncRawSql = async (
  sqllist: any[],
  sequelize: any,
  hooks: RawSqlHooks = {},
  events: RawSqlEvents = {}
) => {
  return brewBlankLambdaFunc(async (event) => {
    const defaultHooks: RawSqlHooks = {
      afterFunctionStart(event) {},
      beforeResponse(defaultBody, event) {
        return defaultBody;
      },
      ...hooks,
    };
    if (isAsyncFunction(defaultHooks.afterFunctionStart)) {
      await defaultHooks.afterFunctionStart(event);
    } else {
      defaultHooks.afterFunctionStart(event);
    }

    const query = event.queryStringParameters;
    const body = event.body ? JSON.parse(event.body) : {};
    const state: any = {
      event,
      query,
      body,
    };
    let data = null;
    await sequelize.transaction(async (t) => {
      for (const [i, sqlOrList] of sqllist.entries()) {
        if (Array.isArray(sqlOrList)) {
          await asyncEach(sqlOrList, async (sqlstr, j) => {
            const { sql, bind } = replaceRawSql(sqlstr, query, body, state);
            data = await sequelize.query(sql, {
              bind,
              transaction: t,
            });
            state[`${i}_${j}`] = data;
            if (typeof events[`${i}_${j}`] == "function") {
              const eventCb = events[`@${i}_${j}`];
              if (isAsyncFunction(eventCb)) {
                await eventCb(data, state);
              } else {
                eventCb(data, state);
              }
            }
          });
        } else {
          const { sql, bind } = replaceRawSql(sqlOrList, query, body, state);
          data = await sequelize.query(sql, {
            bind,
            transaction: t,
          });
          state[`${i}_0`] = data;
          if (typeof events[`@${i}_0`] == "function") {
            const eventCb = events[`@${i}_0`];
            if (isAsyncFunction(events[`@${i}_0`])) {
              await eventCb(data, state);
            } else {
              eventCb(data, state);
            }
          }
        }
      }
    });
    let defaultBody: any = {
      code: 200,
      message: "Successful.",
      data,
    };
    if (isAsyncFunction(defaultHooks.beforeResponse)) {
      defaultBody = await defaultHooks.beforeResponse(defaultBody, event);
    } else {
      defaultBody = defaultHooks.beforeResponse(defaultBody, event);
    }
    return createLambdaResponse(200, defaultBody);
  });
};
