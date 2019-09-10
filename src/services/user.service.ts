import { Injectable } from "@angular/core";
import { AuthenticationService } from './auth.service';
import { UserModel } from '../models/user.model';
import { Observable, of } from 'rxjs';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { map, switchMap, tap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from 'firebase';

@Injectable()
export class UserService {
  private user$: Observable<UserModel | null>;
  private col: AngularFirestoreCollection = this.db.collection('users');

  constructor(private db: AngularFirestore, private authService: AuthenticationService, private router: Router) {

    // TODO remove console logs
    this.user$ = this.authService.getUid().pipe(
      tap(uid => console.log({ uid })),
      switchMap(uid => uid ? this.col.doc(uid).valueChanges() : of(null)),
      map(user => user ? this.mapFromDatabase(user) : null),
      tap(user => console.log({ user })),
      shareReplay(1)
    );
  }

  public createUser(email: string): Promise<void> {
    return this.authService.createAccount(email)
    .then((userCredential) => this.mapToDatabase(userCredential.user))
    .then((userCredential) => this.authService.logout().then(() => userCredential))
    .catch((e) => console.log(e));
  }

  private mapFromDatabase(userData): UserModel {
    return {
      uid: userData.uid,
      name: userData.name,
      age: userData.age,
      email: userData.email
    }
  }

  public mapToDatabase(user: User): Promise<void> {
    var docRef = this.col.doc(user.uid);
    return docRef.set({
      uid: user.uid,
      email: user.email
    }).then(() => console.log('doc succesfully created'));
  }

  public isInDatabase(user: User): boolean {
    return false;
    // var docRef = this.col.doc(user.uid);
    // docRef.get()
    // .then((docSnapshot) => {
    //   if (docSnapshot.exists) {
    //     usersRef.onSnapshot((doc) => {
    //       // do stuff with the data
    //     });
    //   } else {
    //     usersRef.set({...}) // create the document
    //   }
  }

  public async updateUser(uid: string, userData): Promise<void> {
    return this.col.doc(uid).update(userData);
  }

  public getUser(): Observable<UserModel | null> {
    return this.user$;
  }
}
