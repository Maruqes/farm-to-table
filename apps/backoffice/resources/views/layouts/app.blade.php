<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') · Farm to Table backoffice</title>
    {{-- Bootstrap, fonts and Chart.js come from CDNs; vendor them into public/ if the backoffice must work offline. --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;600&family=Big+Shoulders+Display:wght@800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script>
        // Bootstrap follows the OS colour scheme; the shared token block below uses the same media query.
        (() => {
            const scheme = matchMedia('(prefers-color-scheme: dark)');
            const apply = () => { document.documentElement.dataset.bsTheme = scheme.matches ? 'dark' : 'light'; };
            apply();
            scheme.addEventListener('change', () => {
                apply();
                // Canvas colours are resolved once when the charts are created.
                if (window.Chart) location.reload();
            });
        })();
    </script>
    <style>
        :root {
            color-scheme: light;
            --paper: #f6ecd6;
            --ink: #14301b;
            --dim: #5d6b55;
            --tag: #c8102e;
            --tag-ink: #ffffff;
            --wash: #ebe0c6;
            --alarm: #9a2a12;
            --crate-ink: #14301b;
            --tile-cheese: #f2c14e;
            --tile-honey: #e8962e;
            --tile-bakery: #d9a066;
            --tile-wine: #a8496c;
            --tile-fruit: #a8c256;
            --tile-veg: #5c9e4a;
            --font-sans: 'Azeret Mono', monospace;
            --font-display: 'Big Shoulders Display', 'Azeret Mono', sans-serif;
            --bs-body-bg: var(--paper);
            --bs-body-color: var(--ink);
            --bs-secondary-color: var(--dim);
            --bs-emphasis-color: var(--ink);
            --bs-border-color: var(--dim);
            --bs-border-color-translucent: var(--dim);
            --bs-secondary-bg: var(--wash);
            --bs-tertiary-bg: var(--wash);
            --bs-body-font-family: var(--font-sans);
            --bs-font-sans-serif: var(--font-sans);
            --bs-font-monospace: var(--font-sans);
            --bs-border-radius: 0;
            --bs-border-radius-sm: 0;
            --bs-border-radius-lg: 0;
            --bs-border-radius-xl: 0;
            --bs-border-radius-xxl: 0;
            --bs-border-radius-pill: 0;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                color-scheme: dark;
                --paper: #16130e;
                --ink: #f3e9d2;
                --dim: #a39c88;
                --tag: #ff5a6e;
                --tag-ink: #20040a;
                --wash: #242018;
                --alarm: #ff8f73;
                --tile-cheese: #d4a63a;
                --tile-honey: #cc7f22;
                --tile-bakery: #bf8a56;
                --tile-wine: #a8496c;
                --tile-fruit: #93ad45;
                --tile-veg: #4f8a40;
            }
        }
        *, *::before, *::after {
            border-radius: 0 !important;
            box-shadow: none !important;
        }
        html { scrollbar-color: var(--dim) transparent; }
        body {
            background: var(--paper);
            color: var(--ink);
            font-family: var(--font-sans);
            font-size: 15px;
            font-variant-numeric: tabular-nums;
        }
        ::selection { background: var(--ink); color: var(--paper); }
        :focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
        a { color: var(--ink); text-underline-offset: 0.2em; }
        a:hover { color: var(--ink); }
        h1, h2, h3, .display-font {
            font-family: var(--font-display);
            font-weight: 800;
            line-height: 0.9;
            text-transform: uppercase;
        }
        h1 { font-size: clamp(2.25rem, 6vw, 3rem); }
        h4, h5, h6 {
            font-family: var(--font-sans);
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.4;
        }
        .font-display {
            font-family: var(--font-display);
            font-weight: 800;
            line-height: 0.9;
            text-transform: uppercase;
        }
        .font-body {
            font-family: var(--font-sans);
            font-weight: 400;
            line-height: 1.5;
            letter-spacing: normal;
            text-transform: none;
        }
        .tabular, time, data { font-variant-numeric: tabular-nums; }
        .measure { max-width: 65ch; }
        .text-secondary { color: var(--dim) !important; }
        .text-tag { color: var(--tag) !important; }
        .bg-dim { background-color: var(--dim); }
        .rule { border-top: 2px solid var(--ink); }
        .rule-thick { border-top: 4px solid var(--ink); }
        .rule-dim { border-top: 1px solid var(--dim); }
        .frame { border: 2px solid var(--ink); }
        .frame-pad { padding: 1.25rem; }
        .ink-fill { background: var(--ink); color: var(--paper); }
        .board {
            margin: 0;
            padding: 0;
            border-top: 4px solid var(--ink);
            list-style: none;
        }
        .board-row {
            display: flex;
            align-items: center;
            min-width: 0;
            gap: 0.9rem;
            padding: 0.7rem 0;
            border-bottom: 1px solid var(--dim);
        }
        .board-row :is(h2, h3, h4) {
            margin: 0;
            font-family: var(--font-sans);
            font-size: 1rem;
            font-weight: 600;
            line-height: 1.4;
            text-transform: none;
        }
        .board-row p { margin: 0; }
        .label-line {
            color: var(--dim);
            font-size: 0.75rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .price {
            font-family: var(--font-display);
            font-size: 1.8rem;
            font-weight: 800;
            line-height: 1;
            white-space: nowrap;
        }
        .bg-tile-cheese { background-color: var(--tile-cheese); color: var(--crate-ink); }
        .bg-tile-honey { background-color: var(--tile-honey); color: var(--crate-ink); }
        .bg-tile-bakery { background-color: var(--tile-bakery); color: var(--crate-ink); }
        .bg-tile-wine { background-color: var(--tile-wine); color: var(--crate-ink); }
        .bg-tile-fruit { background-color: var(--tile-fruit); color: var(--crate-ink); }
        .bg-tile-veg { background-color: var(--tile-veg); color: var(--crate-ink); }
        .btn {
            --bs-btn-border-radius: 0;
            --bs-btn-border-width: 2px;
            --bs-btn-font-family: var(--font-sans);
            --bs-btn-font-size: 0.875rem;
            --bs-btn-font-weight: 600;
            --bs-btn-line-height: 1.5;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            gap: 0.5rem;
            text-decoration: none;
            transition: background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out;
        }
        .btn-sm { min-height: 40px; }
        .btn-primary,
        .btn-secondary {
            --bs-btn-color: var(--paper);
            --bs-btn-bg: var(--ink);
            --bs-btn-border-color: var(--ink);
            --bs-btn-hover-color: var(--ink);
            --bs-btn-hover-bg: transparent;
            --bs-btn-hover-border-color: var(--ink);
            --bs-btn-active-color: var(--ink);
            --bs-btn-active-bg: transparent;
            --bs-btn-active-border-color: var(--ink);
            --bs-btn-disabled-color: var(--paper);
            --bs-btn-disabled-bg: var(--ink);
            --bs-btn-disabled-border-color: var(--ink);
        }
        .btn-outline-primary,
        .btn-outline-secondary {
            --bs-btn-color: var(--ink);
            --bs-btn-bg: transparent;
            --bs-btn-border-color: var(--ink);
            --bs-btn-hover-color: var(--paper);
            --bs-btn-hover-bg: var(--ink);
            --bs-btn-hover-border-color: var(--ink);
            --bs-btn-active-color: var(--paper);
            --bs-btn-active-bg: var(--ink);
            --bs-btn-active-border-color: var(--ink);
            --bs-btn-disabled-color: var(--ink);
            --bs-btn-disabled-bg: transparent;
            --bs-btn-disabled-border-color: var(--ink);
        }
        .btn-outline-danger {
            --bs-btn-color: var(--alarm);
            --bs-btn-bg: transparent;
            --bs-btn-border-color: var(--alarm);
            --bs-btn-hover-color: var(--paper);
            --bs-btn-hover-bg: var(--alarm);
            --bs-btn-hover-border-color: var(--alarm);
            --bs-btn-active-color: var(--paper);
            --bs-btn-active-bg: var(--alarm);
            --bs-btn-active-border-color: var(--alarm);
            --bs-btn-disabled-color: var(--alarm);
            --bs-btn-disabled-bg: transparent;
            --bs-btn-disabled-border-color: var(--alarm);
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.35em 0.65em;
            border: 1px solid var(--ink);
            background: var(--ink);
            color: var(--paper);
            font-size: 0.75em;
            font-weight: 600;
            line-height: 1;
            text-transform: uppercase;
        }
        .badge-outline { background: transparent; color: var(--ink); }
        .badge-secondary { background: var(--wash); color: var(--ink); }
        .badge-danger { border-color: var(--alarm); background: var(--alarm); color: var(--paper); }
        .badge-live { border-color: var(--tag); background: var(--tag); color: var(--tag-ink); }
        .form-label {
            display: block;
            margin-bottom: 0.25rem;
            color: var(--dim);
            font-size: 0.75rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .form-control, .form-select {
            min-width: 0;
            min-height: 40px;
            border: 2px solid var(--ink);
            background-color: var(--paper);
            color: var(--ink);
            font-family: var(--font-sans);
            font-size: 0.9375rem;
        }
        .form-control:focus, .form-select:focus {
            border-color: var(--ink);
            background-color: var(--paper);
            color: var(--ink);
        }
        .form-control::placeholder { color: var(--dim); }
        .form-control:disabled, .form-select:disabled { background-color: var(--wash); }
        .form-control.is-invalid, .form-select.is-invalid { border-color: var(--alarm); }
        .form-select {
            padding-right: 2.25rem;
            background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%2314301b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/></svg>");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 16px 12px;
        }
        @media (prefers-color-scheme: dark) {
            .form-select {
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23f3e9d2' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/></svg>");
            }
        }
        .form-text { margin-top: 0.25rem; color: var(--dim); font-size: 0.875em; }
        .invalid-feedback { display: block; margin-top: 0.25rem; color: var(--alarm); font-size: 0.875em; }
        .form-check { display: flex; align-items: center; min-height: 40px; gap: 0.5rem; }
        .form-check-input {
            width: 1.25rem;
            height: 1.25rem;
            margin: 0;
            border: 2px solid var(--ink);
            background-color: var(--paper);
        }
        .form-check-input:checked {
            border-color: var(--ink);
            background-color: var(--ink);
            background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill='none' stroke='%23f6ecd6' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/></svg>");
            background-position: center;
            background-repeat: no-repeat;
            background-size: 0.85rem;
        }
        @media (prefers-color-scheme: dark) {
            .form-check-input:checked {
                background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill='none' stroke='%2316130e' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/></svg>");
            }
        }
        .table {
            --bs-table-bg: transparent;
            --bs-table-color: var(--ink);
            --bs-table-border-color: var(--dim);
            width: 100%;
            margin: 0;
            border-top: 4px solid var(--ink);
            border-collapse: collapse;
            color: var(--ink);
            vertical-align: middle;
        }
        .table thead th {
            color: var(--dim);
            font-size: 0.75rem;
            font-weight: 400;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .table th, .table td {
            padding: 0.7rem 0.75rem 0.7rem 0;
            border-bottom: 1px solid var(--dim);
            text-align: left;
            vertical-align: middle;
        }
        .table tbody th { color: var(--ink); font-weight: 600; }
        .table > :not(caption) > * > * { background: transparent; }
        .table-responsive { max-width: 100%; overflow-x: auto; overflow-wrap: normal; }
        .table-responsive .table { min-width: 100%; }
        @media (max-width: 767.98px) {
            .table th, .table td { padding: 0.55rem 0.5rem 0.55rem 0; }
            .table tbody tr { height: 4rem; }
        }
        main, section, article, .row > * { min-width: 0; }
        .alert {
            border: 2px solid var(--ink);
            background: var(--paper);
            color: var(--ink);
            padding: 0.75rem 1rem;
        }
        .alert-danger, .alert-warning { border-color: var(--alarm); color: var(--alarm); }
        .pagination { --bs-pagination-border-radius: 0; }
        .page-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            min-height: 40px;
            border: 2px solid var(--ink);
            background: var(--paper);
            color: var(--ink);
        }
        .page-link:hover { border-color: var(--ink); background: var(--ink); color: var(--paper); }
        .page-item.active .page-link { border-color: var(--ink); background: var(--ink); color: var(--paper); }
        .page-item.disabled .page-link { border-color: var(--dim); background: var(--wash); color: var(--dim); }
        .dropdown-menu, .modal-content, .offcanvas, .toast {
            border: 2px solid var(--ink);
            background: var(--paper);
            color: var(--ink);
        }
        .site-header { border-bottom: 4px solid var(--ink); background: var(--paper); }
        .brand {
            color: var(--ink);
            font-size: 2.25rem;
            line-height: 0.85;
            text-decoration: none;
            text-transform: uppercase;
        }
        .admin-nav { min-width: 0; max-width: 100%; }
        .site-nav-link {
            display: inline-flex;
            flex: none;
            align-items: center;
            min-height: 40px;
            padding: 0 0.75rem;
            color: var(--ink);
            font-size: 0.875rem;
            text-decoration: none;
        }
        .site-nav-link:hover { color: var(--ink); text-decoration: underline; }
        .site-nav-link.active { background: var(--ink); color: var(--paper); font-weight: 600; }
        .stat-tile { height: 100%; padding: 0.75rem 0; border-top: 4px solid var(--ink); border-bottom: 1px solid var(--dim); }
        .stat-value { font-size: 2.25rem; line-height: 1; }
        .chart-box { position: relative; max-width: 100%; height: 260px; }
        .chart-box-compact { height: 180px; }
        .chart-box-short { height: 170px; }
        .empty { display: grid; place-items: center; min-height: 260px; color: var(--dim); text-align: center; }
        .empty-compact { min-height: 180px; }
        .empty-short { min-height: 170px; }
        .swatch { display: inline-block; flex: none; width: 10px; height: 10px; margin-right: 0.5rem; border: 1px solid var(--ink); }
        .live-dot { display: inline-block; width: 10px; height: 10px; margin-right: 0.4rem; background: var(--tag); }
        .page-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 4rem 1.5rem;
            border: 2px solid var(--ink);
            color: var(--dim);
            text-align: center;
        }
        @media (max-width: 575.98px) {
            .filter-form > div, .filter-form > .btn { width: 100%; }
            .chart-box, .chart-box-compact, .chart-box-short { height: 220px; }
        }
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
    </style>
</head>
<body>
    @auth
        <header class="site-header">
            <div class="container-xl d-flex flex-wrap align-items-center justify-content-between gap-2 gap-sm-3 py-2">
                <a class="brand display-font text-nowrap" href="{{ route('dashboard') }}">Farm to Table <span class="brand-context font-body fs-6 d-none d-md-inline">backoffice</span></a>
                <nav class="admin-nav d-flex gap-1 me-xl-auto order-last order-xl-0 col-12 col-xl-auto overflow-auto" aria-label="Main">
                    @foreach (['dashboard' => 'Overview', 'producers' => 'Producers', 'reviews' => 'Reviews', 'content' => 'Content', 'users' => 'Users', 'orders' => 'Orders', 'auctions' => 'Auctions', 'status' => 'Status'] as $route => $label)
                        <a href="{{ route($route) }}" class="site-nav-link text-nowrap {{ request()->routeIs($route) ? 'active' : '' }}" @if (request()->routeIs($route)) aria-current="page" @endif>{{ $label }}</a>
                    @endforeach
                </nav>
                <form method="post" action="{{ route('logout') }}" class="d-flex align-items-center gap-3">
                    @csrf
                    <span class="text-secondary d-none d-sm-inline">{{ auth()->user()->name }}</span>
                    <button class="btn btn-outline-secondary btn-sm px-3 text-nowrap">Log out</button>
                </form>
            </div>
        </header>
    @endauth
    <main class="container-xl py-4">
        @if (session('status'))
            <div class="alert alert-success" role="status">{{ session('status') }}</div>
        @endif
        @error('action')
            <div class="alert alert-danger" role="alert">{{ $message }}</div>
        @enderror
        @yield('content')
    </main>
    <script>
        const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    </script>
    @stack('scripts')
</body>
</html>
