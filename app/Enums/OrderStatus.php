<?php

namespace App\Enums;

enum OrderStatus: string
{
    case REQUESTED = 'Requested';
    case QUOTED = 'Quoted';
    case CONFIRMED = 'Confirmed';
    case IN_PROGRESS = 'In Progress';
    case APPOINTMENT_SCHEDULED = 'Appointment Scheduled';
    case IN_PRODUCTION = 'In Production';
    case READY_FOR_PRODUCTION = 'Ready for Production';
    case READY = 'Ready for Pickup';
    case COMPLETED = 'Completed';
    case REJECTED = 'Rejected';
    case DECLINED = 'Declined';
    case CANCELLED = 'Cancelled';
}
