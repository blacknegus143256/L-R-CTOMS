<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailCodeNotification extends Notification
{
    use Queueable;

    public function __construct(public string $code)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your verification code')
            ->greeting('Verify your email address')
            ->line('Use this 6-digit code to verify your email address:')
            ->line('**' . $this->code . '**')
            ->line('This code expires in 15 minutes.')
            ->line('If you did not create an account, you can ignore this email.');
    }
}