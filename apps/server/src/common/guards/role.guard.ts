import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { PrismaService } from "src/modules/prisma/prisma.service";

export class RoleGuard implements CanActivate{
    constructor(private reflector:Reflector,
        private prisma:PrismaService
    ){

    }
    canActivate(context:ExecutionContext){
        
     const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles",[
        context.getHandler(),
        context.getClass()
     ])
     if(!requiredRoles) return true;
     const user = context.switchToHttp().getRequest()
     return requiredRoles.includes(user as any)
    }
}