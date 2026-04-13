<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Catch-all: let React Router handle all frontend routes
// This prevents 404s on page refresh for any /dashboard, /pos/new, etc.
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
