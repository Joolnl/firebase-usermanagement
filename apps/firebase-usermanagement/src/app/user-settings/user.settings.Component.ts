import { AuthenticationService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Observable, Subscription } from 'rxjs';
import { UserModel } from '../../models/user.model';
import { tap } from 'rxjs/operators';
import { Component, OnDestroy, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { ToasterService } from 'angular2-toaster';

@Component({
  selector: 'app-user-settings',
  templateUrl: '../user-settings/user.settings.component.html',
  styleUrls: ['../user-settings/user.settings.component.css'],
})

export class UserSettingsComponent implements OnDestroy  {

  private currentUser$: Observable<UserModel>;
  public form: FormGroup;

  @Input('formGroup') data: FormGroup;

  private subscriptions: Subscription[] = [];

  constructor(private authService: AuthenticationService, 
    private userService: UserService, 
    public formBuilder: FormBuilder,
    private toasterService: ToasterService)
  {
    this.form = formBuilder.group ({
      'uid' : new FormControl() ,
    });
    this.currentUser$ = this.userService.getCurrentUser().pipe(
      tap (user => { this.form.patchValue(user)}),
    );
  }

  /**
     * Sends a `FormGroup` of user data to the firebase database
     * If the key doens't exist in the db it will be created
     * empty data will not be changed
     * 
     * @usageNotes
     * sends a formgroup to the database
     * ```
     * var data = formBuilder.group ({
     *  'name' : someData,
     *  'age' : moreData,
     * })
     * updateAllDataWith(data);
     * ```
     */
  public updateAllDataWith(data: FormGroup): Promise<void> {
    return this.userService.updateUser(this.form.value.uid, data.value)
    .then(() => {
      this.toasterService.pop('succes', 'update succesfull', '')

      // this.toasterService.popToaster('succes', 'update succesfull', '')
    }).catch((err) => console.log(err));
  }

  public updateAllData(keys: string[], values: any[]): Promise<void>{
    const data = this.formBuilder.group ({});

    for(var i = 0; i < keys.length; i++){
      data.addControl(keys[i], new FormControl());
      data.patchValue({ [keys[i]] : values[i]})
    }
    return this.updateAllDataWith(data);
  }

  public updateSingleValue(key: string, data: any): Promise<void>{
    this.form.addControl( key , new FormControl());
    this.form.patchValue({ key : data })
    return this.updateAllDataWith(this.form);
  }

  public sendResetPasswordMail(): void {
    // return this.authService.getAuthState().pipe( map((user) => this.authService.sendChangePasswordLink(user.email)))
    this.subscriptions.push(this.authService.getAuthState().subscribe((user) => this.authService.sendChangePasswordLink(user.email)));
  }

  public deleteAccount(): void {
    this.authService.deleteAccount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(element => {
      element.unsubscribe();
    });
  }
}