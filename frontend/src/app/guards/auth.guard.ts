import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // Solo verificar autenticación en el browser
  if (isPlatformBrowser(platformId)) {
    // Verificar si el usuario está autenticado
    const currentUser = sessionStorage.getItem('currentUser');
    const userId = sessionStorage.getItem('userId');
    
    if (currentUser && userId) {
      // Usuario autenticado, permitir acceso
      return true;
    }
    
    // Usuario no autenticado, redirigir a login
    console.log('User not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }
  
  // En el servidor, permitir la navegación (se verificará en el cliente)
  return true;
};
