import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  interface RootResponse {
    status: string;
    message: string;
    timestamp: string;
  }

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    const body = response.body as RootResponse;

    expect(body.message).toContain('running');

    expect(body).toMatchObject({
      status: 'ok',
      message: expect.stringMatching(/running/i),
    } as Record<string, unknown>); // Record -> dict[str, any]
  });
});
