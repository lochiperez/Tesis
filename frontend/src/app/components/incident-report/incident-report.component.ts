import { Component, EventEmitter, Output, Input, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService, Incident } from '../../services/incident.service';

@Component({
  selector: 'app-incident-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-report.component.html',
  styleUrls: ['./incident-report.component.scss']
})
export class IncidentReportComponent implements OnInit {
  @Input() currentLocation: { lat: number, lng: number } | null = null;
  @Input() map: google.maps.Map | null = null;
  @Input() selectedRoute: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() incidentReported = new EventEmitter<Incident>();

  selectedType: 'Accidente' | 'Ruta en mal estado' | 'Retención' | 'Obra en ruta' | 'Animales sueltos' | 'Complicación climatica' | null = null;
  description: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  isBrowser: boolean = false;
  
  // Para selección de ubicación
  isSelectingLocation: boolean = false;
  selectedLocation: { lat: number, lng: number } | null = null;
  tempMarker: google.maps.Marker | null = null;
  mapClickListener: google.maps.MapsEventListener | null = null;

  incidentTypes = [
    { value: 'accidente', label: 'Accidente', icon: 'assets/img/accidente.png', description: 'Colisión o incidente vial' },
    { value: 'rutaEnMalEstado', label: 'Ruta en mal estado', icon: 'assets/img/ruta.png', description: 'Agujero o deterioro en el pavimento' },
    { value: 'retencion', label: 'Retención', icon: 'assets/img/retencion.png', description: 'Vía bloqueada o cerrada' },
    { value: 'obraEnRuta', label: 'Obra en ruta', icon: 'assets/img/obra.png', description: 'Obra pública en ruta con corte parcial o total' },
    { value: 'animalesSueltos', label: 'Animales sueltos', icon: 'assets/img/animales.png', description: 'Animales sueltos en ruta' },
    { value: 'complicacionClimatica', label: 'Complicación climatica', icon: 'assets/img/clima.png', description: 'Condiciones climáticas adversas' }
  ];

  constructor(
    private incidentService: IncidentService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Si hay una ruta seleccionada, usar el centro de la ruta como ubicación inicial
    if (this.selectedRoute && !this.selectedLocation) {
      const leg = this.selectedRoute.result.routes[0].legs[0];
      const midPoint = Math.floor(leg.steps.length / 2);
      const midLocation = leg.steps[midPoint].end_location;
      this.selectedLocation = {
        lat: midLocation.lat(),
        lng: midLocation.lng()
      };
    } else if (this.currentLocation) {
      this.selectedLocation = this.currentLocation;
    }
  }

  selectType(type: 'Accidente' | 'Ruta en mal estado' | 'Retención' | 'Obra en ruta' | 'Animales sueltos' | 'Complicación climatica') {
    this.selectedType = type;
    this.errorMessage = '';
  }

  startLocationSelection() {
    if (!this.map) {
      this.errorMessage = 'El mapa no está disponible.';
      return;
    }

    this.isSelectingLocation = true;
    this.errorMessage = '';

    // Agregar listener para clicks en el mapa
    this.mapClickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.onMapClick(event.latLng);
      }
    });

    // Cambiar cursor del mapa
    if (this.map.getDiv()) {
      this.map.getDiv().style.cursor = 'crosshair';
    }
  }

  onMapClick(latLng: google.maps.LatLng) {
    this.selectedLocation = {
      lat: latLng.lat(),
      lng: latLng.lng()
    };

    // Remover marcador temporal anterior si existe
    if (this.tempMarker) {
      this.tempMarker.setMap(null);
    }

    // Crear nuevo marcador temporal
    this.tempMarker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#f56565" stroke="white" stroke-width="2"/>
            <text x="16" y="21" text-anchor="middle" font-size="16" fill="white">📍</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      },
      animation: google.maps.Animation.DROP,
      zIndex: 3000
    });

    // Detener selección
    this.stopLocationSelection();
  }

  stopLocationSelection() {
    this.isSelectingLocation = false;

    // Remover listener
    if (this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
      this.mapClickListener = null;
    }

    // Restaurar cursor
    if (this.map && this.map.getDiv()) {
      this.map.getDiv().style.cursor = '';
    }
  }

  cancelLocationSelection() {
    this.stopLocationSelection();
    
    // Remover marcador temporal
    if (this.tempMarker) {
      this.tempMarker.setMap(null);
      this.tempMarker = null;
    }

    // Restaurar ubicación anterior
    if (this.selectedRoute) {
      const leg = this.selectedRoute.result.routes[0].legs[0];
      const midPoint = Math.floor(leg.steps.length / 2);
      const midLocation = leg.steps[midPoint].end_location;
      this.selectedLocation = {
        lat: midLocation.lat(),
        lng: midLocation.lng()
      };
    } else if (this.currentLocation) {
      this.selectedLocation = this.currentLocation;
    }
  }

  submitReport() {
    if (!this.selectedType) {
      this.errorMessage = 'Por favor, selecciona un tipo de incidente.';
      return;
    }

    if (!this.selectedLocation) {
      this.errorMessage = 'Por favor, selecciona una ubicación en el mapa.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const incident: Incident = {
      type: this.selectedType,
      lat: this.selectedLocation.lat,
      lng: this.selectedLocation.lng,
      timestamp: new Date(),
      description: this.description || undefined
    };

    this.incidentService.reportIncident(incident).subscribe({
      next: (response) => {
        this.successMessage = '¡Incidente reportado exitosamente!';
        this.isSubmitting = false;
        this.incidentReported.emit(response);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          this.closeModal();
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error reporting incident:', error);
                
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión.';
        } else if (error.status === 400) {
          this.errorMessage = 'Los datos del reporte no son válidos.';
        } else {
          this.errorMessage = 'Ocurrió un error al reportar el incidente. Por favor, intenta nuevamente.';
        }
      }
    });
  }

  closeModal() {
    // Limpiar listeners y marcadores
    this.stopLocationSelection();
    if (this.tempMarker) {
      this.tempMarker.setMap(null);
      this.tempMarker = null;
    }
    
    this.close.emit();
  }

  getSelectedTypeInfo() {
    return this.incidentTypes.find(t => t.value === this.selectedType);
  }
}
