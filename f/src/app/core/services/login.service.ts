import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, of, ReplaySubject } from 'rxjs';
import {
  AzureUserGroup,
  AzureUserGroupId,
  SecurityGroup,
  UserDetails,
} from '../models/userDetails';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { APIResponse } from '../models/apiResponse';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseUrl = environment.apiEndpoint;
  private currentUserSource = new ReplaySubject<UserDetails | null>(1);
  currentUser$ = this.currentUserSource.asObservable();
  userGroupIds: AzureUserGroupId[];
  NTIDencrypt: any;
  result: any;
  bytes: any;
  i: any;
  wa: any;
  j: any;

  constructor(private _http: HttpClient, private router: Router) {}

  authenticate() {
    const httpHeader = {
      headers: new HttpHeaders({
        ClientId: environment.appId,
        ClientSecret: environment.clientKey,
        'x-tpdi-api-version': '1.0',
        'userId': sessionStorage.getItem('upn'),
      }),
    };
    return this._http.get(
      this.baseUrl + 'api/Account/authenticate',
      httpHeader
    );
  }
  setCurrentUser(): Promise<boolean> {
    return new Promise((res, rej) => {
    this._http
      .get<any>(environment.graphApiEndpoint + '?$select=employeeId')
      .subscribe({
        next: (response) => {
          sessionStorage.setItem('userId', response.employeeId);
        },
        error: (error) => {
          console.log(error);
        },
      });
    this._http.get<any>(environment.graphApiEndpoint).subscribe({
      next: (response) => {
        if (response) {
          sessionStorage.setItem('username', response.displayName);
          sessionStorage.setItem('userFullName', response.displayName);
          sessionStorage.setItem('emailID', response.mail);
          sessionStorage.setItem(
            'userId',
            response.userPrincipalName?.split('@')[0]
          );
          sessionStorage.setItem(
            'upn',
            response.userPrincipalName?.split('@')[0]
          );
          sessionStorage.setItem('fullUPN',response.userPrincipalName);
          sessionStorage.setItem('JobTitle', response?.jobTitle);
          res(true);
        }else res(false);
      },
      error: (error) => {
        res(false);
        console.log(error);
      },
    });
  });
  }
  onUserLogin() {
    this.authenticate().subscribe((res: any) => {
      if (res.responseCode == 200 && res.responseMessage[0] == 'Success') {

        console.log(res)


        const token = res.result.token;
        //this.setDefaultUserGroup(token);
        localStorage.setItem('DIAPItokDIApiTokenen', token);
        const time = new Date();      
        sessionStorage.setItem('tokenTime', time.toString());
        return true;
      }else return false;
    });
  }
  getToken(data: any) {
    let url = this.baseUrl + 'api/Account/GetToken';

    let objHttpHeaders = new HttpHeaders();
    objHttpHeaders = objHttpHeaders.set('x-tpdi-api-version', '1.0');
    objHttpHeaders = objHttpHeaders.set('x-tpdi-api-sg', '1.0');
    return this._http.post(url, data, { headers: objHttpHeaders });
  }

  getUserGroup(token: string) {
    const httpHeader2 = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'x-tpdi-api-version': '2.0',
        'Content-Type': 'application/json',
      }),
    };
    return this._http.get<APIResponse<SecurityGroup[]>>(
      `${
        this.baseUrl
      }api/ProcessConfiguration/SecurityGroups?loginId=${sessionStorage.getItem(
        'upn'
      )}`,
      httpHeader2
    );
  }

  userLogin(data: any) {
    let url = this.baseUrl + 'api/Account/GetToken';

    return this._http.post(url, data, undefined);
  }

  userLogout(LoginId:string){
    let url = this.baseUrl + 'api/ProcessConfiguration/UpdateLogin';

    const httpHeader2 = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('DIApiToken')}`,
        'x-tpdi-api-version': '3.0',
        'Content-Type': 'application/json',
      }),
    };

    return this._http.post(url, {'LoginId': LoginId}, httpHeader2).subscribe();
  }

  loadCurrentUser(token: string | null) {
    if (token === null) {
      this.currentUserSource.next(null);
      return of(null);
    }

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    headers = headers.set('x-tpdi-api-version', '1.0');
    //this.NTIDencrypt = this.encrypt(environment.userId);

    let lobData: any = {
      ntid: environment.userId,
    };
    sessionStorage.getItem('Upn');
    return this._http
      .post(this.baseUrl + 'api/Account/GetUserDetail', lobData, { headers })
      .pipe(
        map((user: any) => {
          if (user) {
            const userDetail: UserDetails = {
              userFullName: sessionStorage.getItem('FullName'),
              email: sessionStorage.getItem('Upn'),
              isAdmin: user.result.userDetail.isAdmin,
            } as UserDetails;

            environment.userId = sessionStorage.getItem('username');
            environment.userFullName = sessionStorage.getItem('FullName');
            environment.isAdmin = userDetail.isAdmin ? 'true' : 'false';
            this.currentUserSource.next(userDetail);
            return user.result;
          } else {
            return null;
          }
        })
      );
  }
}
