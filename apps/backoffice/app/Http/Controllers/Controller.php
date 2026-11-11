<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

abstract class Controller
{
    /** Same document the API's notify() writes (apps/api/src/modules/notifications). */
    protected function notify(string $userId, string $type, string $text): void
    {
        // shortcut: written straight to Mongo, so the user sees it on their next page load, not pushed over Socket.io.
        DB::connection('mongodb')->table('notifications')->insert([
            'user' => new ObjectId($userId), 'type' => $type, 'text' => $text, 'read' => false, 'createdAt' => new UTCDateTime,
        ]);
    }

    protected function refused(string $what)
    {
        return back()->withErrors(['action' => "That $what was already handled or no longer exists."]);
    }
}
