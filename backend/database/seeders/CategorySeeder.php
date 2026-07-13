<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'YouTube Channels', 'icon' => 'youtube'],
            ['name' => 'Instagram Accounts', 'icon' => 'instagram'],
            ['name' => 'TikTok Accounts', 'icon' => 'tiktok'],
            ['name' => 'Twitter / X Accounts', 'icon' => 'twitter'],
            ['name' => 'Facebook Pages', 'icon' => 'facebook'],
            ['name' => 'Websites & Blogs', 'icon' => 'globe'],
            ['name' => 'E-commerce Stores', 'icon' => 'shopping-cart'],
            ['name' => 'Mobile Apps', 'icon' => 'smartphone'],
            ['name' => 'Domain Names', 'icon' => 'link'],
            ['name' => 'Discord Servers', 'icon' => 'discord'],
        ];

        foreach ($categories as $index => $category) {
            Category::updateOrCreate(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'description' => "Buy and sell {$category['name']} safely on Lawareeg.",
                    'icon' => $category['icon'],
                    'sort_order' => $index,
                    'is_active' => true,
                ]
            );
        }
    }
}
