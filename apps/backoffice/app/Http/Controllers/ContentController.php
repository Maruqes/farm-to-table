<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;

// Hiding removes a product or producer page from the public catalog without deleting it.
// Same rules as the API (apps/api/src/modules/admin/admin-content.service.ts).
class ContentController extends Controller
{
    public function index()
    {
        $producers = User::where('role', 'producer')->orderBy('name')->get();

        return view('content', [
            'producers' => $producers,
            'farms' => $producers->mapWithKeys(fn ($p) => [(string) $p->id => $p->producer['farmName'] ?? $p->name]),
            'products' => Product::orderBy('name')->get(),
        ]);
    }

    public function setHidden(string $type, string $id, string $action)
    {
        $hidden = $action === 'hide';
        if ($type === 'product') {
            $product = Product::find($id);
            // The opposite-state filter keeps a double click from notifying twice.
            if (! $product || ! Product::where('_id', $id)->where('hidden', '!=', $hidden)->update(['hidden' => $hidden])) {
                return $this->refused('change');
            }
            $name = $product->name;
            if ($hidden) {
                $this->notify((string) $product->producer, 'product-hidden', "Your product \"$name\" was hidden by an administrator.");
            }
        } else {
            $producer = User::where('role', 'producer')->find($id);
            if (! $producer || ! User::where('_id', $id)->where('producer.hidden', '!=', $hidden)->update(['producer.hidden' => $hidden])) {
                return $this->refused('change');
            }
            $name = $producer->producer['farmName'] ?? $producer->name;
            if ($hidden) {
                $this->notify($id, 'product-hidden', 'Your producer page was hidden by an administrator.');
            }
        }

        return back()->with('status', $hidden ? "$name is now hidden from the public site." : "$name is public again.");
    }
}
