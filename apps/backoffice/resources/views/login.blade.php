@extends('layouts.app')
@section('title', 'Log in')

@section('content')
    <div class="row justify-content-center pt-5">
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
            <h1 class="h2 mb-1">Farm to Table</h1>
            <p class="text-secondary mb-4">Backoffice. Log in with an admin account.</p>
            <form method="post" action="{{ route('login') }}" class="frame frame-pad">
                @csrf
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username"
                        class="form-control @error('email') is-invalid @enderror" @error('email') aria-describedby="email-error" @enderror>
                    @error('email')
                        <div id="email-error" class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <div class="mb-4">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password"
                        class="form-control @error('password') is-invalid @enderror">
                    @error('password')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                <button class="btn btn-primary w-100">Log in</button>
            </form>
        </div>
    </div>
@endsection
