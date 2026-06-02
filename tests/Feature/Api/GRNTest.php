<?php

namespace Tests\Feature\Api;

use App\Models\GRN;
use App\Models\GRNItem;
use App\Models\Supplier;
use App\Models\Medicine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GRNTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_grn_by_batch_number()
    {
        // 1. Setup - Create a medicine
        $medicine = Medicine::create([
            'medicine_name' => 'Paracetamol',
            'generic_name' => 'Paracetamol',
            'category' => 'Analgesic',
            'manufacturer' => 'PharmaCorp',
            'dosage_form' => 'Tablet',
            'strength' => '500mg',
            'unit_type' => 'Box',
            'sale_unit_label' => 'Tablet',
            'tablets_per_strip' => 10,
            'strips_per_box' => 10,
            'package_size' => 100,
            'price_per_unit' => 1,
            'price_per_stripe' => 10,
            'price_per_box' => 100,
            'mrp' => 120,
            'cost_price' => 80,
            'stock' => 0,
            'reorder_level' => 10,
            'is_active' => true
        ]);

        // 2. Setup - Create a supplier
        $supplier = Supplier::create([
            'name' => 'Supplier A',
            'phone' => '1234567890',
            'email' => 'supplier@example.com',
            'address' => 'Street 1'
        ]);

        // 3. Setup - Create GRNs and Items
        $grn1 = GRN::create([
            'supplier_id' => $supplier->id,
            'received_date' => now(),
            'invoice_number' => 'INV-001',
            'total_amount' => 100,
            'paid_amount' => 0,
            'payment_status' => 'Due'
        ]);

        GRNItem::create([
            'grn_id' => $grn1->id,
            'medicine_id' => $medicine->id,
            'dosage_form_snapshot' => 'Tablet',
            'batch_number' => 'BATCH-ABC',
            'expiry_date' => now()->addYear(),
            'qty_boxes_received' => 10,
            'qty_units_received' => 100,
            'cost_per_box' => 10,
            'cost_per_unit' => 1,
            'subtotal' => 100
        ]);

        $grn2 = GRN::create([
            'supplier_id' => $supplier->id,
            'received_date' => now(),
            'invoice_number' => 'INV-002',
            'total_amount' => 200,
            'paid_amount' => 0,
            'payment_status' => 'Due'
        ]);

        GRNItem::create([
            'grn_id' => $grn2->id,
            'medicine_id' => $medicine->id,
            'dosage_form_snapshot' => 'Tablet',
            'batch_number' => 'BATCH-XYZ',
            'expiry_date' => now()->addYear(),
            'qty_boxes_received' => 20,
            'qty_units_received' => 200,
            'cost_per_box' => 10,
            'cost_per_unit' => 1,
            'subtotal' => 200
        ]);

        // 4. Action - Search for BATCH-ABC
        $response = $this->getJson('/api/v1/grns?search=BATCH-ABC');

        // 5. Assert - Only INV-001 should be returned
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.invoice_number', 'INV-001');

        // 6. Action - Search for XYZ
        $response = $this->getJson('/api/v1/grns?search=BATCH-XYZ');

        // 7. Assert - Only INV-002 should be returned
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.invoice_number', 'INV-002');
            
        // 8. Action - Search by prefix
        $response = $this->getJson('/api/v1/grns?search=BATCH');

        // 9. Assert - Both should be returned
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
