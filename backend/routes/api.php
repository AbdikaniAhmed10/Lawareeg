<?php

use App\Http\Controllers\Api\Admin\SellerVerificationController as AdminSellerVerificationController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\DisputeController as AdminDisputeController;
use App\Http\Controllers\Api\Admin\ListingController as AdminListingController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\WithdrawalController as AdminWithdrawalController;
use App\Http\Controllers\Api\AssetPreviewController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\MyListingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SecureFileController;
use App\Http\Controllers\Api\SellerController;
use App\Http\Controllers\Api\SellerVerificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Signed temporary downloads for sensitive files (issued only to authorized API consumers).
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/secure/orders/{order}/payment-proof', [SecureFileController::class, 'paymentProof'])
        ->middleware('signed')
        ->name('secure.payment-proof');
    Route::get('/secure/verifications/{verification}/document', [SecureFileController::class, 'sellerDocument'])
        ->middleware('signed')
        ->name('secure.seller-document');
    Route::get('/secure/messages/{message}/attachment', [SecureFileController::class, 'messageAttachment'])
        ->middleware('signed')
        ->name('secure.message-attachment');
});

// ---- Auth ----
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/email/verify-code', [AuthController::class, 'verifyEmailCode'])->middleware('throttle:10,1');
        Route::post('/email/resend', [AuthController::class, 'resendVerification'])->middleware('throttle:6,1');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('verified');
        Route::post('/profile', [AuthController::class, 'updateProfile'])->middleware('verified');
        Route::put('/password', [AuthController::class, 'updatePassword'])->middleware('verified');
    });
});

// ---- Public listings / categories / sellers ----
Route::get('/listings/featured', [ListingController::class, 'featured']);
Route::get('/listings/latest', [ListingController::class, 'latest']);
Route::get('/listings/{idOrSlug}/reviews', [ListingController::class, 'reviews']);
Route::get('/listings/{slug}', [ListingController::class, 'show']);
Route::get('/listings', [ListingController::class, 'index']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}/listings', [CategoryController::class, 'listings']);

Route::get('/sellers/top', [SellerController::class, 'top']);
Route::get('/users/{user}', [SellerController::class, 'show']);
Route::get('/sellers/{user}', [SellerController::class, 'show']);
Route::get('/settings', [SettingController::class, 'show']);

// ---- Authenticated routes ----
Route::middleware(['auth:sanctum', 'not-suspended', 'verified'])->group(function () {
    // My listings
    Route::get('/my/listings', [MyListingController::class, 'index']);
    Route::get('/my/listings/{listing}', [MyListingController::class, 'show']);
    Route::post('/my/listings', [MyListingController::class, 'store'])->middleware('throttle:20,1');
    Route::put('/my/listings/{listing}', [MyListingController::class, 'update'])->middleware('throttle:30,1');
    Route::post('/my/listings/{listing}', [MyListingController::class, 'update'])->middleware('throttle:30,1');
    Route::delete('/my/listings/{listing}', [MyListingController::class, 'destroy']);
    Route::post('/my/listings/{listing}/screenshots', [MyListingController::class, 'uploadScreenshots'])->middleware('throttle:20,1');
    Route::post('/my/listings/{listing}/ownership/mark-placed', [MyListingController::class, 'markOwnershipCodePlaced']);
    Route::post('/assets/preview', AssetPreviewController::class)->middleware('throttle:20,1');

    // Favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites/{listingId}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{listingId}', [FavoriteController::class, 'destroy']);

    // Reviews
    Route::get('/my/reviews', [ReviewController::class, 'myReviews']);
    Route::post('/orders/{orderId}/review', [ReviewController::class, 'store'])->middleware('throttle:10,1');

    // Orders
    Route::get('/my/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:10,1');
    Route::post('/orders/{order}/payment-proof', [OrderController::class, 'paymentProof'])->middleware('throttle:10,1');
    Route::post('/orders/{order}/mark-transferring', [OrderController::class, 'markTransferring'])->middleware('throttle:20,1');
    Route::post('/orders/{order}/confirm-receipt', [OrderController::class, 'confirmReceipt'])->middleware('throttle:20,1');
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->middleware('throttle:10,1');
    Route::post('/orders/{order}/dispute', [OrderController::class, 'dispute'])->middleware('throttle:10,1');
    Route::get('/orders/{order}/timeline', [OrderController::class, 'timeline']);

    // Wallet
    Route::get('/wallet', [WalletController::class, 'show']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
    Route::get('/wallet/withdrawals', [WalletController::class, 'withdrawals']);
    Route::post('/wallet/withdrawals', [WalletController::class, 'storeWithdrawal'])->middleware('throttle:5,1');
    Route::post('/wallet/withdrawals/{withdrawal}/cancel', [WalletController::class, 'cancelWithdrawal'])->middleware('throttle:10,1');

    // Seller verification
    Route::get('/seller/verification', [SellerVerificationController::class, 'show']);
    Route::post('/seller/verification', [SellerVerificationController::class, 'store'])->middleware('throttle:5,1');

    // Messages
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::post('/conversations', [ConversationController::class, 'store'])->middleware('throttle:20,1');
    Route::post('/conversations/support', [ConversationController::class, 'startSupport'])->middleware('throttle:10,1');
    Route::get('/conversations/{conversation}', [ConversationController::class, 'show']);
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'storeMessage'])->middleware('throttle:60,1');
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markRead']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // ---- Admin ----
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{user}', [AdminUserController::class, 'update']);
        Route::post('/users/{user}/suspend', [AdminUserController::class, 'suspend']);
        Route::post('/users/{user}/reinstate', [AdminUserController::class, 'reinstate']);

        Route::get('/verifications', [AdminSellerVerificationController::class, 'index']);
        Route::post('/verifications/{verification}/approve', [AdminSellerVerificationController::class, 'approve']);
        Route::post('/verifications/{verification}/reject', [AdminSellerVerificationController::class, 'reject']);

        Route::get('/listings', [AdminListingController::class, 'index']);
        Route::post('/listings/{listing}/approve', [AdminListingController::class, 'approve']);
        Route::post('/listings/{listing}/reject', [AdminListingController::class, 'reject']);
        Route::post('/listings/{listing}/verify-ownership', [AdminListingController::class, 'verifyOwnership']);
        Route::post('/listings/{listing}/reject-ownership', [AdminListingController::class, 'rejectOwnership']);

        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::post('/orders/{order}/confirm-payment', [AdminOrderController::class, 'confirmPayment']);
        Route::post('/orders/{order}/release-funds', [AdminOrderController::class, 'releaseFunds']);
        Route::post('/orders/{order}/refund', [AdminOrderController::class, 'refund']);
        Route::post('/orders/{order}/resolve-dispute', [AdminOrderController::class, 'resolveDispute']);

        Route::get('/withdrawals', [AdminWithdrawalController::class, 'index']);
        Route::post('/withdrawals/{withdrawal}/approve', [AdminWithdrawalController::class, 'approve']);
        Route::post('/withdrawals/{withdrawal}/reject', [AdminWithdrawalController::class, 'reject']);
        Route::post('/withdrawals/{withdrawal}/mark-paid', [AdminWithdrawalController::class, 'markPaid']);

        Route::get('/categories', [AdminCategoryController::class, 'index']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        Route::get('/disputes', [AdminDisputeController::class, 'index']);

        Route::get('/support', [ConversationController::class, 'supportIndex']);

        Route::get('/settings', [AdminSettingController::class, 'show']);
        Route::put('/settings', [AdminSettingController::class, 'update']);

        Route::get('/reports', [AdminReportController::class, 'index']);
    });
});
