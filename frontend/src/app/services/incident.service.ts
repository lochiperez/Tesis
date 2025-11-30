import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Incident {
  id?: string;
  type: 'Accidente' | 'Ruta en mal estado' | 'Retención' | 'Obra en ruta' | 'Animales sueltos' | 'Complicación climatica';
  lat: number;
  lng: number;
  timestamp: Date;
  userId: string;
  description?: string;
  upvotes?: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
}

export interface VoteResponse {
  success: boolean;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private apiUrl = 'http://localhost:4000/api/incidents';

  constructor(private http: HttpClient) { }

  reportIncident(incident: Incident): Observable<any> {
    return this.http.post(this.apiUrl, incident);
  }

  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(this.apiUrl);
  }

  deleteIncident(incidentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${incidentId}`);
  }

  getIncidentsByArea(lat: number, lng: number, radius: number): Observable<Incident[]> {
    return this.http.get<Incident[]>(`${this.apiUrl}/area?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  getIncidentesByUser(userId:string): Observable<Incident[]>{
    return this.http.get<Incident[]>(`${this.apiUrl}/user/${userId}`);
  }

  upvoteIncident(incidentId: string, userId: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/${incidentId}/upvote`, { userId });
  }

  downvoteIncident(incidentId: string, userId: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/${incidentId}/downvote`, { userId });
  }

  removeVote(incidentId: string): Observable<VoteResponse> {
    return this.http.delete<VoteResponse>(`${this.apiUrl}/${incidentId}/vote`);
  }
}
