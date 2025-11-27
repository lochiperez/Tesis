import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  isBrowser: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  login() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // Llamar al servicio de login
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Login exitoso
        console.log('Login exitoso', response);
        
        // Guardar datos del usuario en localStorage
        if (response.user) {
          this.authService.saveUserData(response.user, response.token);
        }
        
        // Redirigir a maps
        this.isSubmitting = false;
        this.router.navigateByUrl('/maps');
      },
      error: (error) => {
        this.isSubmitting = false;
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos. Por favor, intenta nuevamente.';
        } else if (error.status === 404) {
          this.errorMessage = 'Usuario no encontrado. Por favor, verifica tus credenciales.';
        } else if (error.status === 0) {
          // Error de conexión
          this.errorMessage = 'No se pudo conectar con el servidor. Por favor, intenta más tarde.';
        } else {
          this.errorMessage = 'Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.';
        }
        
        console.error('Error de login:', error);
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

  navigateToRegister() {
    this.router.navigateByUrl('/register');
  }
}