/* SPDX-FileCopyrightText: 2026 uttii-com <https://uttii.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    const I18N = {
        ja: {
            pageTitle: "クイック移動の設定",
            pageDesc: "ファイルやフォルダを右クリックした際に、ワンクリックで移動できる「クイック移動先」を登録・管理します。",
            langLabel: "表示言語 / Language:",
            langSaved: "言語設定を保存しました",
            langError: "保存に失敗しました",
            colMenuName: "メニュー表示名",
            colDestFolder: "移動先フォルダ",
            colActions: "操作",
            loading: "読み込み中...",
            empty: "登録されたクイック移動先はありません。「新しい移動先を追加」から設定してください。",
            btnAddDest: "＋ 新しい移動先を追加",
            formTitle: "移動先を追加",
            labelDestFolder: "移動先フォルダ:",
            btnChooseFolder: "📁 フォルダを選択...",
            hintPicker: "「フォルダを選択」をクリックすると、Nextcloudのフォルダ階層から選べます。",
            labelMenuName: "メニュー表示名:",
            hintMenuName: "右クリックメニューに表示される名前です。空欄の場合は「{フォルダ名} へ移動」になります。",
            btnSave: "保存する",
            btnCancel: "キャンセル",
            btnDelete: "🗑️ 削除",
            confirmDelete: "この移動先設定を削除しますか？",
            savedToast: "クイック移動先を保存しました",
            saveFailed: "保存に失敗しました",
            commError: "通信エラーが発生しました",
            pickerUnavailable: "フォルダ選択ダイアログを利用できません。",
            pickerTitle: "クイック移動先のフォルダを選択",
            defaultFolder: "フォルダ",
            movePrefix: (name) => name + " へ移動",
            selectFolderAlert: "移動先フォルダを選択してください。",
            creditTitle: "uttii-QuickMove — クレジット・ライセンス・免責事項",
            creditDevLabel: "開発・運営",
            creditLicenseLabel: "ライセンス",
            creditSupportLabel: "ソースコード・不具合報告・お問い合わせ",
            creditSupportDesc: "不具合のご報告やご要望は、以下のいずれかよりご連絡ください。",
            creditContactFormLabel: "お問い合わせフォーム",
            creditEmailLabel: "メール",
            warrantyTitle: "無保証・自己責任での利用について",
            warrantyBody: "本アプリケーションは無償・無保証で提供されます。ソースコードは確認可能な形式で公開されており、利用者自身による検証を前提としています。<br>正常動作、互換性、安全性および継続的なサポートは保証されません。導入前にバックアップを取得し、ご自身の判断と責任でご利用ください。<br>法令上免除できない場合を除き、運営者は利用に伴う損害について責任を負いません。"
        },
        en: {
            pageTitle: "Quick Move Settings",
            pageDesc: "Register and manage quick-move destination folders for one-click moving from the Nextcloud Files context menu.",
            langLabel: "Display Language / 表示言語:",
            langSaved: "Language preference saved",
            langError: "Failed to save language preference",
            colMenuName: "Menu Label",
            colDestFolder: "Destination Folder",
            colActions: "Actions",
            loading: "Loading...",
            empty: "No quick-move destinations configured. Click \"+ Add Destination\" to get started.",
            btnAddDest: "+ Add Destination",
            formTitle: "Add Destination",
            labelDestFolder: "Destination Folder:",
            btnChooseFolder: "📁 Choose Folder...",
            hintPicker: "Click \"Choose Folder...\" to select a folder from your Nextcloud directory tree.",
            labelMenuName: "Menu Label:",
            hintMenuName: "Label shown in the context menu. Leave blank to use \"Move to {Folder}\".",
            btnSave: "Save",
            btnCancel: "Cancel",
            btnDelete: "🗑️ Delete",
            confirmDelete: "Delete this destination setting?",
            savedToast: "Quick-move destinations saved",
            saveFailed: "Failed to save",
            commError: "A communication error occurred",
            pickerUnavailable: "Folder picker dialog is unavailable.",
            pickerTitle: "Select quick-move destination folder",
            defaultFolder: "Folder",
            movePrefix: (name) => "Move to " + name,
            selectFolderAlert: "Please select a destination folder.",
            creditTitle: "uttii-QuickMove — Credits, License & Disclaimer",
            creditDevLabel: "Developer & Publisher",
            creditLicenseLabel: "License",
            creditSupportLabel: "Source Code, Bug Reports & Contact",
            creditSupportDesc: "For bug reports or inquiries, please contact us via any of the following:",
            creditContactFormLabel: "Contact Form",
            creditEmailLabel: "Email",
            warrantyTitle: "No Warranty and Use at Your Own Risk",
            warrantyBody: "This application is provided free of charge and without any warranty. The source code is published in an inspectable format and is intended to be verified by the user.<br>Normal operation, compatibility, security, and ongoing support are not guaranteed. Please take backups before installation and use the application at your own judgment and risk.<br>Except where liability cannot be excluded by applicable law, the operator shall not be liable for any damages arising from the use of this application."
        }
    };

    let currentLang = "ja";
    let destinations = [];

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function applyLanguage(lang) {
        currentLang = (lang === "en") ? "en" : "ja";
        const dict = I18N[currentLang];
        const root = document.getElementById("quickmove-settings");
        if (!root) return;

        root.setAttribute("data-lang", currentLang);
        root.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key] !== undefined && typeof dict[key] === "string") {
                if (key === "warrantyBody") {
                    el.innerHTML = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });
        renderTable();
    }

    async function loadDestinations() {
        try {
            const res = await fetch(OC.generateUrl("/apps/quickmove/api/destinations"), {
                headers: { "requesttoken": OC.requestToken }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                destinations = data.destinations || [];
                renderTable();
            }
        } catch (e) {
            console.error("[QuickMove] Failed to load destinations:", e);
        }
    }

    function renderTable() {
        const tbody = document.getElementById("quickmove-destinations-body");
        if (!tbody) return;
        const t = I18N[currentLang];
        tbody.innerHTML = "";
        if (destinations.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="3" style="text-align: center; color: #888; padding: 16px;">${escapeHtml(t.empty)}</td>`;
            tbody.appendChild(tr);
            return;
        }
        destinations.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="font-weight: 500;">${escapeHtml(item.name)}</td>
                <td style="font-family: monospace; color: var(--color-text-maxcontrast);">${escapeHtml(item.path)}</td>
                <td style="text-align: center;">
                    <button class="button qm-delete-btn" data-id="${escapeHtml(item.id)}" style="color: var(--color-error, #e9322d);">${escapeHtml(t.btnDelete)}</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll(".qm-delete-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = this.getAttribute("data-id");
                if (!confirm(t.confirmDelete)) return;
                destinations = destinations.filter(d => d.id !== id);
                await saveDestinationsToServer();
            });
        });
    }

    async function saveDestinationsToServer() {
        const t = I18N[currentLang];
        try {
            const res = await fetch(OC.generateUrl("/apps/quickmove/api/destinations"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "requesttoken": OC.requestToken
                },
                body: JSON.stringify({ destinations: destinations })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                destinations = data.destinations;
                renderTable();
                if (OC.Notification?.showTemporary) {
                    OC.Notification.showTemporary(t.savedToast);
                }
            } else {
                alert(data.error || t.saveFailed);
            }
        } catch (e) {
            console.error("[QuickMove] Save failed:", e);
            alert(t.commError);
        }
    }

    function openFilePicker() {
        const t = I18N[currentLang];
        if (typeof OC.dialogs?.filepicker !== "function") {
            alert(t.pickerUnavailable);
            return;
        }
        OC.dialogs.filepicker(
            t.pickerTitle,
            function (chosenPath) {
                if (!chosenPath) return;
                const pathInput = document.getElementById("qm-input-path");
                const nameInput = document.getElementById("qm-input-name");
                pathInput.value = chosenPath;
                const folderName = chosenPath.replace(/\/$/, "").split("/").pop() || t.defaultFolder;
                if (!nameInput.value.trim()) {
                    nameInput.value = t.movePrefix(folderName);
                }
            },
            false,
            null,
            true,
            OC.dialogs.FILEPICKER_TYPE_CHOOSE,
            "/",
            { allowDirectoryChooser: true }
        );
    }

    function showForm() {
        document.getElementById("quickmove-form-title").textContent = I18N[currentLang].formTitle;
        document.getElementById("qm-input-path").value = "";
        document.getElementById("qm-input-name").value = "";
        const modal = document.getElementById("quickmove-form-modal");
        modal.classList.remove("hidden");
        modal.style.display = "block";
    }

    function hideForm() {
        const modal = document.getElementById("quickmove-form-modal");
        modal.classList.add("hidden");
        modal.style.display = "none";
    }

    async function init() {
        const root = document.getElementById("quickmove-settings");
        if (!root) return;

        const initialLang = root.getAttribute("data-lang") || OC.InitialState?.loadState("quickmove", "lang") || "ja";
        applyLanguage(initialLang);

        const select = document.getElementById("uttii-lang-select");
        const statusEl = document.getElementById("uttii-lang-status");
        if (select) {
            select.value = currentLang;
            select.addEventListener("change", async () => {
                const newLang = select.value === "en" ? "en" : "ja";
                applyLanguage(newLang);
                if (statusEl) statusEl.textContent = "...";

                try {
                    const res = await fetch(OC.generateUrl("/apps/quickmove/api/settings/language"), {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "requesttoken": OC.requestToken
                        },
                        body: JSON.stringify({ lang: newLang })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        if (statusEl) {
                            statusEl.textContent = I18N[newLang].langSaved;
                            setTimeout(() => { statusEl.textContent = ""; }, 3000);
                        }
                    } else if (statusEl) {
                        statusEl.textContent = I18N[newLang].langError;
                    }
                } catch (e) {
                    if (statusEl) statusEl.textContent = I18N[newLang].langError;
                }
            });
        }

        await loadDestinations();

        const addBtn = document.getElementById("quickmove-add-btn");
        if (addBtn) addBtn.addEventListener("click", () => showForm());

        const cancelBtn = document.getElementById("qm-cancel-btn");
        if (cancelBtn) cancelBtn.addEventListener("click", hideForm);

        const pickerBtn = document.getElementById("qm-picker-btn");
        if (pickerBtn) pickerBtn.addEventListener("click", openFilePicker);

        const saveBtn = document.getElementById("qm-save-btn");
        if (saveBtn) {
            saveBtn.addEventListener("click", async () => {
                const t = I18N[currentLang];
                const path = document.getElementById("qm-input-path").value.trim();
                let name = document.getElementById("qm-input-name").value.trim();
                if (!path) {
                    alert(t.selectFolderAlert);
                    return;
                }
                if (!name) {
                    const folderName = path.replace(/\/$/, "").split("/").pop() || t.defaultFolder;
                    name = t.movePrefix(folderName);
                }
                destinations.push({
                    id: "qm_" + Date.now(),
                    name: name,
                    path: path
                });
                hideForm();
                await saveDestinationsToServer();
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
