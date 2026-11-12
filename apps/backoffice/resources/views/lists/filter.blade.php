{{-- Filter bar shared by the lists: $name, $label, $options, $selected, optional $search. --}}
<form method="get" class="filter-form d-flex flex-wrap align-items-end gap-2 mb-3">
    @isset($search)
        <div>
            <label for="q" class="form-label">Name or email</label>
            <input type="search" id="q" name="q" value="{{ $search }}" maxlength="100" class="form-control">
        </div>
    @endisset
    <div>
        <label for="{{ $name }}" class="form-label">{{ $label }}</label>
        <select id="{{ $name }}" name="{{ $name }}" class="form-select">
            <option value="">All</option>
            @foreach ($options as $option)
                <option value="{{ $option }}" @selected($option === $selected)>{{ ucfirst($option) }}</option>
            @endforeach
        </select>
    </div>
    <button class="btn btn-outline-secondary px-3">Filter</button>
</form>
