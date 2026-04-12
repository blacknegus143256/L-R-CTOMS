<?php

namespace App\Enums;

enum OrderStatus: string
{
    case REQUESTED = 'Requested';
    case QUOTED = 'Quoted';
    case CONFIRMED = 'Confirmed';
    case APPOINTMENT_SCHEDULED = 'Appointment Scheduled';
    case IN_PRODUCTION = 'In Production';
    case READY = 'Ready for Pickup';
    case COMPLETED = 'Completed';
    case CANCELLED = 'Cancelled';
}
