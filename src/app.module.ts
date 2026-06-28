import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    RestaurantsModule,
    OrdersModule,
    PaymentsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: process.env.VERCEL
        ? join('/tmp', 'schema.gql')
        : join(process.cwd(), 'src/schema.gql'),
      playground: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class AppModule {}
