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

  @Column({ name: 'price_usd', type: 'decimal', precision: 10, scale: 2 }) // factor 100 definition
  priceUsd: number;

  @Column()
  category: string;
}
