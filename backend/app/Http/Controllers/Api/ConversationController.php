<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\StoreConversationRequest;
use App\Http\Requests\Message\StoreMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Listing;
use App\Models\User;
use App\Services\MessageContentFilter;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConversationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $userId = $user->id;

        $conversations = Conversation::query()
            ->with(['listing', 'buyer', 'seller', 'latestMessage'])
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                $q->whereNull('read_at')->where('sender_id', '!=', $userId);
            }])
            ->orderByDesc('last_message_at')
            ->paginate((int) $request->input('per_page', 20));

        return ConversationResource::collection($conversations);
    }

    /**
     * Admin support inbox — all support threads.
     */
    public function supportIndex(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::query()
            ->with(['listing', 'buyer', 'seller', 'latestMessage'])
            ->where('type', Conversation::TYPE_SUPPORT)
            ->withCount(['messages as unread_count' => function ($q) use ($userId) {
                $q->whereNull('read_at')->where('sender_id', '!=', $userId);
            }])
            ->orderByDesc('last_message_at')
            ->paginate((int) $request->input('per_page', 30));

        return ConversationResource::collection($conversations);
    }

    /**
     * Start (or reopen) a support chat with Lawareeg admin.
     */
    public function startSupport(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            throw ValidationException::withMessages([
                'support' => ['Admins already handle support in the admin panel.'],
            ]);
        }

        $admin = User::query()
            ->where('role', 'admin')
            ->where('is_suspended', false)
            ->orderBy('id')
            ->first();

        if (! $admin) {
            throw ValidationException::withMessages([
                'support' => ['Support is temporarily unavailable. Please try again later.'],
            ]);
        }

        $conversation = Conversation::query()
            ->where('type', Conversation::TYPE_SUPPORT)
            ->where('buyer_id', $user->id)
            ->where('seller_id', $admin->id)
            ->first();

        if (! $conversation) {
            $conversation = Conversation::create([
                'type' => Conversation::TYPE_SUPPORT,
                'listing_id' => null,
                'buyer_id' => $user->id,
                'seller_id' => $admin->id,
                'last_message_at' => now(),
            ]);
        }

        return response()->json([
            'data' => new ConversationResource($conversation->load(['listing', 'buyer', 'seller'])),
            'message' => 'Support chat ready. Tell us how we can help.',
        ], 201);
    }

    public function show(Request $request, Conversation $conversation)
    {
        $this->authorizeParty($request, $conversation);

        return response()->json([
            'data' => new ConversationResource($conversation->load(['listing', 'buyer', 'seller'])),
        ]);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $this->authorizeParty($request, $conversation);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->paginate((int) $request->input('per_page', 50));

        return MessageResource::collection($messages);
    }

    public function storeMessage(StoreMessageRequest $request, Conversation $conversation)
    {
        $this->authorizeParty($request, $conversation);

        $data = $request->validated();

        if (empty($data['body']) && ! $request->hasFile('attachment')) {
            throw ValidationException::withMessages(['body' => ['A message body or attachment is required.']]);
        }

        // Listing chats: block contact sharing. Support chats: allow order numbers, still block WhatsApp/email.
        if (! empty($data['body'])) {
            if ($conversation->isSupport()) {
                $violation = MessageContentFilter::findSupportViolation($data['body']);
            } else {
                $violation = MessageContentFilter::findViolation($data['body']);
            }
            if ($violation !== null) {
                throw ValidationException::withMessages([
                    'body' => [MessageContentFilter::warningMessage($violation)],
                ]);
            }
        }

        $attachmentPath = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('messages/'.$conversation->id, 'local');
            $attachmentType = $file->getClientMimeType();
        }

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $data['body'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $attachmentType,
        ]);

        $conversation->update(['last_message_at' => now()]);

        $this->notifyOtherParty($request->user(), $conversation, $message->body);

        return response()->json([
            'data' => new MessageResource($message->load('sender')),
        ], 201);
    }

    public function store(StoreConversationRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $listing = ! empty($data['listing_id']) ? Listing::find($data['listing_id']) : null;

        if (! empty($data['user_id'])) {
            $otherUser = User::findOrFail($data['user_id']);
        } elseif ($listing) {
            $otherUser = $listing->user;
        } else {
            throw ValidationException::withMessages(['user_id' => ['A recipient user or listing is required.']]);
        }

        if ($otherUser->id === $user->id) {
            throw ValidationException::withMessages(['user_id' => ['You cannot start a conversation with yourself.']]);
        }

        if ($otherUser->role === 'admin') {
            // Redirect listing/user start toward support flow instead of treating admin as a seller.
            return $this->startSupport($request);
        }

        [$buyerId, $sellerId] = $user->id === ($listing?->user_id ?? $otherUser->id)
            ? [$otherUser->id, $user->id]
            : [$user->id, $otherUser->id];

        $conversation = DB::transaction(function () use ($listing, $buyerId, $sellerId) {
            return Conversation::firstOrCreate([
                'type' => Conversation::TYPE_LISTING,
                'listing_id' => $listing?->id,
                'buyer_id' => $buyerId,
                'seller_id' => $sellerId,
            ], [
                'last_message_at' => now(),
            ]);
        });

        return response()->json([
            'data' => new ConversationResource($conversation->load(['listing', 'buyer', 'seller'])),
        ], 201);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $this->authorizeParty($request, $conversation);

        $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $request->user()->id)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Conversation marked as read.']);
    }

    private function authorizeParty(Request $request, Conversation $conversation): void
    {
        $user = $request->user();

        if ($conversation->buyer_id === $user->id || $conversation->seller_id === $user->id) {
            return;
        }

        // Any admin can handle support threads
        if ($user->role === 'admin' && $conversation->isSupport()) {
            return;
        }

        if ($user->role === 'admin') {
            return;
        }

        throw ValidationException::withMessages(['conversation' => ['You are not authorized to view this conversation.']]);
    }

    private function notifyOtherParty(User $sender, Conversation $conversation, ?string $body): void
    {
        $preview = $body ? mb_substr($body, 0, 120) : 'New message';

        if ($conversation->isSupport()) {
            if ($sender->role === 'admin') {
                $this->notifications->send(
                    $conversation->buyer,
                    'support_reply',
                    'Support replied',
                    $preview,
                    ['conversation_id' => $conversation->id]
                );
            } else {
                User::query()
                    ->where('role', 'admin')
                    ->where('is_suspended', false)
                    ->get()
                    ->each(function (User $admin) use ($sender, $preview, $conversation) {
                        $this->notifications->send(
                            $admin,
                            'support_message',
                            'Support request from '.$sender->name,
                            $preview,
                            ['conversation_id' => $conversation->id]
                        );
                    });
            }

            return;
        }

        $recipientId = $sender->id === $conversation->buyer_id
            ? $conversation->seller_id
            : $conversation->buyer_id;

        $recipient = User::find($recipientId);
        if ($recipient) {
            $this->notifications->send(
                $recipient,
                'new_message',
                'New message from '.$sender->name,
                $preview,
                ['conversation_id' => $conversation->id]
            );
        }
    }
}
