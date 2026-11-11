<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Order;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\UTCDateTime;

// Same definitions as the API's admin summary (apps/api/src/modules/admin/admin-overview.service.ts):
// cancelled orders are left out of every chart, days are Europe/Lisbon days.
class DashboardController extends Controller
{
    private const TIME_ZONE = 'Europe/Lisbon';

    private const WINDOW_DAYS = 14;

    public function __invoke()
    {
        $firstDay = CarbonImmutable::now(self::TIME_ZONE)->startOfDay()->subDays(self::WINDOW_DAYS - 1);
        $notCancelled = ['$match' => ['status' => ['$ne' => 'cancelled']]];

        $perDay = $this->aggregate([
            ['$match' => ['status' => ['$ne' => 'cancelled'], 'createdAt' => ['$gte' => new UTCDateTime($firstDay)]]],
            ['$group' => [
                '_id' => ['$dateToString' => ['format' => '%Y-%m-%d', 'date' => '$createdAt', 'timezone' => self::TIME_ZONE]],
                'count' => ['$sum' => 1],
            ]],
        ]);
        $ordersPerDay = [];
        for ($i = 0; $i < self::WINDOW_DAYS; $i++) {
            $day = $firstDay->addDays($i);
            $ordersPerDay[] = ['label' => $day->format('j M'), 'count' => $perDay[$day->format('Y-m-d')]['count'] ?? 0];
        }

        $byStatus = $this->aggregate([$notCancelled, ['$group' => ['_id' => '$status', 'count' => ['$sum' => 1]]]]);
        $ordersByStatus = [];
        foreach (Order::STATUSES as $status) {
            $ordersByStatus[$status] = $byStatus[$status]['count'] ?? 0;
        }

        $topProducers = array_map(
            fn (array $row) => [
                'name' => $row['user'][0]['producer']['farmName'] ?? $row['user'][0]['name'] ?? 'Unknown producer',
                'total' => round($row['total'], 2),
            ],
            array_values($this->aggregate([
                $notCancelled,
                ['$group' => ['_id' => '$producer', 'total' => ['$sum' => '$total']]],
                ['$sort' => ['total' => -1, '_id' => 1]],
                ['$limit' => 5],
                ['$lookup' => ['from' => 'users', 'localField' => '_id', 'foreignField' => '_id', 'as' => 'user']],
            ])),
        );

        return view('dashboard', [
            'users' => User::whereIn('role', ['buyer', 'producer'])->count(),
            'pendingProducers' => User::where('role', 'producer')->where('producer.status', 'pending')->count(),
            'orders' => Order::count(),
            'liveAuctions' => Auction::where('status', 'active')->where('cancelled', '!=', true)->count(),
            'ordersPerDay' => $ordersPerDay,
            'ordersByStatus' => $ordersByStatus,
            'topProducers' => $topProducers,
            'latestOrders' => Order::orderByDesc('createdAt')->limit(5)->get(),
        ]);
    }

    /** Runs a pipeline on `orders` and returns the rows as arrays keyed by their _id. */
    private function aggregate(array $pipeline): array
    {
        $rows = DB::connection('mongodb')->table('orders')->raw(
            fn ($collection) => $collection->aggregate($pipeline, ['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']]),
        );
        $byId = [];
        foreach ($rows as $row) {
            $byId[(string) $row['_id']] = $row;
        }

        return $byId;
    }
}
