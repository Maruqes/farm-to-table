@extends('layouts.app')
@section('title', 'Orders')

@section('content')
    <h1 class="mb-1">Orders</h1>
    <p class="text-secondary mb-4">{{ number_format($orders->total()) }} {{ $status ? $status : '' }} orders, newest first.</p>

    @include('lists.filter', ['name' => 'status', 'label' => 'State', 'options' => $statuses, 'selected' => $status])

    @if ($orders->isEmpty())
        <div class="page-state">No orders {{ $status ? "are $status right now" : 'yet' }}.</div>
    @else
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Order</th>
                        <th scope="col" class="d-none d-md-table-cell">Placed</th>
                        <th scope="col" class="d-none d-md-table-cell">Buyer</th>
                        <th scope="col" class="d-none d-md-table-cell">Producer</th>
                        <th scope="col" class="d-none d-md-table-cell">Items</th>
                        <th scope="col" class="text-end">Total</th>
                        <th scope="col">State</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($orders as $order)
                        <tr>
                            <th scope="row" class="tabular">{{ $order->number() }}</th>
                            <td class="d-none d-md-table-cell text-secondary text-nowrap">{{ $order->createdAt?->timezone('Europe/Lisbon')->format('j M Y, H:i') }}</td>
                            <td class="d-none d-md-table-cell">{{ $people[(string) $order->buyer] ?? 'Deleted account' }}</td>
                            <td class="d-none d-md-table-cell">{{ $people[(string) $order->producer] ?? 'Deleted account' }}</td>
                            <td class="d-none d-md-table-cell">
                                {{ collect($order->items)->map(fn ($i) => $i['quantity'].' × '.$i['name'])->join(', ') }}
                                <span class="d-block small text-secondary">{{ $order->auction ? 'Won at auction · ' : '' }}{{ ucfirst((string) $order->fulfilment) }}</span>
                            </td>
                            <td class="price text-end tabular">€{{ number_format((float) $order->total, 2) }}</td>
                            <td><span class="badge badge-secondary">{{ ucfirst($order->status) }}</span></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
    <div class="mt-3">{{ $orders->links() }}</div>
@endsection
