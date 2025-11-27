import { Component, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { IncidentReportComponent } from '../incident-report/incident-report.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { WeatherService } from '../../services/weather.service';
import { IncidentService, Incident } from '../../services/incident.service';
import { RouteService } from '../../services/route.service';
import { AuthService } from '../../services/auth.service';

interface RouteOption {
  id: string;
  travelMode: google.maps.TravelMode;
  travelModeName: string;
  distance: string;
  duration: string;
  result: google.maps.DirectionsResult;
  polylineOptions?: google.maps.PolylineOptions;
}

interface WeatherMarker {
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
}

interface IncidentMarker {
  marker: google.maps.Marker;
  infoWindow: google.maps.InfoWindow;
  incident: Incident;
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, IncidentReportComponent, UserProfileComponent],
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements AfterViewInit {

  @ViewChild('mapContainer') mapElement!: ElementRef;
  @ViewChild('originInput') originInput!: ElementRef;
  @ViewChild('destInput') destInput!: ElementRef;

  map!: google.maps.Map;
  directionsService!: google.maps.DirectionsService;
  directionsRenderers: google.maps.DirectionsRenderer[] = [];
  DirectionsRenderer: any;

  originPlace: google.maps.places.PlaceResult | null = null;
  destPlace: google.maps.places.PlaceResult | null = null;

  routeOptions: RouteOption[] = [];
  selectedRouteId: string | null = null;
  isLoadingRoutes: boolean = false;
  isBrowser: boolean = false;
  errorMessage: string = '';
  
  showIncidentReport: boolean = false;
  showUserProfile: boolean = false;
  currentMapLocation: { lat: number, lng: number } | null = null;

  weatherMarkers: WeatherMarker[] = [];
  incidentMarkers: IncidentMarker[] = [];
  isLoadingWeather: boolean = false;
  isLoadingIncidents: boolean = false;
  isSavingRoute: boolean = false;

  lat:number=0
  lng:number=0

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private weatherService: WeatherService,
    private incidentService: IncidentService,
    private routeService: RouteService,
    private authService: AuthService,
    private ngZone:NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngAfterViewInit() {
    if (!this.isBrowser) {
      return;
    }

    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
    const { Autocomplete } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
    const routesLibrary = await google.maps.importLibrary("routes") as any;
    const { DirectionsService, DirectionsRenderer } = routesLibrary;
    this.DirectionsRenderer = DirectionsRenderer;

    this.map = new Map(this.mapElement.nativeElement, {
      center: { lat: -34.6, lng: -58.4 },
      zoom: 13,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControl: false,
      fullscreenControl: false
    });

    this.directionsService = new DirectionsService();

    const originAutocomplete = new Autocomplete(this.originInput.nativeElement);
    const destAutocomplete = new Autocomplete(this.destInput.nativeElement);

    originAutocomplete.addListener('place_changed', () => {
      const place = originAutocomplete.getPlace();
      this.originPlace = place;
      this.calculateRoutes();
    });

    destAutocomplete.addListener('place_changed', () => {
      const place = destAutocomplete.getPlace();
      this.destPlace = place;
      this.calculateRoutes();
    });


    this.map.addListener('center_changed', () => {
      const center = this.map.getCenter()
      if (center) {
        this.currentMapLocation = {
          lat: center.lat(),
          lng: center.lng()
        };
      }
    });
    // Registrar función global para votación desde InfoWindows
    (window as any).voteIncident = (incidentId: string, voteType: 'up' | 'down') => {
      this.voteOnIncident(incidentId, voteType);
    };
  }

  calculateRoutes() {
    this.isLoadingRoutes = true;
    console.log('cuantas veces entra aaca? ', this.isLoadingRoutes)
    if (!this.originPlace || !this.destPlace) {
      return;
    }

    if (!this.originPlace.geometry || !this.destPlace.geometry) {
      this.errorMessage = 'Por favor, selecciona ubicaciones válidas de la lista de sugerencias.';
      return;
    }

    this.errorMessage = '';
    this.clearRoutes();

    const origin = this.originPlace.geometry.location!;
    const destination = this.destPlace.geometry.location!;

    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    };

    this.directionsService.route(request, (result, status) => {
      this.ngZone.run(()=>{

        console.log(request, 'que es request', result, status)
        if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
          this.routeOptions = result.routes.map((route, index) => {
            const leg = route.legs[0];
            const colors = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'];
            
            return {
              id: `route-${index}`,
              travelMode: google.maps.TravelMode.DRIVING,
              travelModeName: index === 0 ? 'Ruta Más Rápida' : `Alternativa ${index}`,
              distance: leg.distance?.text || 'N/A',
              duration: leg.duration?.text || 'N/A',
              result: {
                ...result,
                routes: [route]
              },
              polylineOptions: {
                strokeColor: colors[index % colors.length],
                strokeWeight: index === 0 ? 6 : 5,
                strokeOpacity: index === 0 ? 0.9 : 0.7
              }
            };
          });
          console.log(this.routeOptions, 'routeOptions')
          
          this.isLoadingRoutes = false;
          this.errorMessage = '';
          console.time('a ver')
          this.displayAllRoutes();
          console.timeEnd('a ver')
          console.log('cuantas veces entra aaca? x2 a ver que onda', this.isLoadingRoutes)
        } else {
          this.isLoadingRoutes = false;
          this.routeOptions = [];
          
          switch (status) {
            case google.maps.DirectionsStatus.NOT_FOUND:
              this.errorMessage = 'No se pudo encontrar una ruta entre el origen y el destino especificados.';
              break;
            case google.maps.DirectionsStatus.ZERO_RESULTS:
              this.errorMessage = 'No hay rutas disponibles entre estos dos puntos. Por favor, intenta con otras ubicaciones.';
              break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
              this.errorMessage = 'La solicitud de ruta no es válida. Por favor, verifica los datos ingresados.';
              break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
              this.errorMessage = 'Se ha excedido el límite de consultas. Por favor, intenta más tarde.';
              break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
              this.errorMessage = 'No se pudo procesar la solicitud de ruta.';
              break;
            case google.maps.DirectionsStatus.UNKNOWN_ERROR:
              this.errorMessage = 'Ocurrió un error desconocido. Por favor, intenta nuevamente.';
              break;
            default:
              this.errorMessage = 'No se pudo calcular la ruta. Por favor, intenta con otras ubicaciones.';
          }
          
          console.error("Directions request failed due to " + status);
        }
      });
      });
  }

  displayAllRoutes() {
    this.directionsRenderers.forEach(renderer => renderer.setMap(null));
    this.directionsRenderers = [];

    this.routeOptions.forEach((routeOption, index) => {
      const renderer = new this.DirectionsRenderer({
        map: this.map,
        directions: routeOption.result,
        suppressMarkers: index !== 0,
        polylineOptions: routeOption.polylineOptions,
        preserveViewport: index !== 0
      });

      this.directionsRenderers.push(renderer);
    });

    console.log(this.routeOptions, 'routeOption en displayAllRoutes')
  }

  selectRoute(routeOption: RouteOption) {
    this.selectedRouteId = routeOption.id;
    
    this.directionsRenderers.forEach(renderer => renderer.setMap(null));
    this.directionsRenderers = [];

    const selectedRenderer = new this.DirectionsRenderer({
      map: this.map,
      directions: routeOption.result,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: routeOption.polylineOptions?.strokeColor || '#4285F4',
        strokeWeight: 6,
        strokeOpacity: 1
      }
    });

    this.directionsRenderers.push(selectedRenderer);

    this.routeOptions.forEach((otherRoute) => {
      if (otherRoute.id !== routeOption.id) {
        const renderer = new this.DirectionsRenderer({
          map: this.map,
          directions: otherRoute.result,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#999999',
            strokeWeight: 3,
            strokeOpacity: 0.3
          },
          preserveViewport: true
        });

        this.directionsRenderers.push(renderer);
      }
    });

    this.loadWeatherForRoute(routeOption);
    this.loadIncidentsForRoute(routeOption);
  }

  // ===== WEATHER FUNCTIONALITY =====

  loadWeatherForRoute(route: RouteOption) {
    this.isLoadingWeather = true;
    this.clearWeatherMarkers();
    
    const keyPoints = this.getRouteKeyPoints(route);
    
    keyPoints.forEach(point => {
      this.weatherService.getWeather(point.lat(), point.lng()).subscribe({
        next: (data: any) => {
          this.createWeatherMarker(point, data);
        },
        error: (error) => {
          console.error('Error loading weather:', error);
        },
        complete: () => {
          this.isLoadingWeather = false;
        }
      });
    });
  }

  getRouteKeyPoints(route: RouteOption): google.maps.LatLng[] {
    const points: google.maps.LatLng[] = [];
    const leg = route.result.routes[0].legs[0];
    
    points.push(leg.start_location);
    
    const steps = leg.steps;
    const totalSteps = steps.length;
    
    for (let i = 0; i < totalSteps; i += Math.floor(totalSteps / 4)) {
      if (i > 0 && i < totalSteps - 1) {
        points.push(steps[i].end_location);
      }
    }
    
    points.push(leg.end_location);
    
    return points;
  }

  createWeatherMarker(position: google.maps.LatLng, weatherData: any) {
    const weatherIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#4A90E2" stroke="white" stroke-width="2"/>
          <text x="20" y="26" text-anchor="middle" font-size="18" fill="white">☁️</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20)
    };
    
    const marker = new google.maps.Marker({
      position: position,
      map: this.map,
      icon: weatherIcon,
      title: `Clima: ${Math.round(weatherData.main.temp)}°C`,
      zIndex: 2000
    });
    
    const infoWindow = new google.maps.InfoWindow({
      content: this.getWeatherCardContent(weatherData, position)
    });
    
    marker.addListener('click', () => {
      this.closeAllWeatherInfoWindows();
      infoWindow.open(this.map, marker);
    });
    
    this.weatherMarkers.push({ marker, infoWindow });
  }

  getWeatherCardContent(weatherData: any, position: google.maps.LatLng): string {
    const temp = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const icon = weatherData.weather[0].icon;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;
    const feelsLike = Math.round(weatherData.main.feels_like);
    const name = weatherData.name
    
    return `
      <div style="
        padding: 16px;
        min-width: 280px;
        font-family: system-ui, -apple-system, sans-serif;
        background: #14309F;
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <img 
            src="https://openweathermap.org/img/wn/${icon}@2x.png" 
            style="width: 60px; height: 60px;"
            alt="Weather icon"
          />
          <div>
            <div style="font-size: 36px; font-weight: 700; line-height: 1;">
              ${temp}°C
            </div>
            <div style="font-size: 14px; opacity: 0.9; text-transform: capitalize;">
              ${description}
            </div>
          </div>
        </div>
        
        <div style="
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="opacity: 0.9;">Sensación térmica:</span>
            <strong>${feelsLike}°C</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="opacity: 0.9;">Humedad:</span>
            <strong>${humidity}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="opacity: 0.9;">Viento:</span>
            <strong>${windSpeed} m/s</strong>
          </div>
        </div>
        
        <div style="
          font-size: 12px;
          opacity: 0.8;
          text-align: center;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.3);
        ">
          📍 ${name}
        </div>
      </div>
    `;
  }

  // ===== INCIDENT FUNCTIONALITY =====

  loadIncidentsForRoute(route: RouteOption) {
    this.isLoadingIncidents = true;
    this.clearIncidentMarkers();
    
    const bounds = this.getRouteBounds(route);
    const center = bounds.getCenter();
    const radius = this.calculateRouteRadius(bounds);
    
    this.incidentService.getIncidentsByArea(
      center.lat(),
      center.lng(),
      radius
    ).subscribe({
      next: (incidents: Incident[]) => {
        const nearbyIncidents = this.filterIncidentsNearRoute(incidents, route);
        nearbyIncidents.forEach(incident => {
          this.createIncidentMarker(incident);
        });
      },
      error: (error) => {
        console.error('Error loading incidents:', error);
      },
      complete: () => {
        this.isLoadingIncidents = false;
      }
    });
  }

  createIncidentMarker(incident: Incident) {
    const config = this.getIncidentConfig(incident.type);
    const icon = this.createIncidentIcon(incident, config);
    
    const marker = new google.maps.Marker({
      position: { lat: incident.lat, lng: incident.lng },
      map: this.map,
      icon: icon,
      title: `${config.label}: ${incident.description || 'Sin descripción'}`,
      zIndex: 1500
    });
    
    const infoWindow = new google.maps.InfoWindow({
      content: this.getIncidentCardContent(incident, config)
    });
    
    marker.addListener('click', () => {
      this.closeAllIncidentInfoWindows();
      infoWindow.open(this.map, marker);
    });
    
    this.incidentMarkers.push({ marker, infoWindow, incident });
  }

  getIncidentConfig(type: string) {
    const incidentIcons: any = {
      'Ruta en mal estado': { emoji: '🕳️', color: '#f97316', label: 'Bache' },
      'Accidente': { emoji: '🚗', color: '#dc2626', label: 'Accidente' },
      'Obra en ruta': { emoji: '🚧', color: '#eab308', label: 'Corte de Ruta' },
      'Complicación climatica': { emoji: '🌤️', color: '#3b82f6', label: 'Nieve/Hielo' },
      'Retención':{ emoji: '🚦', color: '#fc0303', label:'Retención' },
      'Animales sueltos':{ emoji:'🐄',color:'#fffb00',label:'Animales sueltos' }
    };
    return incidentIcons[type];
  }

  createIncidentIcon(incident: Incident, config: any) {
    const score = (incident.upvotes || 0) - (incident.downvotes || 0);
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="${config.color}" stroke="white" stroke-width="2"/>
          <text x="18" y="23" text-anchor="middle" font-size="16" fill="white">
            ${config.emoji}
          </text>
          ${score > 0 ? `
            <circle cx="28" cy="8" r="7" fill="#48bb78"/>
            <text x="28" y="11" text-anchor="middle" font-size="9" fill="white" font-weight="bold">
              ${score}
            </text>
          ` : ''}
        </svg>
      `),
      scaledSize: new google.maps.Size(36, 36),
      anchor: new google.maps.Point(18, 18)
    };
  }

  getIncidentCardContent(incident: Incident, config: any): string {
    const upvotes = incident.upvotes || 0;
    const downvotes = incident.downvotes || 0;
    const score = upvotes - downvotes;
    const timeAgo = this.getTimeAgo(new Date(incident.timestamp));
    
    return `
      <div style="
        padding: 16px;
        min-width: 280px;
        font-family: system-ui, -apple-system, sans-serif;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 2px solid ${config.color};
        ">
          <div style="
            font-size: 32px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${config.color}20;
            border-radius: 50%;
          ">
            ${config.emoji}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 700; color: #1a202c;">
              ${config.label}
            </div>
            <div style="font-size: 12px; color: #718096;">
              ${timeAgo}
            </div>
          </div>
        </div>
        
        ${incident.description ? `
          <div style="
            margin-bottom: 12px;
            padding: 10px;
            background: #f7fafc;
            border-radius: 8px;
            font-size: 14px;
            color: #4a5568;
            line-height: 1.5;
          ">
            ${incident.description}
          </div>
        ` : ''}
        
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: #f7fafc;
          border-radius: 8px;
          gap: 12px;
        ">
          <button 
            onclick="window.voteIncident('${incident.id}', 'up')"
            style="
              flex: 1;
              padding: 10px 16px;
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(72, 187, 120, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
          >
            <span style="font-size: 18px;">👍</span>
            <span>${upvotes}</span>
          </button>
          
          <button 
            onclick="window.voteIncident('${incident.id}', 'down')"
            style="
              flex: 1;
              padding: 10px 16px;
              background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 101, 101, 0.4)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
          >
            <span style="font-size: 18px;">👎</span>
            <span>${downvotes}</span>
          </button>
          
          <div style="
            padding: 10px 16px;
            background: ${score > 0 ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : score < 0 ? 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' : '#e2e8f0'};
            color: ${score !== 0 ? 'white' : '#718096'};
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            min-width: 60px;
            text-align: center;
          ">
            ${score > 0 ? '+' : ''}${score}
          </div>
        </div>
      </div>
    `;
  }

  // ===== VOTING FUNCTIONALITY =====

  voteOnIncident(incidentId: string, voteType: 'up' | 'down') {
    console.log(`Voting ${voteType} on incident ${incidentId}`);
    
    const userId = 'temp-user-' + Date.now();
    
    const voteObservable = voteType === 'up' 
      ? this.incidentService.upvoteIncident(incidentId, userId)
      : this.incidentService.downvoteIncident(incidentId, userId);
    
    voteObservable.subscribe({
      next: (response) => {
        console.log('Vote registered:', response);
        
        const markerIndex = this.incidentMarkers.findIndex(im => im.incident.id === incidentId);
        if (markerIndex !== -1) {
          const incident = this.incidentMarkers[markerIndex].incident;
          
          // Actualizar votos
          if (response.upvotes !== undefined) incident.upvotes = response.upvotes;
          if (response.downvotes !== undefined) incident.downvotes = response.downvotes;
          
          // Calcular nuevo score
          const score = (incident.upvotes || 0) - (incident.downvotes || 0);
          console.log(`Incident ${incidentId} new score: ${score}`);
          
          // Si el score es menor a -5, eliminar el incidente
          if (score < -5) {
            console.log(`Deleting incident ${incidentId} due to low score (${score})`);
            
            this.incidentService.deleteIncident(incidentId).subscribe({
              next: () => {
                console.log(`Incident ${incidentId} deleted successfully`);
                
                // Cerrar InfoWindow
                this.incidentMarkers[markerIndex].infoWindow.close();
                
                // Remover marcador del mapa
                this.incidentMarkers[markerIndex].marker.setMap(null);
                
                // Remover del array
                this.incidentMarkers.splice(markerIndex, 1);
                
                // Mostrar notificación
                alert('El incidente ha sido eliminado debido a su baja puntuación.');
              },
              error: (error) => {
                console.error('Error deleting incident:', error);
              }
            });
          } else {
            // Actualizar el InfoWindow y el icono normalmente
            const config = this.getIncidentConfig(incident.type);
            this.incidentMarkers[markerIndex].infoWindow.setContent(
              this.getIncidentCardContent(incident, config)
            );
            
            const newIcon = this.createIncidentIcon(incident, config);
            this.incidentMarkers[markerIndex].marker.setIcon(newIcon);
          }
        }
      },
      error: (error) => {
        console.error('Error voting:', error);
        alert('Error al registrar el voto. Por favor, intenta nuevamente.');
      }
    });
  }

  // ===== UTILITY METHODS =====

  getRouteBounds(route: RouteOption): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    const path = route.result.routes[0].overview_path;
    
    path.forEach(point => {
      bounds.extend(point);
    });
    
    return bounds;
  }

  calculateRouteRadius(bounds: google.maps.LatLngBounds): number {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    const R = 6371000;
    const dLat = this.toRad(ne.lat() - sw.lat());
    const dLon = this.toRad(ne.lng() - sw.lng());
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(sw.lat())) * Math.cos(this.toRad(ne.lat())) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance / 2;
  }

  filterIncidentsNearRoute(incidents: Incident[], route: RouteOption): Incident[] {
    const routePath = route.result.routes[0].overview_path;
    const maxDistance = 5000000;
    
    return incidents.filter(incident => {
      const incidentLat = incident.lat;
      const incidentLng = incident.lng;
      
      return routePath.some(point => {
        const distance = this.calculateDistance(
          point.lat(),
          point.lng(),
          incidentLat,
          incidentLng
        );
        return distance <= maxDistance;
      });
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }

  clearWeatherMarkers() {
    this.weatherMarkers.forEach(wm => {
      wm.marker.setMap(null);
    });
    this.weatherMarkers = [];
  }

  clearIncidentMarkers() {
    this.incidentMarkers.forEach(im => {
      im.marker.setMap(null);
    });
    this.incidentMarkers = [];
  }

  closeAllWeatherInfoWindows() {
    this.weatherMarkers.forEach(wm => wm.infoWindow.close());
  }

  closeAllIncidentInfoWindows() {
    this.incidentMarkers.forEach(im => im.infoWindow.close());
  }

  clearRoutes() {
    this.directionsRenderers.forEach(renderer => renderer.setMap(null));
    this.directionsRenderers = [];
    this.routeOptions = [];
    this.selectedRouteId = null;
    this.clearWeatherMarkers();
    this.clearIncidentMarkers();
  }

  openIncidentReport() {
    this.showIncidentReport = true;
  }

  closeIncidentReport() {
    this.showIncidentReport = false;
  }

  onIncidentReported(incident: any) {
    console.log('Incident reported:', incident);
    
    if (this.selectedRouteId) {
      const selectedRoute = this.routeOptions.find(r => r.id === this.selectedRouteId);
      if (selectedRoute) {
        this.loadIncidentsForRoute(selectedRoute);
      }
    }
    
    this.closeIncidentReport();
  }

  getSelectedRoute() {
    if (!this.selectedRouteId) {
      return null;
    }
    return this.routeOptions.find(r => r.id === this.selectedRouteId) || null;
  }
  openUserProfile() {
    this.showUserProfile = true;
  }

  closeUserProfile() {
    this.showUserProfile = false;
  }

  saveCurrentRoute() {
    if (!this.selectedRouteId) {
      alert('Por favor, selecciona una ruta primero');
      return;
    }

    const selectedRoute = this.routeOptions.find(r => r.id === this.selectedRouteId);
    if (!selectedRoute) {
      alert('No se encontró la ruta seleccionada');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      alert('Debes iniciar sesión para guardar rutas');
      return;
    }

    // Obtener origen y destino de los inputs
    const origin = this.originPlace?.formatted_address || this.originPlace?.name || 'Origen desconocido';
    const destination = this.destPlace?.formatted_address || this.destPlace?.name || 'Destino desconocido';

    const routeData = {
      userId: currentUser.id,
      origin: origin,
      destination: destination,
      distance: selectedRoute.distance,
      duration: selectedRoute.duration,
      travelMode: selectedRoute.travelModeName,
      timestamp: new Date().toISOString()
    };

    this.isSavingRoute = true;

    this.routeService.saveRouteQuery(routeData).subscribe({
      next: (response) => {
        console.log('Ruta guardada:', response);
        this.isSavingRoute = false;
        alert('¡Ruta guardada exitosamente!');
      },
      error: (error) => {
        console.error('Error al guardar ruta:', error);
        this.isSavingRoute = false;
        alert('Error al guardar la ruta. Por favor, intenta nuevamente.');
      }
    });
  }
}