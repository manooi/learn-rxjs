import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  BehaviorSubject,
  combineLatest,
  from,
  merge,
  Observable,
  Subject,
  throwError,
} from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  scan,
  shareReplay,
  switchMap,
  tap,
  toArray,
} from 'rxjs/operators';

import { Product } from './product';
import { Supplier } from '../suppliers/supplier';
import { SupplierService } from '../suppliers/supplier.service';
import { ProductCategoryService } from '../product-categories/product-category.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    // map((products) =>
    //   products.map(
    //     (product) =>
    //       ({
    //         ...product,
    //         price: product.price * 1.5,
    //         searchKey: [product.productName],
    //       } as Product)
    //   )
    // ),
    // tap((data) => console.log('Products: ', JSON.stringify(data))),
    catchError(this.handleError)
  );

  constructor(
    private http: HttpClient,
    private supplierService: SupplierService,
    private productCategoryService: ProductCategoryService
  ) {}

  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$,
  ]).pipe(
    map(([products, categories]) => {
      return products.map((product) => {
        return {
          ...product,
          price: product.price * 1.5,
          searchKey: [product.productName],
          category: categories.find((c) => product.categoryId === c.id).name,
        } as Product;
      });
    }),
    shareReplay(1)
  );

  private productSelectedSubject = new BehaviorSubject<number>(0);
  productSelectedAction$ = this.productSelectedSubject.asObservable();

  selectedProduct$ = combineLatest([
    this.productsWithCategory$,
    this.productSelectedAction$,
  ]).pipe(
    map(([products, selectedProductId]) =>
      products.find((product) => product.id === selectedProductId)
    ),
    tap((product) => console.log('selectedProduct', product)),
    shareReplay(1)
  );

  private productInsertedSubject = new Subject<Product>();
  productInsertedAction$ = this.productInsertedSubject.asObservable();

  productsWithAdd$ = merge(
    this.productsWithCategory$,
    this.productInsertedAction$
  ).pipe(scan((acc: Product[], value: Product) => [...acc, value]));

  // get all approach
  // selectedProductSuppliers$ = combineLatest([
  //   this.selectedProduct$,
  //   this.supplierService.suppliers$,
  // ]).pipe(
  //   map(([selectedProduct, suppliers]) =>
  //     suppliers.filter((supplier) =>
  //       selectedProduct.supplierIds.includes(supplier.id)
  //     )
  //   )
  // );

  // just in time
  selectedProductSuppliers$ = this.selectedProduct$.pipe(
    filter((selectedProduct) => Boolean(selectedProduct)),

    // every quick click
    // mergeMap((selectedProduct) =>

    // only latest one!
    switchMap((selectedProduct) =>
      from(selectedProduct.supplierIds).pipe(
        mergeMap((supplierId) =>
          this.http.get<Supplier>(`${this.suppliersUrl}/${supplierId}`)
        ),
        toArray(),
        tap((suppliers) => console.log(`product suppliers`, suppliers))
      )
    )
  );

  private fakeProduct(): Product {
    return {
      id: 42,
      productName: 'Another One',
      productCode: 'TBX-0042',
      description: 'Our new product',
      price: 8.9,
      categoryId: 3,
      // category: 'Toolbox',
      quantityInStock: 30,
    };
  }

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

  selectedProductChanged(selectedProductId: number): void {
    this.productSelectedSubject.next(selectedProductId);
  }

  addProduct(newProduct?: Product): void {
    newProduct = newProduct || this.fakeProduct();
    this.productInsertedSubject.next(newProduct);
  }
}
