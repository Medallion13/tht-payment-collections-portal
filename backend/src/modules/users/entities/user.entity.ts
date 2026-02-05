import { IUser } from '@tht/shared';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('users') //table name
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' }) // map from sql snake_case to ts camelCase
  fullName: string;

  // Relation with Orders
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
