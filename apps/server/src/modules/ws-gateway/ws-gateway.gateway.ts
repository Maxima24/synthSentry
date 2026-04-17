import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { WsGatewayService } from './ws-gateway.service';
import { CreateWsGatewayDto } from './dto/create-ws-gateway.dto';
import { UpdateWsGatewayDto } from './dto/update-ws-gateway.dto';

@WebSocketGateway()
export class WsGatewayGateway {
  constructor(private readonly wsGatewayService: WsGatewayService) {}

  @SubscribeMessage('createWsGateway')
  create(@MessageBody() createWsGatewayDto: CreateWsGatewayDto) {
    return this.wsGatewayService.create(createWsGatewayDto);
  }

  @SubscribeMessage('findAllWsGateway')
  findAll() {
    return this.wsGatewayService.findAll();
  }

  @SubscribeMessage('findOneWsGateway')
  findOne(@MessageBody() id: number) {
    return this.wsGatewayService.findOne(id);
  }

  @SubscribeMessage('updateWsGateway')
  update(@MessageBody() updateWsGatewayDto: UpdateWsGatewayDto) {
    return this.wsGatewayService.update(updateWsGatewayDto.id, updateWsGatewayDto);
  }

  @SubscribeMessage('removeWsGateway')
  remove(@MessageBody() id: number) {
    return this.wsGatewayService.remove(id);
  }
}
