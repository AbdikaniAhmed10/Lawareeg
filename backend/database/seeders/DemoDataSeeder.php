<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Admin is created only by AdminUserSeeder (ADMIN_* env) — never here.

        $buyer = User::updateOrCreate(
            ['email' => 'buyer@lawareeg.com'],
            [
                'name' => 'Demo Buyer',
                'password' => 'password',
                'role' => 'buyer',
                'email_verified_at' => now(),
                'country' => 'Somalia',
                'referral_code' => Str::upper(Str::random(8)),
            ]
        );
        $buyer->wallet()->firstOrCreate([]);

        $seller = User::updateOrCreate(
            ['email' => 'seller@lawareeg.com'],
            [
                'name' => 'Demo Seller',
                'password' => 'password',
                'role' => 'seller',
                'email_verified_at' => now(),
                'bio' => 'Verified digital asset seller with 5+ years of experience flipping online businesses.',
                'country' => 'Somalia',
                'is_verified_seller' => true,
                'seller_verification_status' => 'approved',
                'rating_avg' => 4.8,
                'rating_count' => 12,
                'referral_code' => Str::upper(Str::random(8)),
            ]
        );
        $seller->wallet()->firstOrCreate([]);

        $secondSeller = User::updateOrCreate(
            ['email' => 'seller2@lawareeg.com'],
            [
                'name' => 'Amina Hassan',
                'password' => 'password',
                'role' => 'seller',
                'email_verified_at' => now(),
                'bio' => 'Growth-focused social media account seller.',
                'country' => 'Somalia',
                'is_verified_seller' => true,
                'seller_verification_status' => 'approved',
                'rating_avg' => 4.6,
                'rating_count' => 8,
                'referral_code' => Str::upper(Str::random(8)),
            ]
        );
        $secondSeller->wallet()->firstOrCreate([]);

        $categories = Category::all();

        if ($categories->isEmpty() || Listing::count() > 0) {
            return;
        }

        $sampleListings = [
            [
                'title' => 'Tech Review YouTube Channel - 120K Subscribers',
                'price' => 4500,
                'description' => "Established tech review channel with 120K subscribers and consistent monthly views. Monetized with AdSense and sponsorships. Includes full content archive and brand contacts.",
                'stats' => ['followers' => 120000, 'monthly_revenue' => 850, 'age_months' => 36],
                'seller' => $seller,
                'category' => 'YouTube Channels',
                'featured' => true,
            ],
            [
                'title' => 'Fashion Instagram Page - 85K Engaged Followers',
                'price' => 1800,
                'description' => 'Highly engaged fashion & lifestyle Instagram account with an average of 6% engagement rate. Great for brand deals and affiliate marketing.',
                'stats' => ['followers' => 85000, 'monthly_revenue' => 300, 'age_months' => 24],
                'seller' => $secondSeller,
                'category' => 'Instagram Accounts',
                'featured' => true,
            ],
            [
                'title' => 'Profitable Dropshipping Store - Pet Niche',
                'price' => 3200,
                'description' => 'Fully automated Shopify dropshipping store in the pet supplies niche. Comes with supplier contacts and 6 months of sales history.',
                'stats' => ['monthly_revenue' => 1200, 'age_months' => 14],
                'seller' => $seller,
                'category' => 'E-commerce Stores',
                'featured' => true,
            ],
            [
                'title' => 'Comedy TikTok Account - 250K Followers',
                'price' => 2600,
                'description' => 'Viral comedy skits TikTok account with consistent growth and multiple videos over 1M views. Great for brand partnerships.',
                'stats' => ['followers' => 250000, 'age_months' => 18],
                'seller' => $secondSeller,
                'category' => 'TikTok Accounts',
                'featured' => false,
            ],
            [
                'title' => 'premium-domain.com - Brandable Domain Name',
                'price' => 950,
                'description' => 'Short, brandable, memorable domain name perfect for a SaaS or tech startup. Clean history, no penalties.',
                'stats' => ['age_months' => 60],
                'seller' => $seller,
                'category' => 'Domain Names',
                'featured' => false,
            ],
            [
                'title' => 'Finance News Website - 40K Monthly Visitors',
                'price' => 5200,
                'description' => 'SEO-optimized finance news blog with steady organic traffic and display ad revenue. Built on WordPress.',
                'stats' => ['monthly_revenue' => 600, 'age_months' => 30],
                'seller' => $secondSeller,
                'category' => 'Websites & Blogs',
                'featured' => false,
            ],
        ];

        foreach ($sampleListings as $item) {
            $category = $categories->firstWhere('name', $item['category']) ?? $categories->first();

            Listing::create([
                'user_id' => $item['seller']->id,
                'category_id' => $category->id,
                'title' => $item['title'],
                'slug' => Str::slug($item['title']),
                'description' => $item['description'],
                'price' => $item['price'],
                'status' => 'approved',
                'is_featured' => $item['featured'],
                'is_verified_ownership' => true,
                'ownership_verification_code' => 'LAWAREEG-'.Str::upper(Str::random(6)),
                'ownership_verified_at' => now(),
                'statistics' => $item['stats'],
                'asset_url' => null,
                'views_count' => rand(50, 900),
            ]);
        }
    }
}
