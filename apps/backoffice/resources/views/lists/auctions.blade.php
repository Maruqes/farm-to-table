@extends('layouts.app')
@section('title', 'Auctions')

@section('content')
    <h1 class="mb-1">Auctions</h1>
    <p class="text-secondary mb-4">{{ number_format($auctions->total()) }} {{ $status ? $status : '' }} auctions, newest first.</p>

    @include('lists.filter', ['name' => 'status', 'label' => 'State', 'options' => $statuses, 'selected' => $status])

    @if ($auctions->isEmpty())
        <div class="page-state">No auctions {{ $status ? "are $status right now" : 'yet' }}.</div>
    @else
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Lot</th>
                        <th scope="col" class="d-none d-md-table-cell">Producer</th>
                        <th scope="col" class="d-none d-md-table-cell">Starts</th>
                        <th scope="col" class="d-none d-md-table-cell">Ends</th>
                        <th scope="col" class="text-end">Price</th>
                        <th scope="col" class="d-none d-md-table-cell text-end">Bids</th>
                        <th scope="col">State</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($auctions as $auction)
                        <tr>
                            <th scope="row">
                                {{ $auction->productName }}
                                <span class="d-none d-md-block small text-secondary fw-normal">{{ $auction->quantity }} {{ $auction->unit }} · {{ $auction->category }}</span>
                            </th>
                            <td class="d-none d-md-table-cell">{{ $people[(string) $auction->producer] ?? 'Deleted account' }}</td>
                            <td class="d-none d-md-table-cell text-secondary text-nowrap">{{ $auction->startsAt?->timezone('Europe/Lisbon')->format('j M, H:i') ?? 'Not set' }}</td>
                            <td class="d-none d-md-table-cell text-secondary text-nowrap">{{ $auction->endsAt?->timezone('Europe/Lisbon')->format('j M, H:i') ?? 'Not set' }}</td>
                            <td class="price text-end tabular">
                                €{{ number_format((float) $auction->currentPrice, 2) }}
                                @if ($auction->winner) <span class="d-none d-md-block small font-body text-secondary">won by {{ $auction->winner['name'] }}</span>
                                @elseif ($auction->leader) <span class="d-none d-md-block small font-body text-secondary">led by {{ $auction->leader['name'] }}</span> @endif
                            </td>
                            <td class="d-none d-md-table-cell text-end tabular">{{ $auction->bidCount ?? 0 }}</td>
                            <td class="text-nowrap">
                                @if ($auction->cancelled)
                                    <span class="badge badge-secondary">Cancelled</span>
                                @elseif ($auction->status === 'active')
                                    <span class="badge badge-live">Live</span>
                                @else
                                    <span class="badge badge-secondary">{{ ucfirst($auction->status) }}</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
    <div class="mt-3">{{ $auctions->links() }}</div>
@endsection
