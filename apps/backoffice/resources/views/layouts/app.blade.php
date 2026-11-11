<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') · Farm to Table backoffice</title>
    {{-- shortcut: Bootstrap, fonts and Chart.js come from CDNs, vendor them into public/ if the panel must work offline. --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=bricolage-grotesque:800|figtree:400,500,600" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script>
        // Same rule and storage key as apps/web/index.html: saved choice wins, otherwise follow the OS. Runs before paint.
        try {
            var t = localStorage.getItem('theme')
            if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
                document.documentElement.dataset.bsTheme = 'dark'
            }
        } catch (e) {}
    </script>
    <style>
        /* Same tokens as apps/web/src/styles/globals.css (:root and .dark), as hex for Bootstrap. */
        :root {
            --beet: #a3174a;
            --beet-dark: #84103a;
            --carrot: #f08a24;
            --bs-body-bg: #faf9f6;
            --bs-body-color: #241a1a;
            --bs-secondary-color: #6b5f5c;
            --bs-border-color: #e3e1db;
            --bs-body-font-family: 'Figtree', system-ui, sans-serif;
            --bs-border-radius: .875rem;
            --bs-link-color-rgb: 163, 23, 74;
            --bs-link-hover-color-rgb: 132, 16, 58;
            --panel: #fff;
            --accent: #f7e9ee;
            --accent-fg: var(--beet-dark);
            --btn-fg: #fff;
        }
        .dark {
            --beet: #f46a82;
            --beet-dark: #dd6177; /* primary at 90% over the background, like the web hover */
            --carrot: #fd923e;
            --bs-body-bg: #140d0d;
            --bs-body-color: #f3f2ed;
            --bs-secondary-color: #b4aca7;
            --bs-border-color: rgba(255, 255, 255, .11);
            --bs-link-color-rgb: 244, 106, 130;
            --bs-link-hover-color-rgb: 221, 97, 119;
            --panel: #201717;
            --accent: #3d2326;
            --accent-fg: #f3f2ed;
            --btn-fg: #1a0a0c;
        }
        .dark .text-bg-light { background-color: #2b2121 !important; color: #f3f2ed !important; }
        .dark .form-control, .dark .form-select { border-color: rgba(255, 255, 255, .16); }
        .dark .theme-toggle .moon, html:not(.dark) .theme-toggle .sun { display: none; }
        .text-secondary { color: var(--bs-secondary-color) !important; }
        .table { --bs-table-bg: transparent; }
        header { background: var(--panel); }
        h1, h2, .display-font { font-family: 'Bricolage Grotesque', 'Figtree', sans-serif; font-weight: 800; letter-spacing: -.03em; }
        .tabular { font-variant-numeric: tabular-nums; }
        .btn { --bs-btn-border-radius: 50rem; min-height: 40px; }
        .btn-primary {
            --bs-btn-color: var(--btn-fg); --bs-btn-hover-color: var(--btn-fg); --bs-btn-active-color: var(--btn-fg);
            --bs-btn-bg: var(--beet); --bs-btn-border-color: var(--beet);
            --bs-btn-hover-bg: var(--beet-dark); --bs-btn-hover-border-color: var(--beet-dark);
            --bs-btn-active-bg: var(--beet-dark); --bs-btn-active-border-color: var(--beet-dark);
        }
        .form-control:focus { border-color: var(--beet); box-shadow: 0 0 0 .2rem color-mix(in srgb, var(--beet) 20%, transparent); }
        :focus-visible { outline: 2px solid var(--beet); outline-offset: 2px; }
        .panel { background: var(--panel); border: 1px solid var(--bs-border-color); border-radius: 18px; padding: 1.25rem; height: 100%; }
        header .nav-link.active { background: var(--accent); color: var(--accent-fg); font-weight: 600; }
        .pagination { --bs-pagination-color: var(--beet); --bs-pagination-hover-color: var(--beet-dark); --bs-pagination-active-bg: var(--beet); --bs-pagination-active-border-color: var(--beet); --bs-pagination-focus-color: var(--beet-dark); }
        .brand { color: var(--beet); text-decoration: none; font-size: 1.25rem; }
        @stack('styles')
    </style>
</head>
<body>
    @auth
        <header class="border-bottom">
            <div class="container-xl d-flex flex-wrap align-items-center justify-content-between gap-2 gap-sm-3 py-2">
                <a class="brand display-font text-nowrap" href="{{ route('dashboard') }}">Farm to Table <span class="text-body fw-normal fs-6 d-none d-md-inline" style="letter-spacing:0;font-family:var(--bs-body-font-family)">backoffice</span></a>
                <nav class="d-flex gap-1 me-xl-auto order-last order-xl-0 col-12 col-xl-auto overflow-auto" aria-label="Main">
                    @foreach (['dashboard' => 'Overview', 'producers' => 'Producers', 'reviews' => 'Reviews', 'content' => 'Content', 'users' => 'Users', 'orders' => 'Orders', 'auctions' => 'Auctions', 'status' => 'Status'] as $route => $label)
                        <a href="{{ route($route) }}" class="nav-link text-nowrap px-2 px-sm-3 py-2 rounded-pill {{ request()->routeIs($route) ? 'active' : '' }}" @if (request()->routeIs($route)) aria-current="page" @endif>{{ $label }}</a>
                    @endforeach
                </nav>
                <form method="post" action="{{ route('logout') }}" class="d-flex align-items-center gap-3">
                    @csrf
                    <button type="button" class="btn btn-sm theme-toggle px-2" id="theme-toggle" aria-label="Switch theme">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path class="moon" d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                            <g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></g>
                        </svg>
                    </button>
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
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const dark = document.documentElement.classList.toggle('dark');
            document.documentElement.dataset.bsTheme = dark ? 'dark' : 'light';
            try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
            // shortcut: charts read their colours once, so pages with charts reload; redraw in place if the flash bothers.
            if (window.Chart) location.reload();
        });
    </script>
    @stack('scripts')
</body>
</html>
