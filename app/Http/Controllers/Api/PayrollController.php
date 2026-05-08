<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Staff;
use Illuminate\Http\Request;
use App\Http\Resources\Api\PayrollResource;
use Illuminate\Support\Facades\Cache;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $query = Payroll::with('staff');

        if ($search) {
            $query->whereHas('staff', function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($fromDate && $toDate) {
            $query->whereBetween('payment_date', [$fromDate, $toDate]);
        }

        $payroll = $query->orderBy('payment_date', 'desc')->paginate($perPage);
        return PayrollResource::collection($payroll);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'month' => 'required|string',
            'year' => 'required|integer',
            'basic_salary' => 'required|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'deduction' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'status' => 'required|string|in:Paid,Pending',
            'notes' => 'nullable|string',
        ]);

        $basic = $validated['basic_salary'];
        $bonus = $validated['bonus'] ?? 0;
        $deduction = $validated['deduction'] ?? 0;
        $validated['net_salary'] = $basic + $bonus - $deduction;

        if ($validated['status'] === 'Paid') {
            $validated['paid_at'] = now();
        }

        $payroll = Payroll::create($validated);
        Cache::flush();
        return new PayrollResource($payroll->load('staff'));
    }

    public function show(int $id)
    {
        $payroll = Payroll::with('staff')->findOrFail($id);
        return new PayrollResource($payroll);
    }

    public function update(Request $request, int $id)
    {
        $payroll = Payroll::findOrFail($id);
        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'month' => 'required|string',
            'year' => 'required|integer',
            'basic_salary' => 'required|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'deduction' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'status' => 'required|string|in:Paid,Pending',
            'notes' => 'nullable|string',
        ]);

        $basic = $validated['basic_salary'];
        $bonus = $validated['bonus'] ?? 0;
        $deduction = $validated['deduction'] ?? 0;
        $validated['net_salary'] = $basic + $bonus - $deduction;

        if ($validated['status'] === 'Paid' && $payroll->status !== 'Paid') {
            $validated['paid_at'] = now();
        }

        $payroll->update($validated);
        Cache::flush();
        return new PayrollResource($payroll->load('staff'));
    }

    public function destroy(int $id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();
        Cache::flush();
        return response()->json(['success' => true, 'message' => 'Payroll record deleted successfully']);
    }
}
