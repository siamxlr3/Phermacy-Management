<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Medicine;
use App\Models\StockBatch;
use Illuminate\Http\Request;
use App\Http\Resources\Api\AlertResource;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlertController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        // FIX: limit max per_page to prevent memory exhaustion
        $perPage = min($request->get('per_page', 10), 100);
        $type = $request->get('type');
        $severity = $request->get('severity');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $search = $request->get('search');

        // FIX: 'batch' typo changed to 'stockBatch' to actually trigger eager loading
        $query = Alert::with(['medicine', 'stockBatch'])->where('status', Alert::STATUS_ACTIVE);

        if ($type) $query->where('type', $type);
        if ($severity) $query->where('severity', $severity);
        
        if ($fromDate && $toDate) {
            $query->whereBetween('alerts.created_at', [
                Carbon::parse($fromDate)->startOfDay(), 
                Carbon::parse($toDate)->endOfDay()
            ]);
        }
        
        if ($search) {
            // FIX: JOIN instead of whereHas for large dataset text searching
            $query->join('medicines', 'alerts.medicine_id', '=', 'medicines.id')
                  ->where(function($q) use ($search) {
                      $q->where('medicines.name', 'like', "%{$search}%")
                        ->orWhere('alerts.message', 'like', "%{$search}%");
                  })
                  ->select('alerts.*'); // ensure we only select alert columns
        }

        // FIX: simplePaginate is much faster for large datasets
        $alerts = $query->latest('alerts.created_at')->simplePaginate($perPage);
        return AlertResource::collection($alerts);
    }

    public function dismiss(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update(['status' => Alert::STATUS_DISMISSED]);
        Cache::forget('active_alerts_count');
        return response()->json(['success' => true, 'message' => 'Alert dismissed']);
    }

    public function summary(): JsonResponse
    {
        // FIX: Combined 3 separate table scans into 1 SQL aggregation
        $summary = Alert::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN type = 'Expiry' THEN 1 ELSE 0 END) as expiry_alerts,
            SUM(CASE WHEN type = 'Low Stock' THEN 1 ELSE 0 END) as low_stock_alerts
        ")->where('status', Alert::STATUS_ACTIVE)->first();

        return response()->json([
            'success' => true, 
            'data' => [
                'total' => (int) ($summary->total ?? 0),
                'expiry_alerts' => (int) ($summary->expiry_alerts ?? 0),
                'low_stock_alerts' => (int) ($summary->low_stock_alerts ?? 0),
            ]
        ]);
    }

    public function scanExpiries(): JsonResponse
    {
        $today = Carbon::today();
        $batches = StockBatch::where('expiry_date', '<=', $today->copy()->addDays(90))
            ->where('qty_tablets_remaining', '>', 0)
            ->with('medicine')
            ->get();

        // FIX: Pre-load existing alerts to prevent N+1 query loop
        $existingAlerts = Alert::where('type', 'Expiry')
            ->whereIn('stock_batch_id', $batches->pluck('id'))
            ->get()
            ->keyBy('stock_batch_id');

        $toInsert = [];
        $now = now();
        $count = 0;

        foreach ($batches as $batch) {
            $expiryDate = Carbon::parse($batch->expiry_date);
            $daysRemaining = $today->diffInDays($expiryDate, false);
            
            $severity = 'Info';
            if ($daysRemaining <= 0) $severity = 'Critical';
            elseif ($daysRemaining <= 30) $severity = 'Critical';
            elseif ($daysRemaining <= 60) $severity = 'Warning';

            $message = "Batch {$batch->batch_number} of " . ($batch->medicine->name ?? 'Unknown') . " expires in {$daysRemaining} days.";

            if ($existingAlerts->has($batch->id)) {
                $alert = $existingAlerts->get($batch->id);
                // Update severity/message if it's active and changed
                if ($alert->status === Alert::STATUS_ACTIVE && $alert->severity !== $severity) {
                    $alert->update([
                        'severity' => $severity,
                        'message' => $message
                    ]);
                }
                continue;
            }

            $toInsert[] = [
                'medicine_id' => $batch->medicine_id,
                'stock_batch_id' => $batch->id,
                'type' => 'Expiry',
                'severity' => $severity,
                'message' => $message,
                'status' => Alert::STATUS_ACTIVE,
                'created_at' => $now,
                'updated_at' => $now
            ];
            $count++;
        }

        // FIX: Bulk Insert all new alerts in 1 query
        if (!empty($toInsert)) {
            Alert::insert($toInsert);
        }

        Cache::forget('active_alerts_count');
        return response()->json(['success' => true, 'message' => "Scan complete. {$count} new expiry alerts generated."]);
    }

    public function scanStock(): JsonResponse
    {
        $medicines = Medicine::whereRaw('stock <= reorder_level')->get();

        // FIX: Pre-load existing alerts to prevent N+1 query loop
        $existingAlerts = Alert::where('type', 'Low Stock')
            ->whereIn('medicine_id', $medicines->pluck('id'))
            ->get()
            ->keyBy('medicine_id');

        $toInsert = [];
        $now = now();
        $count = 0;

        foreach ($medicines as $medicine) {
            $severity = $medicine->stock <= 0 ? 'Critical' : 'Warning';
            $message = "Stock level for {$medicine->name} is low ({$medicine->stock} remaining).";

            if ($existingAlerts->has($medicine->id)) {
                $alert = $existingAlerts->get($medicine->id);
                // Update severity/message if it's active and changed
                if ($alert->status === Alert::STATUS_ACTIVE && $alert->severity !== $severity) {
                    $alert->update([
                        'severity' => $severity,
                        'message' => $message
                    ]);
                }
                continue;
            }

            $toInsert[] = [
                'medicine_id' => $medicine->id,
                'stock_batch_id' => null,
                'type' => 'Low Stock',
                'severity' => $severity,
                'message' => $message,
                'status' => Alert::STATUS_ACTIVE,
                'created_at' => $now,
                'updated_at' => $now
            ];
            $count++;
        }

        // FIX: Bulk Insert all new alerts in 1 query
        if (!empty($toInsert)) {
            Alert::insert($toInsert);
        }

        Cache::forget('active_alerts_count');
        return response()->json(['success' => true, 'message' => "Scan complete. {$count} new low stock alerts generated."]);
    }
}
