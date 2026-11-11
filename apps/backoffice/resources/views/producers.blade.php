@extends('layouts.app')
@section('title', 'Producer applications')

@section('content')
    <h1 class="mb-1">Producer applications</h1>
    <p class="text-secondary mb-4">
        {{ $producers->count() }} waiting. Approved producers can add products; rejected ones are told why.
    </p>

    @forelse ($producers as $producer)
        @php $farm = $producer->producer['farmName'] ?? $producer->name; @endphp
        <article class="panel mb-3" style="height: auto">
            <div class="row g-3">
                <div class="col-md-7">
                    <h2 class="h5 mb-1">{{ $farm }}</h2>
                    <p class="text-secondary mb-2">
                        {{ $producer->name }} · <a href="mailto:{{ $producer->email }}">{{ $producer->email }}</a><br>
                        {{ ($producer->producer['location'] ?? '') ?: 'No location given' }} · applied {{ date('j M Y', (new MongoDB\BSON\ObjectId($producer->id))->getTimestamp()) }}
                    </p>
                    <p class="mb-0" style="max-width: 65ch">{{ ($producer->producer['bio'] ?? '') ?: 'No description written yet.' }}</p>
                </div>
                <div class="col-md-5">
                    <form method="post" action="{{ route('producers.approve', $producer->id) }}" class="mb-3">
                        @csrf
                        <button class="btn btn-primary w-100">Approve {{ $farm }}</button>
                    </form>
                    <form method="post" action="{{ route('producers.reject', $producer->id) }}">
                        @csrf
                        <label for="reason-{{ $producer->id }}" class="form-label small text-secondary mb-1">Reason for rejecting (optional, sent to the producer)</label>
                        <div class="d-flex gap-2">
                            <input id="reason-{{ $producer->id }}" name="reason" maxlength="300" class="form-control">
                            <button class="btn btn-outline-danger px-3">Reject</button>
                        </div>
                    </form>
                </div>
            </div>
        </article>
    @empty
        <div class="panel text-center text-secondary py-5" style="height: auto">
            No applications are waiting. New producers appear here when they register.
        </div>
    @endforelse
@endsection
