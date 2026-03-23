import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsersService } from './users.service';

export interface PendingTransaction {
  Pending: number;
  Sites: number;
  Withdrawan: number;
  Deposit: number;
  managerId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PendingTransactionService {
  constructor(
    private http: HttpClient,
    private usersService: UsersService
  ) {}

  getPendingTransactions(managerId: string): Observable<any> {
    const data = { managerId };
    return this.usersService.Post('pending-transactions', data);
  }

  updateTransactionStatus(transactionId: string, status: string): Observable<any> {
    const data = { transactionId, status };
    return this.usersService.Post('update-transaction-status', data);
  }

  getTransactionSummary(managerId: string): Observable<any> {
    const data = { managerId };
    return this.usersService.Post('transaction-summary', data);
  }
}
