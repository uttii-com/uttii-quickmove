/* SPDX-FileCopyrightText: 2026 uttii-com <https://uttii.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";
    console.log("[QuickMove] Initializing QuickMove extension...");

    let lang = "ja";
    try {
        const loaded = window.OC?.InitialState?.loadState("quickmove", "lang");
        if (loaded === "en" || loaded === "ja") {
            lang = loaded;
        }
    } catch (e) {}

    const I18N = {
        ja: {
            movedToast: (target, dest) => target + " を " + dest + " へ移動しました",
            multiTarget: (n) => n + " 件の項目",
            moveFailed: "移動に失敗しました",
            moveError: "移動リクエスト中にエラーが発生しました。",
            defaultAction: "フォルダへ移動",
            countSuffix: (n) => " (" + n + " 件)",
            actionSettings: "⚙️ クイック移動先を設定...",
            modalTitle: "クイック移動先の設定",
            modalDesc: "右クリックメニューから1発で移動できるフォルダを管理します。",
            formAddTitle: "＋ 新しい移動先を追加",
            labelDestFolder: "移動先フォルダ:",
            btnChoose: "📁 選択...",
            labelMenuName: "メニュー表示名:",
            btnAdd: "この移動先を追加",
            btnDone: "完了",
            emptyList: "登録されている移動先はありません。",
            btnDelete: "🗑️ 削除",
            pickerTitle: "クイック移動先のフォルダを選択",
            defaultFolder: "フォルダ",
            movePrefix: (f) => f + " へ移動",
            pickerUnavailable: "フォルダ選択ダイアログを利用できませんでした。",
            selectFolderAlert: "移動先フォルダを選択してください。",
            updatedToast: "クイック移動先を更新しました"
        },
        en: {
            movedToast: (target, dest) => `Moved ${target} to ${dest}`,
            multiTarget: (n) => n + " items",
            moveFailed: "Failed to move",
            moveError: "An error occurred during the move request.",
            defaultAction: "Move to folder",
            countSuffix: (n) => " (" + n + " items)",
            actionSettings: "⚙️ Configure Quick Move...",
            modalTitle: "Quick Move Settings",
            modalDesc: "Manage destination folders for one-click moving from the context menu.",
            formAddTitle: "+ Add Destination",
            labelDestFolder: "Destination Folder:",
            btnChoose: "📁 Choose...",
            labelMenuName: "Menu Label:",
            btnAdd: "Add Destination",
            btnDone: "Done",
            emptyList: "No destinations configured.",
            btnDelete: "🗑️ Delete",
            pickerTitle: "Select quick-move destination folder",
            defaultFolder: "Folder",
            movePrefix: (f) => "Move to " + f,
            pickerUnavailable: "Folder picker dialog is unavailable.",
            selectFolderAlert: "Please select a destination folder.",
            updatedToast: "Quick-move destinations updated"
        }
    };

    const t = I18N[lang] || I18N.ja;

    let cachedDestinations = [];
    let registeredActionIds = [];
    let rfaApi = null;

    const icons = {
        move: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 17v-6h-2v6h-3l4 4 4-4h-3M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h8v-2H4V8h16v3h2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>',
        config: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/></svg>'
    };

    function emitEvent(eventName, payload) {
        try {
            if (window._nc_event_bus && typeof window._nc_event_bus.emit === "function") {
                window._nc_event_bus.emit(eventName, payload);
            } else if (window.OC?._eventBus && typeof window.OC._eventBus.emit === "function") {
                window.OC._eventBus.emit(eventName, payload);
            }
        } catch (e) {
            console.warn("[QuickMove] EventBus emit failed:", e);
        }
    }

    async function loadRegisterFileAction() {
        if (rfaApi) return rfaApi;
        const findInModule = (mod) => {
            if (!mod || typeof mod !== "object") return null;
            for (const val of Object.values(mod)) {
                if (typeof val === "function") {
                    const src = Function.prototype.toString.call(val);
                    if (
                        (src.includes("register:action") && src.includes("fileActions")) ||
                        src.includes("_nc_fileactions") ||
                        src.includes("Invalid file action")
                    ) {
                        return { registerFileAction: val };
                    }
                }
            }
            return null;
        };

        const scanLoadedChunks = async () => {
            const resources = performance.getEntriesByType("resource");
            const candidates = [...new Set(
                resources
                    .map((r) => r.name)
                    .filter((name) => name.includes("/dist/") && name.endsWith(".chunk.mjs"))
            )];
            for (const url of candidates) {
                try {
                    const mod = await import(url);
                    const found = findInModule(mod);
                    if (found) return found;
                } catch (ignored) {}
            }
            return null;
        };

        const registerViaScope = () => {
            const root = window._nc_files_scope;
            if (!root || typeof root !== "object") return null;
            const scope =
                root.v4_0 ||
                Object.values(root).find(
                    (s) => s && typeof s === "object" && (s.registry || s.fileActions)
                );
            if (!scope) return null;
            return {
                registerFileAction: (action) => {
                    if (!action || typeof action.id !== "string" || !action.id) {
                        throw new Error("Invalid id");
                    }
                    if (!(scope.fileActions instanceof Map)) {
                        scope.fileActions = new Map();
                    }
                    if (scope.fileActions.has(action.id)) return;
                    scope.fileActions.set(action.id, action);
                    if (scope.registry && typeof scope.registry.dispatchEvent === "function") {
                        scope.registry.dispatchEvent(
                            new CustomEvent("register:action", { detail: action })
                        );
                    }
                }
            };
        };

        for (let attempt = 0; attempt < 20; attempt++) {
            const found = await scanLoadedChunks();
            if (found) {
                rfaApi = found;
                return rfaApi;
            }
            const fallback = registerViaScope();
            if (fallback) {
                rfaApi = fallback;
                return rfaApi;
            }
            await new Promise((r) => setTimeout(r, 100));
        }
        return null;
    }

    async function fetchDestinations() {
        try {
            const res = await fetch(OC.generateUrl("/apps/quickmove/api/destinations"), {
                headers: { "requesttoken": OC.requestToken }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                cachedDestinations = data.destinations || [];
            }
        } catch (e) {
            console.error("[QuickMove] Failed to fetch destinations:", e);
        }
        return cachedDestinations;
    }

    function removeNodesFromUI(nodes) {
        if (!nodes || nodes.length === 0) return;
        nodes.forEach(node => {
            emitEvent("files:node:deleted", node);
            const fileId = node.fileid || node.id;
            const fileName = node.basename || node.name || "";
            const selectorParts = [];
            if (fileId) {
                selectorParts.push(`[data-id="${fileId}"]`);
                selectorParts.push(`[data-fileid="${fileId}"]`);
            }
            if (fileName) {
                try {
                    const escaped = CSS.escape(fileName);
                    selectorParts.push(`[data-file="${escaped}"]`);
                    selectorParts.push(`[data-entryname="${escaped}"]`);
                } catch (e) {
                    selectorParts.push(`[data-file="${fileName}"]`);
                }
            }
            if (selectorParts.length > 0) {
                const elements = document.querySelectorAll(selectorParts.join(", "));
                elements.forEach(el => {
                    el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
                    el.style.opacity = "0";
                    el.style.transform = "translateX(24px)";
                    setTimeout(() => {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    }, 260);
                });
            }
            if (window.OCA?.Files?.App?.fileList) {
                const fl = window.OCA.Files.App.fileList;
                if (fileName && typeof fl.remove === "function") {
                    fl.remove(fileName);
                }
            }
        });
        if (window.OCA?.Files?.App?.fileList?.reload) {
            window.OCA.Files.App.fileList.reload();
        }
    }

    async function executeQuickMove(nodes, destination) {
        if (!nodes || nodes.length === 0 || !destination) return;
        const items = nodes.map(n => ({
            targetId: n.fileid || n.id,
            targetPath: n.path,
            name: n.basename || n.name || "item"
        }));
        try {
            const res = await fetch(OC.generateUrl("/apps/quickmove/api/move"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "requesttoken": OC.requestToken
                },
                body: JSON.stringify({
                    items: items,
                    destFolderPath: destination.path
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const targetText = (nodes.length === 1)
                    ? (nodes[0].basename || nodes[0].name)
                    : t.multiTarget(nodes.length);
                const msg = t.movedToast(targetText, destination.name);
                if (OC.Notification?.showTemporary) {
                    OC.Notification.showTemporary(msg);
                }
                removeNodesFromUI(nodes);
            } else {
                const err = data.error || (data.errors ? data.errors.join("\n") : t.moveFailed);
                alert(err);
            }
        } catch (err) {
            console.error("[QuickMove] Move request failed:", err);
            alert(t.moveError);
        }
    }

    async function updateActions() {
        const api = await loadRegisterFileAction();
        if (!api || typeof api.registerFileAction !== "function") return;
        cachedDestinations.forEach((dest, idx) => {
            const actionId = "quickmove-action-" + dest.id;
            if (registeredActionIds.includes(actionId)) return;
            registeredActionIds.push(actionId);
            api.registerFileAction({
                id: actionId,
                displayName: ({ nodes }) => {
                    const baseName = dest.name || t.defaultAction;
                    if (nodes && nodes.length > 1) {
                        return baseName + t.countSuffix(nodes.length);
                    }
                    return baseName;
                },
                iconSvgInline: () => icons.move,
                order: 35 + idx,
                enabled({ nodes, view }) {
                    if (view?.id === "trashbin") return false;
                    return nodes && nodes.length >= 1;
                },
                async exec({ nodes }) {
                    await executeQuickMove(nodes, dest);
                    return true;
                },
                async execBatch({ nodes }) {
                    await executeQuickMove(nodes, dest);
                    return Array(nodes.length).fill(true);
                }
            });
        });

        const configActionId = "quickmove-action-open-settings";
        if (!registeredActionIds.includes(configActionId)) {
            registeredActionIds.push(configActionId);
            api.registerFileAction({
                id: configActionId,
                displayName: () => t.actionSettings,
                iconSvgInline: () => icons.config,
                order: 999,
                enabled({ nodes, view }) {
                    if (view?.id === "trashbin") return false;
                    return nodes && nodes.length >= 1;
                },
                async exec() {
                    openSettingsModal();
                    return true;
                },
                async execBatch() {
                    openSettingsModal();
                    return [true];
                }
            });
        }
        console.log("[QuickMove] File Actions updated for", cachedDestinations.length, "destinations (lang=" + lang + ").");
    }

    function openSettingsModal() {
        let modal = document.getElementById("quickmove-inline-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "quickmove-inline-modal";
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100vw";
            modal.style.height = "100vh";
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.55)";
            modal.style.zIndex = "100000";
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
            modal.style.backdropFilter = "blur(2px)";
            modal.innerHTML = `
                <div style="background: var(--color-main-background, #fff); color: var(--color-main-text, #222); width: 90%; max-width: 520px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); overflow: hidden; display: flex; flex-direction: column; max-height: 85vh;">
                    <div style="padding: 16px 20px; border-bottom: 1px solid var(--color-border, #ddd); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            <span>📦</span> ${escapeHtml(t.modalTitle)}
                        </h3>
                        <button id="qm-modal-close" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--color-text-maxcontrast, #666); padding: 4px;">&times;</button>
                    </div>
                    <div style="padding: 20px; overflow-y: auto; flex: 1;">
                        <p style="margin: 0 0 16px 0; font-size: 0.9rem; color: var(--color-text-maxcontrast, #666);">
                            ${escapeHtml(t.modalDesc)}
                        </p>
                        <div id="qm-modal-dest-list" style="margin-bottom: 20px;"></div>
                        <div style="background: var(--color-background-hover, #f8f8f8); padding: 14px; border-radius: 8px; border: 1px dashed var(--color-border, #ccc);">
                            <h4 style="margin: 0 0 10px 0; font-size: 0.95rem;">${escapeHtml(t.formAddTitle)}</h4>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">${escapeHtml(t.labelDestFolder)}</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="qm-modal-input-path" placeholder="/01_Flow/Archive" readonly style="flex: 1; padding: 6px 10px; border: 1px solid var(--color-border, #ccc); border-radius: 6px;" />
                                    <button id="qm-modal-picker-btn" class="button" style="padding: 6px 12px; cursor: pointer;">${escapeHtml(t.btnChoose)}</button>
                                </div>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">${escapeHtml(t.labelMenuName)}</label>
                                <input type="text" id="qm-modal-input-name" placeholder="📦 Archive" style="width: 100%; box-sizing: border-box; padding: 6px 10px; border: 1px solid var(--color-border, #ccc); border-radius: 6px;" />
                            </div>
                            <button id="qm-modal-add-btn" class="button primary" style="width: 100%; padding: 8px; cursor: pointer; font-weight: bold;">${escapeHtml(t.btnAdd)}</button>
                        </div>
                    </div>
                    <div style="padding: 12px 20px; border-top: 1px solid var(--color-border, #ddd); text-align: right; background: var(--color-background-hover, #fafafa);">
                        <button id="qm-modal-done-btn" class="button primary" style="padding: 6px 20px; cursor: pointer;">${escapeHtml(t.btnDone)}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            setupModalEvents(modal);
        }
        renderModalList();
        modal.style.display = "flex";
    }

    function renderModalList() {
        const listEl = document.getElementById("qm-modal-dest-list");
        if (!listEl) return;
        if (cachedDestinations.length === 0) {
            listEl.innerHTML = `<p style="text-align: center; color: #888; font-size: 0.9rem; padding: 12px; margin: 0;">${escapeHtml(t.emptyList)}</p>`;
            return;
        }
        let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">`;
        cachedDestinations.forEach(d => {
            html += `
                <tr style="border-bottom: 1px solid var(--color-border, #eee);">
                    <td style="padding: 8px 6px; font-weight: bold;">${escapeHtml(d.name)}</td>
                    <td style="padding: 8px 6px; color: var(--color-text-maxcontrast); font-family: monospace;">${escapeHtml(d.path)}</td>
                    <td style="padding: 8px 6px; text-align: right;">
                        <button class="qm-del-btn" data-id="${escapeHtml(d.id)}" style="background: none; border: none; color: var(--color-error, #e9322d); cursor: pointer; padding: 4px 8px;">${escapeHtml(t.btnDelete)}</button>
                    </td>
                </tr>
            `;
        });
        html += `</table>`;
        listEl.innerHTML = html;
        listEl.querySelectorAll(".qm-del-btn").forEach(b => {
            b.addEventListener("click", async function() {
                const id = this.getAttribute("data-id");
                cachedDestinations = cachedDestinations.filter(d => d.id !== id);
                await saveAndRefresh();
            });
        });
    }

    function setupModalEvents(modal) {
        const closeModal = () => { modal.style.display = "none"; };
        document.getElementById("qm-modal-close").addEventListener("click", closeModal);
        document.getElementById("qm-modal-done-btn").addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

        document.getElementById("qm-modal-picker-btn").addEventListener("click", () => {
            if (typeof OC.dialogs?.filepicker === "function") {
                OC.dialogs.filepicker(
                    t.pickerTitle,
                    function (chosenPath) {
                        if (!chosenPath) return;
                        const pInput = document.getElementById("qm-modal-input-path");
                        const nInput = document.getElementById("qm-modal-input-name");
                        pInput.value = chosenPath;
                        if (!nInput.value.trim()) {
                            const fName = chosenPath.replace(/\/$/, "").split("/").pop() || t.defaultFolder;
                            nInput.value = t.movePrefix(fName);
                        }
                    },
                    false, null, true, OC.dialogs.FILEPICKER_TYPE_CHOOSE, "/", { allowDirectoryChooser: true }
                );
            } else {
                alert(t.pickerUnavailable);
            }
        });

        document.getElementById("qm-modal-add-btn").addEventListener("click", async () => {
            const path = document.getElementById("qm-modal-input-path").value.trim();
            let name = document.getElementById("qm-modal-input-name").value.trim();
            if (!path) {
                alert(t.selectFolderAlert);
                return;
            }
            if (!name) {
                const fName = path.replace(/\/$/, "").split("/").pop() || t.defaultFolder;
                name = t.movePrefix(fName);
            }
            cachedDestinations.push({
                id: "qm_" + Date.now(),
                name: name,
                path: path
            });
            document.getElementById("qm-modal-input-path").value = "";
            document.getElementById("qm-modal-input-name").value = "";
            await saveAndRefresh();
        });
    }

    async function saveAndRefresh() {
        try {
            const res = await fetch(OC.generateUrl("/apps/quickmove/api/destinations"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "requesttoken": OC.requestToken
                },
                body: JSON.stringify({ destinations: cachedDestinations })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                cachedDestinations = data.destinations;
                renderModalList();
                await updateActions();
                if (OC.Notification?.showTemporary) {
                    OC.Notification.showTemporary(t.updatedToast);
                }
            }
        } catch (e) {
            console.error("[QuickMove] Failed to save:", e);
        }
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function init() {
        await fetchDestinations();
        await updateActions();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
