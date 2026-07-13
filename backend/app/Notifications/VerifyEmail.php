<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmail extends Notification
{
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
            ->subject('Your Lawareeg verification code')
            ->greeting('Hello '.$notifiable->name.'!')
            ->line('Use this code to verify your email address and unlock your dashboard:')
            ->line('**'.$this->code.'**')
            ->line('This code expires in 15 minutes.')
            ->line('If you did not create a Lawareeg account, you can ignore this email.')
            ->salutation('— Lawareeg');
    }
}
