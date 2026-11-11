@extends('layouts.app')
@section('title', 'Content')

@php
    $row = function (string $type, string $id, string $name, string $detail, bool $hidden) {
        return compact('type', 'id', 'name', 'detail', 'hidden');
    };
    $sections = [
        'Producer pages' => $producers->map(fn ($p) => $row('producer', (string) $p->id, $farms[(string) $p->id], $p->name.' · '.($p->producer['status'] ?? 'pending'), ($p->producer['hidden'] ?? false) === true)),
        'Products' => $products->map(fn ($p) => $row('product', (string) $p->id, $p->name, ($farms[(string) $p->producer] ?? 'Unknown producer').' · '.$p->category, $p->hidden === true)),
    ];
@endphp

@section('content')
    <h1 class="mb-1">Content</h1>
    <p class="text-secondary mb-4">Hide a producer page or a product to take it off the public site. Nothing is deleted, and you can show it again.</p>

    <div class="row g-3">
        @foreach ($sections as $title => $rows)
            <div class="{{ $loop->first ? 'col-lg-5' : 'col-lg-7' }}">
                <section class="panel" style="height: auto">
                    <h2 class="h5">{{ $title }} <span class="text-secondary fw-normal fs-6" style="letter-spacing: 0; font-family: var(--bs-body-font-family)">{{ $rows->count() }}, {{ $rows->where('hidden', true)->count() }} hidden</span></h2>
                    @if ($rows->isEmpty())
                        <p class="text-secondary py-4 mb-0 text-center">Nothing here yet.</p>
                    @else
                        <table class="table align-middle mb-0">
                            <thead class="visually-hidden">
                                <tr><th scope="col">Name</th><th scope="col">Visibility</th><th scope="col">Action</th></tr>
                            </thead>
                            <tbody>
                                @foreach ($rows as $item)
                                    <tr>
                                        <th scope="row" class="fw-normal">
                                            <span class="fw-medium {{ $item['hidden'] ? 'text-secondary' : '' }}">{{ $item['name'] }}</span>
                                            <span class="d-block small text-secondary">{{ $item['detail'] }}</span>
                                        </th>
                                        <td>
                                            @if ($item['hidden']) <span class="badge rounded-pill text-bg-light border fw-medium">Hidden</span> @else <span class="small text-secondary">Public</span> @endif
                                        </td>
                                        <td class="text-end">
                                            <form method="post" action="{{ route('content.set', [$item['type'], $item['id'], $item['hidden'] ? 'unhide' : 'hide']) }}">
                                                @csrf
                                                <button class="btn btn-sm px-3 {{ $item['hidden'] ? 'btn-outline-secondary' : 'btn-outline-danger' }}" aria-label="{{ $item['hidden'] ? 'Show' : 'Hide' }} {{ $item['name'] }}">{{ $item['hidden'] ? 'Show' : 'Hide' }}</button>
                                            </form>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </section>
            </div>
        @endforeach
    </div>
@endsection
