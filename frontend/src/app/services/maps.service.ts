import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapsService {
  
  private directionsService = new google.maps.DirectionsService();
  private directionRenderer = new google.maps.DirectionsRenderer();

  constructor() { }

  getUserLocation():Promise<any>{
    return new Promise( (resolve, reject)=>{      
      let center
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        (position)=>{
          resolve(center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
      (error)=>{
        console.error('Error al obtener la ubicación: ', error);
        reject(error)
      }
      )
    } else {
      console.log('Geolocalización no soportada por este navegador')
    }
    })
}

calculateRoute(map: google.maps.Map,
  origin: {lat:number, lng:number},
  destination: {lat:number, lng:number}):Promise<google.maps.DirectionsResult>{
return new Promise((resolve, reject)=>{
  this.directionRenderer.setMap(map);

  this.directionsService.route(
    {origin, destination, travelMode: google.maps.TravelMode.DRIVING},
    (result, status)=>{
      if(status === 'OK' && result){
        this.directionRenderer.setDirections(result);
        resolve(result)
      } else {
        reject(`Error al calcular la ruta: ${status}`)
      }
    }
  )
})
}

clearRoute(){
  this.directionRenderer.set('directions', null)
}

}
