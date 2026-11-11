<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

// Same rules and notification texts as the API (apps/api/src/modules/admin/admin-producers.service.ts).
class ProducerController extends Controller
{
    public function index()
    {
        return view('producers', [
            'producers' => User::where('role', 'producer')->where('producer.status', 'pending')->orderByDesc('_id')->get(),
        ]);
    }

    public function approve(string $id)
    {
        return $this->decide($id, ['producer.status' => 'approved'], 'producer-approved',
            'Your producer application was approved. You can now add products.', 'approved');
    }

    public function reject(Request $request, string $id)
    {
        $reason = trim((string) ($request->validate(['reason' => ['nullable', 'string', 'max:300']])['reason'] ?? ''));

        return $this->decide($id, ['producer.status' => 'rejected', 'producer.rejectReason' => $reason], 'producer-rejected',
            $reason ? "Your producer application was rejected: $reason" : 'Your producer application was rejected.', 'rejected');
    }

    private function decide(string $id, array $update, string $type, string $text, string $verb)
    {
        $producer = User::find($id);
        // The pending filter in the update makes the decision atomic: two admins cannot both decide.
        $changed = $producer && User::where('_id', $id)->where('role', 'producer')->where('producer.status', 'pending')->update($update);
        if (! $changed) {
            return $this->refused('application');
        }
        $this->notify($id, $type, $text);

        return back()->with('status', ($producer->producer['farmName'] ?? $producer->name)." was $verb.");
    }
}
