import { IProduct } from '@tht/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products') // table name
export class Product implements IProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'price_usd', type: 'int' }) // factor 100 definition
  priceUsd: number;

  @Column()
  category: string;
}
