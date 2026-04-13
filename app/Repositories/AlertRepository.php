<?php

namespace App\Repositories;

use App\Models\Alert;
use Illuminate\Pagination\LengthAwarePaginator;

class AlertRepository
{
    public function getActiveAlerts(
        int $perPage = 10,
        ?string $type = null,
        ?string $severity = null,
        ?string $fromDate = null,
        ?string $toDate = null,
        ?string $search = null
    ): LengthAwarePaginator {
        $query = Alert::with(['medicine', 'stockBatch'])->active();

        if ($type) {
            $query->where('type', $type);
        }

        if ($severity) {
            $query->where('severity', $severity);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('medicine', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Alert
    {
        return Alert::find($id);
    }

    public function create(array $data): Alert
    {
        // Avoid duplicate active alerts for the same medicine/type if one already exists
        $search = [
            'type' => $data['type'],
            'status' => 'Active',
        ];

        if (isset($data['medicine_id'])) {
            $search['medicine_id'] = $data['medicine_id'];
        }

        if (isset($data['stock_batch_id'])) {
            $search['stock_batch_id'] = $data['stock_batch_id'];
        }

        return Alert::updateOrCreate($search, $data);
    }

    public function dismiss(int $id): bool
    {
        $alert = $this->findById($id);
        if ($alert) {
            return $alert->update(['status' => 'Dismissed']);
        }
        return false;
    }

    public function dismissByTypeAndMedicine(int $medicineId, string $type): void
    {
        Alert::where('medicine_id', $medicineId)
            ->where('type', $type)
            ->where('status', 'Active')
            ->update(['status' => 'Dismissed']);
    }

    public function getActiveCount(): int
    {
        return Alert::active()->count();
    }
}
