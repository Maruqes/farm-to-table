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

    <div class="row g-4">
        @foreach ($sections as $title => $rows)
            <div class="{{ $loop->first ? 'col-lg-5' : 'col-lg-7' }}">
                <section>
                    <h2 class="h5">{{ $title }} <span class="section-count font-body text-secondary fs-6">{{ $rows->count() }}, {{ $rows->where('hidden', true)->count() }} hidden</span></h2>
                    @if ($rows->isEmpty())
                        <div class="page-state">Nothing here yet.</div>
                    @else
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead class="visually-hidden">
                                    <tr><th scope="col">Name</th><th scope="col" class="d-none d-md-table-cell">Visibility</th><th scope="col">Action</th></tr>
                                </thead>
                                <tbody>
                                    @foreach ($rows as $item)
                                        <tr>
                                            <th scope="row" class="fw-normal">
                                                <span class="fw-medium {{ $item['hidden'] ? 'text-secondary' : '' }}">{{ $item['name'] }}</span>
                                                <span class="d-none d-md-block small text-secondary">{{ $item['detail'] }}</span>
                                            </th>
                                            <td class="d-none d-md-table-cell">
                                                @if ($item['hidden']) <span class="badge badge-secondary">Hidden</span> @else <span class="small text-secondary">Public</span> @endif
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
                        </div>
                    @endif
                </section>
            </div>
        @endforeach
    </div>
@endsection
