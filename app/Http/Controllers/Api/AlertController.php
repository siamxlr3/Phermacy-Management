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
    /**
     * List active alerts with optimized joins and background-ready scanning.
     * Note: Scanning is now handled by 'alerts:scan-daily' console command.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = min($request->integer('per_page', 10), 100);
        $type = $request->get('type');
        $severity = $request->get('severity');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $search = $request->get('search');

        $query = Alert::with(['medicine:id,medicine_name', 'stockBatch:id,batch_number'])
            ->where('status', Alert::STATUS_ACTIVE);

        if ($type) $query->where('type', $type);
        if ($severity) $query->where('severity', $severity);
        
        if ($fromDate && $toDate) {
            $query->whereBetween('alerts.created_at', [
                Carbon::parse($fromDate)->startOfDay(), 
                Carbon::parse($toDate)->endOfDay()
            ]);
        }
        
        if ($search) {
            // Optimized join for high-performance text searching
            $query->join('medicines', 'alerts.medicine_id', '=', 'medicines.id')
                  ->where(function($q) use ($search) {
                      $q->where('medicines.medicine_name', 'like', "{$search}%")
                        ->orWhere('alerts.message', 'like', "%{$search}%");
                  })
                  ->select('alerts.*');
        }

        $alerts = $query->latest('alerts.created_at')->simplePaginate($perPage);
        return AlertResource::collection($alerts);
    }

    /**
     * Dismiss an alert.
     */
    public function dismiss(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update(['status' => Alert::STATUS_DISMISSED]);
        
        Cache::tags(['inventory', 'dashboard'])->flush();
        return response()->json(['success' => true, 'message' => 'Alert dismissed']);
    }

    /**
     * Get a high-performance summary of active alerts.
     */
    public function summary(): JsonResponse
    {
        $summary = Alert::active()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN type = 'Expiry' THEN 1 ELSE 0 END) as expiry_alerts,
                SUM(CASE WHEN type = 'Low Stock' THEN 1 ELSE 0 END) as low_stock_alerts
            ")->first();

        return response()->json([
            'success' => true, 
            'data' => [
                'total' => (int) ($summary->total ?? 0),
                'expiry_alerts' => (int) ($summary->expiry_alerts ?? 0),
                'low_stock_alerts' => (int) ($summary->low_stock_alerts ?? 0),
            ]
        ]);
    }
}
