import React from 'react';
import { MoreHorizontal, Search, Filter, Download, Plus } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from './UI';
import { cn } from '../lib/utils';

const products = [
  { id: '#P-1024', name: 'Amoxicillin 500mg', quantity: 120, price: 12.50, expiry: '2025-12-20', status: 'in-stock' },
  { id: '#P-1025', name: 'Paracetamol 500mg', quantity: 45, price: 8.00, expiry: '2026-06-15', status: 'low-stock' },
  { id: '#P-1026', name: 'Vitamin C Syrup', quantity: 0, price: 15.20, expiry: '2024-11-10', status: 'out-of-stock' },
  { id: '#P-1027', name: 'Ibuprofen 400mg', quantity: 210, price: 10.00, expiry: '2025-08-05', status: 'in-stock' },
  { id: '#P-1028', name: 'Metformin 850mg', quantity: 15, price: 22.40, expiry: '2025-02-28', status: 'low-stock' },
];

const StatusBadge = ({ status }) => {
  const styles = {
    'in-stock': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'low-stock': 'bg-amber-50 text-amber-600 border-amber-100',
    'out-of-stock': 'bg-red-50 text-red-600 border-red-100',
  };

  const labels = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-semibold border",
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
};

const ProductTable = () => {
  return (
    <Card className="border-none shadow-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-zinc-50">
        <CardTitle className="text-lg font-bold">Inventory Overview</CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by name..." 
              className="h-9 bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-3 text-xs w-[200px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-xs font-semibold border-zinc-200">
            <Filter size={14} /> Filters
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-xs font-semibold border-zinc-200">
            <Download size={14} /> Export
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold">
            <Plus size={14} /> Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/50 text-[11px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Product ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-400">{product.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-center font-semibold text-zinc-600">{product.quantity}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-500">{product.expiry}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-5 flex items-center justify-between border-t border-zinc-50 bg-zinc-50/30">
          <p className="text-[13px] text-zinc-500 font-medium">Showing 5 of 124 products</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-zinc-200 disabled:opacity-50" disabled>Previous</Button>
            <div className="flex items-center gap-1">
              {[1, 2, 3, '...', 12].map((p, i) => (
                <button 
                  key={i}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                    p === 1 ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs border-zinc-200">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductTable;
