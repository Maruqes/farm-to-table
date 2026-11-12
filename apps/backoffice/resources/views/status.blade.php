@extends('layouts.app')
@section('title', 'Status')

@php
    $stateLabels = ['operational' => 'Operational', 'degraded' => 'Slow', 'down' => 'Down', 'unknown' => 'No data'];
    $stateBadges = ['operational' => 'badge-secondary', 'degraded' => 'badge-outline', 'down' => 'badge-danger', 'unknown' => 'badge-outline'];
    $counts = array_count_values(array_column($services, 'state'));
    $down = $counts['down'] ?? 0;
    $slow = $counts['degraded'] ?? 0;
    // 99.95 must not round up to "100%" while checks are failing.
    $percent = fn (float $value) => rtrim(rtrim(number_format(floor($value * 100) / 100, 2), '0'), '.').'%';
@endphp

@section('content')
    <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2 mb-4">
        <div>
            <h1 class="mb-1">Status</h1>
            <p class="mb-0 fs-5">
                @if (! $lastCheck) No checks recorded yet.
                @elseif ($down) {{ $down }} {{ Str::plural('service', $down) }} down.
                @elseif ($slow) {{ $slow }} {{ Str::plural('service', $slow) }} answering slowly.
                @else All services are operational.
                @endif
            </p>
        </div>
        <p class="text-secondary mb-0">
            @if ($lastCheck) Last check {{ $lastCheck->timezone('Europe/Lisbon')->format('j M, H:i') }} · @endif
            checked every minute, kept {{ $days }} days
        </p>
    </div>

    @if (! $lastCheck)
        <div class="alert alert-warning" role="status">The recorder has not stored a sample yet. It runs once a minute with the backoffice container; reload in a moment.</div>
    @elseif ($stale)
        <div class="alert alert-warning" role="alert">The recorder has not run since {{ $lastCheck->timezone('Europe/Lisbon')->format('j M, H:i') }}, so the states below may be out of date.</div>
    @endif

    <div class="board">
        @foreach ($services as $i => $service)
            <section class="board-row d-block" aria-labelledby="service-{{ $i }}">
                <div class="row g-3 w-100 align-items-center">
                    <div class="col-lg-4">
                        <div class="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-1">
                            <h2 class="h5 mb-0" id="service-{{ $i }}">{{ $service['name'] }}</h2>
                            <span class="badge {{ $stateBadges[$service['state']] ?? 'badge-outline' }}">{{ $stateLabels[$service['state']] }}</span>
                        </div>
                        <p class="text-secondary tabular mb-0">
                            @if ($service['checks'])
                                {{ $percent($service['uptime']) }} uptime
                                · {{ $service['failed'] ? number_format($service['failed']).' of '.number_format($service['checks']).' checks failed' : number_format($service['checks']).' checks, none failed' }}
                                @if ($service['latencyMs'] !== null) · {{ $service['latencyMs'] }} ms now @endif
                            @else
                                No checks in the last {{ $days }} days
                            @endif
                        </p>
                    </div>
                    <div class="col-lg-8">
                        @if ($service['checks'])
                            <div class="chart-box chart-box-short"><canvas id="chart-{{ $i }}" role="img" aria-label="Response time of {{ $service['name'] }} per hour over the last {{ $days }} days; hours with failed checks are marked in red. {{ $percent($service['uptime']) }} uptime."></canvas></div>
                        @else
                            <div class="empty empty-short">Nothing to draw yet.</div>
                        @endif
                    </div>
                </div>
            </section>
        @endforeach
    </div>
    <p class="text-secondary small mt-3 mb-0">Line: average response time per hour. Red band: an hour with at least one failed check. A gap means nothing was recorded.</p>
@endsection

@push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script>
        const services = @json($services);
        const ink = cssVar('--ink');

        Chart.defaults.font.family = "'Azeret Mono', monospace";
        Chart.defaults.color = cssVar('--dim');
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.legend.display = false;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) Chart.defaults.animation = false;

        services.forEach((service, i) => {
            const el = document.getElementById('chart-' + i);
            if (!el) return;
            const hours = service.hours;
            new Chart(el, {
                data: { labels: hours.map(h => h.label), datasets: [
                    { type: 'line', label: 'Response time', data: hours.map(h => h.latency), borderColor: ink, borderWidth: 2,
                      fill: false, tension: .3, pointHoverRadius: 4, pointBackgroundColor: ink,
                      // An hour with no recorded neighbours has no line to sit on, so it gets a dot.
                      pointRadius: c => hours[c.dataIndex - 1]?.latency == null && hours[c.dataIndex + 1]?.latency == null ? 3 : 0 },
                    // Full-height band on its own hidden 0..1 axis: it marks the hour, it is not a measurement.
                    { type: 'bar', label: 'Failed checks', data: hours.map(h => h.failed ? 1 : null), yAxisID: 'band',
                      backgroundColor: cssVar('--alarm'), barPercentage: 1, categoryPercentage: 1 },
                ] },
                options: {
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0, callback(v) { return this.getLabelForValue(v).split(',')[0]; } } },
                        y: { beginAtZero: true, grid: { color: cssVar('--dim') }, ticks: { maxTicksLimit: 5, callback: v => v + ' ms' } },
                        band: { display: false, min: 0, max: 1 },
                    },
                    plugins: { tooltip: { callbacks: { label: c => {
                        const h = hours[c.dataIndex];
                        return c.dataset.type === 'bar' ? `${h.failed} of ${h.total} checks failed` : `${h.latency} ms average`;
                    } } } },
                },
            });
        });
    </script>
@endpush
