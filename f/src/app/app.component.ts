import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute, NavigationError, Router } from '@angular/router';
import { environment } from './environments/environment';
import { AuthService } from './core/services/auth.service';
import { LoginService } from './core/services/login.service';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { filter, Subject, takeUntil } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';
import { TokenService } from './core/services/token.service';
// #region Sharepoint Workspace - AY
import { SharePointUserAuthService } from './workspace-connect/services/sharepoint-user.service';
// #endregion

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  @Input() loggedIn: boolean = false;
  accessPermission: { component: string }[] = [];
  private readonly _destroying$ = new Subject<void>();
  title = 'DataIngestion';
  isLogin = false;
  isLoad = false;
  somethingWentWrong = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private loginService: LoginService,
    private msalService: MsalService,
    private broadcastService: MsalBroadcastService,
    private tokenService: TokenService,
    // #region Sharepoint Workspace - AY
    private sharePointAuth: SharePointUserAuthService,
    // #endregion
  ) {
    this.router.events.subscribe(event => {
      // if(event instanceof NavigationError){
      //   debugger;
      //   console.error('Routing error:', event.error);
      // }
    })
  }

  ngOnInit(): void {
    //fix for clickjacking
    if (window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
    try {
      this.broadcastService.inProgress$
        .pipe(
          filter(
            (status: InteractionStatus) => status === InteractionStatus.None
          ),
          takeUntil(this._destroying$)
        )
        .subscribe(() => {
          this.setLoginDisplay();
        });
    } catch (error) {
      console.log(error);
    }

    
  }
  setLoginDisplay() {
    this.isLogin = this.msalService.instance.getAllAccounts().length > 0;
    if (this.isLogin) {
      this.loginService.setCurrentUser().then((val: boolean) => { if (val) this.onUserLogin(); });
    } else {
      this.isLoad = false;
    }
  }
  onUserLogin() {
    this.loginService.authenticate().subscribe(async (res: any) => {
      if (res.responseCode == 200 && res.responseMessage[0] == 'Success') {
        //console.log(res)
        const token = res.result.token;
        //this.setDefaultUserGroup(token);
        //will now use localStorage 
        localStorage.setItem('DIApiToken', token);
        this.tokenService.setToken(token);
        let groupId = res.result?.securityGroups?.find((g) => g.userSelectedGroup == true)
          ?.securityGroupId
        if (groupId)
          sessionStorage.setItem('GUID', groupId);
        else
          sessionStorage.setItem('GUID', res.result?.securityGroups[0]?.securityGroupId);
        const time = new Date();
        sessionStorage.setItem('tokenTime', time.toString());

        this.accessPermission = res.result?.pageAccess;

        // #region Sharepoint Workspace - AY
        const account =
          this.msalService.instance.getActiveAccount() ??
          this.msalService.instance.getAllAccounts()[0];
        if (account && this.sharePointAuth.isConfigured) {
          try {
            await this.sharePointAuth.syncFromMsalAccount(account);
          } catch (err) {
            console.warn('SharePoint auth sync skipped.', err);
          }
        }
        // #endregion

        setTimeout(() => {
          if (!sessionStorage.getItem("GUID")) window.location.reload();
          this.isLoad = true;
          this.isLogin = true;
        }, 1000);
      } //else this.onUserLogin();
    });
  }
  setDefaultUserGroup(token: string) {
    this.loginService.getUserGroup(token).subscribe({
      next: (response) => {
        if (response && response.responseCode == 200) {
          console.log(response);
          let groupId = response.result.find((g) => g.userSelectedGroup == true)
            ?.securityGroupId
          if (groupId)
            sessionStorage.setItem(
              'GUID',
              groupId
            ); else sessionStorage.setItem(
              'GUID',
              response.result[0]?.securityGroupId
            );
        }
      }
    });
  }
  login() {
    this.authService.login();
    this.isLogin = this.authService.loggedIn;
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.authService.logout();
    this.isLogin = false;
  }
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}