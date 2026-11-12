@extends('layouts.app')
@section('title', 'Overview')

@php
    $statusLabels = ['pending' => 'Pending', 'confirmed' => 'Confirmed', 'ready' => 'Ready', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];
    $statusColors = [
        'pending' => ['token' => '--tile-cheese', 'class' => 'bg-tile-cheese'],
        'confirmed' => ['token' => '--tile-honey', 'class' => 'bg-tile-honey'],
        'ready' => ['token' => '--tile-veg', 'class' => 'bg-tile-veg'],
        'delivered' => ['token' => '--tile-fruit', 'class' => 'bg-tile-fruit'],
        'cancelled' => ['token' => '--dim', 'class' => 'bg-dim'],
    ];
    $statusTotal = array_sum($ordersByStatus);
    $windowTotal = array_sum(array_column($ordersPerDay, 'count'));
    $money = fn ($value) => '€'.number_format($value, 2);
@endphp

@section('content')
    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-4">
        <h1 class="mb-0">Overview</h1>
        <p class="text-secondary mb-0">{{ now('Europe/Lisbon')->format('l, j F Y') }}</p>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
            <div class="stat-tile">
                <div class="label-line">Users</div>
                <div class="stat-value display-font tabular">{{ number_format($users) }}</div>
                <div class="small text-secondary">buyers and producers</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-tile position-relative">
                <div class="label-line">Pending producers</div>
                <div class="stat-value display-font tabular">{{ number_format($pendingProducers) }}</div>
                <div class="small text-secondary">
                    @if ($pendingProducers) <a href="{{ route('producers') }}" class="stretched-link">Review applications</a> @else nobody is waiting @endif
                </div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-tile">
                <div class="label-line">Orders</div>
                <div class="stat-value display-font tabular">{{ number_format($orders) }}</div>
                <div class="small text-secondary">{{ number_format($windowTotal) }} in the last 14 days</div>
            </div>
        </div>
        <div class="col-6 col-lg-3">
            <div class="stat-tile">
                <div class="label-line">Live auctions</div>
                <div class="stat-value display-font tabular">{{ number_format($liveAuctions) }}</div>
                <div class="small text-secondary">
                    @if ($liveAuctions) <span class="live-dot" aria-hidden="true"></span>bidding open now @else none running @endif
                </div>
            </div>
        </div>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-lg-8">
            <section class="frame frame-pad">
                <h2 class="h5">Orders, last 14 days</h2>
                @if ($windowTotal)
                    <div class="chart-box"><canvas id="orders-per-day" role="img" aria-label="Line chart: {{ $windowTotal }} orders in the last 14 days, from {{ $ordersPerDay[0]['count'] }} on {{ $ordersPerDay[0]['label'] }} to {{ end($ordersPerDay)['count'] }} today."></canvas></div>
                @else
                    <div class="empty">No orders in the last 14 days.</div>
                @endif
            </section>
        </div>
        <div class="col-lg-4">
            <section class="frame frame-pad">
                <h2 class="h5">Orders by state</h2>
                @if ($statusTotal)
                    <div class="chart-box chart-box-compact"><canvas id="orders-by-status" role="img" aria-label="Pie chart of orders by state; the values are listed below."></canvas></div>
                    <ul class="list-unstyled mb-0 mt-3">
                        @foreach ($ordersByStatus as $status => $count)
                            <li class="d-flex justify-content-between py-1">
                                <span><span class="swatch {{ $statusColors[$status]['class'] ?? 'bg-dim' }}" aria-hidden="true"></span>{{ $statusLabels[$status] }}</span>
                                <span class="tabular">{{ $count }} <span class="text-secondary">· {{ round($count / $statusTotal * 100) }}%</span></span>
                            </li>
                        @endforeach
                    </ul>
                @else
                    <div class="empty empty-compact">No orders yet.</div>
                @endif
            </section>
        </div>
    </div>

    <div class="row g-3">
        <div class="col-lg-6">
            <section class="frame frame-pad">
                <h2 class="h5">Top 5 producers by sales</h2>
                @if ($topProducers)
                    <div class="chart-box"><canvas id="top-producers" role="img" aria-label="Bar chart of sales by producer: @foreach ($topProducers as $p){{ $p['name'] }} {{ $money($p['total']) }}{{ $loop->last ? '.' : ', ' }}@endforeach"></canvas></div>
                @else
                    <div class="empty">No sales yet.</div>
                @endif
            </section>
        </div>
        <div class="col-lg-6">
            <section>
                <div class="d-flex justify-content-between align-items-baseline gap-2"><h2 class="h5">Latest orders</h2><a href="{{ route('orders') }}">All orders</a></div>
                @if ($latestOrders->isNotEmpty())
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th scope="col">Order</th>
                                    <th scope="col" class="d-none d-xl-table-cell">Placed</th>
                                    <th scope="col" class="text-end">Total</th>
                                    <th scope="col">State</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($latestOrders as $order)
                                    <tr>
                                        <th scope="row" class="tabular">{{ $order->number() }}</th>
                                        <td class="d-none d-xl-table-cell text-secondary">{{ $order->createdAt?->timezone('Europe/Lisbon')->format('j M, H:i') }}</td>
                                        <td class="price text-end tabular">{{ $money($order->total) }}</td>
                                        <td><span class="badge badge-secondary">{{ $statusLabels[$order->status] ?? $order->status }}</span></td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
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
        const statusPalette = @json(array_map(fn ($color) => $color['token'], $statusColors));
        const ink = cssVar('--ink');

        Chart.defaults.font.family = "'Azeret Mono', monospace";
        Chart.defaults.color = cssVar('--dim');
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.legend.display = false;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) Chart.defaults.animation = false;
        const grid = { color: cssVar('--dim') };
        const draw = (id, config) => { const el = document.getElementById(id); if (el) new Chart(el, config); };

        document.fonts.ready.then(() => {
            draw('orders-per-day', {
                type: 'line',
                data: { labels: perDay.map(d => d.label), datasets: [{
                    label: 'Orders', data: perDay.map(d => d.count),
                    borderColor: ink, borderWidth: 2, fill: false,
                    tension: .3, pointRadius: 0, pointHoverRadius: 5, pointBackgroundColor: ink,
                }] },
                options: {
                    interaction: { mode: 'index', intersect: false },
                    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid } },
                },
            });

            draw('orders-by-status', {
                type: 'pie',
                data: { labels: @json(array_map(fn ($s) => $statusLabels[$s], array_keys($ordersByStatus))), datasets: [{
                    data: Object.values(byStatus),
                    backgroundColor: Object.keys(byStatus).map(status => cssVar(statusPalette[status] || '--dim')),
                    borderColor: cssVar('--paper'), borderWidth: 2,
                }] },
            });

            draw('top-producers', {
                type: 'bar',
                data: { labels: producers.map(p => p.name), datasets: [{
                    label: 'Sales', data: producers.map(p => p.total), backgroundColor: ink, borderRadius: 0, maxBarThickness: 28,
                }] },
                options: {
                    indexAxis: 'y',
                    scales: {
                        x: { beginAtZero: true, grid, ticks: { callback: v => '€' + v } },
                        y: {
                            grid: { display: false },
                            ticks: { autoSkip: false, padding: 8, callback(value) {
                                const label = this.getLabelForValue(value);
                                const maxLength = 18;
                                return label.length > maxLength ? label.slice(0, maxLength - 1) + '…' : label;
                            } },
                        },
                    },
                    plugins: { tooltip: { callbacks: { label: c => '€' + c.parsed.x.toFixed(2) } } },
                },
            });
        });
    </script>
@endpush
