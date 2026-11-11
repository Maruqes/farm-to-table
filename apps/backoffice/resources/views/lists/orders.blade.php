@extends('layouts.app')
@section('title', 'Orders')

@section('content')
    <h1 class="mb-1">Orders</h1>
    <p class="text-secondary mb-4">{{ number_format($orders->total()) }} {{ $status ? $status : '' }} orders, newest first.</p>

    @include('lists.filter', ['name' => 'status', 'label' => 'State', 'options' => $statuses, 'selected' => $status])

    <div class="panel" style="height: auto">
        @if ($orders->isEmpty())
            <p class="text-secondary text-center py-5 mb-0">No orders {{ $status ? "are $status right now" : 'yet' }}.</p>
        @else
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead>
                        <tr class="text-secondary">
                            <th scope="col" class="fw-medium">Order</th>
                            <th scope="col" class="fw-medium">Placed</th>
                            <th scope="col" class="fw-medium">Buyer</th>
                            <th scope="col" class="fw-medium">Producer</th>
                            <th scope="col" class="fw-medium">Items</th>
                            <th scope="col" class="fw-medium text-end">Total</th>
                            <th scope="col" class="fw-medium">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($orders as $order)
                            <tr>
                                <th scope="row" class="fw-medium tabular">{{ $order->number() }}</th>
                                <td class="text-secondary text-nowrap">{{ $order->createdAt?->timezone('Europe/Lisbon')->format('j M Y, H:i') }}</td>
                                <td>{{ $people[(string) $order->buyer] ?? 'Deleted account' }}</td>
                                <td>{{ $people[(string) $order->producer] ?? 'Deleted account' }}</td>
                                <td>
                                    {{ collect($order->items)->map(fn ($i) => $i['quantity'].' × '.$i['name'])->join(', ') }}
                                    <span class="d-block small text-secondary">{{ $order->auction ? 'Won at auction · ' : '' }}{{ ucfirst((string) $order->fulfilment) }}</span>
                                </td>
                                <td class="text-end tabular">€{{ number_format((float) $order->total, 2) }}</td>
                                <td><span class="badge rounded-pill text-bg-light border fw-medium">{{ ucfirst($order->status) }}</span></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>
    <div class="mt-3">{{ $orders->links() }}</div>
@endsection
