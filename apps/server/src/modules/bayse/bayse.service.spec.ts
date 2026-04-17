import { Test, TestingModule } from '@nestjs/testing';
import { BayseService } from './bayse.service';

describe('BayseService', () => {
  let service: BayseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BayseService],
    }).compile();

    service = module.get<BayseService>(BayseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
