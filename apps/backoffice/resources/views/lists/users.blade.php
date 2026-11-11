@extends('layouts.app')
@section('title', 'Users')

@section('content')
    <h1 class="mb-1">Users</h1>
    <p class="text-secondary mb-4">{{ number_format($users->total()) }} {{ $role || $q !== '' ? 'match the filter' : 'accounts' }}, newest first.</p>

    @include('lists.filter', ['name' => 'role', 'label' => 'Role', 'options' => $roles, 'selected' => $role, 'search' => $q])

    <div class="panel" style="height: auto">
        @if ($users->isEmpty())
            <p class="text-secondary text-center py-5 mb-0">No users match. Clear the filter to see everyone.</p>
        @else
            <div class="table-responsive">
                <table class="table align-middle mb-0">
                    <thead>
                        <tr class="text-secondary">
                            <th scope="col" class="fw-medium">Name</th>
                            <th scope="col" class="fw-medium">Email</th>
                            <th scope="col" class="fw-medium">Role</th>
                            <th scope="col" class="fw-medium">State</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($users as $user)
                            @php $producerStatus = $user->role === 'producer' ? ($user->producer['status'] ?? 'pending') : null; @endphp
                            <tr>
                                <th scope="row" class="fw-medium">
                                    {{ $user->name }}
                                    @if ($user->role === 'producer') <span class="d-block small text-secondary fw-normal">{{ $user->producer['farmName'] ?? '' }}</span> @endif
                                </th>
                                <td><a href="mailto:{{ $user->email }}">{{ $user->email }}</a></td>
                                <td>{{ ucfirst($user->role) }}</td>
                                <td>
                                    @if ($producerStatus === 'pending')
                                        <a href="{{ route('producers') }}">Pending approval</a>
                                    @elseif ($producerStatus === 'rejected')
                                        <span class="badge rounded-pill text-bg-light border fw-medium">Rejected</span>
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
    </div>
    <div class="mt-3">{{ $users->links() }}</div>
@endsection
