import { Context, HttpRequest } from "@azure/functions";
import { APIGatewayProxyEvent } from "aws-lambda";
import { Request, Response } from "express";
export interface DynamicObject {
    [key: string]: any;
}
export interface AzureCreateHooks {
    beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterCreate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, ctx: Context, req: HttpRequest) => DynamicObject;
}
export interface ExpressCreateHooks {
    beforeCreate?: (req: Request, res: Response) => Promise<void> | void;
    afterCreate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, req: Request, res: Response) => DynamicObject;
}
export interface LambdaCreateHooks {
    beforeCreate?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    afterCreate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
}
export interface AzureFuncHooks {
    afterFunctionStart?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, context: Context, req: HttpRequest) => Promise<void> | void;
    beforeCreate?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterCreate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeDelete?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, ctx: Context, req: HttpRequest) => DynamicObject;
}
export interface ExpressFuncHooks {
    afterFunctionStart?: (req: Request, res: Response) => Promise<void> | void;
    beforeFind?: (req: Request, res: Response) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, req: Request, res: Response) => Promise<void> | void;
    beforeCreate?: (req: Request, res: Response) => Promise<void> | void;
    afterCreate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    beforeUpdate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    afterUpdate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    beforeDelete?: (data: any, req: Request, res: Response) => Promise<void> | void;
    afterDelete?: (req: Request, res: Response) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, req: Request, res: Response) => DynamicObject;
}
export interface LambdaFuncHooks {
    afterFunctionStart?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeFind?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeCreate?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    afterCreate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeUpdate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    afterUpdate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeDelete?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    afterDelete?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
}
export interface ParamsMap {
    [param: string]: ModelOptions;
}
export interface ModelOptions {
    model: any;
    hooks?: AzureFuncHooks | ExpressFuncHooks | LambdaFuncHooks;
    searchColumns?: string[];
    message?: string;
}
export interface AzureFindHooks {
    beforeResponse?: (defaultBody: DynamicObject, ctx: Context, req: HttpRequest) => DynamicObject;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, context: Context, req: HttpRequest) => Promise<void> | void;
}
export interface ExpressFindHooks {
    beforeResponse?: (defaultBody: DynamicObject, req: Request, res: Response) => DynamicObject;
    beforeFind?: (req: Request, res: Response) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, req: Request, res: Response) => Promise<void> | void;
}
export interface LambdaFindHooks {
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
    beforeFind?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, event: APIGatewayProxyEvent) => Promise<void> | void;
}
export interface LambdaFindHooks {
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
    beforeFind?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, event: APIGatewayProxyEvent) => Promise<void> | void;
}
export interface AzureUpdateHooks {
    beforeResponse?: (defaultBody: DynamicObject, ctx: Context, req: HttpRequest) => DynamicObject;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterUpdate?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, context: Context, req: HttpRequest) => Promise<void> | void;
}
export interface ExpressUpdateHooks {
    beforeResponse?: (defaultBody: DynamicObject, req: Request, res: Response) => DynamicObject;
    beforeFind?: (req: Request, res: Response) => Promise<void> | void;
    beforeUpdate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    afterUpdate?: (data: any, req: Request, res: Response) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, req: Request, res: Response) => Promise<void> | void;
}
export interface LambdaUpdateHooks {
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
    beforeFind?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeUpdate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    afterUpdate?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, event: APIGatewayProxyEvent) => Promise<void> | void;
}
export interface AzureDeleteHooks {
    beforeResponse?: (defaultBody: DynamicObject, ctx: Context, req: HttpRequest) => DynamicObject;
    beforeFind?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeDelete?: (data: any, ctx: Context, req: HttpRequest) => Promise<void> | void;
    afterDelete?: (ctx: Context, req: HttpRequest) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, context: Context, req: HttpRequest) => Promise<void> | void;
}
export interface ExpressDeleteHooks {
    beforeResponse?: (defaultBody: DynamicObject, req: Request, res: Response) => DynamicObject;
    beforeFind?: (req: Request, res: Response) => Promise<void> | void;
    beforeDelete?: (data: any, req: Request, res: Response) => Promise<void> | void;
    afterDelete?: (req: Request, res: Response) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, req: Request, res: Response) => Promise<void> | void;
}
export interface LambdaDeleteHooks {
    beforeResponse?: (defaultBody: DynamicObject, event: APIGatewayProxyEvent) => DynamicObject;
    beforeFind?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeDelete?: (data: any, event: APIGatewayProxyEvent) => Promise<void> | void;
    afterDelete?: (event: APIGatewayProxyEvent) => Promise<void> | void;
    beforeQuery?: (options: DynamicObject, event: APIGatewayProxyEvent) => Promise<void> | void;
}
