import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../environments/environment';
import { Statement } from '../model/statement';
import { StatementUploadService } from './statement-upload.service';

describe('StatementUploadService', () => {
  let service: StatementUploadService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiEndpoints.statementUploaderService}/statement/upload/v1/`;

  const statement: Statement = {
    account_id: 1,
    user_id: 1,
    user_account_id: 1,
    file_name: 'HDFC.xls',
    file_extension: 'xls',
    file: 'base64==',
    request_id: 'req-1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatementUploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('uploadStatement', () => {
    it('POSTs a single statement and returns the response', async () => {
      const promise = firstValueFrom(service.uploadStatement(statement));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(statement);
      req.flush({ status: true, request_id: 'req-1', transaction_count: 5, error_messages: [] });

      expect(await promise).toEqual({ status: true, request_id: 'req-1', transaction_count: 5, error_messages: [] });
    });
  });

  describe('uploadAllStatements', () => {
    it('POSTs an array of statements and returns an array of responses', async () => {
      const promise = firstValueFrom(service.uploadAllStatements([statement]));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body).toEqual([statement]);
      req.flush([{ status: true, request_id: 'req-1', transaction_count: 5, error_messages: [] }]);

      expect(await promise).toEqual([{ status: true, request_id: 'req-1', transaction_count: 5, error_messages: [] }]);
    });
  });
});
