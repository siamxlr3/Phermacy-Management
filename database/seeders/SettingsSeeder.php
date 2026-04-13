<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Address;
use App\Models\Tax;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Seed Branch Address
        Address::create([
            'name' => 'Downtown Branch',
            'phone' => '+1 (555) 012-3456',
            'email' => 'downtown@pharmly.com',
            'address' => '123 Medical Plaza, 4th Floor, City Center',
            'google_maps_embed' => null,
            'status' => 'Active',
        ]);

        Address::create([
            'name' => 'Wayside Pharmacy',
            'phone' => '+1 (555) 987-6543',
            'email' => 'wayside@pharmly.com',
            'address' => '789 Suburban Road, Near Metro Station',
            'google_maps_embed' => null,
            'status' => 'Active',
        ]);

        // Seed Tax Configurations
        Tax::create([
            'name' => 'VAT (5%)',
            'rate' => 5.00,
            'status' => 'Active',
        ]);

        Tax::create([
            'name' => 'Excise Duty',
            'rate' => 2.50,
            'status' => 'Inactive',
        ]);
    }
}
