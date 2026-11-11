<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ListController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\StatusController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'show'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
});

// can:admin re-checks the role on every request, so a demoted admin loses access mid-session.
Route::middleware(['auth', 'can:admin'])->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::get('/producers', [ProducerController::class, 'index'])->name('producers');
    Route::post('/producers/{id}/approve', [ProducerController::class, 'approve'])->name('producers.approve');
    Route::post('/producers/{id}/reject', [ProducerController::class, 'reject'])->name('producers.reject');
    Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews');
    Route::post('/reviews/{id}/keep', [ReviewController::class, 'keep'])->name('reviews.keep');
    Route::post('/reviews/{id}/hide', [ReviewController::class, 'hide'])->name('reviews.hide');
    Route::get('/content', [ContentController::class, 'index'])->name('content');
    Route::post('/content/{type}/{id}/{action}', [ContentController::class, 'setHidden'])->name('content.set')
        ->whereIn('type', ['product', 'producer'])->whereIn('action', ['hide', 'unhide']);
    Route::get('/users', [ListController::class, 'users'])->name('users');
    Route::get('/orders', [ListController::class, 'orders'])->name('orders');
    Route::get('/auctions', [ListController::class, 'auctions'])->name('auctions');
    Route::get('/status', StatusController::class)->name('status');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
