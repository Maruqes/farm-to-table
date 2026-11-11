@extends('layouts.app')
@section('title', 'Auctions')

@push('styles')
    .live-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--carrot); margin-right: .4rem; }
@endpush

@section('content')
    <h1 class="mb-1">Auctions</h1>
    <p class="text-secondary mb-4">{{ number_format($auctions->total()) }} {{ $status ? $status : '' }} auctions, newest first.</p>

    @include('lists.filter', ['name' => 'status', 'label' => 'State', 'options' => $statuses, 'selected' => $status])

    <div class="panel" style="height: auto">
        @if ($auctions->isEmpty())
            <p class="text-secondary text-center py-5 mb-0">No auctions {{ $status ? "are $status right now" : 'yet' }}.</p>
        @else
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead>
                        <tr class="text-secondary">
                            <th scope="col" class="fw-medium">Lot</th>
                            <th scope="col" class="fw-medium">Producer</th>
                            <th scope="col" class="fw-medium">Starts</th>
                            <th scope="col" class="fw-medium">Ends</th>
                            <th scope="col" class="fw-medium text-end">Price</th>
                            <th scope="col" class="fw-medium text-end">Bids</th>
                            <th scope="col" class="fw-medium">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($auctions as $auction)
                            <tr>
                                <th scope="row" class="fw-medium">
                                    {{ $auction->productName }}
                                    <span class="d-block small text-secondary fw-normal">{{ $auction->quantity }} {{ $auction->unit }} · {{ $auction->category }}</span>
                                </th>
                                <td>{{ $people[(string) $auction->producer] ?? 'Deleted account' }}</td>
                                <td class="text-secondary text-nowrap">{{ $auction->startsAt?->timezone('Europe/Lisbon')->format('j M, H:i') ?? 'Not set' }}</td>
                                <td class="text-secondary text-nowrap">{{ $auction->endsAt?->timezone('Europe/Lisbon')->format('j M, H:i') ?? 'Not set' }}</td>
                                <td class="text-end tabular">
                                    €{{ number_format((float) $auction->currentPrice, 2) }}
                                    @if ($auction->winner) <span class="d-block small text-secondary">won by {{ $auction->winner['name'] }}</span>
                                    @elseif ($auction->leader) <span class="d-block small text-secondary">led by {{ $auction->leader['name'] }}</span> @endif
                                </td>
                                <td class="text-end tabular">{{ $auction->bidCount ?? 0 }}</td>
                                <td class="text-nowrap">
                                    @if ($auction->cancelled)
                                        <span class="badge rounded-pill text-bg-light border fw-medium">Cancelled</span>
                                    @elseif ($auction->status === 'active')
                                        <span class="live-dot" aria-hidden="true"></span><span class="fw-medium">Live</span>
                                    @else
                                        <span class="badge rounded-pill text-bg-light border fw-medium">{{ ucfirst($auction->status) }}</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>
    <div class="mt-3">{{ $auctions->links() }}</div>
@endsection
