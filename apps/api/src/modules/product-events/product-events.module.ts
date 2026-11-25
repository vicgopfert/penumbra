import { Module } from '@nestjs/common';
import { CredentialsModule } from '../auth/credentials.module';
import { ProductEventsController } from './product-events.controller';
import { ProductEventsRepository } from './product-events.repository';
import { ProductEventsService } from './product-events.service';

@Module({
  imports: [CredentialsModule],
  controllers: [ProductEventsController],
  providers: [ProductEventsService, ProductEventsRepository],
})
export class ProductEventsModule {}
