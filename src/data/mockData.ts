// Mock data for the entire application

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  photo: string;
  aadhaarCardNo: string;
  panCardNo: string;
  createdDate: string;
}

export interface Salesperson {
  id: string;
  name: string;
  mobile: string;
  email: string;
  commissionPct: number;
  branch: string;
  status: 'Active' | 'Inactive';
  totalSales: number;
}

export interface VehicleModel {
  id: string;
  brand: string;
  model: string;
  variant: string;
  fuelType: string;
  basePrice: number;
}

export interface VehicleInventory {
  id: string;
  modelId: string;
  model: VehicleModel;
  color: string;
  chassisNumber: string;
  engineNumber: string;
  purchaseDate: string;
  status: 'Available' | 'Reserved' | 'Sold' | 'Delivered';
}

export interface SaleOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  vehicleId: string;
  vehicle: VehicleInventory;
  salespersonId: string;
  salesperson: Salesperson;
  saleDate: string;
  deliveryDate: string;
  vehiclePrice: number;
  registrationCharges: number;
  insurance: number;
  accessories: number;
  totalAmount: number;
  downPayment: number;
  loanAmount: number;
  balanceAmount: number;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Voided';
}

export interface Payment {
  id: string;
  customerId: string;
  customer: Customer;
  invoiceNumber: string;
  paymentDate: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Card';
  paymentType: 'Down Payment' | 'Loan Disbursement' | 'Balance Payment' | 'Accessories Payment';
  referenceNumber: string;
  bankName: string;
  receiptNumber: string;
  status: 'Completed' | 'Pending' | 'Failed';
  collectedBy: string;
  branch: string;
  remarks: string;
}

