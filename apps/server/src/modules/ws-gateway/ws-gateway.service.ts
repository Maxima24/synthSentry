import { Injectable } from '@nestjs/common';
import { CreateWsGatewayDto } from './dto/create-ws-gateway.dto';
import { UpdateWsGatewayDto } from './dto/update-ws-gateway.dto';

@Injectable()
export class WsGatewayService {
  create(createWsGatewayDto: CreateWsGatewayDto) {
    return 'This action adds a new wsGateway';
  }

  findAll() {
    return `This action returns all wsGateway`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wsGateway`;
  }

  update(id: number, updateWsGatewayDto: UpdateWsGatewayDto) {
    return `This action updates a #${id} wsGateway`;
  }

  remove(id: number) {
    return `This action removes a #${id} wsGateway`;
  }
}
