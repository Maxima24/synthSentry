import { createParamDecorator, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy} from "passport-jwt"
import { LoggerService } from "src/logger/logger.service";
import { JwtPayload } from "src/modules/auth/dto/login.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy,"jwt"){
   constructor( private readonly configService:ConfigService,
    private LoggerService:LoggerService
   ){
    const secret = configService.get<string>('JWT_SECRET');

if (!secret) {
  throw new Error('JWT_SECRET is not defined');
}
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
   }
   async validate(payload: JwtPayload) {
    this.LoggerService.log(`${payload}`,"JwtValidate",payload)
    // whatever you attach here becomes available as req.user
    return { id: payload.id, email: payload.email,role:payload.role };
  }

}

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err || !user) {
      const message = info?.message || 'Invalid or missing token';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
