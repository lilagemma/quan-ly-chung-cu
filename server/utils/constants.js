const ROLES = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  RESIDENT: 'resident',
  WATCHMAN: 'watchman'
};

const SERVICE_FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved'
};

const EMERGENCY_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

const ASSET_TYPES = {
  LIFT: 'lift',
  WATER_PUMP: 'water_pump',
  GENERATOR: 'generator'
};

const ASSET_STATUS = {
  WORKING: 'working',
  UNDER_MAINTENANCE: 'under_maintenance',
  NOT_WORKING: 'not_working'
};

module.exports = {
  ROLES,
  SERVICE_FEE_STATUS,
  COMPLAINT_STATUS,
  EMERGENCY_STATUS,
  ASSET_TYPES,
  ASSET_STATUS
};
