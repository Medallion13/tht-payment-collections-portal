import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Payment flow(E2E)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Post /api/payment/quote', () => {
    it('should return COP amount for valid USD amount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payment/quote')
        .send({ amount: 300 })
        .expect(201);

      // Verify structure
      expect(response.body).toHaveProperty('finalAmount');
      expect(response.body).toHaveProperty('quoteId');
      expect(response.body).toHaveProperty('exchangeRate');

      //verify values have sense
      expect(response.body.finalAmount).toBeGreaterThan(0);
      expect(response.body.exchangeRate).toBeGreaterThan(0);
      expect(typeof response.body.quoteId).toBe('string');
    });

    it('should reject invalid quote requests', async () => {
      // Negative
      await request(app.getHttpServer())
        .post('/api/payment/quote')
        .send({ amount: -100 })
        .expect(400);

      // Missing
      await request(app.getHttpServer()).post('/api/payment/quote').send({}).expect(400);
    });
  });
});
