export type VehicleType = "CAR" | "SUV" | "MOTORCYCLE" | "SCOOTER" | "VAN";
export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";
export type TransmissionType = "AUTOMATIC" | "MANUAL" | "CVT" | "DIRECT_DRIVE";
export type DriveType = "CHAIN" | "BELT" | "SHAFT" | "DIRECT_DRIVE" | "CVT" | "FWD" | "RWD" | "AWD";
export type CoolingType = "AIR" | "LIQUID" | "OIL";

export type ServiceType =
  | "OIL_CHANGE"
  | "BRAKES"
  | "TIRES"
  | "BATTERY"
  | "FLUIDS"
  | "INSPECTION"
  | "REPAIR"
  | "RECALL"
  | "GENERAL"
  | "ELECTRICAL";

export type ScheduleCategory =
  | "ENGINE"
  | "BRAKES"
  | "TIRES"
  | "FLUIDS"
  | "ELECTRICAL"
  | "FILTERS"
  | "DRIVE"
  | "SUSPENSION"
  | "OTHER";

export type UrgencyLevel = "OVERDUE" | "DUE_SOON" | "GOOD";
export type DiagnosticSeverity = "CRITICAL" | "MODERATE" | "MINOR";
export type NotificationType = "CRITICAL" | "WARNING" | "MAINTENANCE" | "DIAGNOSTIC" | "SYSTEM";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  onboardingStep?: number;
  lastLoginAt?: Date | string | null;
}

export interface SubsystemHealth {
  score: number; // 0 - 100
  status: "GOOD" | "ATTENTION" | "CRITICAL";
  label: string;
  description: string;
  factors: string[];
}

export interface SubsystemHealthBreakdown {
  powertrain: SubsystemHealth;
  braking: SubsystemHealth;
  battery: SubsystemHealth;
  tires: SubsystemHealth;
  fluids: SubsystemHealth;
  suspension: SubsystemHealth;
  drive?: SubsystemHealth;
}

export interface VehicleSummary {
  id: string;
  userId: string;
  nickname?: string | null;
  name: string;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  mileage: number;
  avgDailyMiles: number;
  vehicleType: string; // CAR, SUV, MOTORCYCLE, SCOOTER, VAN
  fuelType: string;
  transmission: string;
  engineCc?: number | null;
  driveType?: string | null;
  coolingType?: string | null;
  purchaseDate?: Date | string | null;
  imageUrl?: string | null;
  healthScore: number;
  obdConnected: boolean;
  lastObdSyncAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface VehicleWithRelations extends VehicleSummary {
  maintenanceRecords?: MaintenanceRecordItem[];
  schedules?: MaintenanceScheduleItem[];
  diagnostics?: DiagnosticScanItem[];
  fuelLogs?: FuelLogItem[];
  documents?: VehicleDocumentItem[];
  subsystems?: SubsystemHealthBreakdown;
  _count?: {
    maintenanceRecords: number;
    schedules: number;
    diagnostics: number;
    fuelLogs: number;
  };
}

export interface MaintenanceRecordItem {
  id: string;
  vehicleId: string;
  title: string;
  serviceType: string;
  serviceDate: Date | string;
  mileage: number;
  cost: number;
  provider: string;
  notes: string | null;
  receiptText: string | null;
  createdAt: Date | string;
}

export interface MaintenanceScheduleItem {
  id: string;
  vehicleId: string;
  taskName: string;
  category: string;
  intervalMiles: number;
  intervalMonths: number;
  lastServicedMileage: number | null;
  lastServicedDate: Date | string | null;
  nextDueMileage: number;
  nextDueDate: Date | string;
  urgency: string;
  estimatedCost: number | null;
  isCustom: boolean;
  createdAt: Date | string;
}

export interface DiagnosticScanItem {
  id: string;
  vehicleId: string;
  scanDate: Date | string;
  codes: string;
  symptoms: string | null;
  severity: string;
  canDrive: boolean;
  aiSummary: string;
  possibleCauses: string;
  diySteps: string;
  estimatedCostMin: number;
  estimatedCostMax: number;
  status: string;
  dataSource: "OBD_II" | "MANUAL" | "ESTIMATED" | string;
  createdAt: Date | string;
}

export interface FuelLogItem {
  id: string;
  vehicleId: string;
  logDate: Date | string;
  mileage: number;
  units: number;
  pricePerUnit: number;
  totalCost: number;
  calculatedMpg: number | null;
  notes: string | null;
  createdAt: Date | string;
}

export interface VehicleDocumentItem {
  id: string;
  vehicleId: string;
  docType: string;
  provider: string | null;
  policyNumber: string | null;
  expiryDate: Date | string;
  notes: string | null;
  createdAt: Date | string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  vehicleId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  status: "UNREAD" | "READ" | "DISMISSED";
  link?: string | null;
  createdAt: Date | string;
  vehicle?: VehicleSummary | null;
}

export interface PredictiveWearItem {
  id: string;
  vehicleId: string;
  component: string;
  category: string;
  estimatedLifeRemaining: number; // 0-100%
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  estimatedMilesRemaining: number;
  recommendedInspectionDate: string;
  explanation: string;
  metricSource: "OBD_II" | "MAINTENANCE_HISTORY" | "ESTIMATED";
}

export interface DiagnosticAnalysisResult {
  severity: DiagnosticSeverity;
  canDrive: boolean;
  aiSummary: string;
  possibleCauses: string[];
  diySteps: string[];
  estimatedCostMin: number;
  estimatedCostMax: number;
}

export interface ParsedReceiptResult {
  title: string;
  serviceType: string;
  serviceDate: string;
  mileage: number | null;
  cost: number;
  provider: string;
  partsReplaced: string[];
  notes: string;
}

export interface GlobalSearchResult {
  id: string;
  type: "VEHICLE" | "DTC" | "MAINTENANCE";
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
}
