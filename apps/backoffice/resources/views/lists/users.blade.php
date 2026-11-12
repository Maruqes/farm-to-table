@extends('layouts.app')
@section('title', 'Users')

@section('content')
    <h1 class="mb-1">Users</h1>
    <p class="text-secondary mb-4">{{ number_format($users->total()) }} {{ $role || $q !== '' ? 'match the filter' : 'accounts' }}, newest first.</p>

    @include('lists.filter', ['name' => 'role', 'label' => 'Role', 'options' => $roles, 'selected' => $role, 'search' => $q])

    @if ($users->isEmpty())
        <div class="page-state">No users match. Clear the filter to see everyone.</div>
    @else
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col" class="d-none d-md-table-cell">Email</th>
                        <th scope="col" class="d-none d-md-table-cell">Role</th>
                        <th scope="col">State</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        @php $producerStatus = $user->role === 'producer' ? ($user->producer['status'] ?? 'pending') : null; @endphp
                        <tr>
                            <th scope="row">
                                {{ $user->name }}
                                @if ($user->role === 'producer') <span class="d-none d-md-block small text-secondary fw-normal">{{ $user->producer['farmName'] ?? '' }}</span> @endif
                            </th>
                            <td class="d-none d-md-table-cell"><a href="mailto:{{ $user->email }}">{{ $user->email }}</a></td>
                            <td class="d-none d-md-table-cell">{{ ucfirst($user->role) }}</td>
                            <td>
                                @if ($producerStatus === 'pending')
                                    <a href="{{ route('producers') }}">Pending approval</a>
                                @elseif ($producerStatus === 'rejected')
                                    <span class="badge badge-secondary">Rejected</span>
                                @else
                                    <span class="text-secondary">Active</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
    <div class="mt-3">{{ $users->links() }}</div>
@endsection
