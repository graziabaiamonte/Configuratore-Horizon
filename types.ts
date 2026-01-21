
export interface LocationData {
  mode: 'map' | 'manual';
  coordinates?: { lat: number; lng: number };
  municipality?: string;
  province?: string;
  sheet?: string;
  parcel?: string;
}

export interface AreaData {
  totalArea: number;
  contiguousArea: number;
}

export interface TechnicalData {
  powerLineDistance: number;
  nearIndustrialZone: boolean;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gdprConsent: boolean;
}

export interface ConfiguratorState {
  step: number;
  location: LocationData;
  areas: AreaData;
  technical: TechnicalData;
  contact: ContactData;
}

export enum Step {
  Location = 1,
  Areas = 2,
  Technical = 3,
  Contact = 4,
  Summary = 5
}
