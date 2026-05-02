<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CashRegisterService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CashRegisterController extends Controller
{
    protected $service;

    public function __construct(CashRegisterService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id() ?? (\App\Models\User::first()->id ?? null);
        $query = \App\Models\CashRegister::where('user_id', $userId);

        if ($request->has('from') && $request->from) {
            $query->whereDate('shift_date', '>=', $request->from);
        }
        if ($request->has('to') && $request->to) {
            $query->whereDate('shift_date', '<=', $request->to);
        }

        $registers = $query->with('denominations')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $registers
        ]);
    }

    public function status(): JsonResponse
    {
        $userId = Auth::id() ?? (\App\Models\User::first()->id ?? null);
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: No users found in the system. Please seed the database.'
            ], 401);
        }

        $register = $this->service->getActiveRegister($userId);

        return response()->json([
            'success' => true,
            'is_open' => !!$register,
            'register' => $register
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $request->validate([
            'opening_balance' => 'required|numeric|min:0',
        ]);

        $userId = Auth::id() ?? (\App\Models\User::first()->id ?? null);
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: No users found in the system. Please seed the database.'
            ], 401);
        }

        $register = $this->service->openRegister($userId, $request->opening_balance);

        return response()->json([
            'success' => true,
            'message' => 'Cash register opened successfully',
            'register' => $register
        ]);
    }

    public function close(Request $request): JsonResponse
    {
        $request->validate([
            'counted_cash' => 'required|numeric|min:0',
            'denominations' => 'required|array',
            'denominations.*.denomination' => 'required|numeric',
            'denominations.*.quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        $userId = Auth::id() ?? (\App\Models\User::first()->id ?? null);
        
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: No users found in the system. Please seed the database.'
            ], 401);
        }

        $register = $this->service->getActiveRegister($userId);

        if (!$register) {
            return response()->json([
                'success' => false,
                'message' => 'No active cash register found'
            ], 404);
        }

        $register = $this->service->closeRegister(
            $register,
            $request->counted_cash,
            $request->denominations,
            $request->notes
        );

        return response()->json([
            'success' => true,
            'message' => 'Cash register closed successfully',
            'register' => $register
        ]);
    }
}
