<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use MongoDB\BSON\UTCDateTime;
use Throwable;

// Probes every service once and stores one sample per service in `status_checks`.
// The scheduler runs it every minute (routes/console.php); /status draws the samples.
class CheckStatus extends Command
{
    public const SERVICES = ['Web', 'API', 'Socket.io', 'API docs', 'MongoDB', 'Image storage'];

    public const RETENTION_DAYS = 7;

    private const TIMEOUT_SECONDS = 3;

    protected $signature = 'status:check';

    protected $description = 'Record one health sample per service';

    public function handle(): int
    {
        $urls = config('services.status');
        $get = fn (string $url, array $headers = []) => fn () => Http::timeout(self::TIMEOUT_SECONDS)->withHeaders($headers)->get($url)->throw();
        $checks = [
            // The Vite dev server refuses unknown Host headers; nginx in production does not care.
            'Web' => $get($urls['web'], ['Host' => 'localhost']),
            'API' => $get($urls['api'].'/api/health'),
            'Socket.io' => $get($urls['api'].'/socket.io/?EIO=4&transport=polling'),
            'API docs' => $get($urls['api'].'/api-docs/openapi.json'),
            'MongoDB' => fn () => DB::connection('mongodb')->getMongoDB()->command(['ping' => 1]),
            'Image storage' => $get($urls['storage'].'/minio/health/live'),
        ];

        $now = new UTCDateTime;
        $samples = [];
        foreach ($checks as $service => $check) {
            $started = microtime(true);
            try {
                $check();
                $latency = (int) round((microtime(true) - $started) * 1000);
            } catch (Throwable $e) {
                $latency = null;
                $this->warn("$service is down: {$e->getMessage()}");
            }
            $samples[] = ['service' => $service, 'ok' => $latency !== null, 'latencyMs' => $latency, 'checkedAt' => $now];
        }

        // If MongoDB itself is down this throws and nothing is stored: the gap shows on the page as "no data".
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('status_checks');
        // MongoDB deletes samples older than the retention by itself (TTL index); creating it again is a no-op.
        $collection->createIndex(['checkedAt' => 1], ['expireAfterSeconds' => self::RETENTION_DAYS * 86400]);
        $collection->insertMany($samples);

        return self::SUCCESS;
    }
}
