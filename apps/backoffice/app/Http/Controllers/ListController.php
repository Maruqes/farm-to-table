<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

// Read-only lists, same filters as the API's admin lists (apps/api/src/modules/admin/admin-lists.service.ts).
class ListController extends Controller
{
    private const PER_PAGE = 20;

    private const ROLES = ['buyer', 'producer', 'admin'];

    private const ORDER_STATUSES = ['pending', 'confirmed', 'ready', 'delivered', 'cancelled'];

    private const AUCTION_STATUSES = ['draft', 'scheduled', 'active', 'ended'];

    public function users(Request $request)
    {
        $role = $this->choice($request, 'role', self::ROLES);
        $q = mb_substr(trim((string) $request->query('q')), 0, 100);

        $users = User::query()
            ->when($role, fn ($query) => $query->where('role', $role))
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w->where('name', 'like', "%$q%")->orWhere('email', 'like', "%$q%")))
            ->orderByDesc('_id')->paginate(self::PER_PAGE)->withQueryString();

        return view('lists.users', ['users' => $users, 'roles' => self::ROLES, 'role' => $role, 'q' => $q]);
    }

    public function orders(Request $request)
    {
        $status = $this->choice($request, 'status', self::ORDER_STATUSES);
        $orders = Order::query()->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('createdAt')->orderByDesc('_id')->paginate(self::PER_PAGE)->withQueryString();

        return view('lists.orders', [
            'orders' => $orders, 'statuses' => self::ORDER_STATUSES, 'status' => $status,
            'people' => $this->people($orders->getCollection(), ['buyer', 'producer']),
        ]);
    }

    public function auctions(Request $request)
    {
        $status = $this->choice($request, 'status', self::AUCTION_STATUSES);
        $auctions = Auction::query()->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('createdAt')->orderByDesc('_id')->paginate(self::PER_PAGE)->withQueryString();

        return view('lists.auctions', [
            'auctions' => $auctions, 'statuses' => self::AUCTION_STATUSES, 'status' => $status,
            'people' => $this->people($auctions->getCollection(), ['producer']),
        ]);
    }

    /** An unknown filter value is treated as "all" instead of an error page. */
    private function choice(Request $request, string $key, array $allowed): ?string
    {
        $value = $request->query($key);

        return in_array($value, $allowed, true) ? $value : null;
    }

    /** Display names (farm name for producers) keyed by user id, for the ids found in the given fields. */
    private function people(Collection $rows, array $fields): Collection
    {
        $ids = $rows->flatMap(fn ($row) => array_map(fn ($field) => (string) $row->$field, $fields))->unique()->values()->all();

        return User::whereIn('_id', $ids)->get()->mapWithKeys(fn ($u) => [(string) $u->id => $u->producer['farmName'] ?? $u->name]);
    }
}
