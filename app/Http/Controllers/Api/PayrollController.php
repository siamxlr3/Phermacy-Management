<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PayrollRequest;
use App\Http\Resources\Api\PayrollResource;
use App\Services\PayrollService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search');
        $status = $request->get('status');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');

        $payrolls = $this->payrollService->getAllPayroll($perPage, $search, $status, $fromDate, $toDate);
        return PayrollResource::collection($payrolls);
    }

    public function store(PayrollRequest $request): JsonResponse
    {
        try {
            $payroll = $this->payrollService->createPayroll($request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Payroll record generated successfully',
                'data' => new PayrollResource($payroll)
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show($id): PayrollResource
    {
        $payroll = $this->payrollService->getPayrollById($id);
        return new PayrollResource($payroll);
    }

    public function update(PayrollRequest $request, $id): JsonResponse
    {
        try {
            $payroll = $this->payrollService->updatePayroll($id, $request->validated());
            return response()->json([
                'success' => true,
                'message' => 'Payroll record updated successfully',
                'data' => new PayrollResource($payroll)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $this->payrollService->deletePayroll($id);
            return response()->json([
                'success' => true,
                'message' => 'Payroll record removed successfully'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
