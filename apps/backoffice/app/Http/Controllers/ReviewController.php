<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use MongoDB\BSON\ObjectId;

// Same queue and rules as the API (apps/api/src/modules/reviews/reviews.service.ts).
class ReviewController extends Controller
{
    public function index()
    {
        // The queue: reviews with an open report plus hidden ones, newest report first.
        $reviews = Review::where(fn ($q) => $q->where('report.open', true)->orWhere('hidden', true))
            ->orderByDesc('report.reportedAt')->orderByDesc('_id')->limit(200)->get();
        $ids = $reviews->flatMap(fn ($r) => [(string) $r->buyer, (string) $r->producer])->unique()->values()->all();

        return view('reviews', [
            'reviews' => $reviews,
            'people' => User::whereIn('_id', $ids)->get()->keyBy(fn ($u) => (string) $u->id),
        ]);
    }

    /** Dismisses the report; the review stays public. */
    public function keep(string $id)
    {
        if (! Review::where('_id', $id)->where('report.open', true)->update(['report.open' => false])) {
            return $this->refused('report');
        }

        return back()->with('status', 'Report dismissed. The review stays public.');
    }

    /** Hides the review, closes the report and takes it out of the rating averages. */
    public function hide(string $id)
    {
        $inQueue = Review::where('_id', $id)->where(fn ($q) => $q->where('report.open', true)->orWhere('hidden', true));
        if (! $inQueue->update(['hidden' => true, 'report.open' => false])) {
            return $this->refused('report');
        }

        $review = Review::find($id);
        User::where('_id', (string) $review->producer)->update($this->ratingStats('producer', $review->producer, 'producer.'));
        foreach ($review->products ?? [] as $productId) {
            Product::where('_id', (string) $productId)->update($this->ratingStats('products', $productId));
        }

        return back()->with('status', 'Review hidden. Ratings were recalculated.');
    }

    private function ratingStats(string $field, mixed $id, string $prefix = ''): array
    {
        $visible = Review::where($field, new ObjectId((string) $id))->where('hidden', '!=', true);

        return [
            $prefix.'averageRating' => round((float) $visible->avg('rating'), 2),
            $prefix.'ratingCount' => $visible->count(),
        ];
    }
}
