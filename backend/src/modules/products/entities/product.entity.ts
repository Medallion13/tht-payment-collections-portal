import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products') // table name
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'price_usd', type: 'decimal', precision: 10, scale: 2 }) // factor 100 definition
  price_usd: number;

  @Column()
  category: string;
}
