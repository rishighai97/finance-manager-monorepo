import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';

import { StatementUploaderComponent, UploadableStatement } from './statement-uploader.component';
import { StatementUploadService } from 'src/service/statement-upload.service';
import { Statement } from 'src/model/statement';

describe('StatementUploaderComponent', () => {
  let component: StatementUploaderComponent;
  let fixture: ComponentFixture<StatementUploaderComponent>;

  let uploadAllResult$: Subject<any>;
  let uploadOneResult$: Subject<any>;
  let statementUploadServiceStub: {
    uploadAllStatements: jasmine.Spy;
    uploadStatement: jasmine.Spy;
  };

  function makeStatement(requestId: string, fileName: string): Statement {
    return {
      account_id: 1,
      user_id: 1,
      user_account_id: 1,
      file_name: fileName,
      file_extension: 'xls',
      file: 'base64==',
      request_id: requestId,
    };
  }

  function makeItem(requestId: string, fileName: string): UploadableStatement {
    return { statement: makeStatement(requestId, fileName), status: 'queued' };
  }

  beforeEach(waitForAsync(() => {
    uploadAllResult$ = new Subject<any>();
    uploadOneResult$ = new Subject<any>();

    statementUploadServiceStub = {
      uploadAllStatements: jasmine.createSpy('uploadAllStatements').and.returnValue(uploadAllResult$),
      uploadStatement: jasmine.createSpy('uploadStatement').and.returnValue(uploadOneResult$),
    };

    // StatementUploaderComponent is standalone - see LogoutComponent's spec
    // for why this moved from `declarations` to `imports` (JIRA_7).
    TestBed.configureTestingModule({
      imports: [StatementUploaderComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: StatementUploadService, useValue: statementUploadServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatementUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasQueuedItems (new - drives the "Upload Statements" button, no longer gated by array-non-empty)', () => {
    it('is false when the list is empty', () => {
      expect(component.hasQueuedItems()).toBe(false);
    });

    it('is false when every item has already resolved', () => {
      component.statements = [
        { ...makeItem('r1', 'a.xls'), status: 'success' },
        { ...makeItem('r2', 'b.xls'), status: 'failed' },
      ];
      expect(component.hasQueuedItems()).toBe(false);
    });

    it('is true when at least one item is still queued', () => {
      component.statements = [
        { ...makeItem('r1', 'a.xls'), status: 'success' },
        makeItem('r2', 'b.xls'),
      ];
      expect(component.hasQueuedItems()).toBe(true);
    });
  });

  describe('uploadAllStatements (unified status model - one batch call updates each row in place)', () => {
    it('flips every queued item to uploading immediately, before the response arrives', () => {
      const item1 = makeItem('r1', 'a.xls');
      const item2 = makeItem('r2', 'b.xls');
      component.statements = [item1, item2];

      component.uploadAllStatements();

      expect(item1.status).toBe('uploading');
      expect(item2.status).toBe('uploading');
      expect(component.isUploading).toBe(true);
    });

    it('resolves each item to success/failed in place from the batch response, keeping one list', () => {
      const item1 = makeItem('r1', 'a.xls');
      const item2 = makeItem('r2', 'b.xls');
      component.statements = [item1, item2];

      component.uploadAllStatements();
      uploadAllResult$.next([
        { status: true, request_id: 'r1', transaction_count: 5, error_messages: [] },
        { status: false, request_id: 'r2', transaction_count: 0, error_messages: ['bad format'] },
      ]);

      expect(item1.status).toBe('success');
      expect(item1.transactionCount).toBe(5);
      expect(item2.status).toBe('failed');
      expect(item2.errorMessage).toBe('bad format');
      expect(component.isUploading).toBe(false);
      // Both rows stay in the one array - no separate results section.
      expect(component.statements).toEqual([item1, item2]);
    });

    it('marks every queued item failed on a network/server error', () => {
      const item1 = makeItem('r1', 'a.xls');
      component.statements = [item1];

      component.uploadAllStatements();
      uploadAllResult$.error(new Error('network down'));

      expect(item1.status).toBe('failed');
      expect(item1.errorMessage).toBe('Network or server error occurred');
      expect(component.isUploading).toBe(false);
    });

    it('does nothing when there are no queued items (e.g. all already succeeded)', () => {
      component.statements = [{ ...makeItem('r1', 'a.xls'), status: 'success' }];

      component.uploadAllStatements();

      expect(statementUploadServiceStub.uploadAllStatements).not.toHaveBeenCalled();
    });
  });

  describe('retryStatement (new - a failed row previously had no way to re-submit itself)', () => {
    it('sets the item to uploading and clears its previous error message', () => {
      const item = { ...makeItem('r1', 'a.xls'), status: 'failed' as const, errorMessage: 'bad format' };
      component.statements = [item];

      component.retryStatement(item);

      expect(item.status).toBe('uploading');
      expect(item.errorMessage).toBeUndefined();
      expect(statementUploadServiceStub.uploadStatement).toHaveBeenCalledWith(item.statement);
    });

    it('resolves to success on a successful retry', () => {
      const item = { ...makeItem('r1', 'a.xls'), status: 'failed' as const };
      component.statements = [item];

      component.retryStatement(item);
      uploadOneResult$.next({ status: true, request_id: 'r1', transaction_count: 3, error_messages: [] });

      expect(item.status).toBe('success');
      expect(item.transactionCount).toBe(3);
    });

    it('resolves back to failed on a second failure', () => {
      const item = { ...makeItem('r1', 'a.xls'), status: 'failed' as const };
      component.statements = [item];

      component.retryStatement(item);
      uploadOneResult$.error(new Error('network down'));

      expect(item.status).toBe('failed');
      expect(item.errorMessage).toBe('Network or server error occurred');
    });
  });

  describe('clearAllStatements / resetUploader (one "Clear All & Start Over" action for both pre- and post-submit)', () => {
    it('clears the list regardless of item status', () => {
      component.statements = [
        makeItem('r1', 'a.xls'),
        { ...makeItem('r2', 'b.xls'), status: 'success' },
        { ...makeItem('r3', 'c.xls'), status: 'failed' },
      ];

      component.clearAllStatements();

      expect(component.statements).toEqual([]);
    });
  });

  describe('deleteStatement / editStatement (queued-row actions, unchanged behavior on the unified array)', () => {
    it('deleteStatement removes only the item at the given index', () => {
      const item1 = makeItem('r1', 'a.xls');
      const item2 = makeItem('r2', 'b.xls');
      component.statements = [item1, item2];

      component.deleteStatement(0);

      expect(component.statements).toEqual([item2]);
    });

    it('editStatement removes the item and opens the upload modal pre-filled with its account', () => {
      const item = makeItem('r1', 'a.xls');
      component.statements = [item];
      component.groupedAccounts = [];

      component.editStatement(item, 0);

      expect(component.statements).toEqual([]);
      expect(component.isUploadModalOpen).toBe(true);
    });
  });
});
