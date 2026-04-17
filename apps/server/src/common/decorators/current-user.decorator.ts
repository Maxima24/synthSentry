import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "src/modules/auth/dto/login.dto";

export const CurrentUser = createParamDecorator(
    (data:unknown,ctx:ExecutionContext)=>{
        const req = ctx.switchToHttp().getRequest()
        return req.user as JwtPayload
    }
)