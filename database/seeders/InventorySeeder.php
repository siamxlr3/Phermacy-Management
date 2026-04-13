<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Manufacturer;
use App\Models\Medicine;
use App\Models\Supplier;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categories
        $categories = ['Tablets', 'Capsules', 'Syrups', 'Injections', 'Ointments'];
        foreach ($categories as $cat) {
            Category::create(['name' => $cat, 'status' => 'Active']);
        }

        // 2. Manufacturers
        $manufacturers = [
            'GSK (GlaxoSmithKline)',
            'Pfizer Inc.',
            'Beximco Pharmaceuticals',
            'Square Pharmaceuticals',
            'Sandoz (Novartis)',
            'Bayer AG'
        ];
        foreach ($manufacturers as $man) {
            Manufacturer::create(['name' => $man, 'status' => 'Active']);
        }

        // 3. Suppliers
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

        // 4. Medicines
        $medicines = [
            [
                'name' => 'Napa',
                'generic_name' => 'Paracetamol',
                'category_id' => 1, // Tablets
                'manufacturer_id' => 3, // Beximco
                'tablets_per_strip' => 10,
                'strips_per_box' => 50,
                'price_per_tablet' => 1.20,
                'cost_price' => 0.80,
                'stock' => 500,
                'reorder_level' => 100,
            ],
            [
                'name' => 'Ace Plus',
                'generic_name' => 'Paracetamol + Caffeine',
                'category_id' => 1,
                'manufacturer_id' => 4, // Square
                'tablets_per_strip' => 12,
                'strips_per_box' => 30,
                'price_per_tablet' => 2.50,
                'cost_price' => 1.90,
                'stock' => 300,
                'reorder_level' => 50,
            ],
            [
                'name' => 'Fexo 120',
                'generic_name' => 'Fexofenadine',
                'category_id' => 1,
                'manufacturer_id' => 3,
                'tablets_per_strip' => 10,
                'strips_per_box' => 10,
                'price_per_tablet' => 8.00,
                'cost_price' => 5.50,
                'stock' => 150,
                'reorder_level' => 20,
            ],
            [
                'name' => 'Amoxicillin 500',
                'generic_name' => 'Amoxicillin Trihydrate',
                'category_id' => 2, // Capsules
                'manufacturer_id' => 2, // Pfizer
                'tablets_per_strip' => 6,
                'strips_per_box' => 20,
                'price_per_tablet' => 15.00,
                'cost_price' => 12.00,
                'stock' => 240,
                'reorder_level' => 40,
            ],
            [
                'name' => 'Advasyl Syrup',
                'generic_name' => 'Antacid',
                'category_id' => 3, // Syrups
                'manufacturer_id' => 4,
                'tablets_per_strip' => 0,
                'strips_per_box' => 0,
                'sale_unit' => 'Bottle',
                'price_per_tablet' => 85.00, // Price per bottle for syrups
                'cost_price' => 65.00,
                'stock' => 45,
                'reorder_level' => 10,
            ],
            [
                'name' => 'Insulin Humulin',
                'generic_name' => 'Human Insulin',
                'category_id' => 4, // Injections
                'manufacturer_id' => 1, // GSK
                'tablets_per_strip' => 0,
                'strips_per_box' => 0,
                'sale_unit' => 'Vial',
                'price_per_tablet' => 450.00,
                'cost_price' => 380.00,
                'stock' => 15,
                'reorder_level' => 5,
            ]
        ];

        foreach ($medicines as $med) {
            Medicine::create($med + ['status' => 'Active']);
        }
    }
}
