import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/service/user.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent  implements OnInit {

  constructor(
    private userService: UserService,
    private router: Router
    ) {}
  ngOnInit() {
    this.userService.logout().subscribe(() => {
      this.router.navigate(['/auth']);
    });
  }

  logout() {
    this.userService.logout().subscribe(() => {
      this.router.navigate(['/auth']);
    });
  }

}
