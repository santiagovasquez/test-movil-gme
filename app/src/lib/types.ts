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

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { name: string; email: string };
}
