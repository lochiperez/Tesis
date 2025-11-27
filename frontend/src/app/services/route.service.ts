import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RouteQuery {
  id?: string;
  userId: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  travelMode: string;
  timestamp: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private apiUrl = 'http://localhost:4000/api/routes';

  constructor(private http: HttpClient) { }

  saveRouteQuery(routeData: RouteQuery): Observable<any> {
    return this.http.post(this.apiUrl, routeData);
  }

  getRoutes(): Observable<RouteQuery[]> {
    return this.http.get<RouteQuery[]>(this.apiUrl);
  }

  deleteRouteQuery(routeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${routeId}`);
  }
}
