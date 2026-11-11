<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\ObjectId;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Compose sets MONGODB_DATABASE to the real database and phpunit.xml cannot override it, so switch here.
        config(['database.connections.mongodb.database' => 'farm_to_table_test', 'session.driver' => 'array', 'cache.default' => 'array']);
        DB::purge('mongodb');
        // Never drop anything but the test database.
        $this->assertSame('farm_to_table_test', DB::connection('mongodb')->getDatabaseName());
        DB::connection('mongodb')->getMongoDB()->drop();
        Model::unguard();
    }

    private function user(string $role, array $extra = []): User
    {
        return User::create($extra + [
            'name' => ucfirst($role),
            'email' => uniqid($role).'@example.test',
            // $2b$ prefix, as node bcrypt writes it.
            'passwordHash' => str_replace('$2y$', '$2b$', password_hash('secret-pass', PASSWORD_BCRYPT, ['cost' => 4])),
            'role' => $role,
        ]);
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get('/backoffice/backoffice')->assertRedirect('/backoffice/login');
    }

    public function test_only_admins_can_log_in(): void
    {
        $buyer = $this->user('buyer');
        $admin = $this->user('admin');

        $this->post('/backoffice/login', ['email' => $buyer->email, 'password' => 'secret-pass'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->post('/backoffice/login', ['email' => $admin->email, 'password' => 'wrong'])->assertSessionHasErrors('email');
        $this->post('/backoffice/login', ['email' => $admin->email, 'password' => 'secret-pass'])->assertRedirect('/backoffice');
        $this->assertAuthenticatedAs($admin);
    }

    public function test_a_logged_in_non_admin_is_forbidden(): void
    {
        $this->actingAs($this->user('buyer'))->get('/backoffice/backoffice')->assertForbidden();
    }

    public function test_dashboard_numbers(): void
    {
        $admin = $this->user('admin');
        $this->user('buyer');
        $big = $this->user('producer', ['producer' => ['farmName' => 'Big Farm', 'status' => 'approved']]);
        $small = $this->user('producer', ['producer' => ['farmName' => 'Small Farm', 'status' => 'pending']]);

        Order::create(['producer' => new ObjectId($small->id), 'total' => 5.5, 'status' => 'pending']);
        Order::create(['producer' => new ObjectId($big->id), 'total' => 20, 'status' => 'delivered']);
        Order::create(['producer' => new ObjectId($big->id), 'total' => 10, 'status' => 'delivered', 'createdAt' => now()->subDays(30)]);
        Order::create(['producer' => new ObjectId($small->id), 'total' => 999, 'status' => 'cancelled']);
        Auction::create(['status' => 'active', 'cancelled' => false]);
        Auction::create(['status' => 'active', 'cancelled' => true]);
        Auction::create(['status' => 'ended']);

        $response = $this->actingAs($admin)->get('/backoffice/backoffice')->assertOk();

        $response->assertViewHas('users', 3);
        $response->assertViewHas('pendingProducers', 1);
        $response->assertViewHas('orders', 4);
        $response->assertViewHas('liveAuctions', 1);
        $response->assertViewHas('ordersByStatus', ['pending' => 1, 'confirmed' => 0, 'ready' => 0, 'delivered' => 2]);
        $response->assertViewHas('topProducers', [['name' => 'Big Farm', 'total' => 30.0], ['name' => 'Small Farm', 'total' => 5.5]]);
        $response->assertViewHas('ordersPerDay', fn (array $days) => count($days) === 14 && end($days)['count'] === 2 && array_sum(array_column($days, 'count')) === 2);
        $response->assertViewHas('latestOrders', fn ($orders) => $orders->count() === 4);
    }

    public function test_approve_and_reject_pending_producers(): void
    {
        $admin = $this->user('admin');
        $good = $this->user('producer', ['producer' => ['farmName' => 'Good Farm', 'status' => 'pending']]);
        $bad = $this->user('producer', ['producer' => ['farmName' => 'Bad Farm', 'status' => 'pending']]);

        $this->post("/backoffice/producers/{$good->id}/approve")->assertRedirect('/backoffice/login');

        $this->actingAs($admin)->get('/backoffice/producers')->assertOk()->assertSee('Good Farm')->assertSee('Bad Farm');
        $this->post("/backoffice/producers/{$good->id}/approve")->assertSessionHas('status', 'Good Farm was approved.');
        $this->post("/backoffice/producers/{$bad->id}/reject", ['reason' => ' No farm address '])->assertSessionHas('status');
        // A second decision on the same application is refused.
        $this->post("/backoffice/producers/{$good->id}/reject")->assertSessionHasErrors('action');

        $this->assertSame('approved', $good->fresh()->producer['status']);
        $this->assertSame(['farmName' => 'Bad Farm', 'status' => 'rejected', 'rejectReason' => 'No farm address'], $bad->fresh()->producer);
        $notes = DB::connection('mongodb')->table('notifications')->orderBy('createdAt')->get();
        $this->assertSame(['producer-approved', 'producer-rejected'], $notes->pluck('type')->all());
        $this->assertSame('Your producer application was rejected: No farm address', $notes[1]->text);
        $this->assertEquals(new ObjectId($bad->id), $notes[1]->user);
    }

    public function test_keep_and_hide_reported_reviews(): void
    {
        $admin = $this->user('admin');
        $buyer = $this->user('buyer');
        $farm = $this->user('producer', ['producer' => ['farmName' => 'Rated Farm', 'status' => 'approved', 'averageRating' => 3, 'ratingCount' => 2]]);
        $product = Product::create(['name' => 'Honey', 'producer' => new ObjectId($farm->id), 'averageRating' => 3, 'ratingCount' => 2]);
        $review = fn (int $rating, bool $open) => Review::create([
            'buyer' => new ObjectId($buyer->id), 'producer' => new ObjectId($farm->id), 'products' => [new ObjectId($product->id)],
            'rating' => $rating, 'text' => "Review with $rating stars", 'hidden' => false,
            'report' => $open ? ['reason' => 'Rude', 'reportedAt' => now(), 'open' => true] : null,
        ]);
        $fine = $review(5, true);
        $rude = $review(1, true);
        $unreported = $review(4, false);

        $this->actingAs($admin)->get('/backoffice/reviews')->assertOk()
            ->assertSee('Review with 5 stars')->assertSee('Review with 1 stars')->assertDontSee('Review with 4 stars')->assertSee('Rated Farm');

        $this->post("/backoffice/reviews/{$fine->id}/keep")->assertSessionHas('status');
        $this->post("/backoffice/reviews/{$fine->id}/keep")->assertSessionHasErrors('action');
        $this->post("/backoffice/reviews/{$unreported->id}/hide")->assertSessionHasErrors('action');
        $this->post("/backoffice/reviews/{$rude->id}/hide")->assertSessionHas('status');

        $this->assertFalse($fine->fresh()->hidden);
        $this->assertFalse($fine->fresh()->report['open']);
        $this->assertTrue($rude->fresh()->hidden);
        // The hidden 1-star review no longer counts: (5 + 4) / 2.
        $this->assertSame([4.5, 2], [$product->fresh()->averageRating, $product->fresh()->ratingCount]);
        $this->assertSame([4.5, 2], [$farm->fresh()->producer['averageRating'], $farm->fresh()->producer['ratingCount']]);
    }

    public function test_hide_and_unhide_content(): void
    {
        $admin = $this->user('admin');
        $farm = $this->user('producer', ['producer' => ['farmName' => 'Shown Farm', 'status' => 'approved', 'hidden' => false]]);
        $product = Product::create(['name' => 'Cheese', 'producer' => new ObjectId($farm->id), 'hidden' => false]);

        $this->actingAs($admin)->get('/backoffice/content')->assertOk()->assertSee('Shown Farm')->assertSee('Cheese');

        $this->post("/backoffice/content/product/{$product->id}/hide")->assertSessionHas('status');
        $this->post("/backoffice/content/product/{$product->id}/hide")->assertSessionHasErrors('action');
        $this->post("/backoffice/content/producer/{$farm->id}/hide")->assertSessionHas('status');
        $this->assertTrue($product->fresh()->hidden);
        $this->assertTrue($farm->fresh()->producer['hidden']);
        $this->assertSame('approved', $farm->fresh()->producer['status']);

        $this->post("/backoffice/content/product/{$product->id}/unhide")->assertSessionHas('status');
        $this->assertFalse($product->fresh()->hidden);
        // Hiding notifies the producer, unhiding does not.
        $this->assertSame(2, DB::connection('mongodb')->table('notifications')->where('user', new ObjectId($farm->id))->count());
        $this->post("/backoffice/content/admin/{$admin->id}/hide")->assertNotFound();
        $this->post("/backoffice/content/producer/{$admin->id}/hide")->assertSessionHasErrors('action');
    }

    public function test_lists_filter_and_page(): void
    {
        $admin = $this->user('admin', ['name' => 'Root']);
        $buyer = $this->user('buyer', ['name' => 'Ana B.Costa']);
        $farm = $this->user('producer', ['name' => 'Rui', 'producer' => ['farmName' => 'Listed Farm', 'status' => 'approved']]);
        $ids = ['buyer' => new ObjectId($buyer->id), 'producer' => new ObjectId($farm->id)];
        Order::create($ids + ['total' => 12.5, 'status' => 'pending', 'fulfilment' => 'pickup', 'items' => [['name' => 'Kale', 'quantity' => 2]]]);
        Order::create($ids + ['total' => 99, 'status' => 'cancelled', 'fulfilment' => 'delivery', 'items' => [['name' => 'Figs', 'quantity' => 1]]]);
        Auction::create(['producer' => $ids['producer'], 'productName' => 'Honey lot', 'status' => 'active', 'currentPrice' => 8, 'startsAt' => now(), 'endsAt' => now()->addHour()]);
        Auction::create(['producer' => $ids['producer'], 'productName' => 'Wine lot', 'status' => 'ended', 'currentPrice' => 30]);
        $this->actingAs($admin);

        $this->get('/backoffice/users')->assertOk()->assertSee('Root')->assertSee('Ana B.Costa')->assertSee('Listed Farm');
        $this->get('/backoffice/users?role=producer')->assertSee('Rui')->assertDontSee('Ana B.Costa');
        $this->get('/backoffice/users?q=b.cos')->assertSee('Ana B.Costa')->assertDontSee('Rui');
        // The search is literal text, not a pattern: "." must not match any character.
        $this->get('/backoffice/users?q=a.b')->assertDontSee('Ana B.Costa');
        $this->get('/backoffice/users?role=nonsense')->assertOk()->assertSee('Rui');

        $this->get('/backoffice/orders')->assertOk()->assertSee('2 × Kale')->assertSee('1 × Figs')->assertSee('Listed Farm');
        $this->get('/backoffice/orders?status=cancelled')->assertSee('1 × Figs')->assertDontSee('2 × Kale');

        $this->get('/backoffice/auctions')->assertOk()->assertSee('Honey lot')->assertSee('Wine lot');
        $this->get('/backoffice/auctions?status=active')->assertSee('Honey lot')->assertDontSee('Wine lot');

        for ($i = 0; $i < 20; $i++) {
            $this->user('buyer', ['name' => "Bulk $i"]);
        }
        $this->get('/backoffice/users')->assertSee('Bulk 19')->assertDontSee('Ana B.Costa');
        $this->get('/backoffice/users?page=2')->assertSee('Ana B.Costa')->assertDontSee('Bulk 19');
    }
}
