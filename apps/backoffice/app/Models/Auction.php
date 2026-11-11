<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Auction extends Model
{
    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $connection = 'mongodb';

    protected $casts = ['startsAt' => 'datetime', 'endsAt' => 'datetime'];
}
