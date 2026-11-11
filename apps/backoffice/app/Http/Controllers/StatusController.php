<?php

namespace App\Http\Controllers;

use App\Console\Commands\CheckStatus;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\UTCDateTime;

class StatusController extends Controller
{
    private const HOURS = CheckStatus::RETENTION_DAYS * 24;

    private const DEGRADED_AFTER_MS = 1000;

    // The recorder runs every minute; after this long without a sample the page says so.
    private const STALE_AFTER_MINUTES = 5;

    public function __invoke()
    {
        $firstHour = CarbonImmutable::now('UTC')->startOfHour()->subHours(self::HOURS - 1);
        $array = ['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']];
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('status_checks');

        $buckets = [];
        $rows = $collection->aggregate([
            ['$match' => ['checkedAt' => ['$gte' => new UTCDateTime($firstHour)]]],
            ['$group' => [
                '_id' => ['service' => '$service', 'hour' => ['$dateTrunc' => ['date' => '$checkedAt', 'unit' => 'hour']]],
                'total' => ['$sum' => 1],
                'failed' => ['$sum' => ['$cond' => ['$ok', 0, 1]]],
                'latency' => ['$avg' => '$latencyMs'],
            ]],
        ], $array);
        foreach ($rows as $row) {
            $buckets[$row['_id']['service']][$row['_id']['hour']->toDateTime()->getTimestamp()] = $row;
        }

        $latest = [];
        $rows = $collection->aggregate([
            ['$sort' => ['checkedAt' => -1]],
            ['$group' => ['_id' => '$service', 'ok' => ['$first' => '$ok'], 'latencyMs' => ['$first' => '$latencyMs'], 'checkedAt' => ['$first' => '$checkedAt']]],
        ], $array);
        foreach ($rows as $row) {
            $latest[$row['_id']] = $row;
        }

        $services = [];
        $lastCheck = null;
        foreach (CheckStatus::SERVICES as $name) {
            $hours = [];
            $total = $failed = 0;
            for ($i = 0; $i < self::HOURS; $i++) {
                $hour = $firstHour->addHours($i);
                $bucket = $buckets[$name][$hour->getTimestamp()] ?? null;
                $total += $bucket['total'] ?? 0;
                $failed += $bucket['failed'] ?? 0;
                $hours[] = [
                    'label' => $hour->setTimezone('Europe/Lisbon')->format('j M, H:i'),
                    'latency' => isset($bucket['latency']) ? (int) round($bucket['latency']) : null,
                    'total' => $bucket['total'] ?? 0,
                    'failed' => $bucket['failed'] ?? 0,
                ];
            }
            $last = $latest[$name] ?? null;
            $checkedAt = $last ? CarbonImmutable::instance($last['checkedAt']->toDateTime()) : null;
            $lastCheck = max($lastCheck, $checkedAt);
            $services[] = [
                'name' => $name,
                'state' => match (true) {
                    ! $last => 'unknown',
                    ! $last['ok'] => 'down',
                    $last['latencyMs'] > self::DEGRADED_AFTER_MS => 'degraded',
                    default => 'operational',
                },
                'latencyMs' => $last['latencyMs'] ?? null,
                'uptime' => $total ? ($total - $failed) / $total * 100 : null,
                'checks' => $total,
                'failed' => $failed,
                'hours' => $hours,
            ];
        }

        return view('status', [
            'services' => $services,
            'lastCheck' => $lastCheck,
            'stale' => $lastCheck && $lastCheck->lt(now()->subMinutes(self::STALE_AFTER_MINUTES)),
            'days' => CheckStatus::RETENTION_DAYS,
        ]);
    }
}
