import { Component } from '@angular/core';
import { AuthenticationService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { LoginHelper } from '../login-helper.service';
import { Router, ParamMap, ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, tap, first, switchMap } from 'rxjs/operators';
import { auth } from 'firebase';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { UserModuleConfig } from 'src/users-module-config';


@Component({
  selector: 'app-login-email',
  template:  ``,
})
export class LoginEmailComponent {

  authService: AuthenticationService;
  
  routeQueryMap: Observable<ParamMap>;
  hasActivationCode$: Observable<boolean>;
  loginResult$: Observable<boolean>;
  emailFromStorage$: Observable<string>;
  didSendEmail$ = new BehaviorSubject(false);

  constructor( loginHelper: LoginHelper, activatedRoute: ActivatedRoute, private router: Router, private userModuleConfig: UserModuleConfig,
    protected localStorage: LocalStorage) {
    
    this.authService = loginHelper.getAuthService();

    this.routeQueryMap = activatedRoute.queryParamMap;
    
    // example router params
    // apiKey=abc&oobCode=xyz&mode=signIn&lang=en
    this.hasActivationCode$ = this.routeQueryMap.pipe(map(paramMap =>
      (paramMap.has('oobCode') && paramMap.has('mode') && paramMap.has('apiKey'))
    ));

    this.emailFromStorage$ = <Observable<string>>localStorage.getItem('emailForSignIn');

    this.loginResult$ = combineLatest(this.hasActivationCode$, this.emailFromStorage$).pipe(
      first(),
      switchMap(([hasActivationCode, emailFromStorage]) => {
        if(hasActivationCode && emailFromStorage) {
          return of(this.loginUser(this.router.url, emailFromStorage)).pipe(map(credentials => !!credentials));
        } else {
          return of(false);
        }
      })
    );
  }

  async submitEmail(email: string): Promise<void>{
    return await this.authService.sendLoginEmail(email)
      .then(() => {
        this.localStorage.setItem('emailForSignIn', email).toPromise();
        this.didSendEmail$.next(true);
      }).catch(err => {
        this.localStorage.removeItem('emailForSignIn').toPromise();
        console.error(err);
      });
  }
  
  private loginUser(url: string, email: string): Promise<auth.UserCredential | void>{
    return this.authService.loginWithEmail(email, url)
      .then((credentials) => {
        this.router.navigateByUrl(this.userModuleConfig.redirectAfterLogin);
        
        this.localStorage.removeItem('emailForSignIn').toPromise();
        return credentials;
      })
      .catch((e) => {
        this.localStorage.removeItem('emailForSignIn').toPromise();
        console.log('error code ' + e)
      });
  }

}
