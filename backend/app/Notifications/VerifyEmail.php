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
        $app = config('app.name', 'Lawareeg');
        $name = $notifiable->name ?: 'there';

        return (new MailMessage)
            ->subject("{$app} confirmation code: {$this->code}")
            ->greeting("Hi {$name},")
            ->line('Confirm your email for '.$app.' with this code:')
            ->line($this->code)
            ->line('The code expires in 15 minutes.')
            ->line('If you did not create an account, you can ignore this message.')
            ->salutation('Thanks, '.$app)
            ->withSymfonyMessage(function ($message) use ($app) {
                $headers = $message->getHeaders();
                $headers->addTextHeader('X-Mailer', $app);
                $headers->addTextHeader('X-Auto-Response-Suppress', 'OOF, AutoReply');
                $headers->addTextHeader('Precedence', 'bulk');
            });
    }
}
