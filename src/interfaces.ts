import { Context, HttpRequest } from "@azure/functions";

export interface DynamicObject {
  [key: string]: any;
}

export interface CreateHooks {
  beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  afterCreate?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  beforeResponse?: (
    defaultBody: DynamicObject,
    ctx: Context,
    req: HttpRequest
  ) => DynamicObject;
}

export interface AzureFuncHooks {
  afterFunctionStart?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeQuery?: (
    options: DynamicObject,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  afterCreate?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
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
  beforeDelete?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeResponse?: (
    defaultBody: DynamicObject,
    ctx: Context,
    req: HttpRequest
  ) => DynamicObject;
}

export interface ParamsMap {
  [param: string]: ModelOptions;
}
export interface ModelOptions {
  model: any;
  hooks?: AzureFuncHooks;
  searchColumns?: string[];
  message?: string;
}

export interface FindHooks {
  beforeResponse?: (
    defaultBody: DynamicObject,
    ctx: Context,
    req: HttpRequest
  ) => DynamicObject;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeQuery?: (
    options: DynamicObject,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

export interface UpdateHooks {
  beforeResponse?: (
    defaultBody: DynamicObject,
    ctx: Context,
    req: HttpRequest
  ) => DynamicObject;
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
    options: DynamicObject,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

export interface DeleteHooks {
  beforeResponse?: (
    defaultBody: DynamicObject,
    ctx: Context,
    req: HttpRequest
  ) => DynamicObject;
  beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeDelete?: (
    data: any,
    ctx: Context,
    req: HttpRequest
  ) => Promise<void> | void;
  afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
  beforeQuery?: (
    options: DynamicObject,
    context: Context,
    req: HttpRequest
  ) => Promise<void> | void;
}

export interface MongooseSchemaIndex {
  fields: DynamicObject;
  options: DynamicObject;
}
