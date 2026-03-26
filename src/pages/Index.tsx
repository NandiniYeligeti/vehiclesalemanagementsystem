import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';
import DashboardPage from '@/pages/DashboardPage';
import CustomersPage from '@/pages/CustomersPage';
import SalespersonsPage from '@/pages/SalespersonsPage';
import VehiclesPage from '@/pages/VehiclesPage';
import SalesOrderPage from '@/pages/SalesOrderPage';
import PaymentsPage from '@/pages/PaymentsPage';
import LoansPage from '@/pages/LoansPage';
import LedgerPage from '@/pages/LedgerPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import UsersManagementPage from '@/pages/UsersManagementPage';
import VehicleInventoryPage from '@/pages/VehicleInventoryPage';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  salespersons: 'Salespersons',
  vehicles: 'Vehicles',
  'vehicle-inventory': 'Vehicle Inventory',
  sales: 'Sales Orders',
  payments: 'Payments',
  loans: 'Loan Management',
  ledger: 'Customer Ledger',
  reports: 'Reports',
  users: 'User Management',
  settings: 'Settings',
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'customers': return <CustomersPage />;
      case 'salespersons': return <SalespersonsPage />;
      case 'vehicles': return <VehiclesPage initialTab="models" />;
      case 'vehicle-inventory': return <VehicleInventoryPage />;
      case 'sales': return <SalesOrderPage />;
      case 'payments': return <PaymentsPage />;
      case 'loans': return <LoansPage />;
      case 'ledger': return <LedgerPage />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersManagementPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav title={pageTitles[activeTab] || 'Dashboard'} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Index;
