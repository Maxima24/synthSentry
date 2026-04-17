import { Test, TestingModule } from '@nestjs/testing';
import { WsGatewayGateway } from './ws-gateway.gateway';
import { WsGatewayService } from './ws-gateway.service';

describe('WsGatewayGateway', () => {
  let gateway: WsGatewayGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsGatewayGateway, WsGatewayService],
    }).compile();

    gateway = module.get<WsGatewayGateway>(WsGatewayGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
