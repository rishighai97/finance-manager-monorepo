import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiEndpoints.transactionService}/transaction`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('fetchAllTransactions', () => {
    it('builds the base URL from account ids and date range', async () => {
      const promise = firstValueFrom(service.fetchAllTransactions([1, 2], '2026-09-01', '2026-09-09'));

      const req = httpMock.expectOne(
        `${apiUrl}/v1/fetch_all?user_account_ids=1,2&start_date=2026-09-01&end_date=2026-09-09`
      );
      expect(req.request.method).toBe('GET');
      req.flush({ transactions: [] });

      expect(await promise).toEqual({ transactions: [] } as any);
    });

    it('appends category_ids when provided', async () => {
      const promise = firstValueFrom(service.fetchAllTransactions([1], '2026-09-01', '2026-09-09', [3, 4]));

      const req = httpMock.expectOne(
        `${apiUrl}/v1/fetch_all?user_account_ids=1&start_date=2026-09-01&end_date=2026-09-09&category_ids=3,4`
      );
      req.flush({ transactions: [] });

      expect(await promise).toEqual({ transactions: [] } as any);
    });

    it('omits category_ids entirely when the array is empty', async () => {
      const promise = firstValueFrom(service.fetchAllTransactions([1], '2026-09-01', '2026-09-09', []));

      const req = httpMock.expectOne(
        `${apiUrl}/v1/fetch_all?user_account_ids=1&start_date=2026-09-01&end_date=2026-09-09`
      );
      req.flush({ transactions: [] });

      expect(await promise).toEqual({ transactions: [] } as any);
    });

    it('appends debit_credit_indicator when provided', async () => {
      const promise = firstValueFrom(service.fetchAllTransactions([1], '2026-09-01', '2026-09-09', null, 'DR'));

      const req = httpMock.expectOne(
        `${apiUrl}/v1/fetch_all?user_account_ids=1&start_date=2026-09-01&end_date=2026-09-09&debit_credit_indicator=DR`
      );
      req.flush({ transactions: [] });

      expect(await promise).toEqual({ transactions: [] } as any);
    });
  });

  describe('fetchCurrentUserTransactions', () => {
    it('delegates to fetchAllTransactions when account ids are provided', async () => {
      const promise = firstValueFrom(service.fetchCurrentUserTransactions('2026-09-01', '2026-09-09', [1]));

      const req = httpMock.expectOne(
        `${apiUrl}/v1/fetch_all?user_account_ids=1&start_date=2026-09-01&end_date=2026-09-09`
      );
      req.flush({ transactions: [] });

      expect(await promise).toEqual({ transactions: [] } as any);
    });

    it('throws when no account ids are provided', () => {
      expect(() => service.fetchCurrentUserTransactions('2026-09-01', '2026-09-09')).toThrowError(
        'Account IDs must be provided'
      );
    });

    it('throws when given an empty account ids array', () => {
      expect(() => service.fetchCurrentUserTransactions('2026-09-01', '2026-09-09', [])).toThrowError(
        'Account IDs must be provided'
      );
    });
  });
});
