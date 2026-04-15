import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/buyer.dto';
import * as bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class AuthService {
    constructor ( private readonly db:PrismaService,
        private jwt:JwtService,
        private configService:ConfigService,
        private readonly logger:LoggerService,
    ){}
    public async registerUser(body:SignupDto){
        const {email,name,password} = body


    
            if(!email || !password|| ! name ){
                this.logger.warn("FIll in all Field","Auth",{
                    email,name
                })
             throw new BadRequestException("Fill in all fields")
            }
         
        
               const hashedPwd = await bcrypt.hash(password,10)
         return await this.db.$transaction(async(tx)=>{
            if(!email){
            throw new BadRequestException("Fill in the email Field")
        }
        const user=  await tx.user.findFirst({
            where:{
               email:email
              
            }
        })
        if(user){
            throw new BadRequestException("This user already exists Login ")
        }

           const newUser = await tx.user.create({
            data:{
                email:email,
                name:name,
                password: hashedPwd,
            },
            select:{
                id:true,
                role:true,
                name:true,
                email:true,
            },
           
           })
        
        
           const payload = {
            email: newUser.email, id:newUser.id,role:newUser.role
           }
           const accessToken = this.jwt.sign(payload)
           const refreshToken = this.jwt.sign(payload,{
            secret:this.configService.get("JWT_SECRET")!,
            expiresIn:  "7d"
           })
           this.logger.logAuthEvent("Register",newUser?.id,{
            email:newUser.email,
           })

           return {
            message: "User created Successfully",
            data:{
                ...newUser,
                accessToken,
                refreshToken
            }
           }
        
        })
        



       
    }


     public async getUser(userId:string){
            if(!userId){
                this.logger.warn("User id Must not be blank","Auth",{
                    userId
                })
                throw new BadRequestException("User id Must not be blank")
            }
            const user = await this.db.user.findFirst({
                where:{
                    id:userId
                },
                omit:{
                    createdAt:true,
                    updatedAt:true
                }
            })
            if(!user){
                this.logger.warn("User not found","Auth")
                throw new NotFoundException("User not found")
            }

            return {
                message:"User details retrieval successful",
                data:{
                    ...user
                }
            }
            
        }
    public async loginUser(body:LoginDto){
       const {password:oldPwd,email} = body

       if(!email && !oldPwd){
        this.logger.warn("Email or phoneno must exist,","Auth")
        throw new BadRequestException("Email or phoneno must exist")
       }
       const user = await this.db.user.findFirst({
        where:{
           email
        },
        omit:{
           createdAt:true,
           updatedAt:true
        },
       })
       if(!user){
        this.logger.warn("User does not exist","Auth",{
            email,
        })
            throw new NotFoundException("User Does not exist")
       }
       const pwdMatch = await bcrypt.compare(oldPwd,user.password)
       if(!pwdMatch){
        this.logger.warn("Ivalid credentials","Auth",{
            userId:user.id,
            email:user.email
        })
        throw new BadRequestException("Invalid Credentials")

       }
    
   const payload = {
            email: user.email, id:user.id,role:user.role
           }
           const accessToken = this.jwt.sign(payload)
           const refreshToken = this.jwt.sign(payload,{
            secret:this.configService.get("JWT_SECRET")!,
            expiresIn:  "7d"
           })
           this.logger.logAuthEvent("login",user.id,{
            email:user.email
           })
           return {
            message: "Login Successful",
            data:{
                ...user,
                accessToken,
                refreshToken
            }
           }
    }
   
}
