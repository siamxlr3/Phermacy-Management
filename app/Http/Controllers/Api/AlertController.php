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
use App\Http\Requests\Api\AlertFilterRequest;

class AlertController extends Controller
{
    /**
     * List active alerts with optimized joins and background-ready scanning.
     */
    public function index(AlertFilterRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $perPage = $validated['per_page'] ?? 10;
        
        $query = Alert::with(['medicine:id,medicine_name', 'stockBatch:id,batch_number'])
            ->where('status', Alert::STATUS_ACTIVE);

        if ($request->filled('type')) {
            $query->where('type', $validated['type']);
        }
        
        if ($request->filled('severity')) {
            $query->where('severity', $validated['severity']);
        }
        
        if ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('created_at', [
                Carbon::parse($validated['from_date'])->startOfDay(), 
                Carbon::parse($validated['to_date'])->endOfDay()
            ]);
        }
        
        if ($request->filled('search')) {
            $search = $validated['search'];
            $query->where(function($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhereHas('medicine', function($mq) use ($search) {
                      $mq->where('medicine_name', 'like', "{$search}%");
                  });
            });
        }

        $alerts = $query->latest('created_at')->paginate($perPage);
        return AlertResource::collection($alerts);
    }

    /**
     * Dismiss an alert.
     */
    public function dismiss(int $id): JsonResponse
    {
        $alert = Alert::findOrFail($id);
        $alert->update(['status' => Alert::STATUS_DISMISSED]);
        
        // Surgical cache invalidation is preferred, but following project pattern:
        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            Cache::tags(['inventory', 'dashboard'])->flush();
        } else {
            Cache::flush();
        }
        
        return response()->json([
            'success' => true, 
            'message' => 'Alert dismissed'
        ]);
    }

    /**
     * Get a high-performance summary of active alerts.
     */
    public function summary(): JsonResponse
    {
        $summary = Alert::active()
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as expiry_alerts,
                SUM(CASE WHEN type = ? THEN 1 ELSE 0 END) as low_stock_alerts
            ", [Alert::TYPE_EXPIRY, Alert::TYPE_LOW_STOCK])->first();

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
