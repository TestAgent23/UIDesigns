import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from '../core/services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: false
})
export class LoginComponent implements OnInit {
  @Input() loggedIn: boolean = false;
  @Output() loginClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  isLogin: boolean = false;
  year: any;
  returnUrl: string = '';
  environment = environment;

  constructor(
    public authService: AuthService,
    private msalService: MsalService,
    private router: Router,
    private activatedRouter: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const datey = new Date();
    this.year = datey.getUTCFullYear();
    var username = environment.userId;
    if (sessionStorage.getItem('upn')?.split('@')[0]) {
      this.loggedIn = true;
    }
  }

  login() {
    this.msalService.instance.loginRedirect({
      scopes: ['User.Read'],
    });
  }

  logout() {
    this.logoutClicked.emit();
    this.authService.logout();
    sessionStorage.clear();
    //console.log("login.component.ts logout()");
  }
}
