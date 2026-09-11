import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { IonContent, IonInput, IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alertCircleOutline } from "ionicons/icons";
import { UserService } from "../../service/user.service";
import { ToastService } from "../../service/toast.service";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon, IonSpinner],
})
export class AuthComponent implements OnInit {
  authMode: string = "login"; // Default to login mode
  
  // Login form
  loginUsername: string = "";
  loginPassword: string = "";
  
  // Signup form
  signupUsername: string = "";
  signupPassword: string = "";
  
  isLoading: boolean = false;
  errorMessage: string = "";

  constructor(
    private userService: UserService,
    private router: Router,
    private toastService: ToastService
  ) {
    addIcons({ alertCircleOutline });
  }

  ngOnInit() {
    // Check if already authenticated
    this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/tabs/tab1']);
      }
    });
  }

  // Replaces segmentChanged() now that the mode switch is two plain
  // underline tabs, not an ion-segment - same authMode state and
  // clear-errors-on-switch behavior as before.
  selectAuthMode(mode: string) {
    this.authMode = mode;
    this.clearErrors();
  }

  clearErrors() {
    this.errorMessage = "";
  }

  login() {
    this.clearErrors();
    
    // Validate inputs
    if (!this.loginUsername || !this.loginPassword) {
      this.errorMessage = "Please enter both username and password";
      return;
    }
    
    this.isLoading = true;
    
    this.userService.login(this.loginUsername, this.loginPassword).subscribe(
      (success) => {
        this.isLoading = false;
        if (success) {
          this.toastService.showSuccess("Login successful");
          this.router.navigate(['/tabs/tab1']);
        } else {
          this.errorMessage = "Login failed. Please check your credentials.";
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || "Login failed. Please try again.";
      }
    );
  }

  signup() {
    this.clearErrors();
    
    // Validate inputs
    if (!this.signupUsername || !this.signupPassword) {
      this.errorMessage = "Username and password are required";
      return;
    }
    
    this.isLoading = true;
    
    this.userService.signup(
      this.signupUsername,
      this.signupPassword,
    ).subscribe(
      (success) => {
        this.isLoading = false;
        if (success) {
          this.toastService.showSuccess("Account created successfully");
          // Switch to login mode or auto-login
          this.loginUsername = this.signupUsername;
          this.loginPassword = this.signupPassword;
          this.authMode = "login";
        } else {
          this.errorMessage = "Failed to create account. Please try again.";
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || "Registration failed. Please try again.";
      }
    );
  }
}