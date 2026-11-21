<?php
/**
 * SPDX-FileCopyrightText: 2026 uttii-com <https://uttii.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
?>
<div id="quickmove-settings" class="section" data-lang="<?php p($_['lang']); ?>">
    <h2 class="app-name" data-i18n="pageTitle">クイック移動の設定</h2>
    <p class="settings-hint" data-i18n="pageDesc">
        ファイルやフォルダを右クリックした際に、ワンクリックで移動できる「クイック移動先」を登録・管理します。
    </p>

    <div class="uttii-lang-bar">
        <label for="uttii-lang-select" data-i18n="langLabel">表示言語 / Language:</label>
        <select id="uttii-lang-select" class="uttii-lang-select">
            <option value="ja" <?php if ($_['lang'] === 'ja') p('selected'); ?>>日本語（デフォルト）</option>
            <option value="en" <?php if ($_['lang'] === 'en') p('selected'); ?>>English</option>
        </select>
        <span id="uttii-lang-status" class="uttii-lang-status"></span>
    </div>

    <div class="quickmove-table-container">
        <table class="grid" id="quickmove-destinations-table">
            <thead>
                <tr>
                    <th style="width: 35%;" data-i18n="colMenuName">メニュー表示名</th>
                    <th style="width: 45%;" data-i18n="colDestFolder">移動先フォルダ</th>
                    <th style="width: 20%; text-align: center;" data-i18n="colActions">操作</th>
                </tr>
            </thead>
            <tbody id="quickmove-destinations-body">
                <tr id="quickmove-loading-row">
                    <td colspan="3" style="text-align: center; color: #888;" data-i18n="loading">読み込み中...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div style="margin-top: 16px;">
        <button id="quickmove-add-btn" class="button primary" data-i18n="btnAddDest">＋ 新しい移動先を追加</button>
    </div>

    <!-- 追加・編集モーダル／フォーム -->
    <div id="quickmove-form-modal" class="modal-container hidden" style="display: none; margin-top: 20px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--border-radius-large); background: var(--color-main-background);">
        <h3 id="quickmove-form-title" data-i18n="formTitle">移動先を追加</h3>
        
        <div style="margin-bottom: 12px;">
            <label for="qm-input-path" style="display: block; font-weight: bold; margin-bottom: 4px;" data-i18n="labelDestFolder">移動先フォルダ:</label>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="qm-input-path" placeholder="/01_Flow/Archive" style="flex: 1;" readonly />
                <button id="qm-picker-btn" class="button" data-i18n="btnChooseFolder">📁 フォルダを選択...</button>
            </div>
            <small style="color: #777;" data-i18n="hintPicker">「フォルダを選択」をクリックすると、Nextcloudのフォルダ階層から選べます。</small>
        </div>

        <div style="margin-bottom: 16px;">
            <label for="qm-input-name" style="display: block; font-weight: bold; margin-bottom: 4px;" data-i18n="labelMenuName">メニュー表示名:</label>
            <input type="text" id="qm-input-name" placeholder="📦 Archive" style="width: 100%;" />
            <small style="color: #777;" data-i18n="hintMenuName">右クリックメニューに表示される名前です。空欄の場合は「{フォルダ名} へ移動」になります。</small>
        </div>

        <div style="display: flex; gap: 8px;">
            <button id="qm-save-btn" class="button primary" data-i18n="btnSave">保存する</button>
            <button id="qm-cancel-btn" class="button" data-i18n="btnCancel">キャンセル</button>
        </div>
    </div>

    <div class="uttii-credit-card">
        <div class="uttii-credit-header">
            <h3 data-i18n="creditTitle">uttii-QuickMove — クレジット・ライセンス・免責事項</h3>
            <span class="uttii-version-badge">v<?php p($_['version']); ?></span>
        </div>

        <div class="uttii-credit-grid">
            <div class="uttii-credit-item">
                <strong data-i18n="creditDevLabel">開発・運営</strong>
                <div>
                    uttii.com<br>
                    <a href="https://uttii.com" target="_blank" rel="noopener noreferrer">https://uttii.com</a><br>
                    <a href="https://app-nextcloud.uttii.com" target="_blank" rel="noopener noreferrer">https://app-nextcloud.uttii.com</a>
                </div>
            </div>

            <div class="uttii-credit-item">
                <strong data-i18n="creditLicenseLabel">ライセンス</strong>
                <div>GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)</div>
            </div>

            <div class="uttii-credit-item">
                <strong data-i18n="creditSupportLabel">ソースコード・不具合報告・お問い合わせ</strong>
                <div data-i18n="creditSupportDesc">不具合のご報告やご要望は、以下のいずれかよりご連絡ください。</div>
                <ul class="uttii-credit-links">
                    <li>GitHub Issues: <a href="https://github.com/uttii-com/uttii-quickmove/issues" target="_blank" rel="noopener noreferrer">https://github.com/uttii-com/uttii-quickmove/issues</a></li>
                    <li><span data-i18n="creditContactFormLabel">お問い合わせフォーム</span>: <a href="https://contact.uttii.com" target="_blank" rel="noopener noreferrer">https://contact.uttii.com</a></li>
                    <li><span data-i18n="creditEmailLabel">メール</span>: <a href="mailto:info@uttii.com">info@uttii.com</a></li>
                </ul>
            </div>
        </div>

        <div class="uttii-warranty-box">
            <strong data-i18n="warrantyTitle">無保証・自己責任での利用について</strong>
            <p data-i18n="warrantyBody">
                本アプリケーションは無償・無保証で提供されます。ソースコードは確認可能な形式で公開されており、利用者自身による検証を前提としています。<br>
                正常動作、互換性、安全性および継続的なサポートは保証されません。導入前にバックアップを取得し、ご自身の判断と責任でご利用ください。<br>
                法令上免除できない場合を除き、運営者は利用に伴う損害について責任を負いません。
            </p>
        </div>
    </div>
</div>
