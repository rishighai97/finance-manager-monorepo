import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { GroupedAccount } from '../model/grouped-account';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiEndpoints.accountService}/account`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('fetchAccounts', () => {
    it('GETs the flat account list', async () => {
      const promise = firstValueFrom(service.fetchAccounts());

      const req = httpMock.expectOne(`${apiUrl}/v1/fetch_all`);
      expect(req.request.method).toBe('GET');
      req.flush([{ account_id: 1, account_name: 'HDFC' }]);

      expect(await promise).toEqual([{ account_id: 1, account_name: 'HDFC' } as any]);
    });
  });

  describe('fetchGroupedAccounts', () => {
    it('GETs the grouped account list', async () => {
      const promise = firstValueFrom(service.fetchGroupedAccounts());

      const req = httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped`);
      expect(req.request.method).toBe('GET');
      req.flush([]);

      expect(await promise).toEqual([]);
    });
  });

  describe('loadGroupedAccounts', () => {
    it('base64-prefixes each account icon and publishes the result on groupedAccounts$', (done) => {
      const grouped: GroupedAccount[] = [
        { level_1_title: 'Assets', level_2_title: 'Bank', accounts: [{ account_id: 1, account_name: 'HDFC', icon: 'raw-icon-bytes' } as any] },
      ];

      service.groupedAccounts$.subscribe((value) => {
        if (value.length === 0) {
          return; // initial BehaviorSubject value before the HTTP call resolves
        }
        expect(value[0].accounts[0].icon).toBe('data:image/png;base64,raw-icon-bytes');
        done();
      });

      service.loadGroupedAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped`).flush(grouped);
    });

    it('does not throw when the fetch fails (logs the error instead)', () => {
      expect(() => {
        service.loadGroupedAccounts();
        httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped`).flush('error', { status: 500, statusText: 'Server Error' });
      }).not.toThrow();
    });
  });

  describe('getFirstAccountId', () => {
    it('returns null before any accounts have been loaded', () => {
      expect(service.getFirstAccountId()).toBeNull();
    });

    it('returns the first account id of the first group once loaded', () => {
      service.loadGroupedAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped`).flush([
        { level_1_title: 'Assets', level_2_title: 'Bank', accounts: [{ account_id: 42, account_name: 'HDFC', icon: 'x' }] },
      ]);

      expect(service.getFirstAccountId()).toBe(42);
    });

    it('returns null when the first group has no accounts', () => {
      service.loadGroupedAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped`).flush([
        { level_1_title: 'Assets', level_2_title: 'Bank', accounts: [] },
      ]);

      expect(service.getFirstAccountId()).toBeNull();
    });
  });
});
