import { TestBed } from '@angular/core/testing';

import { StatementUploadService } from './statement-upload.service';

describe('StatementUploadService', () => {
  let service: StatementUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatementUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
