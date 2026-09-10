import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular/standalone';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let toastController: jasmine.SpyObj<ToastController>;
  let toastSpy: jasmine.SpyObj<HTMLIonToastElement>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    toastController = jasmine.createSpyObj('ToastController', ['create']);
    toastController.create.and.returnValue(Promise.resolve(toastSpy));

    TestBed.configureTestingModule({
      providers: [ToastService, { provide: ToastController, useValue: toastController }],
    });
    service = TestBed.inject(ToastService);
  });

  describe('showSuccess', () => {
    it('creates and presents a success-colored toast with the given message', async () => {
      await service.showSuccess('Saved successfully');

      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ message: 'Saved successfully', color: 'success' })
      );
      expect(toastSpy.present).toHaveBeenCalled();
    });
  });

  describe('showError', () => {
    it('creates and presents a danger-colored toast with the given message', async () => {
      await service.showError('Something went wrong');

      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ message: 'Something went wrong', color: 'danger' })
      );
      expect(toastSpy.present).toHaveBeenCalled();
    });
  });
});
