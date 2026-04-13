<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExpenseService;
use App\Http\Requests\Api\StoreExpenseRequest;
use App\Http\Requests\Api\UpdateExpenseRequest;
use App\Http\Resources\Api\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    protected $expenseService;

    public function __construct(ExpenseService $expenseService)
    {
        $this->expenseService = $expenseService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');
            $status = $request->get('status');
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');

            $expenses = $this->expenseService->getExpenses($perPage, $search, $status, $fromDate, $toDate);

            return response()->json([
                'success' => true,
                'message' => 'Expenses fetched successfully',
                'data' => ExpenseResource::collection($expenses),
                'meta' => [
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'per_page' => $expenses->perPage(),
                    'total' => $expenses->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function summary(): JsonResponse
    {
        try {
            $summary = $this->expenseService->getExpenseSummary();
            
            return response()->json([
                'success' => true,
                'message' => 'Expense summary fetched successfully',
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $expense = $this->expenseService->getExpenseById($id);
            if (!$expense) {
                return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense fetched successfully',
                'data' => new ExpenseResource($expense)
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        try {
            $expense = $this->expenseService->createExpense($request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Expense created successfully',
                'data' => new ExpenseResource($expense)
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(UpdateExpenseRequest $request, int $id): JsonResponse
    {
        try {
            $expense = $this->expenseService->getExpenseById($id);
            if (!$expense) {
                return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
            }

            $updatedExpense = $this->expenseService->updateExpense($expense, $request->validated());
            
            return response()->json([
                'success' => true,
                'message' => 'Expense updated successfully',
                'data' => new ExpenseResource($updatedExpense)
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $expense = $this->expenseService->getExpenseById($id);
            if (!$expense) {
                return response()->json(['success' => false, 'message' => 'Expense not found'], 404);
            }

            $this->expenseService->deleteExpense($expense);
            
            return response()->json([
                'success' => true,
                'message' => 'Expense deleted successfully',
                'data' => null
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
