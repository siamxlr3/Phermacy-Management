<?php

namespace App\Imports;

use App\Models\Medicine;
use App\Models\Category;
use App\Models\Manufacturer;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithStartRow;

/**
 * Maps Excel columns by INDEX (0-based), skipping row 1 (headers).
 *
 * Expected column order (matching your template):
 *  0  medicine_name
 *  1  generic_name
 *  2  category
 *  3  manufacturer
 *  4  dosage_form
 *  5  strength
 *  6  unit_type
 *  7  sale_unit_label
 *  8  tablets_per_strip
 *  9  strips_per_box
 * 10  package_size
 * 11  price_per_unit
 * 12  price_per_stripe
 * 13  price_per_box
 * 14  mrp
 * 16  reorder_level
 * 17  stock
 * 18  is_active
 */
class MedicineImport implements ToModel, WithStartRow
{
    // Skip the header row
    public function startRow(): int
    {
        return 2;
    }

    private const ALLOWED_FORMS = [
        'Tablet', 'Capsule', 'Syrup', 'Drops', 'Cream', 'Ointment',
        'Gel', 'Lotion', 'Suspension', 'Injection', 'Inhaler',
        'Powder', 'Suppository', 'Patch', 'Sachet',
    ];

    private function col(array $row, int $index, $default = null)
    {
        $val = isset($row[$index]) ? trim((string)$row[$index]) : '';
        return $val === '' ? $default : $val;
    }

    private function num(array $row, int $index, $default = null)
    {
        $val = $this->col($row, $index);
        return ($val !== null && is_numeric($val)) ? (float)$val : $default;
    }

    private function int(array $row, int $index, $default = null)
    {
        $val = $this->num($row, $index);
        return $val !== null ? (int)$val : $default;
    }

    public function model(array $row): ?Medicine
    {
        // Skip completely empty rows
        if (empty(array_filter($row, fn($v) => trim((string)$v) !== ''))) {
            return null;
        }

        $medicineName = $this->col($row, 0);
        if (!$medicineName) {
            return null; // Skip blank medicine name rows
        }

        // Normalize dosage form (case-insensitive match)
        $rawForm = $this->col($row, 4, '');
        $form = null;
        foreach (self::ALLOWED_FORMS as $allowed) {
            if (strcasecmp($rawForm, $allowed) === 0) {
                $form = $allowed;
                break;
            }
        }

        if (!$form) {
            return null; // Skip rows with invalid dosage form
        }

        $categoryName = $this->col($row, 2, 'General');
        $manufacturerName = $this->col($row, 3, 'Unknown');

        $category = Category::firstOrCreate(['name' => $categoryName]);
        $manufacturer = Manufacturer::firstOrCreate(['name' => $manufacturerName]);

        return new Medicine([
            'medicine_name'     => $medicineName,
            'generic_name'      => $this->col($row, 1),
            'category_id'       => $category->id,
            'manufacturer_id'   => $manufacturer->id,
            'dosage_form'       => $form,
            'strength'          => $this->col($row, 5),
            'unit_type'         => $this->col($row, 6, 'Piece'),
            'sale_unit_label'   => $this->col($row, 7, 'per Piece'),
            'tablets_per_strip' => $this->int($row, 8),
            'strips_per_box'    => $this->int($row, 9),
            'package_size'      => $this->col($row, 10),
            'price_per_unit'    => $this->num($row, 11, 0),
            'price_per_stripe'  => $this->num($row, 12),
            'price_per_box'     => $this->num($row, 13),
            'mrp'               => $this->num($row, 14, 0),
            'reorder_level'     => $this->int($row, 16, 10),
            'stock'             => $this->int($row, 17, 0),
            'is_active'         => $this->int($row, 18, 1) == 1,
        ]);
    }
}
