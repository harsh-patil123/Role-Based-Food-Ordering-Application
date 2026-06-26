import { Field, ID, Float, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role, Country, OrderStatus, PaymentType } from '@prisma/client';

registerEnumType(Role, { name: 'Role' });
registerEnumType(Country, { name: 'Country' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentType, { name: 'PaymentType' });

@ObjectType()
export class PaymentMethod {
  @Field(() => ID)
  id: string;

  @Field(() => PaymentType)
  type: PaymentType;

  @Field()
  label: string;

  @Field()
  isDefault: boolean;

  @Field()
  userId: string;

  @Field(() => User, { nullable: true })
  user?: any;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => Role)
  role: Role;

  @Field(() => Country, { nullable: true })
  country?: Country | null;

  @Field(() => [Order], { defaultValue: [] })
  orders?: any[];

  @Field(() => [PaymentMethod], { defaultValue: [] })
  paymentMethods?: any[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class MenuItem {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field()
  imageUrl: string;

  @Field()
  isAvailable: boolean;

  @Field()
  restaurantId: string;

  @Field(() => Restaurant, { nullable: true })
  restaurant?: any;
}

@ObjectType()
export class Restaurant {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  imageUrl: string;

  @Field(() => Country)
  country: Country;

  @Field()
  isActive: boolean;

  @Field(() => [MenuItem], { defaultValue: [] })
  menuItems?: any[];

  @Field(() => [Order], { defaultValue: [] })
  orders?: any[];
}

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  id: string;

  @Field()
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field()
  orderId: string;

  @Field(() => Order, { nullable: true })
  order?: any;

  @Field()
  menuItemId: string;

  @Field(() => MenuItem, { nullable: true })
  menuItem?: any;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field()
  userId: string;

  @Field(() => User, { nullable: true })
  user?: any;

  @Field()
  restaurantId: string;

  @Field(() => Restaurant, { nullable: true })
  restaurant?: any;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => [OrderItem], { defaultValue: [] })
  orderItems?: any[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
}
