export type Room = {
  id: string;
  roomNumber: string;
  totalBeds: number;
  occupiedBeds: number;
};

export type Bed = {
  id: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  isOccupied: boolean;
  currentTenantId?: string;
};

export type Tenant = {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp: string;
  parentName: string;
  parentMobile: string;
  emergencyContact: string;
  address: string;
  aadhaarNumber: string;
  roomNumber: string;
  bedNumber: string;
  joiningDate: string; // ISO Date
  monthlyRent: number;
  securityDeposit: number;
  advanceAmount: number;
  notes: string;
  status: 'active' | 'vacated';
  photoUrl?: string;
  aadhaarUrl?: string;
};

export type PaymentStatus = 'Paid' | 'Partial' | 'Due' | 'Overdue';

export type Payment = {
  id: string;
  tenantId: string;
  tenantName: string;
  dueDate: string;
  rentAmount: number;
  paidAmount: number;
  balance: number;
  paymentDate?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer';
  transactionRef?: string;
  status: PaymentStatus;
};

export type Reminder = {
  id: string;
  tenantId: string;
  whatsappNumber?: string;
  mobileNumber?: string;
  reminderType: '3_days_before' | '1_day_before' | 'due_day' | 'overdue' | 'manual';
  message: string;
  sentTime: string;
  method: 'whatsapp' | 'sms';
  status: 'sent' | 'failed' | 'delivered';
  error?: string;
};

export type Settings = {
  hostelName: string;
  address: string;
  contactNumber: string;
  upiId: string;
  upiQrUrl?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  reminderSettings: {
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    templates: {
      upcoming: string;
      due: string;
      overdue: string;
    };
    twilioConfig?: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
  };
  gracePeriod: number;
};

export type ActivityLog = {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
};
