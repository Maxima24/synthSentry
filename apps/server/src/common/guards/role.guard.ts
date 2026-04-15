import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export class RoleGuard implements CanActivate{
    constructor(private reflector:Reflector){

    }
    canActivate(context:ExecutionContext){
     const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles",[
        context.getHandler(),
        context.getClass()
     ])
     if(!requiredRoles) return true;
     const user = context.switchToHttp().getRequest()
     return requiredRoles.includes(user.role)
    }
}