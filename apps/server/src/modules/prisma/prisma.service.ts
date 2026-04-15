import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {Pool} from "pg"
import {PrismaPg} from "@prisma/adapter-pg"
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy,OnModuleInit {
    constructor(private configService:ConfigService){
        const pool = new Pool({
            connectionString: configService.get<string>("DATABASE_URL")
        })
        const adapter = new PrismaPg(pool)
        super({
            adapter
        })
    }

    async onModuleInit() {
    await this.$connect()
  }
  async onModuleDestroy() {
    await this.$disconnect()
  }
  async checkHealth(){
    const start = Date.now()
    try{
      await this.$queryRaw`SELECT 1;`;
      return {
        service:"Prisma",
        status:"up",
        message:"Prisma is up",
        duration: Date.now()
      }

  }catch(e){
      return {
        message:"Prisma",
        status:"Down",
        duration: Date.now()
      }
  }


}
}
