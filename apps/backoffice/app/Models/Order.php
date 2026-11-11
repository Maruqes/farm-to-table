<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Order extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'ready', 'delivered'];

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected $connection = 'mongodb';

    public function number(): string
    {
        return '#'.substr((string) $this->id, -6);
    }
}
