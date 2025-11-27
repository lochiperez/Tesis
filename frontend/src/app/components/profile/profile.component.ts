import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  profileForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;
  isBrowser: boolean = false;
  isEditing: boolean = false;

  // Datos del usuario actual (simulado - en producción vendría del servicio de autenticación)
  currentUser = {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    telefono: '+54 11 1234-5678',
    direccion: 'Av. Corrientes 1234, CABA'
  };

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      nombre: [this.currentUser.nombre, [Validators.required, Validators.minLength(2)]],
      apellido: [this.currentUser.apellido, [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser.email, [Validators.required, Validators.email]],
      telefono: [this.currentUser.telefono, [Validators.pattern(/^[\d\s\+\-\(\)]+$/)]],
      direccion: [this.currentUser.direccion]
    });

    // Deshabilitar el formulario inicialmente
    this.profileForm.disable();
  }

  get nombre() {
    return this.profileForm.get('nombre');
  }

  get apellido() {
    return this.profileForm.get('apellido');
  }

  get email() {
    return this.profileForm.get('email');
  }

  get telefono() {
    return this.profileForm.get('telefono');
  }

  get direccion() {
    return this.profileForm.get('direccion');
  }

  enableEdit() {
    this.isEditing = true;
    this.profileForm.enable();
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit() {
    this.isEditing = false;
    this.profileForm.disable();
    this.initializeForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedData = {
      nombre: this.profileForm.value.nombre,
      apellido: this.profileForm.value.apellido,
      email: this.profileForm.value.email,
      telefono: this.profileForm.value.telefono,
      direccion: this.profileForm.value.direccion
    };

    // Llamar al servicio para actualizar el perfil
    this.authService.updateProfile(updatedData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Perfil actualizado exitosamente!';
        
        // Actualizar los datos locales
        this.currentUser = { ...updatedData };
        
        // Deshabilitar edición después de guardar
        setTimeout(() => {
          this.isEditing = false;
          this.profileForm.disable();
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        
        if (error.status === 409) {
          this.errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
        } else if (error.status === 400) {
          this.errorMessage = 'Los datos ingresados no son válidos. Por favor, verifica la información.';
        } else {
          this.errorMessage = 'Ocurrió un error al actualizar el perfil. Por favor, intenta nuevamente.';
        }
        
        console.error('Error al actualizar perfil:', error);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  logout() {
    // Limpiar sesión y redirigir al login
    this.router.navigateByUrl('/login');
  }

  goToMaps() {
    this.router.navigateByUrl('/maps');
  }
}
