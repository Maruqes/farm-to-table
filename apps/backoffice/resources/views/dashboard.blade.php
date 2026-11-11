@extends('layouts.app')
@section('title', 'Overview')

@php
    $statusLabels = ['pending' => 'Pending', 'confirmed' => 'Confirmed', 'ready' => 'Ready', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];
    // Categorical slots from the dataviz palette, fixed per state (validated for colour-blind separation).
    $statusColors = ['pending' => '#2a78d6', 'confirmed' => '#eb6834', 'ready' => '#1baf7a', 'delivered' => '#eda100'];
    $statusTotal = array_sum($ordersByStatus);
    $windowTotal = array_sum(array_column($ordersPerDay, 'count'));
    $money = fn ($value) => '€'.number_format($value, 2);
@endphp

@push('styles')
    .stat-value { font-size: 2.25rem; line-height: 1.1; }
    .chart-box { position: relative; height: 260px; }
    .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: .5rem; }
    .live-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--carrot); margin-right: .4rem; }
    @media (prefers-reduced-motion: no-preference) { .live-dot { animation: pulse 1.6s ease-out infinite; } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(240, 138, 36, .6); } 100% { box-shadow: 0 0 0 10px rgba(240, 138, 36, 0); } }
    .empty { display: grid; place-items: center; height: 260px; color: var(--bs-secondary-color); text-align: center; }
@endpush

