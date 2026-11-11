@extends('layouts.app')
@section('title', 'Reported reviews')

@section('content')
    <h1 class="mb-1">Reported reviews</h1>
    <p class="text-secondary mb-4">
        {{ $reviews->where('hidden', '!=', true)->count() }} waiting for a decision. Keep dismisses the report; Hide removes the review from the site and from the rating averages.
    </p>

    @forelse ($reviews as $review)
        @php
            $producer = $people[(string) $review->producer] ?? null;
            $hidden = $review->hidden === true;
        @endphp
        <article class="panel mb-3" style="height: auto">
            <div class="row g-3">
                <div class="col-md-8">
                    <p class="mb-1 fw-semibold tabular">
                        <span aria-hidden="true" style="color: var(--beet)">{{ str_repeat('★', (int) $review->rating) }}</span><span aria-hidden="true" class="text-secondary">{{ str_repeat('☆', 5 - (int) $review->rating) }}</span>
                        {{ $review->rating }} out of 5
                        @if ($hidden) <span class="badge rounded-pill text-bg-light border fw-medium ms-2">Hidden</span> @endif
                    </p>
                    <p class="mb-2" style="max-width: 65ch">{{ $review->text ?: 'No text, rating only.' }}</p>
                    <p class="text-secondary small mb-0">
                        By {{ $people[(string) $review->buyer]->name ?? 'a deleted account' }}
                        for {{ $producer->producer['farmName'] ?? $producer->name ?? 'an unknown producer' }}@if ($review->productName), {{ $review->productName }}@endif
                        · {{ $review->createdAt?->timezone('Europe/Lisbon')->format('j M Y') }}
                    </p>
                </div>
                <div class="col-md-4">
                    <p class="small mb-2"><span class="text-secondary">Reported for:</span> {{ ($review->report['reason'] ?? '') ?: 'no reason given' }}</p>
                    @unless ($hidden)
                        <div class="d-flex gap-2">
                            <form method="post" action="{{ route('reviews.keep', $review->id) }}" class="flex-fill">
                                @csrf
                                <button class="btn btn-outline-secondary w-100">Keep review</button>
                            </form>
                            <form method="post" action="{{ route('reviews.hide', $review->id) }}" class="flex-fill">
                                @csrf
                                <button class="btn btn-outline-danger w-100">Hide review</button>
                            </form>
                        </div>
                    @endunless
                </div>
            </div>
        </article>
    @empty
        <div class="panel text-center text-secondary py-5" style="height: auto">
            No reviews have been reported. They appear here when a producer reports one.
        </div>
    @endforelse
@endsection
