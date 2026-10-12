export interface Vehicle {
  id: string;
  label: string;
  plate: string;
  driver: string;
}

export interface PositionUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  recordedAt: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface User {
  name: string;
  email: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends TokenResponse {
  user: User;
}
