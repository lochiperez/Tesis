import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_KEY } from '../../environments/environment'
@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'http://localhost:4000/api/weather'

  constructor(private http:HttpClient) { }

  getWeather(lat:number, lon:number){
    return this.http.get(`${this.apiUrl}?lat=${lat}&lon=${lon}`)
  }


}
