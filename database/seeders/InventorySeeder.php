<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Medicine;
use App\Models\Supplier;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Suppliers
        Supplier::create([
            'name' => 'Metro Meds Distribution',
            'contact_person' => 'John Doe',
            'phone' => '+1 (555) 111-2222',
            'email' => 'sales@metromeds.com',
            'address' => '45 Supply Lane, Industrial Zone',
            'credit_days' => 30,
            'status' => 'Active'
        ]);

        Supplier::create([
            'name' => 'Reliable Pharma Wholesalers',
            'contact_person' => 'Sarah Connor',
            'phone' => '+1 (555) 333-4444',
            'email' => 'orders@reliablepharma.com',
            'address' => '12 Bulk St, Distribution Hub',
            'status' => 'Active'
        ]);

        // 2. Medicines
        $medicines = [
            [
                'name' => 'Napa',
                'generic_name' => 'Paracetamol',
                'category_name' => 'Tablets',
                'manufacturer_name' => 'Beximco Pharmaceuticals',
                'dosage_form' => 'Tablet',
                'strength' => '500mg',
                'tablet_per_stripe' => 10,
                'stripe_per_box' => 50,
                'price_per_tablet' => 1.20,
                'price_per_stripe' => 12.00,
                'price_per_box' => 600.00,
                'stock' => 500,
                'reorder_level' => 100,
                'status' => 'Active'
            ],
            [
                'name' => 'Ace Plus',
                'generic_name' => 'Paracetamol + Caffeine',
                'category_name' => 'Tablets',
                'manufacturer_name' => 'Square Pharmaceuticals',
                'dosage_form' => 'Tablet',
                'strength' => '500mg+65mg',
                'tablet_per_stripe' => 12,
                'stripe_per_box' => 30,
                'price_per_tablet' => 2.50,
                'price_per_stripe' => 30.00,
                'price_per_box' => 900.00,
                'stock' => 300,
                'reorder_level' => 50,
                'status' => 'Active'
            ],
            [
                'name' => 'Fexo 120',
                'generic_name' => 'Fexofenadine',
                'category_name' => 'Tablets',
                'manufacturer_name' => 'Beximco Pharmaceuticals',
                'dosage_form' => 'Tablet',
                'strength' => '120mg',
                'tablet_per_stripe' => 10,
                'stripe_per_box' => 10,
                'price_per_tablet' => 8.00,
                'price_per_stripe' => 80.00,
                'price_per_box' => 800.00,
                'stock' => 150,
                'reorder_level' => 20,
                'status' => 'Active'
            ]
        ];

        foreach ($medicines as $med) {
            Medicine::create($med);
        }
    }
}