export interface Loan {
  id: string;
  customerId: string;
  customer: Customer;
  saleOrderId: string;
  bankName: string;
  loanAmount: number;
  emiAmount: number;
  tenure: number;
  disbursementDate: string;
  status: 'Pending' | 'Approved' | 'Disbursed' | 'Closed';
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

// --- Mock Data ---

export const customers: Customer[] = [
  { id: 'C001', name: 'Rajesh Kumar', mobile: '9876543210', email: 'rajesh@email.com', address: '45 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', photo: '', aadhaarCardNo: '1234-5678-9012', panCardNo: 'ABCDE1234F', createdDate: '2025-01-15' },
  { id: 'C002', name: 'Priya Sharma', mobile: '9876543211', email: 'priya@email.com', address: '12 Park Street', city: 'Delhi', state: 'Delhi', pincode: '110001', photo: '', aadhaarCardNo: '2345-6789-0123', panCardNo: 'FGHIJ5678K', createdDate: '2025-02-20' },
  { id: 'C003', name: 'Amit Patel', mobile: '9876543212', email: 'amit@email.com', address: '78 Lake Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', photo: '', aadhaarCardNo: '3456-7890-1234', panCardNo: 'KLMNO9012P', createdDate: '2025-03-10' },
  { id: 'C004', name: 'Sunita Reddy', mobile: '9876543213', email: 'sunita@email.com', address: '23 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', photo: '', aadhaarCardNo: '4567-8901-2345', panCardNo: 'PQRST3456Q', createdDate: '2025-04-05' },
  { id: 'C005', name: 'Vikram Singh', mobile: '9876543214', email: 'vikram@email.com', address: '56 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', photo: '', aadhaarCardNo: '5678-9012-3456', panCardNo: 'UVWXY7890R', createdDate: '2025-05-12' },
];

export const salespersons: Salesperson[] = [
  { id: 'SP001', name: 'Arjun Mehta', mobile: '9988776655', email: 'arjun@dealer.com', commissionPct: 2.5, branch: 'Mumbai Central', status: 'Active', totalSales: 42 },
  { id: 'SP002', name: 'Neha Gupta', mobile: '9988776656', email: 'neha@dealer.com', commissionPct: 3.0, branch: 'Delhi South', status: 'Active', totalSales: 38 },
  { id: 'SP003', name: 'Kiran Rao', mobile: '9988776657', email: 'kiran@dealer.com', commissionPct: 2.0, branch: 'Mumbai Central', status: 'Active', totalSales: 27 },
];

export const vehicleModels: VehicleModel[] = [
  { id: 'VM001', brand: 'Maruti Suzuki', model: 'Swift', variant: 'ZXi+', fuelType: 'Petrol', basePrice: 899000 },
  { id: 'VM002', brand: 'Hyundai', model: 'Creta', variant: 'SX(O)', fuelType: 'Diesel', basePrice: 1799000 },
  { id: 'VM003', brand: 'Tata', model: 'Nexon EV', variant: 'Max LR', fuelType: 'Electric', basePrice: 1999000 },
  { id: 'VM004', brand: 'Mahindra', model: 'XUV700', variant: 'AX7 L', fuelType: 'Diesel', basePrice: 2499000 },
  { id: 'VM005', brand: 'Toyota', model: 'Fortuner', variant: '4x4 AT', fuelType: 'Diesel', basePrice: 4599000 },
];

export const vehicleInventory: VehicleInventory[] = [
  { id: 'VI001', modelId: 'VM001', model: vehicleModels[0], color: 'Pearl White', chassisNumber: 'MA3FJEB1S00', engineNumber: 'K12N-1234567', purchaseDate: '2025-01-10', status: 'Available' },
  { id: 'VI002', modelId: 'VM002', model: vehicleModels[1], color: 'Phantom Black', chassisNumber: 'MALC381CBNM', engineNumber: 'D4FC-2345678', purchaseDate: '2025-01-15', status: 'Sold' },
  { id: 'VI003', modelId: 'VM003', model: vehicleModels[2], color: 'Teal Blue', chassisNumber: 'MAT6389KXNL', engineNumber: 'ACEX-3456789', purchaseDate: '2025-02-01', status: 'Available' },
  { id: 'VI004', modelId: 'VM004', model: vehicleModels[3], color: 'Everest White', chassisNumber: 'MA1TG2GS9P1', engineNumber: 'mHAWK-456789', purchaseDate: '2025-02-10', status: 'Reserved' },
  { id: 'VI005', modelId: 'VM005', model: vehicleModels[4], color: 'Attitude Black', chassisNumber: 'MBJ11BV1308', engineNumber: '1GD-FTV-7890', purchaseDate: '2025-02-20', status: 'Available' },
  { id: 'VI006', modelId: 'VM001', model: vehicleModels[0], color: 'Solid Fire Red', chassisNumber: 'MA3FJEB1S01', engineNumber: 'K12N-1234568', purchaseDate: '2025-03-01', status: 'Delivered' },
  { id: 'VI007', modelId: 'VM002', model: vehicleModels[1], color: 'Titan Grey', chassisNumber: 'MALC381CBNN', engineNumber: 'D4FC-2345679', purchaseDate: '2025-03-05', status: 'Available' },
];

export const saleOrders: SaleOrder[] = [
  {
    id: 'SO001', orderNumber: 'SO-8819', customerId: 'C001', customer: customers[0],
    vehicleId: 'VI002', vehicle: vehicleInventory[1], salespersonId: 'SP001', salesperson: salespersons[0],
    saleDate: '2025-02-15', deliveryDate: '2025-03-01',
    vehiclePrice: 1799000, registrationCharges: 45000, insurance: 52000, accessories: 35000,
    totalAmount: 1931000, downPayment: 500000, loanAmount: 1200000, balanceAmount: 231000,
    status: 'Confirmed',
  },
  {
    id: 'SO002', orderNumber: 'SO-8820', customerId: 'C005', customer: customers[4],
    vehicleId: 'VI006', vehicle: vehicleInventory[5], salespersonId: 'SP002', salesperson: salespersons[1],
    saleDate: '2025-03-10', deliveryDate: '2025-03-15',
    vehiclePrice: 899000, registrationCharges: 25000, insurance: 28000, accessories: 15000,
    totalAmount: 967000, downPayment: 300000, loanAmount: 600000, balanceAmount: 67000,
    status: 'Delivered',
  },
];

export const payments: Payment[] = [
  { id: 'P001', customerId: 'C001', customer: customers[0], invoiceNumber: 'SO-8819', paymentDate: '2025-02-15', amount: 500000, paymentMode: 'Bank Transfer', paymentType: 'Down Payment', referenceNumber: 'NEFT20250215001', bankName: 'HDFC Bank', receiptNumber: 'RCT-0001', status: 'Completed', collectedBy: 'Arjun Mehta', branch: 'Mumbai Central', remarks: '' },
  { id: 'P002', customerId: 'C001', customer: customers[0], invoiceNumber: 'SO-8819', paymentDate: '2025-03-01', amount: 1200000, paymentMode: 'Bank Transfer', paymentType: 'Loan Disbursement', referenceNumber: 'LOAN-SBI-001', bankName: 'SBI', receiptNumber: 'RCT-0002', status: 'Completed', collectedBy: 'Arjun Mehta', branch: 'Mumbai Central', remarks: 'SBI Loan Disbursement' },
  { id: 'P003', customerId: 'C005', customer: customers[4], invoiceNumber: 'SO-8820', paymentDate: '2025-03-10', amount: 300000, paymentMode: 'UPI', paymentType: 'Down Payment', referenceNumber: 'UPI20250310001', bankName: '', receiptNumber: 'RCT-0003', status: 'Completed', collectedBy: 'Neha Gupta', branch: 'Delhi South', remarks: '' },
];

export const loans: Loan[] = [
  { id: 'L001', customerId: 'C001', customer: customers[0], saleOrderId: 'SO001', bankName: 'SBI', loanAmount: 1200000, emiAmount: 25000, tenure: 60, disbursementDate: '2025-03-01', status: 'Disbursed' },
  { id: 'L002', customerId: 'C005', customer: customers[4], saleOrderId: 'SO002', bankName: 'ICICI Bank', loanAmount: 600000, emiAmount: 13500, tenure: 48, disbursementDate: '', status: 'Pending' },
];

export const ledgerEntries: LedgerEntry[] = [
  { id: 'LE001', customerId: 'C001', date: '2025-02-15', description: 'Vehicle Sale — Hyundai Creta SX(O)', debit: 1931000, credit: 0, balance: 1931000 },
  { id: 'LE002', customerId: 'C001', date: '2025-02-15', description: 'Down Payment — Bank Transfer', debit: 0, credit: 500000, balance: 1431000 },
  { id: 'LE003', customerId: 'C001', date: '2025-03-01', description: 'Loan Disbursement — SBI', debit: 0, credit: 1200000, balance: 231000 },
  { id: 'LE004', customerId: 'C005', date: '2025-03-10', description: 'Vehicle Sale — Maruti Swift ZXi+', debit: 967000, credit: 0, balance: 967000 },
  { id: 'LE005', customerId: 'C005', date: '2025-03-10', description: 'Down Payment — UPI', debit: 0, credit: 300000, balance: 667000 },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const monthlyData = [
  { month: 'Jan', sales: 4, revenue: 3200000 },
  { month: 'Feb', sales: 6, revenue: 5800000 },
  { month: 'Mar', sales: 8, revenue: 7500000 },
  { month: 'Apr', sales: 5, revenue: 4900000 },
  { month: 'May', sales: 7, revenue: 6200000 },
  { month: 'Jun', sales: 9, revenue: 8100000 },
];

export const modelSalesData = [
  { model: 'Swift', sold: 12 },
  { model: 'Creta', sold: 9 },
  { model: 'Nexon EV', sold: 7 },
  { model: 'XUV700', sold: 5 },
  { model: 'Fortuner', sold: 3 },
];
