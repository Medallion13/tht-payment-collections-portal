/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { CreatePaymentResponseDto } from '../src/modules/payment/dto/create-payment-response.dto';
import { QuoteResponseDto } from '../src/modules/payment/dto/quote-response.dto';

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

  describe('POST /api/payment/quote', () => {
    it('should return COP amount for valid USD amount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payment/quote')
        .send({ amount: 10000 }) // factor 100
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

  describe('POST /api/payment/process', () => {
    it('Should create a payment with valid user data', async () => {
      // Get the quote
      const quoteRes = await request(app.getHttpServer())
        .post('/api/payment/quote')
        .send({ amount: 10000 }) // factor 100
        .expect(201);
      const { quoteId } = quoteRes.body as QuoteResponseDto;

      // Create the payment
      const paymentRes = await request(app.getHttpServer())
        .post('/api/payment/process')
        .send({
          quoteId,
          fullName: 'John Doe',
          documentType: 'CC',
          document: '123456789',
          email: 'test@example.com',
          cellPhone: '+575555678987',
        })
        .expect(200);

      expect(paymentRes.body).toHaveProperty('userId');
      expect(paymentRes.body).toHaveProperty('paymentId');
      expect(paymentRes.body).toHaveProperty('paymentLink');
      expect(paymentRes.body).toHaveProperty('status');

      expect(paymentRes.body.quoteId).toBe(quoteId);
    });

    it('should reject invalid payment requests', async () => {
      // Missing quoteId
      await request(app.getHttpServer())
        .post('/api/payment/process')
        .send({
          fullName: 'John Doe',
          documentType: 'CC',
          document: '123456789',
          email: 'test@example.com',
          cellPhone: '+575555678987',
        })
        .expect(400);

      // Invalid email format
      await request(app.getHttpServer())
        .post('/api/payment/process')
        .send({
          quoteId: 'some-quote-id',
          fullName: 'John Doe',
          documentType: 'CC',
          document: '123456789',
          email: 'invalid-email',
          cellPhone: '+575555678987',
        })
        .expect(400);

      // Invalid documentType
      await request(app.getHttpServer())
        .post('/api/payment/process')
        .send({
          quoteId: 'some-quote-id',
          fullName: 'John Doe',
          documentType: 'INVALID',
          document: '123456789',
          email: 'test@example.com',
          cellPhone: '+575555678987',
        })
        .expect(400);

      // Empty request
      await request(app.getHttpServer()).post('/api/payment/process').send({}).expect(400);
    });
  });

  describe('Get /api/payment/status/:id', () => {
    let existingPaymentId: string;

    beforeAll(async () => {
      // Setup: crear quote + payment UNA vez para este bloque
      const quoteRes = await request(app.getHttpServer())
        .post('/api/payment/quote')
        .send({ amount: 10000 });

      const { quoteId } = quoteRes.body as QuoteResponseDto;

      const paymentRes = await request(app.getHttpServer()).post('/api/payment/process').send({
        quoteId,
        fullName: 'Status Test User',
        documentType: 'CC',
        document: '888888888',
        email: 'status-test@example.com',
        cellPhone: '+573001234567',
      });

      existingPaymentId = (paymentRes.body as CreatePaymentResponseDto).paymentId;
    });

    it('should get payment status by valid ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payment/status/${existingPaymentId}`)
        .expect(200);

      // Estructura mínima para ConfirmationPage
      expect(response.body).toHaveProperty('paymentId', existingPaymentId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('amount');
      expect(response.body).toHaveProperty('currency');
    });

    it('should return 404 for non-existent payment ID', async () => {
      await request(app.getHttpServer())
        .get('/api/payment/status/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/payment/balances', () => {
    it('should return USD and COP balances', async () => {
      const response = await request(app.getHttpServer()).get('/api/payment/balances').expect(200);

      expect(response.body).toHaveProperty('usd');
      expect(response.body).toHaveProperty('cop');
      expect(typeof response.body.usd).toBe('number');
      expect(typeof response.body.cop).toBe('number');
    });
  });
});
