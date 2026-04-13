import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import CategoryCard from '../components/CategoryCard';
import ProductTable from '../components/ProductTable';
import { 
  Package, 
  AlertTriangle, 
  XOctagon, 
  Pill, 
  Thermometer, 
  Zap, 
  Syringe, 
  Activity, 
  Heart, 
  Droplets, 
  Wind 
} from 'lucide-react';

const categories = [
  { id: 1, title: 'Antibiotics', icon: Pill, active: true },
  { id: 2, title: 'Pain Relievers', icon: Thermometer },
  { id: 3, title: 'Vitamins', icon: Zap },
  { id: 4, title: 'Antiviral', icon: Syringe },
  { id: 5, title: 'Diabetes Care', icon: Activity },
  { id: 6, title: 'Cardiovascular', icon: Heart },
  { id: 7, title: 'Allergy', icon: Droplets },
  { id: 8, title: 'Respiratory', icon: Wind },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Products" 
          value="1,284" 
          icon={Package} 
          trend={12} 
          color="emerald" 
        />
        <StatCard 
          title="Low Stock Items" 
          value="45" 
          icon={AlertTriangle} 
          trend={-5} 
          color="amber" 
        />
        <StatCard 
          title="Out of Stock" 
          value="12" 
          icon={XOctagon} 
          trend={2} 
          color="red" 
        />
      </div>

      {/* Category Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900">Categories</h2>
          <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} {...cat} />
          ))}
        </div>
      </div>

      {/* Table Section */}
      <ProductTable />
    </DashboardLayout>
  );
};

export default Dashboard;