@section('content')
    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-4">
        <h1 class="mb-0">Overview</h1>
        <p class="text-secondary mb-0">{{ now('Europe/Lisbon')->format('l, j F Y') }}</p>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-6 col-lg-3">
            <div class="panel">
                <div class="text-secondary">Users</div>
                <div class="stat-value display-font tabular">{{ number_format($users) }}</div>
                <div class="small text-secondary">buyers and producers</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="panel position-relative" @if ($pendingProducers) style="border-color: var(--beet)" @endif>
                <div class="text-secondary">Pending producers</div>
                <div class="stat-value display-font tabular">{{ number_format($pendingProducers) }}</div>
                <div class="small text-secondary">
                    @if ($pendingProducers) <a href="{{ route('producers') }}" class="stretched-link">Review applications</a> @else nobody is waiting @endif
                </div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="panel">
                <div class="text-secondary">Orders</div>
                <div class="stat-value display-font tabular">{{ number_format($orders) }}</div>
                <div class="small text-secondary">{{ number_format($windowTotal) }} in the last 14 days</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="panel">
                <div class="text-secondary">Live auctions</div>
                <div class="stat-value display-font tabular">{{ number_format($liveAuctions) }}</div>
                <div class="small text-secondary">
                    @if ($liveAuctions) <span class="live-dot" aria-hidden="true"></span>bidding open now @else none running @endif
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-3">
        <div class="col-lg-8">
            <section class="panel">
                <h2 class="h5">Orders, last 14 days</h2>
                @if ($windowTotal)
                    <div class="chart-box"><canvas id="orders-per-day" role="img" aria-label="Line chart: {{ $windowTotal }} orders in the last 14 days, from {{ $ordersPerDay[0]['count'] }} on {{ $ordersPerDay[0]['label'] }} to {{ end($ordersPerDay)['count'] }} today."></canvas></div>
                @else
                    <div class="empty">No orders in the last 14 days.</div>
                @endif
            </section>
        </div>
        <div class="col-lg-4">
            <section class="panel">
                <h2 class="h5">Orders by state</h2>
                @if ($statusTotal)
                    <div class="chart-box" style="height: 180px"><canvas id="orders-by-status" role="img" aria-label="Pie chart of orders by state; the values are listed below."></canvas></div>
                    <ul class="list-unstyled mb-0 mt-3">
                        @foreach ($ordersByStatus as $status => $count)
                            <li class="d-flex justify-content-between py-1">
                                <span><span class="swatch" style="background: {{ $statusColors[$status] }}" aria-hidden="true"></span>{{ $statusLabels[$status] }}</span>
                                <span class="tabular">{{ $count }} <span class="text-secondary">· {{ round($count / $statusTotal * 100) }}%</span></span>
                            </li>
                        @endforeach
                    </ul>
                @else
                    <div class="empty">No orders yet.</div>
                @endif
            </section>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-6">
            <section class="panel">
                <h2 class="h5">Top 5 producers by sales</h2>
                @if ($topProducers)
                    <div class="chart-box"><canvas id="top-producers" role="img" aria-label="Bar chart of sales by producer: @foreach ($topProducers as $p){{ $p['name'] }} {{ $money($p['total']) }}{{ $loop->last ? '.' : ', ' }}@endforeach"></canvas></div>
                @else
                    <div class="empty">No sales yet.</div>
                @endif
            </section>
        </div>
        <div class="col-lg-6">
            <section class="panel">
                <div class="d-flex justify-content-between align-items-baseline"><h2 class="h5">Latest orders</h2><a href="{{ route('orders') }}">All orders</a></div>
                @if ($latestOrders->isNotEmpty())
                    <table class="table align-middle mb-0">
                        <thead>
                            <tr class="text-secondary">
                                <th scope="col" class="fw-medium">Order</th>
                                <th scope="col" class="fw-medium">Placed</th>
                                <th scope="col" class="fw-medium text-end">Total</th>
                                <th scope="col" class="fw-medium">State</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($latestOrders as $order)
                                <tr>
                                    <th scope="row" class="fw-medium tabular">{{ $order->number() }}</th>
                                    <td class="text-secondary">{{ $order->createdAt?->timezone('Europe/Lisbon')->format('j M, H:i') }}</td>
                                    <td class="text-end tabular">{{ $money($order->total) }}</td>
                                    <td><span class="badge rounded-pill text-bg-light border fw-medium">{{ $statusLabels[$order->status] ?? $order->status }}</span></td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @else
                    <div class="empty">No orders yet.</div>
                @endif
            </section>
        </div>
    </div>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script>
        const perDay = @json($ordersPerDay);
        const byStatus = @json($ordersByStatus);
        const producers = @json($topProducers);
        const beet = cssVar('--beet');

        Chart.defaults.font.family = 'Figtree, system-ui, sans-serif';
        Chart.defaults.color = cssVar('--bs-secondary-color');
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.legend.display = false;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) Chart.defaults.animation = false;
        const grid = { color: cssVar('--bs-border-color') };
        const draw = (id, config) => { const el = document.getElementById(id); if (el) new Chart(el, config); };

        draw('orders-per-day', {
            type: 'line',
            data: { labels: perDay.map(d => d.label), datasets: [{
                label: 'Orders', data: perDay.map(d => d.count),
                borderColor: beet, borderWidth: 2, backgroundColor: beet + '14', fill: true,
                tension: .3, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: beet,
            }] },
            options: {
                interaction: { mode: 'index', intersect: false },
                scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid } },
            },
        });

        draw('orders-by-status', {
            type: 'pie',
            data: { labels: @json(array_map(fn ($s) => $statusLabels[$s], array_keys($ordersByStatus))), datasets: [{
                data: Object.values(byStatus), backgroundColor: @json(array_values($statusColors)), borderColor: cssVar('--panel'), borderWidth: 2,
            }] },
        });

        draw('top-producers', {
            type: 'bar',
            data: { labels: producers.map(p => p.name), datasets: [{
                label: 'Sales', data: producers.map(p => p.total), backgroundColor: beet, borderRadius: 4, maxBarThickness: 28,
            }] },
            options: {
                indexAxis: 'y',
                scales: { x: { beginAtZero: true, grid, ticks: { callback: v => '€' + v } }, y: { grid: { display: false } } },
                plugins: { tooltip: { callbacks: { label: c => '€' + c.parsed.x.toFixed(2) } } },
            },
        });
    </script>
@endpush
