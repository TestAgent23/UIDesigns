import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_Upload_Compent } from '../../models/contextTokens';
import { APISourceExport } from '../../models/APISource/drawFlow';
import { environment } from '../../../environments/environment';
import { APIResponse } from '../../models/apiResponse';
import { AdditionalSettings } from '../../models/additionalSettings';

export interface ApiRequestError {
  status: number;
  message: string;
  url: string;
  raw: any;
}


interface RequestOptions {
  headers? : Record<string, string>;
  body? : any,
  params? : Record<string, string | number | boolean>;
  context? : HttpContext;
  contentType? : 'json' | 'form-data' | 'x-www-form-urlencoded';
}

@Injectable({
  providedIn: 'root',
})
export class ApiSourceService {
  constructor(
    private http: HttpClient
  ) { }

  private baseUrl = environment.apiEndpoint;
  
  setHttpsRequestHeaders(apiVersion: string): HttpHeaders {
    let objHttpHeaders = new HttpHeaders();
    objHttpHeaders = objHttpHeaders.append(
      'Authorization',
      `Bearer ${localStorage.getItem('DIApiToken')}`
    );
    objHttpHeaders = objHttpHeaders.set(
      'Content-Type',
      'application/json; charset=utf-8'
    );
    objHttpHeaders = objHttpHeaders.set('Accept', 'application/json');
    objHttpHeaders = objHttpHeaders.set('x-tpdi-api-version', apiVersion);
    objHttpHeaders = objHttpHeaders.set('x-tpdi-api-sg', `${sessionStorage.getItem("GUID")}`);
    return objHttpHeaders;
  }

  request<T>(method: string, url: string, body?: any, headers?: HttpHeaders, queryParams?: HttpParams, startTime: number = performance.now(), 
    contentType?: 'json' | 'form-data' | 'x-www-form-urlencoded'): Observable<HttpResponse<T>> {

    // Validate URL before sending to HttpClient
    const trimmedUrl = (url || '').trim();
    if (!trimmedUrl) {
      return throwError(() => <ApiRequestError>{ status: 0, message: 'URL is required.', url: '', raw: null });
    }
    try {
      const parsed = new URL(trimmedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return throwError(() => <ApiRequestError>{ status: 0, message: 'URL must start with http:// or https://', url: trimmedUrl, raw: null });
      }
    } catch {
      return throwError(() => <ApiRequestError>{ status: 0, message: 'Invalid URL format. Please enter a valid endpoint URL.', url: trimmedUrl, raw: null });
    }

    if (contentType === 'x-www-form-urlencoded') {
      headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');
    } else if (contentType === 'form-data') {
      const formData = new FormData();
      for (const key in body) {
        formData.append(key, body[key]);
      }
      body = formData;
    } else {
      headers.set('Content-Type', 'application/json');
    }

    const options = {
      body,
      headers,
      params: queryParams,
      context: new HttpContext().set(API_Upload_Compent, true),
      observe: 'response' as const
    };

    return this.http.request<T>(method, trimmedUrl, options).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Request failed.';
        if (error.status === 0) {
          message = 'Unable to reach endpoint. Check the URL, network, and CORS settings.';
        } else if (error.status === 401) {
          message = 'Unauthorized (401). Check your authentication headers or token.';
        } else if (typeof error.error === 'string' && error.error.trim().length > 0) {
          message = error.error;
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.message) {
          message = error.message;
        }

        return throwError(() => <ApiRequestError>{
          status: error.status,
          message,
          url: trimmedUrl,
          raw: error.error ?? null
        });
      })
    );
  }

  insertNewAPISource(apiSource : APISourceExport, config : AdditionalSettings) : Observable<APIResponse<boolean>> {
      let headers: HttpHeaders = this.setHttpsRequestHeaders('4.1');
      let url = this.baseUrl + `api/ProcessConfiguration/insertNewAPISource`;
      //sessionStorage.getItem('upn').split('@')[0]
      // Construct the HttpParams object
      let params = new HttpParams();
      // if (apiSource.flpConfigurationId) {
      //   params = params.set('flpConfigurationId', apiSource.flpConfigurationId);
      // }

      var payload = {
        apiSource : apiSource,
        config : config
      }
  
      return this.http.post<APIResponse<boolean>>(url, payload, { headers: headers, params : params });
    }
}
