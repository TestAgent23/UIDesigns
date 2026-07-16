import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnInit,
  Output
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { filter } from 'rxjs';
import { AzureUserGroupId, CampaignUserAccess, SecurityGroup } from '../core/models/userDetails';
import { AuthService } from '../core/services/auth.service';
import { DashboardService } from '../core/services/dashboard.service';
import { DataSliceService } from '../core/services/dataslice.service';
import { FabService } from '../core/services/FAB/fab-service.service';
import { LoginService } from '../core/services/login.service';
import { NavigateService } from '../core/services/navigate.service';
@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  //@HostListener('window:unload', ['$event'])
  userName: string;
  userEmail: string;
  jobTitle: string;
  @Input() loggedIn: boolean = false;
  @Input() accessPermission: { component: string }[] = [];
  @Output() logoutClicked = new EventEmitter<void>();
  azureUserGroups: AzureUserGroupId[];
  securityGroups: SecurityGroup[];
  menuActive: boolean = false;
  profilePic?: SafeResourceUrl;
  userID: string;
  userFullName: string;
  program!: string;
  userDefaultGroup: string = '';
  userDefaultGroupId: string = '';
  isChangeGroup: boolean = false;
  workspaceConnectAccess = false;

  isCreateEibActive: boolean = false;
  isProcessCreation: boolean = false;
  constructor(
    private router: Router,
    public authService: AuthService,
    private dashboardService: DashboardService,
    private domSanitizer: DomSanitizer,
    private toastr: ToastrService,
    private dsService: DataSliceService,
    private loginService: LoginService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private navigateService: NavigateService,
    private fabService: FabService

  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {


        const url = event.urlAfterRedirects;
        this.isCreateEibActive = url.includes('/create-eib') || url.includes('/eib');
        this.isProcessCreation = url.includes('/add-process') || url.includes('/file-upload') || url.includes('/add');
        // console.log('URL:', url);
        //console.log('isCreateEibActive:', this.isCreateEibActive);

        this.cdr.markForCheck();

      });
  }

  hasAccessToCreateGlobalRules: boolean = false;
  ngOnInit(): void {
    //if (sessionStorage.getItem('upn')?.split('@')[0]) {
    this.loggedIn = true;
    this.getUserGroup();
    this.reloadCurrentRoute();
    //this.router.navigate(['/dashboard']);
    //}
    this.getProfilePic();
    // this.getUsername();
    // this.userFullName = environment.userFullName;
    // this.userID = environment.userId;
    if (!this.userFullName) this.setUser();
  }
  getUserGroup() {
    this.dashboardService.getAllUserGroups().subscribe({
      next: (res) => {
        if (res) {
          this.azureUserGroups = res;
          this.getAllGroup(res);
          //console.log(this.securityGroups);
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
  getAllGroup(azureUserGroups: AzureUserGroupId[]) {

    this.dashboardService.getAllGroup().subscribe({
      next: (response) => {
        if (response && response.responseCode == 200) {
          this.securityGroups = azureUserGroups
            .map((group) => {
              const matchedGroup = response.result.find(
                (secGroup) => secGroup.securityGroupId == group.id
              );
              if (matchedGroup) {
                return {
                  securityGroupId: matchedGroup.securityGroupId,
                  securityGroupName: matchedGroup.securityGroupName,
                  userSelectedGroup: matchedGroup.userSelectedGroup,
                };
              }
              return null;
            })
            .filter((group) => group !== null);


        } else {
          this.toastr.error(
            'Security group does not exist in our database. Please contact the administrator.'
          );
          this.router.navigate(['/user-group']);
        }


        if (this.securityGroups.length > 0) {
          this.userDefaultGroup = this.securityGroups.find(
            (g) => g.userSelectedGroup == true
          )?.securityGroupName;
          if (this.userDefaultGroup) {
            sessionStorage.setItem(
              'GUID',
              this.securityGroups.find((g) => g.userSelectedGroup == true)
                ?.securityGroupId
            );
            sessionStorage.setItem(
              'UserDefaultGroup',
              this.securityGroups.find((g) => g.userSelectedGroup == true)
                ?.securityGroupName
            );

            this.fabService.loadUserAccount$().subscribe({
              next: (userAccessList: CampaignUserAccess[]) => {
                if (userAccessList.length > 0) {
                  console.log('this is a fab user');
                }
              }
            });
            this.loadWorkspaceConnectAccess();

          }
          //remove logic to add first user sec group from azure when sec group is not found in database
          else {
            this.dashboardService.saveUserGroup(this.securityGroups[0]?.securityGroupId).subscribe({
              next: (response) => {
                sessionStorage.setItem(
                  'GUID',
                  this.securityGroups[0]?.securityGroupId
                );
                this.userDefaultGroup = this.securityGroups[0]?.securityGroupName;
                //call fillcache
                this.dsService.fillCache();
                this.loadWorkspaceConnectAccess();

                // window.location.reload();


              },
              complete: () => {
                //this.toastr.success('Security group was assigned!');
                window.location.reload();
                //this.router.navigate(['/dashboard']);
              }
            });
          }
        } else {
          this.toastr.error(
            'Security group does not exist in our database. Please contact the administrator.'
          );
          this.router.navigate(['/user-group']);
        }
        //console.log(this.securityGroups);
      },
      error: (error) => {
        console.error(error);
        this.toastr.error(
          'Security group does not exist in our database. Please contact the administrator.'
        );
        this.router.navigate(['/user-group']);
      },
    });
  }

  private loadWorkspaceConnectAccess(): void {
    this.authService.getWorkspaceConnectAccess().subscribe({
      next: (response) => {
        this.workspaceConnectAccess = response?.responseCode === 200 && response.result === true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.workspaceConnectAccess = false;
        this.cdr.markForCheck();
      },
    });
  }
  changeGroup() {
    this.isChangeGroup = true;
    console.log('model displaying');
  }

  closeModal() {
    this.isChangeGroup = false;
  }
  updateGroup(groupId: string) {
    if (groupId) {
      this.userDefaultGroup = this.securityGroups.find(
        (x) => x.securityGroupId == groupId
      )?.securityGroupName;
      sessionStorage.setItem('GUID', groupId);
      this.dashboardService.saveUserGroup(groupId).subscribe({
        next: (response) => {
          //call again the fillcache
          this.dsService.fillCache();
          console.log(response);
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          this.toastr.success('Security group changed successfully!');
          window.location.reload();
        },
      });
      this.isChangeGroup = false;
    }
  }
  logout() {
    this.loginService.userLogout(sessionStorage.getItem('userId'));
    localStorage.removeItem('DIApiToken');
    localStorage.clear();
    sessionStorage.clear();
    this.logoutClicked.emit();
    this.authService.logout();
  }

  unloadHandler() {
    window.sessionStorage.clear();
  }
  openStatusDetails(id: string): void {
    this.router.navigate(['/file-processing-status', id]);
  }
  menu() {
    if (this.menuActive == false) {
      this.menuActive = true;
    } else this.menuActive = false;
  }
  setUser() {
    this.dashboardService.getUserProfile().subscribe({
      next: (res) => {
        if (res) {
          this.userFullName = res.displayName;
          this.userName = res.displayName;
          this.userEmail = res.mail;
          this.jobTitle = res.jobTitle;
        }
      },
      error: (error) => {
        console.error(error);
      },
    });
  }
  getProfilePic() {
    try {
      this.dashboardService.getProfilePic().subscribe({
        next: (res: any) => {
          var urlCreator = window.URL || window.webkitURL;
          this.profilePic = this.domSanitizer.bypassSecurityTrustResourceUrl(
            urlCreator.createObjectURL(res)
          );
        },
        error: (error) => {
          this.profilePic = 'profile.png';
        },
      });
    } catch { }
  }
  reloadCurrentRoute() {
    if (this.router.url === '/' || this.router.url === '/dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }
    const currentUrl = this.router.url.split('?')[0]; // strip query string
    const queryParams = { ...this.route.snapshot.queryParams };

    this.router.navigate([currentUrl], { queryParams });
  }

  hasAccess(comp: string) {
    //if(!this.accessPermission) return false;
    return this.accessPermission?.find(x => x.component === comp);
  }
  isPdmOpen = false;
  togglePdm(evt: MouseEvent) {
    evt.preventDefault(); //stop default <a> behaviour
    evt.stopPropagation();
    this.isPdmOpen = !this.isPdmOpen;
  }


}
