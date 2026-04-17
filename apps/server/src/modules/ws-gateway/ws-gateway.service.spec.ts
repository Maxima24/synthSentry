import { Test, TestingModule } from '@nestjs/testing';
import { WsGatewayService } from './ws-gateway.service';

describe('WsGatewayService', () => {
  let service: WsGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsGatewayService],
    }).compile();

    service = module.get<WsGatewayService>(WsGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
