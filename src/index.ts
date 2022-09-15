import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { isAsyncFunction } from "util/types";

export const responseAzureFuncError = (context: Context, err: any) => {
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

interface CreateHook {
  beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  afterCreate?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  beforeResponse?: (defaultBody: any) => any;
}

export const brewAzureFuncCreate = (
  Model: any,
  hooks: CreateHook = {},
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: CreateHook = {
    beforeCreate: (ctx: Context, req: HttpRequest) => {},
    afterCreate: (data: any, ctx: Context, req: HttpRequest) => {},
    beforeResponse: (defaultBody: any) => defaultBody,
    ...hooks,
  };
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
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

      context.res = {
        status: 201,
        body: defaultHooks.beforeResponse({
          code: 201,
          message: "Data created successful.",
          data,
        }),
      };
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  };
};

interface FindHooks {
  beforeResponse?: (defaultBody: any) => any;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeQuery?: (
    options: any,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

const queryToWhere = (
  query: any,
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
) => {
  let where: any = null;
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
      } else if (connector == "mongoose") {
        where = {
          $text: { $search: v },
        };
      }
    } else if (!["page", "perpage"].includes(k)) {
      if (!where) {
        where = {};
      }
      where[k] = v;
    }
  }
  return where;
};

export const brewAzureFuncFindAll = (
  Model: any,
  hooks: FindHooks = {},
  connector = "sequelize",
  sequelize: any = null,
  searchColumns: string[] = []
): AzureFunction => {
  const defaultHooks: FindHooks = {
    beforeFind: (ctx: Context, req: HttpRequest) => {},
    beforeResponse: (defaultBody: any) => defaultBody,
    beforeQuery: (defaultOptions: any, ctx: Context, req: HttpRequest) => {},
    ...hooks,
  };
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
      context.log("HTTP trigger function processed a request.");
      if (isAsyncFunction(defaultHooks.beforeFind)) {
        await defaultHooks.beforeFind(context, req);
      } else {
        defaultHooks.beforeFind(context, req);
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
          const { rows, count } = await Model.findAndCountAll(options);
          data = rows;
          total = count;
        } else if (connector == "mongoose") {
          if ("$project" in options) {
            const project = options.$project;
            delete options.$project;
            data = await Model.find(options, project)
              .limit(perpage)
              .skip(offset);
          } else {
            data = await Model.find(options).skip(offset).limit(perpage);
          }

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
      context.res = {
        body: defaultHooks.beforeResponse({
          code: 200,
          message: "Data fetched successful.",
          data,
          total,
          ...pagination,
        }),
      };
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  };
};

export const brewAzureFuncFindOne = (
  Model: any,
  hooks: FindHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: FindHooks = {
    beforeFind: (ctx: Context, req: HttpRequest) => {},
    beforeResponse: (defaultBody: any) => defaultBody,
    beforeQuery: (defaultOptions: any, ctx: Context, req: HttpRequest) => {},
    ...hooks,
  };
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
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
      if ("$project" in options) {
        const project = options.$project;
        delete options.$project;
        data = await Model.findOne(options, project);
      } else {
        data = await Model.findOne(options);
      }

      if (!data) {
        const error: any = new Error(message);
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
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  };
};

interface UpdateHooks {
  beforeResponse?: (defaultBody: any) => any;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeUpdate?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  afterUpdate?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  beforeQuery?: (
    options: any,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

export const brewAzureFuncUpdate = (
  Model: any,
  hooks: UpdateHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: UpdateHooks = {
    beforeFind: (ctx: Context, req: HttpRequest) => {},
    beforeResponse: (defaultBody: any) => defaultBody,
    beforeQuery: (defaultOptions: any, ctx: Context, req: HttpRequest) => {},
    beforeUpdate: (data: any, ctx: Context, req: HttpRequest) => {},
    afterUpdate: (data: any, ctx: Context, req: HttpRequest) => {},
    ...hooks,
  };
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
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
      if ("$project" in options) {
        const project = options.$project;
        delete options.$project;
        data = await Model.findOne(options, project);
      } else {
        data = await Model.findOne(options);
      }

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

      context.res = {
        body: defaultHooks.beforeResponse({
          code: 200,
          message: "Data updated successful.",
          data,
        }),
      };
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  };
};

interface DeleteHooks {
  beforeResponse?: (defaultBody: any) => any;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeDelete?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeQuery?: (
    options: any,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

export const brewAzureFuncDelete = (
  Model: any,
  hooks: DeleteHooks = {},
  message = "Data not found!",
  connector = "sequelize"
): AzureFunction => {
  const defaultHooks: DeleteHooks = {
    beforeFind: (ctx: Context, req: HttpRequest) => {},
    beforeResponse: (defaultBody: any) => defaultBody,
    beforeQuery: (defaultOptions: any, ctx: Context, req: HttpRequest) => {},
    beforeDelete: (data: any, ctx: Context, req: HttpRequest) => {},
    afterDelete: (ctx: Context, req: HttpRequest) => {},
    ...hooks,
  };
  return async (context: Context, req: HttpRequest): Promise<void> => {
    try {
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
      if ("$project" in options) {
        const project = options.$project;
        delete options.$project;
        data = await Model.findOne(options, project);
      } else {
        data = await Model.findOne(options);
      }

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

      context.res = {
        body: defaultHooks.beforeResponse({
          code: 204,
          message: "Data deleted successful.",
        }),
      };
    } catch (err) {
      responseAzureFuncError(context, err);
    }
  };
};
