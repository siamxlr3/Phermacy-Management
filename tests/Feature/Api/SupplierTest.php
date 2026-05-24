<?php

namespace Tests\Feature\Api;

use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_suppliers()
    {
        Supplier::factory()->count(5)->create();

        $response = $this->getJson('/api/suppliers');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    public function test_can_search_suppliers_by_name()
    {
        Supplier::factory()->create(['name' => 'Acme Corp']);
        Supplier::factory()->create(['name' => 'Globex']);

        $response = $this->getJson('/api/suppliers?search=Acme');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Acme Corp');
    }

    public function test_cannot_create_supplier_with_duplicate_phone()
    {
        Supplier::factory()->create(['phone' => '1234567890']);

        $response = $this->postJson('/api/suppliers', [
            'name' => 'New Supplier',
            'phone' => '1234567890',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_cache_is_cleared_on_supplier_update()
    {
        Cache::shouldReceive('forget')
            ->with('suppliers.active_list')
            ->atLeast()->once();

        $supplier = Supplier::factory()->create(['status' => 'Active']);
        $supplier->update(['name' => 'Updated Name']);
    }

    public function test_cache_is_cleared_on_supplier_restore()
    {
        $supplier = Supplier::factory()->create();
        $supplier->delete();

        Cache::shouldReceive('forget')
            ->with('suppliers.active_list')
            ->atLeast()->once();

        $supplier->restore();
    }
}
