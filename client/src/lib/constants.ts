export const ROLES = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  RESIDENT: 'resident',
  WATCHMAN: 'watchman',
} as const;

export const SERVICE_FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
} as const;

export const EMERGENCY_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
} as const;

export const ASSET_TYPES = {
  LIFT: 'lift',
  WATER_PUMP: 'water_pump',
  GENERATOR: 'generator',
} as const;

export const ASSET_STATUS = {
  WORKING: 'working',
  UNDER_MAINTENANCE: 'under_maintenance',
  NOT_WORKING: 'not_working',
} as const;

export const SOCIETY_NAME = 'MyCT2';
export const SOCIETY_TAGLINE = 'Quan ly chung cu';

export const FLAT_NUMBERS = [
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310',
  '401', '402', '403', '404', '405', '406', '407', '408', '409', '410',
];

export const EMERGENCY_POLL_INTERVAL = 30000;
