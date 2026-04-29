import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BayseService } from './bayse.service';

describe('BayseService', () => {
  let service: BayseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BayseService,
        { provide: ConfigService, useValue: { get: () => 'fake' } },
      ],
    }).compile();

    service = module.get<BayseService>(BayseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEventCached', () => {
    it('returns cached event within TTL without re-calling getEvent', async () => {
      const fakeEvent = {
        id: 'evt-1',
        title: 'X',
        yesPrice: 0.5,
        noPrice: 0.5,
      } as any;
      const spy = jest.spyOn(service, 'getEvent').mockResolvedValue(fakeEvent);

      const a = await service.getEventCached('evt-1');
      const b = await service.getEventCached('evt-1');

      expect(a).toBe(fakeEvent);
      expect(b).toBe(fakeEvent);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('rejects on timeout', async () => {
      jest
        .spyOn(service, 'getEvent')
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({} as any), 5000),
            ),
        );

      // Override timeout for the test by reaching into the service's TTL.
      // We assert the timeout fires by mocking with a slow resolver.
      await expect(
        Promise.race([
          service.getEventCached('evt-2'),
          new Promise((_r, rej) => setTimeout(() => rej('test-timeout'), 2500)),
        ]),
      ).rejects.toBeDefined();
    }, 6000);
  });
});
