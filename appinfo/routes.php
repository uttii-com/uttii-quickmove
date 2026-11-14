<?php
/**
 * SPDX-FileCopyrightText: 2026 uttii-com <https://uttii.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
declare(strict_types=1);

return [
    'routes' => [
        ['name' => 'quick_move#get_destinations', 'url' => '/api/destinations', 'verb' => 'GET'],
        ['name' => 'quick_move#save_destinations', 'url' => '/api/destinations', 'verb' => 'POST'],
        ['name' => 'quick_move#move', 'url' => '/api/move', 'verb' => 'POST'],
        ['name' => 'settings#setLanguage', 'url' => '/api/settings/language', 'verb' => 'POST'],
    ],
];
