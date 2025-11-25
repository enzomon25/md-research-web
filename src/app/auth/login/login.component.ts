import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };

  usernameError: string = '';
  passwordError: string = '';
  isLoading: boolean = false;
  isNavigating: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(): void {
    this.usernameError = '';
    this.passwordError = '';
    
    if (!this.credentials.username || !this.credentials.password) {
      if (!this.credentials.username) {
        this.usernameError = 'El usuario es requerido';
      }
      if (!this.credentials.password) {
        this.passwordError = 'La contraseña es requerida';
      }
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.isNavigating = true;
        this.cdr.detectChanges();
        // Mantener isLoading en true durante la transición
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error completo en login:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores del backend
        if (error.status === 401) {
          // Credenciales inválidas - mostrar ambos errores
          this.usernameError = 'Usuario incorrecto';
          this.passwordError = 'Contraseña incorrecta';
        } else if (error.status === 400) {
          // Usuario inactivo u otros errores de validación
          const detalle = error.error?.detalle || '';
          this.usernameError = detalle || 'Usuario inactivo o datos inválidos';
        } else if (error.status === 0) {
          // Error de conexión
          this.usernameError = 'No se pudo conectar con el servidor. Verifique su conexión.';
        } else if (error.status === 500) {
          // Error interno del servidor
          const detalle = error.error?.detalle || '';
          this.usernameError = detalle || 'Error en el servidor. Intente nuevamente.';
        } else {
          // Otros errores
          this.usernameError = error.error?.message || error.error?.detalle || 'Error al iniciar sesión. Intente nuevamente.';
        }
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
        console.log('Username error:', this.usernameError);
        console.log('Password error:', this.passwordError);
      }
    });
  }
}
