import { Component, OnInit, Output, EventEmitter, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IncidentService, Incident } from '../../services/incident.service';
import { RouteService, RouteQuery } from '../../services/route.service';

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  createdAt?: Date;
}

interface RouteHistory {
  id?: string;
  origin: string;
  destination: string;
  timestamp: Date | string;
  distance: string;
  duration: string;
  travelMode?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  isBrowser: boolean = false;
  user!: UserProfile;
  userIncidents: Incident[] = [];
  routeHistory: RouteHistory[] = [];
  isLoading: boolean = true;
  activeTab: 'info' | 'incidents' | 'routes' = 'info';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private incidentService: IncidentService,
    private routeService: RouteService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.loadUserData();
    }
  }

  loadUserData() {
    this.isLoading = true;

    // Cargar datos del usuario desde localStorage o AuthService
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    // Cargar incidentes del usuario
    this.loadUserIncidents();

    // Cargar historial de rutas
    this.loadRouteHistory();

    this.isLoading = false;
  }

  loadUserIncidents() {
    this.incidentService.getIncidentesByUser(this.user?.id).subscribe({
      next: (incidents) => {
        this.userIncidents = incidents
        console.log('User incidents:', this.userIncidents);
      },
      error: (error) => {
        console.error('Error loading user incidents:', error);
        this.userIncidents = [];
      }
    });
  }

  loadRouteHistory() {
    // Cargar historial de rutas desde el backend (igual que incidentes)
    const userId = this.user?.id || sessionStorage.getItem('userId');
    
    if (!userId) {
      console.log('No userId found for loading routes');
      this.routeHistory = [];
      return;
    }

    this.routeService.getRoutes().subscribe({
      next: (routes) => {

        this.routeHistory = routes.filter(route => route.userId === userId);
        console.log('User routes loaded:', this.routeHistory);
      },
      error: (error) => {
        console.error('Error loading user routes:', error);
        this.routeHistory = [];
      }
    });
  }

  setActiveTab(tab: 'info' | 'incidents' | 'routes') {
    this.activeTab = tab;
  }

  getIncidentIcon(type: string): string {
    const icons: any = {
      'rutaEnMalEstado': '🕳️',
      'retencion':'🚘',
      'accidente': '🚗',
      'obraEnRuta': '🚧',
      'complicacionClimatica': '🌦️',
      'animalesSueltos': '🐄'
    };
    return icons[type] || '📍';
  }

  getIncidentLabel(type: string): string {
    const labels: any = {
      'rutaEnMalEstado': 'Ruta en mal estado',
      'retencion':'Retención',
      'accidente': 'Accidente ',
      'obraEnRuta': 'Obra en ruta',
      'complicacionClimatica': 'Complicación climatica',
      'animalesSueltos': 'Animales sueltos'
    };
    return labels[type] || type;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }

  logout() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userId');
    this.closeModal();
    window.location.href = '/login';
  }

  getTotalUpvotes(): number {
    return this.userIncidents.reduce((sum, inc) => sum + (inc.upvotes || 0), 0);
  }

  closeModal() {
    this.close.emit();
  }
}
