import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity.js';

@Injectable()
export class PaymentsService {
  constructor(@InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>) {}

  findAll(): Promise<Payment[]> {
    return this.paymentsRepo.find({ order: { date: 'DESC' } });
  }
}
