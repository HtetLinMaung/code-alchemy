import { Request, Response } from "express";
export declare const expressStreamMedia: (filepath: string, req: Request, res: Response) => Response<any, Record<string, any>>;
