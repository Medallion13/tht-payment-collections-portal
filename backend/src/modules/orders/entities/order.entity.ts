import { IOrder, OrderStatus } from '@tht/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('orders') // table name
export class Order implements IOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // related columns
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Transaction snapshot to save the cost of the products at transaction time
  @Column('int')
  quantity: number;

  @Column({ name: 'total_amount_usd', type: 'int' }) // factor 100
  totalAmountUsd: number;

  @Column({ name: 'total_amount_cop', type: 'int', nullable: true })
  totalAmountCop: number | null; // final price quote

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  exchangeRate: number | null; // fee

  // Audit
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string; //supra transacton ID

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
