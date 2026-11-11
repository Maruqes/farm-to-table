<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use MongoDB\BSON\UTCDateTime;
use Tests\TestCase;

class StatusTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Same switch as DashboardTest: never touch anything but the test database.
        config(['database.connections.mongodb.database' => 'farm_to_table_test', 'session.driver' => 'array', 'cache.default' => 'array']);
        DB::purge('mongodb');
        $this->assertSame('farm_to_table_test', DB::connection('mongodb')->getDatabaseName());
        DB::connection('mongodb')->getMongoDB()->drop();
        Model::unguard();
    }

    public function test_check_records_samples_and_the_page_draws_them(): void
    {
        Http::fake([
            '*/api/health' => Http::response('', 500),
            '*' => Http::response('ok'),
        ]);
        $checks = DB::connection('mongodb')->getMongoDB()->selectCollection('status_checks');
        // An old, healthy API sample from three days ago, still inside the retention.
        $checks->insertOne(['service' => 'API', 'ok' => true, 'latencyMs' => 40, 'checkedAt' => new UTCDateTime(now()->subDays(3))]);

        $this->artisan('status:check')->assertSuccessful();

        $this->assertSame(7, $checks->countDocuments());
        $ttl = collect(iterator_to_array($checks->listIndexes()))->first(fn ($index) => $index->isTtl());
        $this->assertSame(7 * 86400, $ttl['expireAfterSeconds']);

        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'passwordHash' => 'x', 'role' => 'admin']);
        $this->get('/backoffice/status')->assertRedirect('/backoffice/login');
        $response = $this->actingAs($admin)->get('/backoffice/status')->assertOk()->assertSee('1 service down.');

        $services = collect($response->viewData('services'))->keyBy('name');
        $this->assertSame('down', $services['API']['state']);
        $this->assertSame([2, 1, 50.0], [$services['API']['checks'], $services['API']['failed'], $services['API']['uptime']]);
        $this->assertSame('operational', $services['MongoDB']['state']);
        $this->assertEquals(100, $services['Web']['uptime']);
        $this->assertCount(7 * 24, $services['API']['hours']);
        $this->assertSame(1, $services['API']['hours'][167]['failed']);
        $this->assertFalse($response->viewData('stale'));
    }

    public function test_page_without_samples(): void
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'passwordHash' => 'x', 'role' => 'admin']);
        $this->actingAs($admin)->get('/backoffice/status')->assertOk()->assertSee('No checks recorded yet.');
    }
}
