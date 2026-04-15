import { LoggerService, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export class HttpMiddleware implements NestMiddleware{
    constructor(private logger:LoggerService){}

    use(req:Request,res:Response,next:NextFunction){
        const {method,originalUrl} = req
        const startTime = Date.now()
        const userId = (req as any).user.id
        res.on("finish",()=>{
            const {statusCode} = res
            const duration = Date.now() - startTime
            this.logger.log( `${method} ${originalUrl} ${statusCode} -${duration} `,"Http",)
        })
        
    }
}