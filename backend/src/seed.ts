import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { Product } from './modules/products/entities/product.entity';
import { User } from './modules/users/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const productRepo = app.get<Repository<Product>>(getRepositoryToken(Product));

  console.log('Running seed...');

  // Default users for the implementation
  const usersData = [
    {
      email: 'dev@tht.com',
      fullName: 'ThT Developer',
    },
    {
      email: 'cliente@example.com',
      fullName: 'Common Client',
    },
  ];

  for (const userData of usersData) {
    // Check existance
    const existing = await userRepo.findOneBy({ email: userData.email });

    if (!existing) {
      const newUser = userRepo.create(userData);
      await userRepo.save(newUser);
      console.log(`User ${userData.email} created!`);
    } else {
      console.log(`User ${userData.email} already exists`);
    }
  }

  // base products for basic interaction
  const productsData = [
    {
      name: 'Keychron K2 Mechanical Keyboard',
      description: '75% layout wireless mechanical keyboard, Gateron Brown switches.',
      priceUsd: 9900,
      category: 'Peripherals',
    },
    {
      name: 'Dell UltraSharp 27" 4K',
      description: 'USB-C Hub monitor, 4K UHD IPS, 99% sRGB coverage.',
      priceUsd: 45000,
      category: 'Monitors',
    },
    {
      name: 'Herman Miller Aeron',
      description: 'Legendary ergonomic chair, Size B, graphite finish.',
      priceUsd: 120000,
      category: 'Furniture',
    },
  ];

  for (const productData of productsData) {
    // Check existance
    const existing = await productRepo.findOneBy({ name: productData.name });

    if (!existing) {
      const newProd = productRepo.create(productData);
      await productRepo.save(newProd);
      console.log(`Product ${productData.name} created!`);
    } else {
      console.log(`Product ${productData.name} already exists`);
    }
  }

  console.log('Ending seed');

  await app.close();
}

bootstrap();
