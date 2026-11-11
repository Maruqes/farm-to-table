<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Hidden;
use MongoDB\Laravel\Auth\User as Authenticatable;

// Same `users` collection the API writes (Mongoose schema: apps/api/src/modules/users/users.model.ts).
#[Hidden(['passwordHash'])]
class User extends Authenticatable
{
    protected $connection = 'mongodb';

    public $timestamps = false;

    public function getAuthPasswordName(): string
    {
        return 'passwordHash';
    }
}
