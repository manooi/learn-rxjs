import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { throwError, Observable, of } from 'rxjs';
import { Supplier } from './supplier';
import {
  catchError,
  concatMap,
  delay,
  map,
  mergeMap,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  suppliersUrl = 'api/suppliers';

  constructor(private http: HttpClient) {
    // this.supplierWithMap$.subscribe((outer) => {
    //   // console.log('map result', outer);
    //   outer.subscribe((item) => console.log('inner', item));
    // });
    // this.supplierWithConcatMap$.subscribe((outer) =>
    //   console.log(`concatMap!`, outer)
    // );
    // this.supplierWithMergeMap$.subscribe((outer) =>
    //   console.log(`mergeMap!`, outer)
    // );
    // this.supplierWithSwitchMap$.subscribe((outer) => {
    //   console.log(`switchMap!`, outer);
    // });
  }

  suppliers$ = this.http.get<Supplier[]>(this.suppliersUrl).pipe(
    tap((data) => console.log('suppliers', data)),
    shareReplay(1),
    catchError(this.handleError)
  );

  supplierWithMap$ = of(1, 2, 3).pipe(
    map((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

  supplierWithConcatMap$ = of(1, 2, 3).pipe(
    concatMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

  supplierWithMergeMap$ = of(1, 2, 3).pipe(
    mergeMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );

  supplierWithSwitchMap$ = of(1, 2, 3).pipe(
    switchMap((id) => this.http.get<Supplier>(`${this.suppliersUrl}/${id}`))
  );
  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }
}
