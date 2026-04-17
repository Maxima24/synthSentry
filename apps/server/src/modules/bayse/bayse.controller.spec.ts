import { Test, TestingModule } from '@nestjs/testing';
import { BayseController } from './bayse.controller';
import { BayseService } from './bayse.service';

describe('BayseController', () => {
  let controller: BayseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BayseController],
      providers: [BayseService],
    }).compile();

    controller = module.get<BayseController>(BayseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
