<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->company,
            'contact_person' => $this->faker->name,
            'phone' => $this->faker->unique()->phoneNumber,
            'email' => $this->faker->unique()->safeEmail,
            'address' => $this->faker->address,
            'credit_days' => $this->faker->numberBetween(0, 30),
            'status' => $this->faker->randomElement(['Active', 'Inactive']),
        ];
    }
}
